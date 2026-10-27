let redirectsPromise: Promise<Record<string, string>> | null = null;
let shouldScrollToRedirectHeading = false;

const getRedirects = () => {
  if (redirectsPromise) {
    return redirectsPromise;
  }

  const isLocal = window.location.hostname === "localhost";
  const basePath = isLocal ? "" : "/quartz";

  redirectsPromise = fetch(`${basePath}/heading-redirects.json`)
    .then((response) => {
      if (!response.ok) {
        return {};
      }

      return response.json() as Promise<Record<string, string>>;
    })
    .catch(() => ({}));

  return redirectsPromise;
};

const markRedirectLink = (
  link: HTMLAnchorElement,
  redirects: Record<string, string>,
) => {
  const isLocal = window.location.hostname === "localhost";
  const basePath = isLocal ? "" : "/quartz";
  const url = new URL(link.href, window.location.href);

  if (url.origin !== window.location.origin) {
    return;
  }

  const prefix = basePath ? `${basePath}/` : "/";
  if (!url.pathname.startsWith(prefix)) {
    return;
  }

  const slug = decodeURIComponent(url.pathname.slice(prefix.length));
  let redirectUrl = redirects[slug];

  if (!redirectUrl) {
    return;
  }

  if (isLocal && redirectUrl.startsWith("/quartz/")) {
    redirectUrl = redirectUrl.slice("/quartz".length);
  }

  link.href = redirectUrl;
  link.dataset.routerIgnore = "";

  if (link.dataset.headingRedirectMarked === "true") {
    return;
  }
  link.dataset.headingRedirectMarked = "true";

  const targetUrl = new URL(link.href, window.location.href);

  link.addEventListener("click", () => {
    shouldScrollToRedirectHeading = true;
    queueMicrotask(() => {
      sessionStorage.removeItem("search-term");
      if (targetUrl.pathname === location.pathname && targetUrl.hash) {
        document.getElementById(decodeURIComponent(targetUrl.hash.slice(1)))?.scrollIntoView();
        shouldScrollToRedirectHeading = false;
      }
    });
  });
};

const markRedirectLinks = async () => {
  try {
    const redirects = await getRedirects();

    document.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
      markRedirectLink(link, redirects);
    });
  } catch {
    // Redirect link marking is non-critical.
  }
};

const observer = new MutationObserver((mutations) => {
  void getRedirects().then((redirects) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) {
          continue;
        }

        if (node instanceof HTMLAnchorElement && node.hasAttribute("href")) {
          markRedirectLink(node, redirects);
        }

        node.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
          markRedirectLink(link, redirects);
        });
      }
    }
  });
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

document.addEventListener("nav", () => {
  void markRedirectLinks();

  if (shouldScrollToRedirectHeading && location.hash) {
    shouldScrollToRedirectHeading = false;
    requestAnimationFrame(() => {
      document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
    });
  }
});
markRedirectLinks();
