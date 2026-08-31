import { expect, test } from '@playwright/test';

test('shared backlog page renders list, tabs, and rail modules', async ({ page }) => {
  await page.goto('/backlog');
  await expect(page.getByRole('tab', { name: /Both plan to watch/ })).toBeVisible();
  await expect(page.locator('.list-panel').getByRole('link', { name: 'Monster', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Watch-together picks' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Backlog overlap' })).toBeVisible();

  await page.getByRole('tab', { name: /Watching together/ }).click();
  await expect(page.getByText('Connect AniList to populate')).toBeVisible();
});

test('groups page renders member stats and pairwise matrix', async ({ page }) => {
  await page.goto('/groups');
  await expect(page.getByRole('heading', { name: /Saturday watch club/ })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'yuki_47' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pairwise taste match' })).toBeVisible();
  await expect(page.locator('.m-cell.k-strong').first()).toHaveText('78');
  await expect(page.getByRole('heading', { name: 'Backlog shared by the group' })).toBeVisible();
});

test('mobile viewport shows summary card and bottom nav', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/compare');
  await expect(page.locator('.mobile-summary')).toBeVisible();
  await expect(page.locator('.score-big')).toHaveText('78');
  const bottomNav = page.locator('.mobile-nav');
  for (const label of ['Compare', 'Backlog', 'Groups', 'Profile']) {
    await expect(bottomNav.getByText(label)).toBeVisible();
  }
  // desktop chrome must be hidden on mobile
  await expect(page.getByRole('navigation', { name: 'Global navigation' })).toBeHidden();
});
