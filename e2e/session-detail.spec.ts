import { test, expect } from './fixtures/index';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const MOCK_SESSION_LIST = {
  total: 1,
  sessions: [
    {
      id: 'session-001',
      title: 'Debate on Climate Policy',
      date: '2024-03-15',
      room: 'Plenaire zaal',
      chair: 'Vera Bergkamp',
      summary: '## Climate Policy\nThis session debated renewable energy targets for 2030.',
      status: 'SUMMARISED',
      meeting_number: 58,
      parliamentary_year: '2023-2024',
    },
  ],
};

const MOCK_SESSION_DETAIL = {
  id: 'session-001',
  title: 'Debate on Climate Policy',
  date: '2024-03-15',
  room: 'Plenaire zaal',
  chair: 'Vera Bergkamp',
  parliamentary_year: '2023-2024',
  meeting_number: 58,
  status: 'SUMMARISED',
  summary: '## Climate Policy\nThis session debated renewable energy targets for 2030.',
  stances: {
    extracted_at: '2024-03-16T10:00:00Z',
    model: 'gpt-4',
    stances: [
      {
        speaker: 'Jan de Vries',
        party: 'VVD',
        activity: 'Bijdrage inbreng',
        stance: 'support',
        summary: 'Strongly supports the 2030 renewable energy targets.',
        evidence: '"We must act now to protect future generations."',
        utterance_ids: ['u-001', 'u-002'],
      },
      {
        speaker: 'Sophie Hermans',
        party: 'D66',
        activity: 'Interruptie',
        stance: 'oppose',
        summary: 'Opposes the proposed timeline as too aggressive.',
        evidence: '"The industry cannot adapt this quickly."',
        utterance_ids: ['u-003'],
      },
      {
        speaker: 'Pieter Omtzigt',
        party: 'NSC',
        activity: 'Vragenuur',
        stance: 'unclear',
        summary: 'Has not yet committed to a position on this matter.',
        evidence: '"We need more information before deciding."',
        utterance_ids: [],
      },
    ],
  },
  summary_sources: null,
  documents: [],
};

const MOCK_SESSION_NO_STANCES = {
  ...MOCK_SESSION_DETAIL,
  stances: null,
};

