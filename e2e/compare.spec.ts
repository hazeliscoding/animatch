import { expect, test } from '@playwright/test';

import { FIXTURES } from './fixtures';

test('empty state prompts for users instead of showing fake data', async ({ page }) => {
  await page.goto('/compare');
  await expect(page.getByRole('heading', { name: 'Pick two users to compare' })).toBeVisible();
  await expect(page.getByPlaceholder('first username')).toBeVisible();
  await expect(page.getByRole('button', { name: /Load a live sample/ })).toBeVisible();
  await expect(page.locator('.score')).toHaveCount(0);
  await expect(page.locator('.user-name')).toHaveCount(0);
});

test('empty submit shows a validation error', async ({ page }) => {
  await page.goto('/compare');
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(page.locator('.picker-error')).toHaveText('Enter two AniList usernames.');
});

test('comparing two users renders live data (AniList mocked)', async ({ page }) => {
  await page.route('https://graphql.anilist.co/**', async (route) => {
    const body = route.request().postDataJSON() as { variables: { name: string } };
    const fixture = FIXTURES[body.variables.name];
    if (!fixture) {
      await route.fulfill({ status: 404, json: { errors: [{ message: 'User not found' }] } });
      return;
    }
    await route.fulfill({ json: fixture });
  });

  await page.goto('/compare');
  await page.getByPlaceholder('first username').fill('alice');
  await page.getByPlaceholder('second username').fill('bob');
  await page.getByRole('button', { name: 'Compare', exact: true }).click();

  await expect(page.locator('.user-name').first()).toHaveText('alice');
  await expect(page.locator('.user-name').nth(1)).toHaveText('bob');
  // alice 4.0 vs bob 9.0 on "Anime Two" is the biggest disagreement
  const disagreements = page.locator('.dis-row').first();
  await expect(disagreements).toContainText('Anime Two');
  await expect(disagreements).toContainText('Δ 5.0');
  // 2 titles scored by both users
  await expect(page.getByText('All 2 →')).toBeVisible();
  await expect(page).toHaveURL(/a=alice&b=bob/);
});

test('unknown user surfaces a friendly error and stays on the empty state', async ({ page }) => {
  await page.route('https://graphql.anilist.co/**', (route) =>
    route.fulfill({ status: 404, json: { errors: [{ message: 'User not found' }] } }),
  );
  await page.goto('/compare');
  await page.getByPlaceholder('first username').fill('nobody-here');
  await page.getByPlaceholder('second username').fill('also-nobody');
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(page.locator('.picker-error')).toContainText('not found');
  await expect(page.locator('.user-name')).toHaveCount(0);
});
