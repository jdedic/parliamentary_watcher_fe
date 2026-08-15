import { test, expect } from './fixtures/index';
import type { Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

// 1x1 transparent PNG, used as a stand-in for a real/placeholder speaker photo.
const PNG_1X1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

const MOCK_SPEAKER = {
  id: 42,
  name: 'Mariëlle Paul',
  function: 'Tweede Kamerlid',
  party_afkorting: 'VVD',
  party_name_nl: 'Volkspartij voor Vrijheid en Democratie',
  party_name_en: "People's Party for Freedom and Democracy",
  image_url: 'https://example.com/photo.jpg',
  resolved: true,
};

const MOCK_SESSION_DETAIL_WITH_SPEAKER_LINKS = {
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
        speaker_id: 42,
        activity: 'Bijdrage inbreng',
        stance: 'support',
        summary: 'Strongly supports the 2030 renewable energy targets.',
        evidence: '"We must act now to protect future generations."',
        utterance_ids: ['u-001', 'u-002'],
      },
      {
        speaker: 'Oude Backfill Speaker',
        party: 'D66',
        speaker_id: null,
        activity: 'Interruptie',
        stance: 'oppose',
        summary: 'A stance from a session that predates speaker backfilling.',
        evidence: '"No speaker_id available for this record."',
        utterance_ids: [],
      },
    ],
  },
  summary_sources: null,
  documents: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockSessionDetail(page: Page, body = MOCK_SESSION_DETAIL_WITH_SPEAKER_LINKS) {
  return page.route('**/api/v1/sessions/session-001', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  );
}

function mockSpeaker(page: Page, id: number, body: object = MOCK_SPEAKER) {
  return page.route(`**/api/v1/speakers/${id}`, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  );
}

function mockSpeakerNotFound(page: Page, id: number) {
  return page.route(`**/api/v1/speakers/${id}`, route =>
    route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Speaker not found' }),
    })
  );
}

function mockSpeakerImage(page: Page, id: number) {
  return page.route(`**/api/v1/speakers/${id}/image`, route =>
    route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from(PNG_1X1_BASE64, 'base64'),
    })
  );
}

// ---------------------------------------------------------------------------
// Session detail stances tab — speaker links
// ---------------------------------------------------------------------------

test.describe('Session detail stances tab — speaker links', () => {
  test.beforeEach(async ({ page }) => {
    await mockSessionDetail(page);
    await mockSpeaker(page, 42);
    await mockSpeakerImage(page, 42);
    await page.goto('/sessions/session-001');
    await page.getByRole('tab', { name: /stances/i }).click();
  });

  test('a stance with a non-null speaker_id renders the speaker name as a link', async ({ page }) => {
    const link = page.getByRole('link', { name: 'Jan de Vries' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/speakers/42');
  });

  test('clicking the speaker link navigates to the speaker detail page', async ({ page }) => {
    await page.getByRole('link', { name: 'Jan de Vries' }).click();
    await page.waitForURL('/speakers/42');
    await expect(page.getByRole('heading', { level: 1, name: 'Mariëlle Paul' })).toBeVisible();
  });

  test('speaker detail page shows name, party, and photo after navigating from a stance link', async ({ page }) => {
    await page.getByRole('link', { name: 'Jan de Vries' }).click();
    await page.waitForURL('/speakers/42');

    await expect(page.getByRole('heading', { level: 1, name: 'Mariëlle Paul' })).toBeVisible();
    await expect(page.getByText(/People's Party for Freedom and Democracy/)).toBeVisible();
    await expect(page.getByText(/VVD/)).toBeVisible();

    const photo = page.getByRole('img', { name: 'Mariëlle Paul' });
    await expect(photo).toBeVisible();
    const src = await photo.getAttribute('src');
    expect(src).toMatch(/^blob:/);
  });

  test('a stance with a null speaker_id renders as plain, non-clickable text', async ({ page }) => {
    await expect(page.getByText('Oude Backfill Speaker')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Oude Backfill Speaker' })).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Speaker detail page — direct navigation
// ---------------------------------------------------------------------------

test.describe('Speaker detail page — direct navigation', () => {
  test('navigating directly to a speaker URL renders name, party, and photo', async ({ page }) => {
    await mockSpeaker(page, 42);
    await mockSpeakerImage(page, 42);

    await page.goto('/speakers/42');

    await expect(page.getByRole('heading', { level: 1, name: 'Mariëlle Paul' })).toBeVisible();
    await expect(page.getByText(/Tweede Kamerlid/)).toBeVisible();
    await expect(page.getByText(/People's Party for Freedom and Democracy/)).toBeVisible();

    const photo = page.getByRole('img', { name: 'Mariëlle Paul' });
    await expect(photo).toBeVisible();
    const src = await photo.getAttribute('src');
    expect(src).toMatch(/^blob:/);
  });

  test('navigating to a nonexistent speaker id shows the not-found message', async ({ page }) => {
    await mockSpeakerNotFound(page, 999);

    await page.goto('/speakers/999');

    await expect(page.getByText('Speaker not found.')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0);
  });

  test('back button on the speaker page returns to the sessions list', async ({ page }) => {
    await mockSpeaker(page, 42);
    await mockSpeakerImage(page, 42);

    await page.goto('/speakers/42');
    await expect(page.getByRole('heading', { level: 1, name: 'Mariëlle Paul' })).toBeVisible();

    await page.getByRole('button', { name: /Back/i }).click();
    await page.waitForURL('/sessions');
  });
});
