import { expect, test } from '@playwright/test';
import { FIXTURES } from './fixtures';

const VIEWER_RESPONSE = {
  data: { Viewer: { id: 9, name: 'alice', avatar: { medium: null } } },
};

const signIn = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => localStorage.setItem('animatch.token', 'e2e-token'));
  await page.route('https://graphql.anilist.co/**', async (route) => {
    const body = route.request().postDataJSON() as { query: string; variables?: { name?: string } };
    if (body.query.includes('Viewer')) {
      await route.fulfill({ json: VIEWER_RESPONSE });
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

test('signed in: pickers prefill you as the first user', async ({ page }) => {
  await signIn(page);
  await page.goto('/compare');
  await expect(page.getByPlaceholder('first username')).toHaveValue('alice');

  await page.goto('/backlog');
  await expect(page.getByPlaceholder('first username')).toHaveValue('alice');

  await page.goto('/recommendations');
  await expect(page.getByPlaceholder('first username')).toHaveValue('alice');
});

test('signed in: someone else\'s profile offers "Compare with me"', async ({ page }) => {
  await signIn(page);
  await page.goto('/profile?u=bob');
  await expect(page.getByRole('heading', { name: 'bob' })).toBeVisible();
  await page.getByRole('button', { name: 'Compare with me →' }).click();
  await expect(page).toHaveURL(/compare\?a=alice&b=bob/);
  await expect(page.locator('.user-name').first()).toHaveText(/alice/);
  await expect(page.locator('.user-name').nth(1)).toHaveText(/bob/);
});

test('signed in: groups picker has an "Add me" shortcut', async ({ page }) => {
  await signIn(page);
  await page.goto('/groups');
  await page.getByRole('button', { name: 'Add me', exact: true }).click();
  await expect(page.locator('.member-chip')).toContainText('alice');
  // already added -> shortcut disappears
  await expect(page.getByRole('button', { name: 'Add me', exact: true })).toHaveCount(0);
});
