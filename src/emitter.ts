import path from "node:path";
import fs from "node:fs/promises";
// @ts-ignore
import redirectLinksScript from "./redirect-links.inline";
import type {
  QuartzEmitterPlugin,
  ProcessedContent,
  BuildCtx,
  FilePath,
  FullSlug,
} from "@quartz-community/types";

/**
 * HTMLで使用する文字をエスケープする
 */
const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

/**
 * redirect: "哲学#存在論"
 *
 * を
 *
 * /哲学#存在論
 *
 * のようなQuartz上のURLへ変換する。
 */
const makeRedirectUrl = (target: string, basePath = ""): string => {
  const hashIndex = target.indexOf("#");

  let page = target;
  let heading = "";

  if (hashIndex !== -1) {
    page = target.slice(0, hashIndex);
    heading = target.slice(hashIndex + 1);
  }

  // Windows形式のパスが書かれていても / に統一
  page = page.replaceAll("\\", "/");

  // .md が書かれていた場合は除去
  page = page.replace(/\.md$/i, "");

  // URLとしてエンコード
  const encodedPage = page
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  if (!heading) {
    return `${basePath}/${encodedPage}`;
  }

  /*
   * Obsidian/Markdownの見出しをQuartzの一般的な
   * heading slug形式へ変換する。
   *
   * 日本語はそのまま残し、
   * 空白は - にする。
   */
  const encodedHeading = encodeURIComponent(heading.trim().toLowerCase().replace(/\s+/g, "-"));

  return `${basePath}/${encodedPage}#${encodedHeading}`;
};

/**
 * redirect frontmatter を持つノートについて、
 * 即時転送用HTMLを生成するQuartz Emitter。
 */
export const HeadingRedirect: QuartzEmitterPlugin = () => {
  const emitRedirects = async (ctx: BuildCtx, content: ProcessedContent[]): Promise<FilePath[]> => {
    const outputs: FilePath[] = [];
    const redirectSlugs: string[] = [];

    for (const [_tree, vfile] of content) {
      const frontmatter = (vfile.data?.frontmatter ?? {}) as {
        redirect?: unknown;
      };

      if (typeof frontmatter.redirect !== "string") {
        continue;
      }

      const target = frontmatter.redirect.trim();

      if (!target) {
        continue;
      }

      const slug = vfile.data?.slug as FullSlug | undefined;

      if (!slug) {
        continue;
      }
      redirectSlugs.push(slug);

      const baseUrl = ctx.cfg.configuration.baseUrl ?? "";
      const basePath = baseUrl.includes("/") ? `/${baseUrl.split("/").slice(1).join("/")}` : "";

      const redirectUrl = makeRedirectUrl(target, basePath);
      const safeUrl = escapeHtml(redirectUrl);

      const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=${safeUrl}">
  <link rel="canonical" href="${safeUrl}">
  <meta name="robots" content="noindex">
  <title>Redirecting...</title>
  <script>
  setTimeout(() => {
    window.location.replace(${JSON.stringify(redirectUrl)});
  }, 0);
  </script>
</head>
<body>
  <p>
    Redirecting to
    <a href="${safeUrl}">${safeUrl}</a>
  </p>
</body>
</html>
`;

      /*
       * 例:
       *
       * content/存在論.md
       *
       * ↓
       *
       * public/存在論.html
       */
      const outputPath = path.join(ctx.argv.output, `${slug}.html`) as FilePath;

      await fs.mkdir(path.dirname(outputPath), {
        recursive: true,
      });

      await fs.writeFile(outputPath, html, "utf8");

      outputs.push(outputPath);
    }
    const redirectSlugsPath = path.join(ctx.argv.output, "heading-redirects.json") as FilePath;

    await fs.writeFile(redirectSlugsPath, JSON.stringify(redirectSlugs), "utf8");

    outputs.push(redirectSlugsPath);
    return outputs;
  };

  return {
    name: "HeadingRedirect",
    externalResources() {
      return {
        js: [
          {
            script: redirectLinksScript,
            loadTime: "afterDOMReady",
            contentType: "inline",
          },
        ],
      };
    },
    async emit(ctx, content, _resources) {
      return emitRedirects(ctx, content);
    },

    async *partialEmit(ctx, content, _resources, _changeEvents) {
      const outputs = await emitRedirects(ctx, content);

      for (const output of outputs) {
        yield output;
      }
    },
  };
};
