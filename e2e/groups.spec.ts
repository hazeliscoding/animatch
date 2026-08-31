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

test('builds a real group from the member picker', async ({ page }) => {
  await mockAnilist(page);
  await page.goto('/groups');
  await expect(page.getByText('Showing demo data', { exact: false })).toBeVisible();

  await page.getByPlaceholder('AniList username').fill('alice');
  await page.getByRole('button', { name: '+ Add member' }).click();
  await page.getByPlaceholder('AniList username').fill('bob');
  await page.getByRole('button', { name: '+ Add member' }).click();

  await expect(page.getByRole('heading', { name: /Watch group/ })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'alice' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'bob' })).toBeVisible();
  await expect(page).toHaveURL(/users=alice,bob/);

  // both users plan "Monster Fixture" -> 2/2 everyone
  const backlog = page.locator('.backlog-list .row').first();
  await expect(backlog).toContainText('Monster Fixture');
  await expect(backlog).toContainText('2/2');
  await expect(backlog).toContainText('everyone');
});

test('loads a group from ?users= and supports member removal', async ({ page }) => {
  await mockAnilist(page);
  await page.goto('/groups?users=alice,bob');
  await expect(page.getByRole('columnheader', { name: 'alice' })).toBeVisible();
  await expect(page.getByText('Showing demo data', { exact: false })).toHaveCount(0);

  await page.getByRole('button', { name: 'Remove bob' }).click();
  // below two members the page returns to demo state
  await expect(page.getByText('Showing demo data', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Saturday watch club/ })).toBeVisible();
});

test('unknown member surfaces an error and keeps demo data', async ({ page }) => {
  await mockAnilist(page);
  await page.goto('/groups');
  await page.getByPlaceholder('AniList username').fill('alice');
  await page.getByRole('button', { name: '+ Add member' }).click();
  await page.getByPlaceholder('AniList username').fill('ghost-user');
  await page.getByRole('button', { name: '+ Add member' }).click();
  await expect(page.locator('.picker-error')).toContainText('not found');
  await expect(page.getByRole('columnheader', { name: 'yuki_47' })).toBeVisible();
});
