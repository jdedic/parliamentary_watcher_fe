import { test, expect } from './fixtures/index';

test.describe('Navbar', () => {
  test.describe('layout and links', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('renders the ParlAI brand', async ({ page }) => {
      await expect(page.getByText('ParlAI')).toBeVisible();
    });

    test('renders Home nav link', async ({ page }) => {
      await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    });

    test('renders Plenary Sessions nav link', async ({ page }) => {
      await expect(page.getByRole('link', { name: 'Plenary Sessions' })).toBeVisible();
    });

    test('renders About nav link', async ({ page }) => {
      await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
    });

    test('renders EN and NL language buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'EN' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'NL' })).toBeVisible();
    });
  });

  test.describe('navigation', () => {
    test('brand click navigates to /', async ({ page }) => {
      await page.route('**/api/v1/sessions**', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ total: 0, sessions: [] }) })
      );
      await page.goto('/sessions');
      await page.getByText('ParlAI').click();
      await page.waitForURL('/');
      await expect(page).toHaveURL('/');
    });

    test('"Plenary Sessions" link navigates to /sessions', async ({ page }) => {
      await page.route('**/api/v1/sessions**', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ total: 0, sessions: [] }) })
      );
      await page.goto('/');
      await page.getByRole('link', { name: 'Plenary Sessions' }).click();
      await page.waitForURL('/sessions');
      await expect(page).toHaveURL('/sessions');
    });

    test('"About" link navigates to /about', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('link', { name: 'About' }).click();
      await page.waitForURL('/about');
      await expect(page).toHaveURL('/about');
    });

    test('"Home" link navigates back to / from /about', async ({ page }) => {
      await page.goto('/about');
      await page.getByRole('link', { name: 'Home' }).click();
      await page.waitForURL('/');
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('active route highlighting', () => {
    test('Home link has active-link class on /', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('link', { name: 'Home' })).toHaveClass(/active-link/);
    });

    test('Home link does not have active-link class on /about', async ({ page }) => {
      await page.goto('/about');
      await expect(page.getByRole('link', { name: 'Home' })).not.toHaveClass(/active-link/);
    });

    test('Plenary Sessions link has active-link class on /sessions', async ({ page }) => {
      await page.route('**/api/v1/sessions**', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ total: 0, sessions: [] }) })
      );
      await page.goto('/sessions');
      await expect(page.getByRole('link', { name: 'Plenary Sessions' })).toHaveClass(/active-link/);
    });

    test('About link has active-link class on /about', async ({ page }) => {
      await page.goto('/about');
      await expect(page.getByRole('link', { name: 'About' })).toHaveClass(/active-link/);
    });

    test('About link does not have active-link class on /', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('link', { name: 'About' })).not.toHaveClass(/active-link/);
    });
  });

  test.describe('language toggle EN ↔ NL', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('EN button has lang-active class by default', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'EN' })).toHaveClass(/lang-active/);
    });

    test('NL button does not have lang-active class by default', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'NL' })).not.toHaveClass(/lang-active/);
    });

    test('clicking NL gives NL button lang-active and removes it from EN', async ({ page }) => {
      await page.getByRole('button', { name: 'NL' }).click();
      await expect(page.getByRole('button', { name: 'NL', exact: true })).toHaveClass(/lang-active/);
      await expect(page.getByRole('button', { name: 'EN', exact: true })).not.toHaveClass(/lang-active/);
    });

    test('clicking NL changes hero title to Dutch', async ({ page }) => {
      await page.getByRole('button', { name: 'NL' }).click();
      await expect(page.getByRole('heading', { name: 'Parlementaire Vergaderingintelligentie' })).toBeVisible();
    });

    test('clicking NL translates "Plenary Sessions" nav link to "Plenaire vergaderingen"', async ({ page }) => {
      await page.getByRole('button', { name: 'NL' }).click();
      await expect(page.getByRole('link', { name: 'Plenaire vergaderingen' })).toBeVisible();
    });

    test('clicking NL translates "About" nav link to "Over ons"', async ({ page }) => {
      await page.getByRole('button', { name: 'NL' }).click();
      await expect(page.getByRole('link', { name: 'Over ons' })).toBeVisible();
    });

    test('switching back to EN restores English hero title', async ({ page }) => {
      await page.getByRole('button', { name: 'NL' }).click();
      // Wait for NL translations to finish loading before switching back
      await expect(page.getByRole('heading', { name: 'Parlementaire Vergaderingintelligentie' })).toBeVisible();
      await page.getByRole('button', { name: 'EN', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Parliamentary Session Intelligence' })).toBeVisible();
    });

    test('NL language persists when navigating to /about', async ({ page }) => {
      await page.getByRole('button', { name: 'NL' }).click();
      await page.getByRole('link', { name: 'Over ons' }).click();
      await page.waitForURL('/about');
      await expect(page.getByRole('heading', { level: 1, name: 'Over dit project' })).toBeVisible();
    });
  });
});
