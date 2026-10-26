const markRedirectLinks = async () => {
  try {
    const isLocal = window.location.hostname === "localhost";
    const basePath = isLocal ? "" : "/quartz";
    const response = await fetch(`${basePath}/heading-redirects.json`);
    if (!response.ok) return;

    const redirects = (await response.json()) as Record<string, string>;

    document.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
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
    });
  } catch {
    // Redirect link marking is non-critical.
  }
};

document.addEventListener("nav", markRedirectLinks);
markRedirectLinks();