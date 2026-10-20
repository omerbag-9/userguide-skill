/*
  Runs synchronously in <head>, after assets/site.js and before first paint.

  Sets the theme on <html> so a dark-mode reader never sees a white flash. Kept
  separate from guide.js (which is deferred) for that reason.
*/
(() => {
  const site = window.GUIDE_SITE || { id: 'guide' };
  let stored = null;
  try {
    stored = localStorage.getItem(`${site.id}-guide-theme`);
  } catch {
    stored = null; // private mode — fall back to the system preference
  }
  document.documentElement.dataset.theme =
    stored === 'light' || stored === 'dark'
      ? stored
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
})();
