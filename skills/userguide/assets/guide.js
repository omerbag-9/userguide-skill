/*
  Stakeholder tour — shared page chrome.

  Every guide page ships only its <main> content and a `data-page` id on <body>;
  this script injects the top bar, the sidebar, the "on this page" rail and the
  prev/next pager so the pages cannot drift apart. It runs from file:// as well
  as from a static server — no fetch, no build step.

  Everything project-specific (navigation, product name, logo, storage keys)
  comes from `window.GUIDE_SITE`, which build.py writes to assets/site.js.
  The theme is already set on <html> by assets/boot.js, which runs
  synchronously in <head>; this file only handles changing it.
*/
(() => {
  const SITE = window.GUIDE_SITE || { id: 'guide', nav: [], brand: { name: 'Guide', sub: 'Stakeholder tour' } };
  const NAV = SITE.nav;

  /** Flat reading order, used for the prev/next pager. */
  const ORDER = NAV.flatMap((group) => group.items);

  const THEME_KEY = `${SITE.id}-guide-theme`;

  const persist = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* nothing to persist to — the change still applies to this page view */
    }
  };

  const escapeHtml = (text) =>
    String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // ── Theme ────────────────────────────────────────────────────────────────

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const btn = document.getElementById('g-theme');
    if (btn) {
      btn.textContent = theme === 'dark' ? 'Light' : 'Dark';
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  // ── Markup builders ──────────────────────────────────────────────────────

  function buildTopbar() {
    const brand = SITE.brand || {};
    const mark = brand.logo
      ? `<img class="g-brand-logo" src="${escapeHtml(brand.logo)}" alt="${escapeHtml(brand.name || '')}" />`
      : `<span class="g-brand-name">${escapeHtml(brand.name || '')}</span>`;
    const el = document.createElement('header');
    el.className = 'g-topbar';
    el.innerHTML = [
      '<button type="button" class="g-iconbtn g-menubtn" id="g-menu" aria-expanded="false" aria-controls="g-sidebar">Menu</button>',
      '<a class="g-brand" href="index.html">',
      mark,
      `<span class="g-brand-sub">${escapeHtml(brand.sub || 'Stakeholder tour')}</span>`,
      '</a>',
      '<div class="g-topbar-spacer"></div>',
      '<div class="g-search">',
      '<label class="g-visually-hidden" for="g-filter">Filter guides</label>',
      '<input id="g-filter" type="search" placeholder="Filter pages…" autocomplete="off" />',
      '</div>',
      '<button type="button" class="g-iconbtn" id="g-theme">Dark</button>',
    ].join('');
    return el;
  }

  function buildSidebar(current) {
    const el = document.createElement('nav');
    el.className = 'g-sidebar';
    el.id = 'g-sidebar';
    el.setAttribute('aria-label', 'Guide sections');
    el.innerHTML = NAV.map((group) => {
      const links = group.items
        .map((item) => {
          const currentAttr = item.id === current ? ' aria-current="page"' : '';
          return `<a class="g-navlink" href="${item.href}" data-title="${escapeHtml(item.title.toLowerCase())}"${currentAttr}>${escapeHtml(item.title)}</a>`;
        })
        .join('');
      return `<div class="g-navgroup"><div class="g-navgroup-label">${escapeHtml(group.label)}</div>${links}</div>`;
    }).join('');
    return el;
  }

  function buildPager(current) {
    const idx = ORDER.findIndex((item) => item.id === current);
    if (idx < 0) return null;
    const prev = ORDER[idx - 1];
    const next = ORDER[idx + 1];
    if (!(prev || next)) return null;

    const el = document.createElement('nav');
    el.className = 'g-pager';
    el.setAttribute('aria-label', 'Guide pagination');
    el.innerHTML = [
      prev ? `<a href="${prev.href}"><span>Previous</span>${escapeHtml(prev.title)}</a>` : '',
      next ? `<a href="${next.href}"><span>Next</span>${escapeHtml(next.title)}</a>` : '',
    ].join('');
    return el;
  }

  /** Builds the right-hand rail from the page's own <h2> headings. */
  function buildToc(main) {
    const headings = Array.from(main.querySelectorAll('h2[id]'));
    if (headings.length < 2) return null;

    const el = document.createElement('nav');
    el.className = 'g-toc';
    el.setAttribute('aria-label', 'On this page');
    el.innerHTML =
      '<div class="g-toc-label">On this page</div>' +
      headings.map((h) => `<a href="#${h.id}">${escapeHtml(h.textContent.trim())}</a>`).join('');
    return el;
  }

  function highlightToc(toc, main) {
    const links = Array.from(toc.querySelectorAll('a'));
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          for (const a of links) a.removeAttribute('aria-current');
          const active = byId.get(entry.target.id);
          if (active) active.setAttribute('aria-current', 'true');
        }
      },
      // Only count a heading as "current" once it reaches the upper third of
      // the viewport, so the rail does not flicker while scrolling fast.
      { rootMargin: '-10% 0px -70% 0px', threshold: 0 },
    );

    for (const h of main.querySelectorAll('h2[id]')) observer.observe(h);
  }

  /**
   * Re-attaches column headings to cells so a dense table can stack into cards
   * on a narrow screen. Opt in with `data-stack` on the `.g-tablewrap`. A
   * leading `th[scope="row"]` is the row's title and becomes the card heading.
   */
  function labelStackedTables(root) {
    for (const table of root.querySelectorAll('.g-tablewrap[data-stack] table')) {
      const headings = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent.trim());
      if (headings.length === 0) continue;
      for (const row of table.querySelectorAll('tbody tr')) {
        for (const [i, cell] of Array.from(row.children).entries()) {
          if (cell.tagName === 'TH') continue;
          if (headings[i]) cell.dataset.label = headings[i];
        }
      }
    }
  }

  // ── Boot ─────────────────────────────────────────────────────────────────

  function init() {
    const current = document.body.dataset.page || '';
    const main = document.querySelector('.g-main');
    if (!main) return;

    const scrim = document.createElement('div');
    scrim.className = 'g-scrim';
    document.body.insertBefore(buildTopbar(), document.body.firstChild);
    main.parentNode.insertBefore(buildSidebar(current), main);
    main.parentNode.insertBefore(scrim, main);

    labelStackedTables(main);

    const content = main.querySelector('.g-content');
    const toc = buildToc(main);
    if (toc && content) {
      main.appendChild(toc);
      highlightToc(toc, main);
    }

    const pager = buildPager(current);
    const footer = content ? content.querySelector('.g-footer') : null;
    if (pager && footer) footer.insertBefore(pager, footer.firstChild);

    applyTheme(document.documentElement.dataset.theme);
    document.getElementById('g-theme').addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      persist(THEME_KEY, next);
    });

    const menu = document.getElementById('g-menu');
    const setMenu = (open) => {
      const nav = document.getElementById('g-sidebar');
      if (nav) nav.dataset.open = String(open);
      scrim.dataset.open = String(open);
      menu.setAttribute('aria-expanded', String(open));
    };
    menu.addEventListener('click', () => setMenu(document.getElementById('g-sidebar').dataset.open !== 'true'));
    scrim.addEventListener('click', () => setMenu(false));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setMenu(false);
    });

    const filter = document.getElementById('g-filter');
    filter.addEventListener('input', () => {
      const q = filter.value.trim().toLowerCase();
      const nav = document.getElementById('g-sidebar');
      for (const link of nav.querySelectorAll('.g-navlink')) {
        link.hidden = q !== '' && !link.dataset.title.includes(q);
      }
      for (const group of nav.querySelectorAll('.g-navgroup')) {
        group.hidden = !Array.from(group.querySelectorAll('.g-navlink')).some((l) => !l.hidden);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
