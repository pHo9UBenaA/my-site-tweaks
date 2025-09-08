(() => {
  // Only act on archives pages (defensive: match already restricts this)
  if (!location.pathname.startsWith("/archives/")) return;

  // Scope to the redirect loading page to avoid unrelated anchors
  const containerSelector = '[data-qa="ssb_redirect_loading_page"]';
  // Target only the specific redirect link among multiple anchors
  // - Slack internal redirect to messages
  // - Opens in same tab (target=_self)
  // - Uses c-link class
  const selector = `${containerSelector} a.c-link[target="_self"][href^="/messages/"]`;

  const tryClick = (root = document) => {
    const link = root.querySelector(selector);
    if (!link) return false;
    try {
      link.click();
      return true;
    } catch (_) {
      return false;
    }
  };

  const observeAndClick = () => {
    // In case the element is injected after load
    const observer = new MutationObserver(() => {
      // If the redirect container is gone, stop observing
      const container = document.querySelector(containerSelector);
      if (!container) {
        observer.disconnect();
        return;
      }

      if (tryClick(container)) {
        observer.disconnect();
      }
    });

    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
    });

    // Cleanup on page unload/navigation without timeouts
    const cleanup = () => observer.disconnect();
    window.addEventListener("pagehide", cleanup, { once: true });
    window.addEventListener("beforeunload", cleanup, { once: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      const container = document.querySelector(containerSelector) || document;
      if (!tryClick(container)) observeAndClick();
    });
  } else {
    const container = document.querySelector(containerSelector) || document;
    if (!tryClick(container)) observeAndClick();
  }
})();
