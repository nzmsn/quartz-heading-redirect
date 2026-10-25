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

// node_modules/unist-util-is/lib/index.js
var convert = (
  // Note: overloads in JSDoc can’t yet use different `@template`s.
  /**
   * @type {(
   *   (<Condition extends string>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & {type: Condition}) &
   *   (<Condition extends Props>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & Condition) &
   *   (<Condition extends TestFunction>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & Predicate<Condition, Node>) &
   *   ((test?: null | undefined) => (node?: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node) &
   *   ((test?: Test) => Check)
   * )}
   */
  /**
   * @param {Test} [test]
   * @returns {Check}
   */
  (function(test) {
    if (test === null || test === void 0) {
      return ok;
    }
    if (typeof test === "function") {
      return castFactory(test);
    }
    if (typeof test === "object") {
      return Array.isArray(test) ? anyFactory(test) : (
        // Cast because `ReadonlyArray` goes into the above but `isArray`
        // narrows to `Array`.
        propertiesFactory(
          /** @type {Props} */
          test
        )
      );
    }
    if (typeof test === "string") {
      return typeFactory(test);
    }
    throw new Error("Expected function, string, or object as test");
  })
);
function anyFactory(tests) {
  const checks = [];
  let index = -1;
  while (++index < tests.length) {
    checks[index] = convert(tests[index]);
  }
  return castFactory(any);
  function any(...parameters) {
    let index2 = -1;
    while (++index2 < checks.length) {
      if (checks[index2].apply(this, parameters)) return true;
    }
    return false;
  }
}
function propertiesFactory(check) {
  const checkAsRecord = (
    /** @type {Record<string, unknown>} */
    check
  );
  return castFactory(all);
  function all(node) {
    const nodeAsRecord = (
      /** @type {Record<string, unknown>} */
      /** @type {unknown} */
      node
    );
    let key;
    for (key in check) {
      if (nodeAsRecord[key] !== checkAsRecord[key]) return false;
    }
    return true;
  }
}
function typeFactory(check) {
  return castFactory(type);
  function type(node) {
    return node && node.type === check;
  }
}
function castFactory(testFunction) {
  return check;
  function check(value, index, parent) {
    return Boolean(
      looksLikeANode(value) && testFunction.call(
        this,
        value,
        typeof index === "number" ? index : void 0,
        parent || void 0
      )
    );
  }
}
function ok() {
  return true;
}
function looksLikeANode(value) {
  return value !== null && typeof value === "object" && "type" in value;
}

// node_modules/unist-util-visit-parents/lib/color.node.js
function color(d) {
  return "\x1B[33m" + d + "\x1B[39m";
}

// node_modules/unist-util-visit-parents/lib/index.js
var empty = [];
var CONTINUE = true;
var EXIT = false;
var SKIP = "skip";
function visitParents(tree, test, visitor, reverse) {
  let check;
  if (typeof test === "function" && typeof visitor !== "function") {
    reverse = visitor;
    visitor = test;
  } else {
    check = test;
  }
  const is2 = convert(check);
  const step = reverse ? -1 : 1;
  factory(tree, void 0, [])();
  function factory(node, index, parents) {
    const value = (
      /** @type {Record<string, unknown>} */
      node && typeof node === "object" ? node : {}
    );
    if (typeof value.type === "string") {
      const name = (
        // `hast`
        typeof value.tagName === "string" ? value.tagName : (
          // `xast`
          typeof value.name === "string" ? value.name : void 0
        )
      );
      Object.defineProperty(visit2, "name", {
        value: "node (" + color(node.type + (name ? "<" + name + ">" : "")) + ")"
      });
    }
    return visit2;
    function visit2() {
      let result = empty;
      let subresult;
      let offset;
      let grandparents;
      if (!test || is2(node, index, parents[parents.length - 1] || void 0)) {
        result = toResult(visitor(node, parents));
        if (result[0] === EXIT) {
          return result;
        }
      }
      if ("children" in node && node.children) {
        const nodeAsParent = (
          /** @type {UnistParent} */
          node
        );
        if (nodeAsParent.children && result[0] !== SKIP) {
          offset = (reverse ? nodeAsParent.children.length : -1) + step;
          grandparents = parents.concat(nodeAsParent);
          while (offset > -1 && offset < nodeAsParent.children.length) {
            const child = nodeAsParent.children[offset];
            subresult = factory(child, offset, grandparents)();
            if (subresult[0] === EXIT) {
              return subresult;
            }
            offset = typeof subresult[1] === "number" ? subresult[1] : offset + step;
          }
        }
      }
      return result;
    }
  }
}
function toResult(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "number") {
    return [CONTINUE, value];
  }
  return value === null || value === void 0 ? empty : [value];
}

// node_modules/unist-util-visit/lib/index.js
function visit(tree, testOrVisitor, visitorOrReverse, maybeReverse) {
  let reverse;
  let test;
  let visitor;
  {
    test = testOrVisitor;
    visitor = visitorOrReverse;
    reverse = maybeReverse;
  }
  visitParents(tree, test, overload, reverse);
  function overload(node, parents) {
    const parent = parents[parents.length - 1];
    const index = parent ? parent.children.indexOf(node) : void 0;
    return visitor(node, index, parent);
  }
}

// src/transformer.ts
var rehypeHeadingRedirectLinks = () => {
  return (tree, file) => {
    const frontmatter = file.data?.frontmatter;
    if (typeof frontmatter?.redirect !== "string" || !frontmatter.redirect.trim()) {
      return;
    }
    visit(tree, "element", (node) => {
      if (node.tagName !== "a") {
        return;
      }
      node.properties ??= {};
      node.properties.dataRouterIgnore = true;
    });
  };
};
var HeadingRedirectTransformer = () => {
  return {
    name: "HeadingRedirectTransformer",
    htmlPlugins() {
      return [rehypeHeadingRedirectLinks];
    }
  };
};

export { HeadingRedirect, HeadingRedirectTransformer };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map