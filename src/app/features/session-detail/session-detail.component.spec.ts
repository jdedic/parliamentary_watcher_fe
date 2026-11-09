import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { FormsModule } from '@angular/forms';
import { of, throwError, Subject } from 'rxjs';
import { vi } from 'vitest';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { TranslateNoOpLoader } from '@ngx-translate/core';
// mat-tab-group only stamps the *active* tab's body content into the DOM;
// inactive tabs' content is not rendered until they are selected at least
// once. Tests that assert on markup inside a non-default tab (Stances is
// index 1; Summary, index 0, is selected by default) must select it first,
// by clicking its label — this is how Angular Material's own tests drive
// tab selection; setting `MatTabGroup.selectedIndex` directly does not
// stick because it is not template-bound.
const selectTab = async (fixture: ComponentFixture<unknown>, index: number) => {
  const tabLabels = fixture.nativeElement.querySelectorAll('[role="tab"]');
  (tabLabels[index] as HTMLElement).click();
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
};

const makeParamMap = (params: Record<string, string>): ParamMap => ({
  has: (key: string) => key in params,
  get: (key: string) => params[key] ?? null,
  getAll: (key: string) => (params[key] ? [params[key]] : []),
  keys: Object.keys(params),
});

import { SessionDetailComponent } from './session-detail.component';
import { SessionService } from '../../core/services/session.service';
import { PlenarySession, Stance } from '../../core/models/session.model';

const mockSession: PlenarySession = {
  id: 'session-abc',
  title: 'Climate Policy Debate',
  date: '2024-03-10',
  parliamentary_year: '2023-2024',
  meeting_number: 42,
  room: 'Plenaire zaal',
  chair: 'Speaker Name',
  status: 'SUMMARISED',
  summary: '## Summary\nThis session covered climate policy.',
  summary_en: null,
  stances: {
    extracted_at: '2024-03-10T12:00:00Z',
    model: 'gpt-4',
    stances: [
      {
        speaker: 'Alice',
        party: 'Green Party',
        activity: 'Speech',
        stance: 'support',
        summary: 'Alice supports the bill.',
        evidence: 'Quote from Alice.',
        utterance_ids: ['u1', 'u2'],
      },
    ],
  },
  stances_en: null,
  summary_sources: [],
  documents: [],
  is_final: true,
};

const mockSessionService = {
  getSessions: vi.fn(),
  getSession: vi.fn(),
  chat: vi.fn(),
};

