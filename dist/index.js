import { createRequire } from 'module';
import path from 'path';
import fs from 'fs/promises';

createRequire(import.meta.url);
var escapeHtml = (value) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
var makeRedirectUrl = (target) => {
  const hashIndex = target.indexOf("#");
  let page = target;
  let heading = "";
  if (hashIndex !== -1) {
    page = target.slice(0, hashIndex);
    heading = target.slice(hashIndex + 1);
  }
  page = page.replaceAll("\\", "/");
  page = page.replace(/\.md$/i, "");
  const encodedPage = page.split("/").map((part) => encodeURIComponent(part)).join("/");
  if (!heading) {
    return `/${encodedPage}`;
  }
  const encodedHeading = encodeURIComponent(
    heading.trim().toLowerCase().replace(/\s+/g, "-")
  );
  return `/${encodedPage}#${encodedHeading}`;
};
var HeadingRedirect = () => {
  const emitRedirects = async (ctx, content) => {
    const outputs = [];
    for (const [_tree, vfile] of content) {
      const frontmatter = vfile.data?.frontmatter ?? {};
      if (typeof frontmatter.redirect !== "string") {
        continue;
      }
      const target = frontmatter.redirect.trim();
      if (!target) {
        continue;
      }
      const slug = vfile.data?.slug;
      if (!slug) {
        continue;
      }
      const redirectUrl = makeRedirectUrl(target);
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
    window.location.replace(${JSON.stringify(redirectUrl)});
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
      const outputPath = path.join(
        ctx.argv.output,
        `${slug}.html`
      );
      await fs.mkdir(path.dirname(outputPath), {
        recursive: true
      });
      await fs.writeFile(outputPath, html, "utf8");
      outputs.push(outputPath);
    }
    return outputs;
  };
  return {
    name: "HeadingRedirect",
    async emit(ctx, content, _resources) {
      return emitRedirects(ctx, content);
    },
    async *partialEmit(ctx, content, _resources, _changeEvents) {
      const outputs = await emitRedirects(ctx, content);
      for (const output of outputs) {
        yield output;
      }
    }
  };
};

export { HeadingRedirect };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map