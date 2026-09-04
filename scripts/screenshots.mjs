/**
 * Regenerates the README screenshots in docs/screenshots/ from live AniList
 * data (the same sample pair/group the app's "try it live" links use).
 *
 *   npm start -- --port 4213   # in another terminal, or reuse the e2e server
 *   node scripts/screenshots.mjs
 */
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:4213';
const OUT = 'docs/screenshots';
const PAIR = 'a=Anime&b=Kira';
const SAVED_GROUP = {
  id: 'sample',
  name: 'Saturday watch club',
  users: ['Anime', 'Kira', 'akirakira', 'yuki'],
  at: Date.now(),
};

const browser = await chromium.launch();

async function shot(name, path, { mobile = false, savedGroups = null } = {}) {
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 900 } : { width: 960, height: 750 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  if (savedGroups) {
    await page.addInitScript((groups) => {
      localStorage.setItem('animatch.savedGroups', JSON.stringify(groups));
    }, savedGroups);
  }
  await page.goto(BASE + path);
  await page.locator('hk-module:visible').first().waitFor({ timeout: 60_000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // let cover art paint
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: !mobile });
  console.log(`ok ${name}.png`);
  await context.close();
}

await shot('compare', `/compare?${PAIR}`);
await shot('backlog', `/backlog?${PAIR}`);
await shot('groups', '/groups?g=sample', { savedGroups: [SAVED_GROUP] });
await shot('recommendations', `/recommendations?${PAIR}`);
await shot('compare-mobile', `/compare?${PAIR}`, { mobile: true });

await browser.close();
