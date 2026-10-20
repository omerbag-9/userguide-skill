/*
  Screenshot helpers for capture scripts. Import by absolute path:

    import { open, settle, shot, hideText, routeScript } from '/abs/path/to/scripts/capture.mjs';
    const { browser, ctx, page } = await open({ shotsDir: '/abs/shots' });
    await page.goto('http://localhost:3000/login');
    await shot(page, 'p-login');                      // viewport capture -> shots/p-login.png
    await shot(page, 'p-register', { full: true });   // full-page capture
    await browser.close();

  Playwright is resolved from the project, then from the global npm root.
*/
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

export function loadPlaywright() {
  const attempts = [process.cwd() + '/', import.meta.url];
  try {
    attempts.push(execSync('npm root -g').toString().trim() + '/');
  } catch {
    /* no global npm */
  }
  for (const base of attempts) {
    try {
      return createRequire(base.endsWith('/') ? base + 'noop.js' : base)('playwright');
    } catch {
      /* try the next location */
    }
  }
  throw new Error('Playwright not found. Install it with `npm i -D playwright` (browsers: `npx playwright install chromium`).');
}

let SHOTS_DIR = path.resolve('shots');

/** Launches Chromium at 1440×900. Pass shotsDir once; shot() writes there. */
export async function open({ shotsDir, viewport = { width: 1440, height: 900 }, ...ctxOptions } = {}) {
  if (shotsDir) SHOTS_DIR = path.resolve(shotsDir);
  mkdirSync(SHOTS_DIR, { recursive: true });
  const { chromium } = loadPlaywright();
  const executablePath = process.env.CHROMIUM_PATH || undefined;
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, ...ctxOptions });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  return { browser, ctx, page };
}

/** Waits for the network to go quiet, then a short pause for animations. */
export async function settle(page, ms = 600) {
  try {
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } catch {
    /* long-polling apps never go idle — carry on */
  }
  await page.waitForTimeout(ms);
}

/** Saves shots/<name>.png. opts: { full, wait, clip } */
export async function shot(page, name, opts = {}) {
  await settle(page, opts.wait ?? 600);
  await page.screenshot({ path: path.join(SHOTS_DIR, `${name}.png`), fullPage: Boolean(opts.full), clip: opts.clip });
  console.log('shot', name);
}

/**
 * Hides small elements whose text starts with a pattern — for dev-only banners
 * such as "Development build: your code is 000000" that must not appear in a guide.
 */
export async function hideText(page, pattern) {
  await page.evaluate((src) => {
    const re = new RegExp(src);
    for (const el of document.querySelectorAll('div,p,span,section,aside')) {
      if (re.test(el.textContent.trim()) && el.children.length < 3) el.style.display = 'none';
    }
  }, pattern.source ?? String(pattern));
}

/**
 * Replaces a third-party script (payment widget, map, chat) with local code,
 * so a flow can be completed and photographed without the real service.
 */
export async function routeScript(ctx, urlGlob, jsSource) {
  await ctx.route(urlGlob, (r) => r.fulfill({ contentType: 'application/javascript', body: jsSource }));
}
