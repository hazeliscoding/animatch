import { expect, test } from '@playwright/test';

test('defaults to light, moon toggle switches and persists', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.getByRole('link', { name: '☾ Dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('link', { name: '☀ Light mode' })).toBeVisible();

  // explicit choice survives a reload
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.getByRole('link', { name: '☀ Light mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test.describe('OS dark preference', () => {
  test.use({ colorScheme: 'dark' });

  test('is respected when the user has not chosen', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

test('mobile header has a theme toggle', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
