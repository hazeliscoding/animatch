import { expect, test } from '@playwright/test';
import { FIXTURES } from './fixtures';

const mockAnilist = async (page: import('@playwright/test').Page) => {
  await page.route('https://graphql.anilist.co/**', async (route) => {
    const body = route.request().postDataJSON() as { variables: { name: string } };
    const fixture = FIXTURES[body.variables.name];
    if (!fixture) {
      await route.fulfill({ status: 404, json: { errors: [{ message: 'User not found' }] } });
      return;
    }
    await route.fulfill({ json: fixture });
  });
};

test('loads real backlogs via query params', async ({ page }) => {
  await mockAnilist(page);
  await page.goto('/backlog?a=alice&b=bob');

  // both-plan tab: Monster Fixture planned by both, Started One planned by alice / started by bob
  const list = page.locator('.list-panel');
  await expect(list.getByRole('link', { name: 'Monster Fixture' })).toBeVisible();
  await expect(list.getByText('BOTH PLAN', { exact: true })).toBeVisible();
  await expect(list.getByText('BOB STARTED', { exact: true })).toBeVisible();
  await expect(list.getByText('bob is 5 episodes in — easy to sync up')).toBeVisible();

  // overlap module reflects fixture counts: alice plans 3, bob plans 1, both 1
  const overlap = page.locator('.overlap');
  await expect(overlap.getByText('alice plan to watch')).toBeVisible();
  await expect(overlap.locator('.o-row').first()).toContainText('3');
  await expect(overlap.locator('.o-row.total')).toContainText('1 (33%)');

  // picks ranked with gold medal on top predicted title
  await expect(page.locator('.pick').first()).toContainText('Monster Fixture');
  await expect(page.locator('.medal-gold')).toHaveText('1');
});

test('tabs partition only-one and watching-together when live', async ({ page }) => {
  await mockAnilist(page);
  await page.goto('/backlog?a=alice&b=bob');

  await page.getByRole('tab', { name: /Only in one backlog/ }).click();
  await expect(page.locator('.list-panel').getByRole('link', { name: 'Solo Plan' })).toBeVisible();
  await expect(page.locator('.list-panel').getByText('only alice')).toBeVisible();

  await page.getByRole('tab', { name: /Watching together/ }).click();
  await expect(page.getByText('Nothing currently airing together.')).toBeVisible();
});

test('pair params carry from Compare to Shared backlog through the nav', async ({ page }) => {
  await mockAnilist(page);
  await page.goto('/compare');
  await page.getByPlaceholder('first username').fill('alice');
  await page.getByPlaceholder('second username').fill('bob');
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(page.locator('.user-name').first()).toHaveText('alice');

  await page.getByRole('navigation', { name: 'Global navigation' }).getByRole('link', { name: 'Shared backlog' }).click();
  await expect(page).toHaveURL(/backlog\?.*a=alice/);
  await expect(page.locator('.subtitle')).toHaveText('alice × bob');
  await expect(page.locator('.list-panel').getByRole('link', { name: 'Monster Fixture' })).toBeVisible();
});

test('empty state renders without params', async ({ page }) => {
  await page.goto('/backlog');
  await expect(page.getByRole('heading', { name: 'See what you both plan to watch' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Load a live sample/ })).toBeVisible();
  await expect(page.locator('.list-panel')).toHaveCount(0);
});
