import { expect, test } from '@playwright/test';
import { FIXTURES } from './fixtures';

const mockAnilist = async (page: import('@playwright/test').Page) => {
  await page.route('https://graphql.anilist.co/**', async (route) => {
    const body = route.request().postDataJSON() as { query: string; variables?: { name?: string } };
    const fixture = FIXTURES[body.variables?.name ?? ''];
    if (!fixture) {
      await route.fulfill({ status: 404, json: { errors: [{ message: 'User not found' }] } });
      return;
    }
    await route.fulfill({ json: fixture });
  });
};

test('landing page explains the app and offers entry points', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /same taste in anime/ })).toBeVisible();
  await expect(page.getByLabel('First AniList username')).toBeVisible();
  await expect(page.getByText('Pick two AniList users')).toBeVisible();
  await expect(page.getByText('See your taste match')).toBeVisible();
  await expect(page.getByText('Find what to watch together')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Compare →' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Groups →' })).toBeVisible();
});

test('hero form starts a comparison', async ({ page }) => {
  await mockAnilist(page);
  await page.goto('/');
  await page.getByLabel('First AniList username').fill('alice');
  await page.getByLabel('Second AniList username').fill('bob');
  await page.getByRole('button', { name: 'Compare' }).click();
  await expect(page).toHaveURL(/compare\?a=alice&b=bob/);
  await expect(page.locator('.user-name').first()).toHaveText(/alice/);
});

test('hero "try it live" link loads the sample pair', async ({ page }) => {
  await mockAnilist(page);
  await page.goto('/');
  await page.getByRole('link', { name: /Try it live/ }).click();
  await expect(page).toHaveURL(/compare\?a=Anime&b=Kira/);
  await expect(page.locator('.user-name').first()).toHaveText(/Anime/);
  await expect(page.locator('.demo-badge')).toHaveCount(0);
});

test('compare empty state offers a live sample link', async ({ page }) => {
  await mockAnilist(page);
  await page.goto('/compare');
  await page.getByRole('link', { name: /load a live sample/ }).click();
  await expect(page.locator('.user-name').first()).toHaveText(/Anime/);
  await expect(page).toHaveURL(/a=Anime&b=Kira/);
});

test('genre profile toggles between bars and radar', async ({ page }) => {
  await mockAnilist(page);
  await page.goto('/compare?a=alice&b=bob');
  await expect(page.locator('.genres')).toBeVisible();
  await page.getByRole('tab', { name: 'Radar' }).click();
  await expect(page.locator('hk-genre-radar svg')).toBeVisible();
  await expect(page.locator('polygon.series')).toHaveCount(2);
  await page.getByRole('tab', { name: 'Bars' }).click();
  await expect(page.locator('.genres')).toBeVisible();
});

test('brand wordmark navigates back home', async ({ page }) => {
  await page.goto('/groups');
  await page.getByRole('link', { name: 'AniMatch for AniList' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: /same taste in anime/ })).toBeVisible();
});

test('unknown routes land on the home page', async ({ page }) => {
  await page.goto('/definitely-not-a-page');
  await expect(page.getByRole('heading', { name: /same taste in anime/ })).toBeVisible();
});
