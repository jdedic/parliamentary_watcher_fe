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
// Final sessions only — the finality filter is hidden for now
// ---------------------------------------------------------------------------

test.describe('Session List page — final sessions only', () => {
  test('does not render the All / Final / Provisional filter', async ({ page }) => {
    await mockSessionList(page);
    await page.goto('/sessions');
    await expect(page.locator('.session-card').first()).toBeVisible();

    await expect(page.locator('.finality-filter')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Provisional' })).toHaveCount(0);
  });

  test('requests only final sessions (is_final=true) on load', async ({ page }) => {
    await mockSessionList(page);
    const [request] = await Promise.all([
      page.waitForRequest(req => req.url().includes('/api/v1/sessions')),
      page.goto('/sessions'),
    ]);

    const params = new URL(request.url()).searchParams;
    expect(params.get('is_final')).toBe('true');
    expect(params.get('status')).toBe('SUMMARISED');
  });
});

// ---------------------------------------------------------------------------
// No provisional chip on session cards (removed for now)
// ---------------------------------------------------------------------------

test.describe('Session List page — provisional chip', () => {
  test.beforeEach(async ({ page }) => {
    await mockSessionList(page);
    await page.goto('/sessions');
  });

  test('does not show a "Provisional" chip on a session card with is_final: false', async ({ page }) => {
    const provisionalCard = page.locator('.session-card', { hasText: 'Debate on Housing Subsidies' });
    await expect(provisionalCard).toBeVisible();
    await expect(provisionalCard.getByText('Provisional', { exact: true })).toHaveCount(0);
  });

  test('does not show a "Provisional" chip on a session card with is_final: true', async ({ page }) => {
    const finalCard = page.locator('.session-card', { hasText: 'Debate on Pension Reform' });
    await expect(finalCard.getByText('Provisional', { exact: true })).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

test.describe('Session List page — empty state', () => {
  test('shows the generic "No sessions found." message when there are no final sessions', async ({ page }) => {
    await mockSessionList(page, MOCK_EMPTY);
    await page.goto('/sessions');

    await expect(page.getByText('No sessions found.')).toBeVisible();
    await expect(page.getByText('No provisional sessions right now.')).not.toBeVisible();
  });
});
