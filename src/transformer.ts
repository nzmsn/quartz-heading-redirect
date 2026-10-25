import type { PluggableList, Plugin } from "unified";
import type { Root as HastRoot, Element } from "hast";
import type { VFile } from "vfile";
import { visit } from "unist-util-visit";
import type { QuartzTransformerPlugin } from "@quartz-community/types";

const rehypeHeadingRedirectLinks: Plugin<[], HastRoot> = () => {
  return (tree: HastRoot, file: VFile) => {
    const frontmatter = file.data?.frontmatter as
      | { redirect?: unknown }
      | undefined;

    if (
      typeof frontmatter?.redirect !== "string" ||
      !frontmatter.redirect.trim()
    ) {
      return;
    }

    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "a") {
        return;
      }

      node.properties ??= {};
      node.properties.dataRouterIgnore = true;
    });
  };
};

export const HeadingRedirectTransformer: QuartzTransformerPlugin = () => {
  return {
    name: "HeadingRedirectTransformer",

    htmlPlugins(): PluggableList {
      return [rehypeHeadingRedirectLinks];
    },
  };
};