describe('SessionDetailComponent', () => {
  let fixture: ComponentFixture<SessionDetailComponent>;
  let component: SessionDetailComponent;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockSessionService.getSession.mockReturnValue(of(mockSession));
    mockSessionService.chat.mockReturnValue(of({
      answer: 'Assistant reply',
      retrieved_chunk_ids: [],
      matched_speakers: [],
      retrieval_confidence: 'high',
      generation_confidence: 'high',
      judge_verdict: 'pass',
    }));

    await TestBed.configureTestingModule({
      imports: [SessionDetailComponent, FormsModule],
      providers: [
        { provide: SessionService, useValue: mockSessionService },
        provideAnimationsAsync('noop'),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(makeParamMap({ id: 'session-abc' })) },
        },
        provideTranslateService({
          loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  // -------------------------------------------------------------------------
  // Existing behaviour (preserved and corrected)
  // -------------------------------------------------------------------------

  describe('initialisation', () => {
    it('calls SessionService.getSession with the route param id', () => {
      expect(mockSessionService.getSession).toHaveBeenCalledWith('session-abc');
    });

    it('sets the session signal to the value returned by the service', () => {
      expect(component.session()).toEqual(mockSession);
    });

    it('currentStances() returns the inner stances array from the session', () => {
      expect(component.currentStances()).toEqual(mockSession.stances!.stances);
    });

    it('loading() is false after the service resolves', () => {
      expect(component.loading()).toBe(false);
    });
  });

  describe('sendMessage()', () => {
    it('calls SessionService.chat with the session id and the typed message', async () => {
      component.chatInput = 'What is the main topic?';
      component.sendMessage();
      await fixture.whenStable();

      expect(mockSessionService.chat).toHaveBeenCalledWith(
        'session-abc',
        'What is the main topic?',
        [],
      );
    });
  });

  // -------------------------------------------------------------------------
  // Chat tab — open access (no password gate)
  // -------------------------------------------------------------------------

  describe('chat tab', () => {
    it('renders the chat interface directly, with no password gate', async () => {
      await selectTab(fixture, 2); // Chat tab — inactive-tab content isn't stamped until selected

      const nativeEl: HTMLElement = fixture.nativeElement;
      expect(nativeEl.querySelector('.chat-container')).not.toBeNull();
      expect(nativeEl.querySelector('.chat-gate')).toBeNull();
      expect(nativeEl.querySelector('input[type="password"]')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Stances tab — speaker link rendering
  // -------------------------------------------------------------------------

  describe('stances tab — speaker link rendering', () => {
    // The default `mockSession` (set up in the top-level beforeEach) has a
    // stance with no `speaker_id`, so it already covers the fallback <span>
    // branch using the shared `fixture`/`component` from beforeEach.
    it('renders a plain <span> (no anchor) when stance.speaker_id is null/absent', async () => {
      await selectTab(fixture, 1); // Stances tab

      const nativeEl: HTMLElement = fixture.nativeElement;
      const speakerEl = nativeEl.querySelector('.speaker-name');

      expect(speakerEl).not.toBeNull();
      expect(speakerEl?.tagName).toBe('SPAN');
      expect(nativeEl.querySelector('a.speaker-name')).toBeNull();
      expect(speakerEl?.textContent).toContain('Alice');
    });

    // A stance with a truthy speaker_id requires its own session payload, so
    // this test rebuilds the TestBed with an override session rather than
    // reusing the shared fixture from the top-level beforeEach.
    it('renders a routerLink anchor to /speakers/:id when stance.speaker_id is truthy', async () => {
      const stanceWithSpeakerId: Stance = {
        speaker: 'Bob',
        party: null,
        speaker_id: 99,
        activity: 'Speech',
        stance: 'oppose',
        summary: 'Bob opposes the bill.',
        evidence: 'Quote from Bob.',
        utterance_ids: [],
      };
      const sessionWithSpeakerId: PlenarySession = {
        ...mockSession,
        stances: { ...mockSession.stances!, stances: [stanceWithSpeakerId] },
      };

      TestBed.resetTestingModule();
      mockSessionService.getSession.mockReturnValue(of(sessionWithSpeakerId));

      await TestBed.configureTestingModule({
        imports: [SessionDetailComponent, FormsModule],
        providers: [
          { provide: SessionService, useValue: mockSessionService },
            provideAnimationsAsync('noop'),
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: { paramMap: of(makeParamMap({ id: 'session-abc' })) },
          },
          provideTranslateService({
            loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader },
          }),
        ],
      }).compileComponents();

      const overrideFixture = TestBed.createComponent(SessionDetailComponent);
      overrideFixture.detectChanges();
      await overrideFixture.whenStable();
      await selectTab(overrideFixture, 1); // Stances tab

      const nativeEl: HTMLElement = overrideFixture.nativeElement;
      const anchor = nativeEl.querySelector<HTMLAnchorElement>('a.speaker-name');

      expect(anchor).not.toBeNull();
      expect(anchor?.textContent).toContain('Bob');
      expect(anchor?.getAttribute('href')).toBe('/speakers/99');
      expect(nativeEl.querySelector('span.speaker-name')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Provisional vs. final session indicators
  // -------------------------------------------------------------------------

  describe('provisional session indicators', () => {
    it('does not render .provisional-chip or .provisional-banner when is_final is true', () => {
      // The default mockSession (is_final: true) is loaded in the top-level beforeEach.
      const nativeEl: HTMLElement = fixture.nativeElement;

      expect(nativeEl.querySelector('.provisional-chip')).toBeNull();
      expect(nativeEl.querySelector('.provisional-banner')).toBeNull();
    });

    // A session with is_final: false requires its own session payload, so this
    // test rebuilds the TestBed with an override session rather than reusing
    // the shared fixture from the top-level beforeEach.
    it('renders .provisional-chip and .provisional-banner when is_final is false', async () => {
      const provisionalSession: PlenarySession = { ...mockSession, is_final: false };

      TestBed.resetTestingModule();
      mockSessionService.getSession.mockReturnValue(of(provisionalSession));

      await TestBed.configureTestingModule({
        imports: [SessionDetailComponent, FormsModule],
        providers: [
          { provide: SessionService, useValue: mockSessionService },
            provideAnimationsAsync('noop'),
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: { paramMap: of(makeParamMap({ id: 'session-abc' })) },
          },
          provideTranslateService({
            loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader },
          }),
        ],
      }).compileComponents();

      const overrideFixture = TestBed.createComponent(SessionDetailComponent);
      overrideFixture.detectChanges();
      await overrideFixture.whenStable();
      overrideFixture.detectChanges();

      const nativeEl: HTMLElement = overrideFixture.nativeElement;
      const chip = nativeEl.querySelector('.provisional-chip');
      const banner = nativeEl.querySelector('.provisional-banner');

      expect(chip).not.toBeNull();
      expect(chip?.textContent?.trim()).toBe('sessions.provisional_chip');

      expect(banner).not.toBeNull();
      expect(banner?.querySelector('strong')?.textContent?.trim()).toBe('detail.provisional_banner_title');
      expect(banner?.textContent).toContain('detail.provisional_banner_body');
    });
  });
});
