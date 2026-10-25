const markRedirectLinks = async () => {
  try {
    const response = await fetch("/heading-redirects.json")
    if (!response.ok) return

    const redirectSlugs = (await response.json()) as string[]
    const redirectSet = new Set(
      redirectSlugs.map((slug) => `/${slug}`),
    )

    document.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
      const url = new URL(link.href, window.location.href)

      if (
        url.origin === window.location.origin &&
        redirectSet.has(url.pathname)
      ) {
        link.dataset.routerIgnore = ""
      }
    })
  } catch {
    // Redirect link marking is non-critical.
  }
}

document.addEventListener("nav", markRedirectLinks)
markRedirectLinks()