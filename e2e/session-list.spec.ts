import { test, expect } from './fixtures/index';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const MOCK_SESSION_LIST = {
  total: 2,
  sessions: [
    {
      id: 'session-001',
      title: 'Debate on Climate Policy',
      date: '2024-03-15',
      room: 'Plenaire zaal',
      chair: 'Vera Bergkamp',
      summary: 'This session covered extensive debate on the national climate agreement and renewable energy targets for 2030.',
      status: 'SUMMARISED',
      meeting_number: 58,
      parliamentary_year: '2023-2024',
    },
    {
      id: 'session-002',
      title: 'Housing Market Discussion',
      date: '2024-03-22',
      room: 'Plenaire zaal',
      chair: 'Martin Bosma',
      summary: null,
      status: 'DOWNLOADED',
      meeting_number: 59,
      parliamentary_year: '2023-2024',
    },
  ],
};

const MOCK_SINGLE_SESSION = {
  total: 1,
  sessions: [MOCK_SESSION_LIST.sessions[0]],
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
// Tests
// ---------------------------------------------------------------------------

test.describe('Session List page', () => {
  test.beforeEach(async ({ page }) => {
    await mockSessionList(page);
    await page.goto('/sessions');
  });

  test('renders the page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Plenary Sessions' })).toBeVisible();
  });

  test('renders the search input', async ({ page }) => {
    await expect(page.getByPlaceholder('Search by title...')).toBeVisible();
  });

  test('renders session cards with titles', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Debate on Climate Policy' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Housing Market Discussion' })).toBeVisible();
  });

  test('renders date badge for each session', async ({ page }) => {
    // The date pipe formats "2024-03-15" → "15 March 2024" in en locale
    await expect(page.getByText('15 March 2024')).toBeVisible();
    await expect(page.getByText('22 March 2024')).toBeVisible();
  });

  test('renders status badge for sessions that have a status', async ({ page }) => {
    // SUMMARISED → "Summarised", DOWNLOADED → "Downloaded"
    await expect(page.getByText('Summarised')).toBeVisible();
    await expect(page.getByText('Downloaded')).toBeVisible();
  });

  test('renders excerpt for session with summary', async ({ page }) => {
    // The ExcerptPipe truncates the summary — we match a unique fragment
    await expect(page.getByText(/This session covered extensive debate/)).toBeVisible();
  });

  test('renders "Summary not yet available" for session without summary', async ({ page }) => {
    await expect(page.getByText('Summary not yet available.')).toBeVisible();
  });

  test('renders chair and room metadata', async ({ page }) => {
    await expect(page.getByText('Vera Bergkamp')).toBeVisible();
    // room appears on both cards; at least one visible is sufficient
    await expect(page.getByText('Plenaire zaal').first()).toBeVisible();
  });

  test('renders meeting number and parliamentary year', async ({ page }) => {
    await expect(page.getByText(/#58\s*·\s*2023-2024/).first()).toBeVisible();
  });

  test('renders "Read more" button for each session', async ({ page }) => {
    const readMoreButtons = page.getByRole('button', { name: /Read more/i });
    await expect(readMoreButtons).toHaveCount(2);
  });

  test('clicking "Read more" navigates to session detail', async ({ page }) => {
    // Intercept the detail API call so navigation can complete
    await page.route('**/api/v1/sessions/session-001', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'session-001',
          title: 'Debate on Climate Policy',
          date: '2024-03-15',
          room: 'Plenaire zaal',
          chair: 'Vera Bergkamp',
          parliamentary_year: '2023-2024',
          meeting_number: 58,
          status: 'SUMMARISED',
          summary: '## Climate Policy\nThis session debated climate targets.',
          stances: null,
          summary_sources: null,
          documents: [],
        }),
      })
    );

    await page.getByRole('button', { name: /Read more/i }).first().click();
    await page.waitForURL('/sessions/session-001');
    await expect(page).toHaveURL('/sessions/session-001');
  });

  test('shows empty state message when no sessions are returned', async ({ page }) => {
    await page.unrouteAll();
    await mockSessionList(page, MOCK_EMPTY);
    await page.goto('/sessions');
    await expect(page.getByText('No sessions found.')).toBeVisible();
  });

  test('shows loading spinner while sessions are fetching', async ({ page }) => {
    await page.unrouteAll();
    // Use a request that never resolves so the spinner stays visible
    await page.route('**/api/v1/sessions**', () => { /* hang */ });
    await page.goto('/sessions');
    await expect(page.locator('mat-spinner')).toBeVisible();
  });

  test('shows empty state after API error', async ({ page }) => {
    await page.unrouteAll();
    await page.route('**/api/v1/sessions**', route =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );
    await page.goto('/sessions');
    // On error the component sets loading=false and sessions stays empty
    await expect(page.getByText('No sessions found.')).toBeVisible();
  });

  test('search input triggers a new API request with title param', async ({ page }) => {
    const searchRequests: string[] = [];
    await page.unrouteAll();
    await page.route('**/api/v1/sessions**', route => {
      searchRequests.push(route.request().url());
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_EMPTY),
      });
    });

    await page.goto('/sessions');
    await page.getByPlaceholder('Search by title...').fill('Climate');

    // Wait for debounce (300ms) + network
    await page.waitForTimeout(400);
    await expect(page.getByText('No sessions found.')).toBeVisible();

    const searchRequest = searchRequests.find(url => url.includes('title=Climate'));
    expect(searchRequest).toBeTruthy();
  });

  test('paginator is visible when sessions are loaded', async ({ page }) => {
    await expect(page.locator('mat-paginator')).toBeVisible();
  });
});
