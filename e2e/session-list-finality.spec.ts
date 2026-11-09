import { test, expect } from './fixtures/index';

// ---------------------------------------------------------------------------
// Shared mock data
//
// Fields mirror `PlenarySessionListItem` (src/app/core/models/session.model.ts)
// so the list template's optional-field bindings (meeting_number, chair, etc.)
// have everything they need.
// ---------------------------------------------------------------------------

const MOCK_FINAL_SESSION = {
  id: 'session-101',
  title: 'Debate on Pension Reform',
  date: '2024-04-10',
  room: 'Plenaire zaal',
  chair: 'Vera Bergkamp',
  summary: 'This session covered the pension reform bill and its implications for public sector workers.',
  summary_en: null,
  status: 'SUMMARISED',
  meeting_number: 60,
  parliamentary_year: '2023-2024',
  is_final: true,
};

const MOCK_PROVISIONAL_SESSION = {
  id: 'session-102',
  title: 'Debate on Housing Subsidies',
  date: '2024-04-17',
  room: 'Plenaire zaal',
  chair: 'Martin Bosma',
  summary: 'This session covered proposed changes to housing subsidy eligibility criteria.',
  summary_en: null,
  status: 'SUMMARISED',
  meeting_number: 61,
  parliamentary_year: '2023-2024',
  is_final: false,
};

const MOCK_SESSION_LIST = {
  total: 2,
  sessions: [MOCK_FINAL_SESSION, MOCK_PROVISIONAL_SESSION],
};

const MOCK_EMPTY = { total: 0, sessions: [] };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockSessionList(page: import('@playwright/test').Page, body = MOCK_SESSION_LIST) {
  return page.route('**/api/v1/sessions**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  );
}

// ---------------------------------------------------------------------------
// Filter buttons: All / Final / Provisional
// ---------------------------------------------------------------------------

test.describe('Session List page — finality filter buttons', () => {
  test.beforeEach(async ({ page }) => {
    await mockSessionList(page);
    await page.goto('/sessions');
    // Wait for the initial (unfiltered) load to render, so a later
    // waitForRequest can't capture this request instead of the click's.
    await expect(page.locator('.session-card').first()).toBeVisible();
  });

  test('"All" filter button is active by default', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'All' })).toHaveClass(/filter-active/);
  });

  test('initial request (default "All" filter) omits the is_final query param', async ({ page }) => {
    await page.unrouteAll();
    await mockSessionList(page);
    const [request] = await Promise.all([
      page.waitForRequest(req => req.url().includes('/api/v1/sessions')),
      page.goto('/sessions'),
    ]);
    expect(request.url()).not.toContain('is_final');
  });

  test('clicking "Final" marks it active and requests is_final=true', async ({ page }) => {
    const [request] = await Promise.all([
      page.waitForRequest(req =>
        req.url().includes('/api/v1/sessions') && new URL(req.url()).searchParams.has('is_final'),
      ),
      page.getByRole('button', { name: 'Final' }).click(),
    ]);

    expect(request.url()).toContain('is_final=true');
    await expect(page.getByRole('button', { name: 'Final' })).toHaveClass(/filter-active/);
    await expect(page.getByRole('button', { name: 'All' })).not.toHaveClass(/filter-active/);
  });

  test('clicking "Provisional" marks it active and requests is_final=false', async ({ page }) => {
    const [request] = await Promise.all([
      page.waitForRequest(req =>
        req.url().includes('/api/v1/sessions') && new URL(req.url()).searchParams.has('is_final'),
      ),
      page.getByRole('button', { name: 'Provisional' }).click(),
    ]);

    expect(request.url()).toContain('is_final=false');
    await expect(page.getByRole('button', { name: 'Provisional' })).toHaveClass(/filter-active/);
    await expect(page.getByRole('button', { name: 'All' })).not.toHaveClass(/filter-active/);
  });

  test('clicking "All" after another filter omits is_final again', async ({ page }) => {
    await Promise.all([
      page.waitForResponse(res => new URL(res.url()).searchParams.get('is_final') === 'true'),
      page.getByRole('button', { name: 'Final' }).click(),
    ]);

    const [request] = await Promise.all([
      page.waitForRequest(req => req.url().includes('/api/v1/sessions')),
      page.getByRole('button', { name: 'All' }).click(),
    ]);

    expect(request.url()).not.toContain('is_final');
    await expect(page.getByRole('button', { name: 'All' })).toHaveClass(/filter-active/);
  });
});

// ---------------------------------------------------------------------------
// Provisional chip on session cards
// ---------------------------------------------------------------------------

test.describe('Session List page — provisional chip', () => {
  test.beforeEach(async ({ page }) => {
    await mockSessionList(page);
    await page.goto('/sessions');
  });

  test('shows a "Provisional" chip on a session card with is_final: false', async ({ page }) => {
    const provisionalCard = page.locator('.session-card', { hasText: 'Debate on Housing Subsidies' });
    await expect(provisionalCard.getByText('Provisional', { exact: true })).toBeVisible();
  });

  test('does not show a "Provisional" chip on a session card with is_final: true', async ({ page }) => {
    const finalCard = page.locator('.session-card', { hasText: 'Debate on Pension Reform' });
    await expect(finalCard.getByText('Provisional', { exact: true })).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Empty state when the Provisional filter returns zero results
// ---------------------------------------------------------------------------

test.describe('Session List page — provisional empty state', () => {
  test('shows "No provisional sessions right now." when the Provisional filter returns zero results', async ({ page }) => {
    await mockSessionList(page);
    await page.goto('/sessions');

    await page.unrouteAll();
    await mockSessionList(page, MOCK_EMPTY);
    await page.getByRole('button', { name: 'Provisional' }).click();

    await expect(page.getByText('No provisional sessions right now.')).toBeVisible();
    await expect(page.getByText('No sessions found.')).not.toBeVisible();
  });

  test('shows the generic "No sessions found." message when the "All" filter returns zero results', async ({ page }) => {
    await mockSessionList(page, MOCK_EMPTY);
    await page.goto('/sessions');

    await expect(page.getByText('No sessions found.')).toBeVisible();
    await expect(page.getByText('No provisional sessions right now.')).not.toBeVisible();
  });
});
