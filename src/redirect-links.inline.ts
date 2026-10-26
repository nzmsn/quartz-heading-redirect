const markRedirectLinks = async () => {
  try {
    const basePath = window.location.pathname.split("/")[1];
    const response = await fetch(`/${basePath}/heading-redirects.json`);
    if (!response.ok) return;

    const redirects = (await response.json()) as Record<string, string>;

    document.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
      const url = new URL(link.href, window.location.href);
      const prefix = `/${basePath}/`;

      if (url.origin !== window.location.origin || !url.pathname.startsWith(prefix)) {
        return;
      }

      const slug = decodeURIComponent(url.pathname.slice(prefix.length));
      const redirectUrl = redirects[slug];

      if (redirectUrl) {
        link.href = redirectUrl;
        link.dataset.routerIgnore = "";
      }
    });
  } catch {
    // Redirect link marking is non-critical.
  }
};

document.addEventListener("nav", markRedirectLinks);
markRedirectLinks();