import { expect, test } from '@playwright/test';
import { FIXTURES } from './fixtures';

const SEARCH_RESPONSE = {
  data: {
    Page: {
      users: [
        { id: 1, name: 'alice', avatar: { medium: null }, statistics: { anime: { count: 123 } } },
        { id: 2, name: 'bob', avatar: { medium: null }, statistics: { anime: { count: 45 } } },
      ],
    },
  },
};

const mockAnilist = async (page: import('@playwright/test').Page) => {
  await page.route('https://graphql.anilist.co/**', async (route) => {
    const body = route.request().postDataJSON() as { query: string; variables: { name?: string; search?: string } };
    if (body.query.includes('users(search')) {
      await route.fulfill({ json: SEARCH_RESPONSE });
      return;
    }
    const fixture = FIXTURES[body.variables.name ?? ''];
    if (!fixture) {
      await route.fulfill({ status: 404, json: { errors: [{ message: 'User not found' }] } });
      return;
    }
    await route.fulfill({ json: fixture });
  });
};

test('header search finds users and fills the compare pair', async ({ page }) => {
  await mockAnilist(page);
  await page.goto('/compare');

  const searchBox = page.getByRole('searchbox', { name: 'Search AniList users' }).first();
  await searchBox.fill('ali');
  const dropdown = page.locator('.search-results').first();
  await expect(dropdown.getByRole('button', { name: /alice/ })).toBeVisible();
  await expect(dropdown.getByText('123 anime')).toBeVisible();

  // first pick fills slot a and opens the picker with it
  await dropdown.getByRole('button', { name: /alice/ }).click();
  await expect(page).toHaveURL(/compare\?a=alice/);
  await expect(page.getByPlaceholder('first username')).toHaveValue('alice');
  await expect(page.getByText('Now add a second username')).toBeVisible();

  // second pick fills slot b and triggers the live comparison
  await searchBox.fill('bo');
  await dropdown.getByRole('button', { name: /bob/ }).click();
  await expect(page).toHaveURL(/a=alice&b=bob/);
  await expect(page.locator('.user-name').first()).toHaveText('alice');
  await expect(page.locator('.user-name').nth(1)).toHaveText('bob');
});

test('dropdown closes on outside click, Escape, and arrow keys rove options', async ({ page }) => {
  await mockAnilist(page);
  await page.goto('/compare');
  const searchBox = page.getByRole('searchbox', { name: 'Search AniList users' }).first();

  await searchBox.fill('ali');
  await expect(page.locator('.search-results').first()).toBeVisible();
  await page.getByRole('heading', { name: 'Pick two users to compare' }).click();
  await expect(page.locator('.search-results')).toHaveCount(0);

  await searchBox.fill('ali');
  await expect(page.locator('.search-results').first()).toBeVisible();
  await searchBox.press('ArrowDown');
  await expect(page.locator('.search-results').first().getByRole('button', { name: /alice/ })).toBeFocused();
  await searchBox.press('Escape');
  await expect(page.locator('.search-results')).toHaveCount(0);
  await expect(searchBox).toBeFocused();
});