const MOCK_CHAT_RESPONSE = {
  answer: 'The session focused on renewable energy targets for 2030.',
  retrieved_chunk_ids: ['chunk-1'],
  matched_speakers: ['Jan de Vries'],
  retrieval_confidence: 'high',
  generation_confidence: 'high',
  judge_verdict: 'pass',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockDetail(page: import('@playwright/test').Page, body = MOCK_SESSION_DETAIL) {
  return page.route('**/api/v1/sessions/session-001', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  );
}

function mockList(page: import('@playwright/test').Page, body = MOCK_SESSION_LIST) {
  return page.route('**/api/v1/sessions?**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  );
}

// ---------------------------------------------------------------------------
// Navigation: list → detail
// ---------------------------------------------------------------------------

test.describe('Navigating from session list to session detail', () => {
  test('clicking "Read more" navigates to the detail page and shows the session title', async ({ page }) => {
    await mockList(page);
    await mockDetail(page);

    await page.goto('/sessions');
    await expect(page.getByRole('heading', { name: 'Debate on Climate Policy' })).toBeVisible();

    await page.getByRole('button', { name: /Read more/i }).first().click();
    await page.waitForURL('/sessions/session-001');

    await expect(page.getByRole('heading', { level: 1, name: 'Debate on Climate Policy' })).toBeVisible();
  });

  test('detail page is accessible directly by URL', async ({ page }) => {
    await mockDetail(page);
    await page.goto('/sessions/session-001');
    await expect(page.getByRole('heading', { level: 1, name: 'Debate on Climate Policy' })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Session detail — header & summary
// ---------------------------------------------------------------------------

test.describe('Session detail page — header and summary tab', () => {
  test.beforeEach(async ({ page }) => {
    await mockDetail(page);
    await page.goto('/sessions/session-001');
  });

  test('shows session title', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Debate on Climate Policy' })).toBeVisible();
  });

  test('shows session date', async ({ page }) => {
    await expect(page.getByText('15 March 2024')).toBeVisible();
  });

  test('shows chair metadata', async ({ page }) => {
    await expect(page.getByText(/Vera Bergkamp/)).toBeVisible();
  });

  test('shows room metadata', async ({ page }) => {
    await expect(page.getByText(/Plenaire zaal/)).toBeVisible();
  });

  test('back button is visible and links to /sessions', async ({ page }) => {
    const backBtn = page.getByRole('button', { name: /Back/i });
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await page.waitForURL('/sessions');
  });

  test('summary tab is active by default and renders markdown content', async ({ page }) => {
    // The markdown pipe converts "## Climate Policy" → an <h2> element
    await expect(page.locator('.summary-text h2')).toBeVisible();
    await expect(page.getByText(/renewable energy targets/)).toBeVisible();
  });

  test('shows loading spinner while session data is fetching', async ({ page }) => {
    await page.unrouteAll();
    await page.route('**/api/v1/sessions/session-001', () => { /* hang */ });
    await page.goto('/sessions/session-001');
    await expect(page.locator('mat-spinner').first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Session detail — stances tab
// ---------------------------------------------------------------------------

test.describe('Session detail page — stances tab', () => {
  test.beforeEach(async ({ page }) => {
    await mockDetail(page);
    await page.goto('/sessions/session-001');
    await page.getByRole('tab', { name: /stances/i }).click();
  });

  test('stances tab is visible', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /stances/i })).toBeVisible();
  });

  test('renders a card for each speaker', async ({ page }) => {
    await expect(page.getByText('Jan de Vries')).toBeVisible();
    await expect(page.getByText('Sophie Hermans')).toBeVisible();
    await expect(page.getByText('Pieter Omtzigt')).toBeVisible();
  });

  test('renders party labels', async ({ page }) => {
    await expect(page.getByText(/VVD/)).toBeVisible();
    await expect(page.getByText(/D66/)).toBeVisible();
    await expect(page.getByText(/NSC/)).toBeVisible();
  });

  test('renders support stance chip', async ({ page }) => {
    // StanceChipComponent uses translation key "stance.support"
    await expect(page.locator('.stance-support').first()).toBeVisible();
  });

  test('renders oppose stance chip', async ({ page }) => {
    await expect(page.locator('.stance-oppose').first()).toBeVisible();
  });

  test('renders unclear stance chip', async ({ page }) => {
    await expect(page.locator('.stance-unclear').first()).toBeVisible();
  });

  test('renders stance summary text', async ({ page }) => {
    await expect(page.getByText(/Strongly supports the 2030 renewable energy targets/)).toBeVisible();
  });

  test('evidence panel is collapsed by default and can be expanded', async ({ page }) => {
    const evidencePanel = page.locator('mat-expansion-panel').first();
    await expect(evidencePanel).toBeVisible();
    // Panel header should be clickable; click to expand
    await evidencePanel.locator('mat-expansion-panel-header').click();
    await expect(page.getByText(/We must act now/)).toBeVisible();
  });

  test('shows utterance count for speakers with utterances', async ({ page }) => {
    await expect(page.getByText(/2.*utterances?/i).or(page.getByText(/utterances/i)).first()).toBeVisible();
  });

  test('shows empty placeholder when session has no stances', async ({ page }) => {
    await page.unrouteAll();
    await mockDetail(page, MOCK_SESSION_NO_STANCES);
    await page.goto('/sessions/session-001');
    await page.getByRole('tab', { name: /stances/i }).click();
    await expect(page.getByText('Stances not yet extracted.')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Session detail — chat tab
// ---------------------------------------------------------------------------

test.describe('Session detail page — chat tab', () => {
  test.beforeEach(async ({ page }) => {
    await mockDetail(page);
    await page.goto('/sessions/session-001');
    await page.getByRole('tab', { name: 'Chat' }).click();
  });

  test('chat tab is visible', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Chat' })).toBeVisible();
  });

  test('chat input field is visible', async ({ page }) => {
    await expect(page.getByPlaceholder('Ask a question about this session…')).toBeVisible();
  });

  test('send button is visible', async ({ page }) => {
    await expect(page.locator('.chat-send-btn')).toBeVisible();
  });

  test('typing a message and clicking send shows user bubble and assistant reply', async ({ page }) => {
    await page.route('**/api/v1/sessions/session-001/chat', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CHAT_RESPONSE),
      })
    );

    const input = page.getByPlaceholder('Ask a question about this session…');
    await input.fill('What was discussed?');
    await page.locator('.chat-send-btn').click();

    // User bubble appears immediately
    await expect(page.locator('.chat-user').getByText('What was discussed?')).toBeVisible();

    // Assistant reply appears after API responds
    await expect(page.locator('.chat-assistant').getByText(/renewable energy targets for 2030/)).toBeVisible();
  });

  test('pressing Enter in the input also sends the message', async ({ page }) => {
    await page.route('**/api/v1/sessions/session-001/chat', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CHAT_RESPONSE),
      })
    );

    const input = page.getByPlaceholder('Ask a question about this session…');
    await input.fill('What was discussed?');
    await input.press('Enter');

    await expect(page.locator('.chat-user').getByText('What was discussed?')).toBeVisible();
    await expect(page.locator('.chat-assistant').getByText(/renewable energy targets/)).toBeVisible();
  });

  test('loading spinner appears while chat request is in flight', async ({ page }) => {
    // Route that never resolves so the spinner stays visible
    await page.route('**/api/v1/sessions/session-001/chat', () => { /* hang */ });

    const input = page.getByPlaceholder('Ask a question about this session…');
    await input.fill('Will this hang?');
    await page.locator('.chat-send-btn').click();

    await expect(page.locator('.chat-loading mat-spinner')).toBeVisible();
  });

  test('send button is disabled while a chat request is in flight', async ({ page }) => {
    await page.route('**/api/v1/sessions/session-001/chat', () => { /* hang */ });

    const input = page.getByPlaceholder('Ask a question about this session…');
    await input.fill('Will this hang?');
    await page.locator('.chat-send-btn').click();

    await expect(page.locator('.chat-send-btn')).toBeDisabled();
  });

  test('input is cleared after message is sent', async ({ page }) => {
    await page.route('**/api/v1/sessions/session-001/chat', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CHAT_RESPONSE),
      })
    );

    const input = page.getByPlaceholder('Ask a question about this session…');
    await input.fill('A question');
    await page.locator('.chat-send-btn').click();

    await expect(input).toHaveValue('');
  });

  test('multiple messages accumulate in the chat history', async ({ page }) => {
    await page.route('**/api/v1/sessions/session-001/chat', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CHAT_RESPONSE),
      })
    );

    const input = page.getByPlaceholder('Ask a question about this session…');

    await input.fill('First question');
    await page.locator('.chat-send-btn').click();
    await expect(page.locator('.chat-assistant').first()).toBeVisible();

    await input.fill('Second question');
    await page.locator('.chat-send-btn').click();

    await expect(page.locator('.chat-user')).toHaveCount(2);
    await expect(page.locator('.chat-assistant')).toHaveCount(2);
  });
});
