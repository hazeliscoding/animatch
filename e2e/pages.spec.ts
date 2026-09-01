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

test('shared backlog page renders list, tabs, and rail modules', async ({ page }) => {
  await mockAnilist(page);
  await page.goto('/backlog?a=alice&b=bob');
  await expect(page.getByRole('tab', { name: /Both plan to watch/ })).toBeVisible();
  await expect(page.locator('.list-panel').getByRole('link', { name: 'Monster Fixture' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Watch-together picks' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Backlog overlap' })).toBeVisible();
});

test('groups page renders member stats and pairwise matrix', async ({ page }) => {
  await mockAnilist(page);
  await page.goto('/groups?users=alice,bob');
  await expect(page.getByRole('heading', { name: /Watch group/ })).toBeVisible();
  await expect(page.locator('hk-comparison-table').getByRole('columnheader', { name: 'alice' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pairwise taste match' })).toBeVisible();
  await expect(page.locator('.m-cell').nth(1)).not.toBeEmpty();
  await expect(page.getByRole('heading', { name: 'Backlog shared by the group' })).toBeVisible();
});

test('mobile viewport shows summary card and bottom nav', async ({ page }) => {
  await mockAnilist(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/compare?a=alice&b=bob');
  await expect(page.locator('.mobile-summary')).toBeVisible();
  await expect(page.locator('.score-big')).toHaveText(/\d+/);
  const bottomNav = page.locator('.mobile-nav');
  for (const label of ['Compare', 'Backlog', 'Groups', 'Profile']) {
    await expect(bottomNav.getByText(label)).toBeVisible();
  }
  // desktop chrome must be hidden on mobile
  await expect(page.getByRole('navigation', { name: 'Global navigation' })).toBeHidden();
});
