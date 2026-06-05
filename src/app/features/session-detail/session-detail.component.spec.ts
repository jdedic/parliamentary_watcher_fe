import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { TranslateNoOpLoader } from '@ngx-translate/core';

const makeParamMap = (params: Record<string, string>): ParamMap => ({
  has: (key: string) => key in params,
  get: (key: string) => params[key] ?? null,
  getAll: (key: string) => (params[key] ? [params[key]] : []),
  keys: Object.keys(params),
});

import { SessionDetailComponent } from './session-detail.component';
import { SessionService } from '../../core/services/session.service';
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
  summary_sources: [],
  documents: [],
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

  it('calls SessionService.getSession with the route param id after init', () => {
    expect(mockSessionService.getSession).toHaveBeenCalledWith('session-abc');
  });

  it('sets the session signal to the value returned by the service', () => {
    expect(component.session()).toEqual(mockSession);
  });

  it('stances computed signal returns the inner stances array from the session', () => {
    expect(component.stances()).toEqual(mockSession.stances!.stances);
  });

  it('sendMessage() calls SessionService.chat with the session id and the message', async () => {
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
