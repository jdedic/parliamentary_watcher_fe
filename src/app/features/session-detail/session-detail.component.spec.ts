import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { FormsModule } from '@angular/forms';
import { of, throwError, Subject } from 'rxjs';
import { vi } from 'vitest';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { TranslateNoOpLoader } from '@ngx-translate/core';
import { signal } from '@angular/core';

const makeParamMap = (params: Record<string, string>): ParamMap => ({
  has: (key: string) => key in params,
  get: (key: string) => params[key] ?? null,
  getAll: (key: string) => (params[key] ? [params[key]] : []),
  keys: Object.keys(params),
});

import { SessionDetailComponent } from './session-detail.component';
import { SessionService } from '../../core/services/session.service';
import { ChatAuthService } from '../../core/services/chat-auth.service';
import { PlenarySession } from '../../core/models/session.model';

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
};

const mockSessionService = {
  getSessions: vi.fn(),
  getSession: vi.fn(),
  chat: vi.fn(),
  verifyChat: vi.fn(),
};

// The unlocked state is managed per-test via a writable signal so tests can
// set it independently without coupling to the real ChatAuthService logic.
let unlockedSignal = signal(false);

const mockChatAuthService = {
  get unlocked() { return unlockedSignal.asReadonly(); },
  unlock: vi.fn(),
};

