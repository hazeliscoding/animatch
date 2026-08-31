import { expect, test } from '@playwright/test';

const NAV_ITEMS = ['Compare', 'Shared backlog', 'Groups', 'Recommendations', 'My profile'];

// Regression for the invisible-tab bug: inactive nav links inherited the
// global `a.hk-link-plain:visited` blue and vanished against the blue nav bar.
// Note getComputedStyle reports the unvisited style for :visited links (browser
// privacy), so these assertions guard the base state; the component now also
// pins the :visited state explicitly in CSS.
test('global nav shows every item in white, active or not', async ({ page }) => {
  await page.goto('/compare');
  const nav = page.getByRole('navigation', { name: 'Global navigation' });
  for (const label of NAV_ITEMS) {
    const link = nav.getByRole('link', { name: label, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveCSS('color', 'rgb(255, 255, 255)');
  }
});

test('nav links stay visible and functional while navigating', async ({ page }) => {
  await page.goto('/compare');
  const nav = page.getByRole('navigation', { name: 'Global navigation' });

  await nav.getByRole('link', { name: 'Shared backlog' }).click();
  await expect(page.getByRole('heading', { name: /Shared backlog/ })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Compare', exact: true })).toHaveCSS(
    'color',
    'rgb(255, 255, 255)',
  );

  await nav.getByRole('link', { name: 'Groups' }).click();
  await expect(page.getByRole('heading', { name: /Saturday watch club/ })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Shared backlog', exact: true })).toHaveCSS(
    'color',
    'rgb(255, 255, 255)',
  );

  await nav.getByRole('link', { name: 'Compare', exact: true }).click();
  await expect(page.getByText('Taste match', { exact: true })).toBeVisible();
});

test('active nav item tracks the current route', async ({ page }) => {
  await page.goto('/backlog');
  const nav = page.getByRole('navigation', { name: 'Global navigation' });
  await expect(nav.getByRole('link', { name: 'Shared backlog' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(nav.getByRole('link', { name: 'Compare', exact: true })).not.toHaveAttribute(
    'aria-current',
    'page',
  );
});
