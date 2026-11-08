import { test, expect } from './fixtures/index';

// ---------------------------------------------------------------------------
// Shared mock data
//
// Fields mirror `PlenarySession` (src/app/core/models/session.model.ts) so
// the detail template's bindings (stances, summary_sources, documents, etc.)
// have everything they need.
// ---------------------------------------------------------------------------

const MOCK_FINAL_DETAIL = {
  id: 'session-201',
  title: 'Debate on Pension Reform',
  date: '2024-04-10',
  parliamentary_year: '2023-2024',
  meeting_number: 60,
  room: 'Plenaire zaal',
  chair: 'Vera Bergkamp',
  status: 'SUMMARISED',
  summary: 'This session covered the pension reform bill and its implications for public sector workers.',
  stances: null,
  summary_sources: null,
  summary_en: null,
  stances_en: null,
  documents: [],
  is_final: true,
};

const MOCK_PROVISIONAL_DETAIL = {
  ...MOCK_FINAL_DETAIL,
  id: 'session-202',
  title: 'Debate on Housing Subsidies',
  is_final: false,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockDetail(page: import('@playwright/test').Page, id: string, body: unknown) {
  return page.route(`**/api/v1/sessions/${id}`, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Session detail page — provisional vs final', () => {
  test('shows a "Provisional" chip next to the title when is_final is false', async ({ page }) => {
    await mockDetail(page, 'session-202', MOCK_PROVISIONAL_DETAIL);
    await page.goto('/sessions/session-202');

    const titleRow = page.locator('.header-title-row');
    await expect(titleRow.getByRole('heading', { level: 1, name: 'Debate on Housing Subsidies' })).toBeVisible();
    await expect(titleRow.getByText('Provisional', { exact: true })).toBeVisible();
  });

  test('shows the provisional info banner when is_final is false', async ({ page }) => {
    await mockDetail(page, 'session-202', MOCK_PROVISIONAL_DETAIL);
    await page.goto('/sessions/session-202');

    await expect(page.locator('.provisional-banner')).toBeVisible();
    await expect(page.getByText('Provisional transcript.')).toBeVisible();
    await expect(page.getByText(/This session is based on a preliminary report/)).toBeVisible();
  });

  test('provisional banner is rendered between the header and the tab group', async ({ page }) => {
    await mockDetail(page, 'session-202', MOCK_PROVISIONAL_DETAIL);
    await page.goto('/sessions/session-202');

    const children = page.locator('.detail-container > *');
    await expect(children.nth(0)).toHaveClass(/detail-header/);
    await expect(children.nth(1)).toHaveClass(/provisional-banner/);
    const thirdTag = await children.nth(2).evaluate(el => el.tagName.toLowerCase());
    expect(thirdTag).toBe('mat-tab-group');
  });

  test('does not show a "Provisional" chip when is_final is true', async ({ page }) => {
    await mockDetail(page, 'session-201', MOCK_FINAL_DETAIL);
    await page.goto('/sessions/session-201');

    const titleRow = page.locator('.header-title-row');
    await expect(titleRow.getByRole('heading', { level: 1, name: 'Debate on Pension Reform' })).toBeVisible();
    await expect(titleRow.getByText('Provisional', { exact: true })).toHaveCount(0);
  });

  test('does not show the provisional info banner when is_final is true', async ({ page }) => {
    await mockDetail(page, 'session-201', MOCK_FINAL_DETAIL);
    await page.goto('/sessions/session-201');

    await expect(page.locator('.provisional-banner')).toHaveCount(0);
    await expect(page.getByText('Provisional transcript.')).toHaveCount(0);

    // The header is immediately followed by the tab group — no banner in between.
    const children = page.locator('.detail-container > *');
    await expect(children.nth(0)).toHaveClass(/detail-header/);
    const secondTag = await children.nth(1).evaluate(el => el.tagName.toLowerCase());
    expect(secondTag).toBe('mat-tab-group');
  });
});
