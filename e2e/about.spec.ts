import { test, expect } from './fixtures/index';

test.describe('About page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about');
  });

  test.describe('page content', () => {
    test('renders the page heading "About This Project"', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: 'About This Project' })).toBeVisible();
    });

    test('renders the Technology Stack section heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Technology Stack' })).toBeVisible();
    });

    test('renders paragraph about civic-tech initiative', async ({ page }) => {
      await expect(page.getByText(/civic-tech initiative aimed at making the work of the Dutch parliament/)).toBeVisible();
    });

    test('renders paragraph mentioning large language models', async ({ page }) => {
      await expect(page.getByText(/large language models/)).toBeVisible();
    });

    test('renders paragraph about the open-source stack', async ({ page }) => {
      await expect(page.getByText(/modern open-source stack/)).toBeVisible();
    });
  });

  test.describe('technology stack chips', () => {
    const TECHNOLOGIES = ['Python', 'FastAPI', 'OpenAI', 'Qdrant', 'PostgreSQL', 'Angular', 'Angular Material'];

    for (const tech of TECHNOLOGIES) {
      test(`renders the "${tech}" chip`, async ({ page }) => {
        await expect(page.getByText(tech, { exact: true })).toBeVisible();
      });
    }

    test('renders exactly 7 chips', async ({ page }) => {
      await expect(page.locator('mat-chip-set mat-chip')).toHaveCount(7);
    });
  });

  test.describe('Dutch (NL) language', () => {
    test('heading switches to "Over dit project" after clicking NL', async ({ page }) => {
      await page.getByRole('button', { name: 'NL' }).click();
      await expect(page.getByRole('heading', { level: 1, name: 'Over dit project' })).toBeVisible();
    });

    test('Technology Stack heading switches to "Technologiestack" after clicking NL', async ({ page }) => {
      await page.getByRole('button', { name: 'NL' }).click();
      await expect(page.getByRole('heading', { name: 'Technologiestack' })).toBeVisible();
    });

    test('paragraph text switches to Dutch after clicking NL', async ({ page }) => {
      await page.getByRole('button', { name: 'NL' }).click();
      await expect(page.getByText(/civic-tech initiatief/)).toBeVisible();
    });

    test('chip labels are unchanged after switching to NL (not translated)', async ({ page }) => {
      await page.getByRole('button', { name: 'NL' }).click();
      await expect(page.getByText('Angular', { exact: true })).toBeVisible();
      await expect(page.getByText('Python', { exact: true })).toBeVisible();
    });
  });

  test.describe('navbar integration', () => {
    test('About nav link has active-link class on this page', async ({ page }) => {
      await expect(page.getByRole('link', { name: 'About' })).toHaveClass(/active-link/);
    });

    test('page is reachable from Home via the About nav link', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('link', { name: 'About' }).click();
      await page.waitForURL('/about');
      await expect(page.getByRole('heading', { level: 1, name: 'About This Project' })).toBeVisible();
    });
  });
});
