/*
  Stakeholder tour — tabs, full-size screenshots, and the tour checklist.
  Runs from file:// with no build step, like the rest of the guide.
*/
(() => {
  const CHECK_KEY = `${(window.GUIDE_SITE || { id: 'guide' }).id}-tour-checklist`;

  // ── Tabs ──────────────────────────────────────────────────────────────────
  // Markup: .t-tabs > .t-tablist > button[data-tab] … and .t-panel[data-panel].
  function initTabs(root) {
    const buttons = Array.from(root.querySelectorAll(':scope > .t-tablist > button'));
    const panels = Array.from(root.querySelectorAll(':scope > .t-panel'));
    const select = (i, focus) => {
      buttons.forEach((b, j) => {
        b.setAttribute('aria-selected', String(i === j));
        b.tabIndex = i === j ? 0 : -1;
      });
      panels.forEach((p, j) => {
        p.hidden = i !== j;
      });
      if (focus) buttons[i].focus();
    };
    buttons.forEach((b, i) => {
      b.setAttribute('role', 'tab');
      b.type = 'button';
      b.addEventListener('click', () => select(i, false));
      b.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') select((i + 1) % buttons.length, true);
        if (e.key === 'ArrowLeft') select((i - 1 + buttons.length) % buttons.length, true);
      });
    });
    panels.forEach((p) => p.setAttribute('role', 'tabpanel'));
    root.querySelector(':scope > .t-tablist').setAttribute('role', 'tablist');
    select(0, false);
  }

  // ── Screenshots open full size ────────────────────────────────────────────
  function initLightbox() {
    const box = document.createElement('div');
    box.className = 't-lightbox';
    box.hidden = true;
    box.innerHTML = '<img alt="" /><p></p>';
    document.body.appendChild(box);
    const img = box.querySelector('img');
    const cap = box.querySelector('p');
    const close = () => {
      box.hidden = true;
    };
    box.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    for (const fig of document.querySelectorAll('.t-shot')) {
      const pic = fig.querySelector('img');
      if (!pic) continue;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Open screenshot full size');
      pic.replaceWith(btn);
      btn.appendChild(pic);
      btn.addEventListener('click', () => {
        img.src = pic.src;
        img.alt = pic.alt;
        const caption = fig.querySelector('figcaption');
        cap.textContent = caption ? caption.textContent.trim() : '';
        box.hidden = false;
      });
    }
  }

  // ── Tour checklist (kept in this browser only) ────────────────────────────
  function initChecklist() {
    const boxes = Array.from(document.querySelectorAll('.t-check input[type="checkbox"][data-id]'));
    if (boxes.length === 0) return;
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(CHECK_KEY) || '{}') || {};
    } catch {
      saved = {};
    }
    const bar = document.querySelector('.t-progress-bar span');
    const label = document.querySelector('.t-progress-label');
    const update = () => {
      const done = boxes.filter((b) => b.checked).length;
      if (bar) bar.style.width = `${Math.round((done / boxes.length) * 100)}%`;
      if (label) label.textContent = `${done} of ${boxes.length} stops completed`;
    };
    for (const b of boxes) {
      b.checked = Boolean(saved[b.dataset.id]);
      b.addEventListener('change', () => {
        saved[b.dataset.id] = b.checked;
        try {
          localStorage.setItem(CHECK_KEY, JSON.stringify(saved));
        } catch {
          /* private mode — the ticks still work for this visit */
        }
        update();
      });
    }
    const reset = document.querySelector('[data-check-reset]');
    if (reset) {
      reset.addEventListener('click', () => {
        for (const b of boxes) b.checked = false;
        saved = {};
        try {
          localStorage.removeItem(CHECK_KEY);
        } catch {
          /* nothing stored */
        }
        update();
      });
    }
    update();
  }

  function init() {
    for (const t of document.querySelectorAll('.t-tabs')) initTabs(t);
    initLightbox();
    initChecklist();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
