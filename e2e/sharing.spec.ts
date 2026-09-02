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

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test('share puts the card image on the clipboard when native share is unavailable', async ({ page }) => {
  await mockAnilist(page);
  await page.goto('/compare?a=alice&b=bob');
  await expect(page.locator('.user-name').first()).toHaveText(/alice/);

  await page.getByRole('button', { name: 'Share card →' }).click();
  await expect(page.locator('.share-status').first()).toHaveText('Card copied — paste it anywhere');
  const clipboardTypes = await page.evaluate(async () => {
    const items = await navigator.clipboard.read();
    return items.flatMap((i) => [...i.types]);
  });
  expect(clipboardTypes).toContain('image/png');
});

test('copy link copies the comparison URL', async ({ page }) => {
  await mockAnilist(page);
  await page.goto('/compare?a=alice&b=bob');
  await expect(page.locator('.user-name').first()).toHaveText(/alice/);

  await page.getByRole('button', { name: 'Copy link' }).click();
  await expect(page.locator('.share-status').first()).toHaveText('Link copied');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('/compare?a=alice&b=bob');
});

test('save card downloads a themed PNG', async ({ page }) => {
  await mockAnilist(page);
  await page.goto('/compare?a=alice&b=bob');
  await expect(page.locator('.user-name').first()).toHaveText(/alice/);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save card' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('animatch-alice-x-bob.png');
  await expect(page.locator('.share-status').first()).toHaveText('Card saved');
});
