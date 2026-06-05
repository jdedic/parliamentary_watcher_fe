import { test, expect } from './fixtures/index';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the hero section with title, subtitle, and CTA button', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Parliamentary Session Intelligence' })).toBeVisible();
    await expect(page.getByText('We analyse Dutch parliamentary plenary sessions using AI')).toBeVisible();
    await expect(page.getByRole('button', { name: /Explore Sessions/i })).toBeVisible();
  });

  test('CTA button navigates to /sessions', async ({ page }) => {
    await page.route('**/api/v1/sessions**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: 0, sessions: [] }),
      })
    );

    await page.getByRole('button', { name: /Explore Sessions/i }).click();
    await page.waitForURL('/sessions');
    await expect(page).toHaveURL('/sessions');
  });

  test('renders all three feature cards', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'AI Summaries' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Speaker Stances' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Source References' })).toBeVisible();
  });

  test('feature card body text is visible', async ({ page }) => {
    await expect(page.getByText('Neutral 300–500 word summaries of each plenary session')).toBeVisible();
    await expect(page.getByText('Classified positions — support, oppose, or unclear')).toBeVisible();
    await expect(page.getByText('Every summary and stance links back to the original transcript')).toBeVisible();
  });

  test('navbar brand link is present', async ({ page }) => {
    await expect(page.getByText('ParlAI')).toBeVisible();
  });
});