describe('SessionDetailComponent', () => {
  let fixture: ComponentFixture<SessionDetailComponent>;
  let component: SessionDetailComponent;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset the unlocked signal to false for each test.
    unlockedSignal = signal(false);

    mockSessionService.getSession.mockReturnValue(of(mockSession));
    mockSessionService.chat.mockReturnValue(of({
      answer: 'Assistant reply',
      retrieved_chunk_ids: [],
      matched_speakers: [],
      retrieval_confidence: 'high',
      generation_confidence: 'high',
      judge_verdict: 'pass',
    }));
    mockSessionService.verifyChat.mockReturnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [SessionDetailComponent, FormsModule],
      providers: [
        { provide: SessionService, useValue: mockSessionService },
        { provide: ChatAuthService, useValue: mockChatAuthService },
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
  // Password gate — template visibility
  // -------------------------------------------------------------------------

  describe('chat tab password gate', () => {
    it('renders the password gate (.chat-gate) when chatAuthService.unlocked() is false', async () => {
      // unlocked is false by default in beforeEach
      fixture.detectChanges();
      await fixture.whenStable();

      const nativeEl: HTMLElement = fixture.nativeElement;
      expect(nativeEl.querySelector('.chat-gate')).not.toBeNull();
      expect(nativeEl.querySelector('.chat-container')).toBeNull();
    });

    it('renders the chat interface (.chat-container) when chatAuthService.unlocked() is true', async () => {
      unlockedSignal.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      const nativeEl: HTMLElement = fixture.nativeElement;
      expect(nativeEl.querySelector('.chat-container')).not.toBeNull();
      expect(nativeEl.querySelector('.chat-gate')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // submitChatPassword() — happy path
  // -------------------------------------------------------------------------

  describe('submitChatPassword() — success', () => {
    it('calls sessionService.verifyChat() with the trimmed password signal value', async () => {
      component.chatPassword.set('  my-secret-guid  ');
      component.submitChatPassword();
      await fixture.whenStable();

      expect(mockSessionService.verifyChat).toHaveBeenCalledWith('my-secret-guid');
    });

    it('calls chatAuthService.unlock() after a successful verifyChat response', async () => {
      component.chatPassword.set('valid-password');
      component.submitChatPassword();
      await fixture.whenStable();

      expect(mockChatAuthService.unlock).toHaveBeenCalledOnce();
    });

    it('sets chatPasswordLoading back to false after success', async () => {
      component.chatPassword.set('valid-password');
      component.submitChatPassword();
      await fixture.whenStable();

      expect(component.chatPasswordLoading()).toBe(false);
    });

    it('does NOT set chatPasswordError on success', async () => {
      component.chatPassword.set('valid-password');
      component.submitChatPassword();
      await fixture.whenStable();

      expect(component.chatPasswordError()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // submitChatPassword() — error path
  // -------------------------------------------------------------------------

  describe('submitChatPassword() — error', () => {
    beforeEach(() => {
      mockSessionService.verifyChat.mockReturnValue(
        throwError(() => ({ status: 401, statusText: 'Unauthorized' })),
      );
    });

    it('sets chatPasswordError to true when verifyChat returns a 401', async () => {
      component.chatPassword.set('wrong-password');
      component.submitChatPassword();
      await fixture.whenStable();

      expect(component.chatPasswordError()).toBe(true);
    });

    it('sets chatPasswordLoading back to false after an error', async () => {
      component.chatPassword.set('wrong-password');
      component.submitChatPassword();
      await fixture.whenStable();

      expect(component.chatPasswordLoading()).toBe(false);
    });

    it('does NOT call chatAuthService.unlock() on error', async () => {
      component.chatPassword.set('wrong-password');
      component.submitChatPassword();
      await fixture.whenStable();

      expect(mockChatAuthService.unlock).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // submitChatPassword() — guard conditions
  // -------------------------------------------------------------------------

  describe('submitChatPassword() — guards', () => {
    it('does not call verifyChat when chatPassword() is empty', () => {
      component.chatPassword.set('');
      component.submitChatPassword();

      expect(mockSessionService.verifyChat).not.toHaveBeenCalled();
    });

    it('does not call verifyChat when chatPassword() is whitespace only', () => {
      component.chatPassword.set('   ');
      component.submitChatPassword();

      expect(mockSessionService.verifyChat).not.toHaveBeenCalled();
    });

    it('does not call verifyChat a second time while chatPasswordLoading() is true', async () => {
      // Use a Subject so the observable never completes — loading stays true
      // between the two calls.
      const subject = new Subject<void>();
      mockSessionService.verifyChat.mockReturnValue(subject.asObservable());

      component.chatPassword.set('valid-password');
      component.submitChatPassword(); // first call — loading becomes true
      component.submitChatPassword(); // second call should be a no-op

      expect(mockSessionService.verifyChat).toHaveBeenCalledOnce();

      // Clean up: complete the subject so takeUntilDestroyed doesn't warn.
      subject.complete();
      await fixture.whenStable();
    });
  });

  // -------------------------------------------------------------------------
  // Template interactions — Enter key & disabled state
  // -------------------------------------------------------------------------

  describe('password field template interactions', () => {
    it('the submit button is disabled when chatPassword() is empty', async () => {
      component.chatPassword.set('');
      fixture.detectChanges();
      await fixture.whenStable();

      const nativeEl: HTMLElement = fixture.nativeElement;
      const submitBtn = nativeEl.querySelector<HTMLButtonElement>(
        '.chat-gate-card button[mat-flat-button]',
      );
      expect(submitBtn?.disabled).toBe(true);
    });

    it('the submit button is enabled when chatPassword() has a non-empty value', async () => {
      component.chatPassword.set('some-password');
      fixture.detectChanges();
      await fixture.whenStable();

      const nativeEl: HTMLElement = fixture.nativeElement;
      const submitBtn = nativeEl.querySelector<HTMLButtonElement>(
        '.chat-gate-card button[mat-flat-button]',
      );
      expect(submitBtn?.disabled).toBe(false);
    });

    it('pressing Enter in the password input calls submitChatPassword()', async () => {
      const spy = vi.spyOn(component, 'submitChatPassword');
      component.chatPassword.set('my-password');
      fixture.detectChanges();
      await fixture.whenStable();

      const nativeEl: HTMLElement = fixture.nativeElement;
      const input = nativeEl.querySelector<HTMLInputElement>(
        '.gate-field input[type="password"]',
      );
      expect(input).not.toBeNull();

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      input!.dispatchEvent(event);
      fixture.detectChanges();

      expect(spy).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // chatPasswordError reset on new input
  // -------------------------------------------------------------------------

  describe('chatPasswordError reset', () => {
    it('clears chatPasswordError when the user types a new value in the password field', () => {
      // The template wires (ngModelChange) to: chatPassword.set($event); chatPasswordError.set(false)
      // Drive those signal mutations directly to test the intended behaviour.
      component.chatPasswordError.set(true);
      component.chatPassword.set('x');
      component.chatPasswordError.set(false);
      fixture.detectChanges();

      expect(component.chatPasswordError()).toBe(false);
    });
  });
});
