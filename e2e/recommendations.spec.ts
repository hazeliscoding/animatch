import { expect, test } from '@playwright/test';
import { CATALOG_RESPONSE, FIXTURES } from './fixtures';

const mockAnilist = async (page: import('@playwright/test').Page) => {
  await page.route('https://graphql.anilist.co/**', async (route) => {
    const body = route.request().postDataJSON() as { query: string; variables?: { name?: string } };
    if (body.query.includes('popular:')) {
      await route.fulfill({ json: CATALOG_RESPONSE });
      return;
    }
    const fixture = FIXTURES[body.variables?.name ?? ''];
    if (!fixture) {
      await route.fulfill({ status: 404, json: { errors: [{ message: 'User not found' }] } });
      return;
    }
    await route.fulfill({ json: fixture });
  });
};

test('empty state prompts for a pair', async ({ page }) => {
  await page.goto('/recommendations');
  await expect(page.getByRole('heading', { name: /Recommendations/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Find something new for both of you' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Load a live sample/ })).toBeVisible();
  await expect(page.locator('.list-panel')).toHaveCount(0);
});

test('live recommendations exclude owned titles and rank by fit', async ({ page }) => {
  await mockAnilist(page);
  await page.goto('/recommendations?a=alice&b=bob');
  const list = page.locator('.list-panel');

  // alice/bob both have "Anime One" (M1) listed — never recommended
  await expect(list.getByRole('link', { name: 'Fresh Action Pick' })).toBeVisible();
  await expect(list.getByRole('link', { name: 'Anime One' })).toHaveCount(0);
  await expect(list.getByRole('link', { name: 'Acclaimed Sleeper' })).toBeVisible();
  await expect(list.getByText('Loved site-wide · 91/100')).toBeVisible();
  await expect(page.locator('.subtitle')).toHaveText('alice × bob');
});

test('nav reaches recommendations and preserves the pair', async ({ page }) => {
  await mockAnilist(page);
  await page.goto('/compare?a=alice&b=bob');
  await expect(page.locator('.user-name').first()).toHaveText(/alice/);
  await page
    .getByRole('navigation', { name: 'Global navigation' })
    .getByRole('link', { name: 'Recommendations' })
    .click();
  await expect(page).toHaveURL(/recommendations\?.*a=alice/);
  await expect(page.locator('.subtitle')).toHaveText('alice × bob');
});
