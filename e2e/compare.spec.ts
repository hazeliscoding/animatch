import { expect, test } from '@playwright/test';

const gqlMedia = (id: number, title: string, genres: string[], studio: string) => ({
  id,
  title: { userPreferred: title },
  format: 'TV',
  seasonYear: 2020,
  episodes: 12,
  genres,
  coverImage: { medium: null },
  studios: { nodes: [{ name: studio }] },
});

const M1 = gqlMedia(1, 'Anime One', ['Action'], 'MAPPA');
const M2 = gqlMedia(2, 'Anime Two', ['Drama'], 'MAPPA');
const M3 = gqlMedia(3, 'Anime Three', ['Action'], 'Bones');
const M4 = gqlMedia(4, 'Anime Four', ['Romance'], 'Bones');

const FIXTURES: Record<string, unknown> = {
  alice: {
    data: {
      MediaListCollection: {
        user: { id: 1, name: 'alice', avatar: { medium: null } },
        lists: [
          {
            isCustomList: false,
            entries: [
              { score: 9, media: M1 },
              { score: 4, media: M2 },
              { score: 8, media: M3 },
            ],
          },
        ],
      },
    },
  },
  bob: {
    data: {
      MediaListCollection: {
        user: { id: 2, name: 'bob', avatar: { medium: null } },
        lists: [
          {
            isCustomList: false,
            entries: [
              { score: 8.5, media: M1 },
              { score: 9, media: M2 },
              { score: 7, media: M4 },
            ],
          },
        ],
      },
    },
  },
};

test('demo comparison renders until real users are compared', async ({ page }) => {
  await page.goto('/compare');
  await expect(page.getByText('Showing demo data')).toBeVisible();
  await expect(page.locator('.score')).toHaveText(/78\s*\/100/);
  await expect(page.locator('.user-name').first()).toHaveText('yuki_47');
  await expect(page.getByRole('heading', { name: 'Compatibility breakdown' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Genre taste profile' })).toBeVisible();
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
  await expect(page.getByText('Showing demo data')).toHaveCount(0);
});

test('unknown user surfaces a friendly error and keeps demo data', async ({ page }) => {
  await page.route('https://graphql.anilist.co/**', (route) =>
    route.fulfill({ status: 404, json: { errors: [{ message: 'User not found' }] } }),
  );
  await page.goto('/compare');
  await page.getByPlaceholder('first username').fill('nobody-here');
  await page.getByPlaceholder('second username').fill('also-nobody');
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(page.locator('.picker-error')).toContainText('not found');
  await expect(page.locator('.user-name').first()).toHaveText('yuki_47');
});
