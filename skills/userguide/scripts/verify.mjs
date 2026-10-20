/*
  Checks a built guide in a real browser:

    node verify.mjs /abs/path/to/userguide [reviewDir]

  For every page: console errors, broken images, horizontal overflow at 390px,
  tabs and lightbox wiring. Writes review screenshots (welcome page and the
  busiest page, light and dark, desktop and phone) to reviewDir (default
  <guide>/../guide-review) — look at them before delivering. Exit code 1 on
  any problem.
*/
import { mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadPlaywright } from './capture.mjs';

const guide = path.resolve(process.argv[2] || 'userguide');
const review = path.resolve(process.argv[3] || path.join(guide, '..', 'guide-review'));
mkdirSync(review, { recursive: true });

const pages = readdirSync(guide).filter((f) => f.endsWith('.html')).sort();
const { chromium } = loadPlaywright();
const executablePath = process.env.CHROMIUM_PATH || undefined;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const problems = [];
let busiest = { name: 'index.html', tabs: 0 };

async function visit(file, { width, theme }) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  await ctx.addInitScript((th) => {
    try {
      for (const k of Object.keys(localStorage)) if (k.endsWith('-guide-theme')) localStorage.removeItem(k);
    } catch {}
    window.matchMedia = ((orig) => (q) =>
      q.includes('prefers-color-scheme') ? { matches: th === 'dark', media: q, addEventListener() {}, removeEventListener() {} } : orig(q))(
      window.matchMedia.bind(window),
    );
  }, theme);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text()) && errs.push(m.text()));
  await page.goto(pathToFileURL(path.join(guide, file)).href);
  await page.waitForTimeout(700);
  const info = await page.evaluate(() => {
    for (const img of document.images) img.loading = 'eager';
    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      tabs: document.querySelectorAll('.t-tabs').length,
      tablists: document.querySelectorAll('[role=tablist]').length,
      chrome: Boolean(document.querySelector('.g-topbar') && document.querySelector('#g-sidebar')),
      lightbox: document.querySelectorAll('.t-shot button').length,
      shots: document.querySelectorAll('.t-shot').length,
    };
  });
  await page.waitForTimeout(600);
  info.broken = await page.evaluate(() =>
    Array.from(document.images).filter((i) => i.getAttribute('src') && i.complete && i.naturalWidth === 0).map((i) => i.getAttribute('src')),
  );
  return { ctx, page, errs, info };
}

for (const file of pages) {
  const { ctx, errs, info } = await visit(file, { width: 1440, theme: 'light' });
  const tag = file;
  if (errs.length) problems.push(`${tag}: console errors: ${errs.join(' | ')}`);
  if (info.broken.length) problems.push(`${tag}: broken images: ${info.broken.join(', ')}`);
  if (!info.chrome) problems.push(`${tag}: top bar or sidebar was not injected`);
  if (info.tabs !== info.tablists) problems.push(`${tag}: ${info.tabs - info.tablists} tab group(s) not wired`);
  if (info.lightbox !== info.shots) problems.push(`${tag}: ${info.shots - info.lightbox} screenshot(s) not clickable`);
  if (info.tabs > busiest.tabs) busiest = { name: file, tabs: info.tabs };
  await ctx.close();

  const mobile = await visit(file, { width: 390, theme: 'light' });
  if (mobile.info.overflow > 1) problems.push(`${tag}: page scrolls sideways by ${mobile.info.overflow}px at 390px wide`);
  await mobile.ctx.close();
}

for (const file of ['index.html', busiest.name]) {
  for (const [width, theme] of [[1440, 'light'], [1440, 'dark'], [390, 'light']]) {
    const { ctx, page } = await visit(file, { width, theme });
    if (file !== 'index.html') {
      const lists = page.locator('.t-tablist');
      if ((await lists.count()) > 0) {
        await lists.nth(0).locator('button').nth(1).click();
        await lists.nth(0).scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
      }
    }
    await page.screenshot({ path: path.join(review, `${file.replace('.html', '')}-${width}-${theme}.png`) });
    await ctx.close();
  }
}

await browser.close();
console.log(`Checked ${pages.length} pages. Review screenshots: ${review}`);
if (problems.length) {
  console.log(`Problems (${problems.length}):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log('No problems found.');
