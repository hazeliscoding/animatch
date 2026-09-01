import { expect, test } from '@playwright/test';
import { FIXTURES } from './fixtures';

const VIEWER_RESPONSE = {
  data: { Viewer: { id: 9, name: 'alice', avatar: { medium: null } } },
};

const mockAnilist = async (page: import('@playwright/test').Page) => {
  await page.route('https://graphql.anilist.co/**', async (route) => {
    const body = route.request().postDataJSON() as { query: string; variables?: { name?: string } };
    if (body.query.includes('Viewer')) {
      await route.fulfill({ json: VIEWER_RESPONSE });
      return;
    }
    if (body.query.includes('users(search')) {
      await route.fulfill({ json: { data: { Page: { users: [] } } } });
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

test('logged out: connect prompt, unconfigured hint, public profile lookup', async ({ page }) => {
  await mockAnilist(page);
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'My profile' })).toBeVisible();

  // no OAuth client configured yet -> connect explains setup
  await page.getByRole('button', { name: 'Connect AniList' }).click();
  await expect(page.locator('.picker-error')).toContainText('client ID');

  // any public profile can still be viewed
  await page.getByPlaceholder('AniList username').fill('alice');
  await page.getByRole('button', { name: 'View profile' }).click();
  await expect(page.getByRole('heading', { name: 'alice' })).toBeVisible();
  await expect(page).toHaveURL(/profile\?u=alice/);
  await expect(page.getByText('3 completed')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Genre taste' })).toBeVisible();
});

test('auth callback stores the token and profile shows the viewer', async ({ page }) => {
  await mockAnilist(page);
  await page.goto('/auth/callback#access_token=e2e-token&token_type=Bearer&expires_in=3600');
  await expect(page).toHaveURL(/\/profile/);
  await expect(page.getByText('Signed in as alice')).toBeVisible();
  await expect(page.locator('.you')).toHaveText('YOU');
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();

  // log out returns to the connect prompt
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page.getByRole('button', { name: 'Connect AniList' })).toBeVisible();
  await expect(page.getByText('Connect AniList', { exact: true }).first()).toBeVisible();
});

test('comparisons land in history: profile modules and picker chips', async ({ page }) => {
  await mockAnilist(page);
  await page.goto('/compare');
  await page.getByPlaceholder('first username').fill('alice');
  await page.getByPlaceholder('second username').fill('bob');
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(page.locator('.user-name').first()).toHaveText('alice');

  await page.goto('/profile');
  const recents = page.locator('.recents').first();
  await expect(recents.getByText('alice × bob')).toBeVisible();
  await expect(recents.getByText(/\/100/)).toBeVisible();

  // fresh compare page offers the recent pair as a one-click chip
  await page.goto('/compare');
  const chip = page.getByRole('button', { name: 'alice × bob' });
  await expect(chip).toBeVisible();
  await chip.click();
  await expect(page.locator('.user-name').first()).toHaveText('alice');
});

test('groups land in history and reopen from profile', async ({ page }) => {
  await mockAnilist(page);
  await page.goto('/groups?users=alice,bob');
  await expect(page.getByRole('columnheader', { name: 'alice' })).toBeVisible();

  await page.goto('/profile');
  const groupsModule = page.locator('.recents').nth(1);
  await expect(groupsModule.getByText('alice, bob')).toBeVisible();
  await groupsModule.getByText('alice, bob').click();
  await expect(page).toHaveURL(/groups\?users=alice,bob/);
});
