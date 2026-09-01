import { expect, test } from '@playwright/test';

test('meta description, canonical, and og:url track the route', async ({ page }) => {
  await page.goto('/backlog');
  await expect(page).toHaveTitle(/Shared backlog — AniMatch/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /plan-to-watch lists/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/backlog$/);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', /\/backlog$/);

  // navigating updates the tags
  await page
    .getByRole('navigation', { name: 'Global navigation' })
    .getByRole('link', { name: 'Groups' })
    .click();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /watch club/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/groups$/);
});

test('social cards and icons are declared', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-image\.png$/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', 'site.webmanifest');
  await expect(page.locator('link[rel="icon"][sizes="32x32"]')).toHaveAttribute('href', 'favicon-32.png');
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
});
