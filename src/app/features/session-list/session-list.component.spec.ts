import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { TranslateNoOpLoader } from '@ngx-translate/core';

import { SessionListComponent } from './session-list.component';
import { SessionService } from '../../core/services/session.service';
import { PlenarySessionListItem } from '../../core/models/session.model';

const mockSession: PlenarySessionListItem = {
  id: 'session-1',
  title: 'Test Session',
  date: '2024-01-15',
  room: 'Room A',
  chair: 'John Doe',
  summary: 'A test summary',
  summary_en: null,
  status: 'SUMMARISED',
  meeting_number: 1,
  parliamentary_year: '2023-2024',
};

const mockSessionService = {
  getSessions: vi.fn(),
  getSession: vi.fn(),
  chat: vi.fn(),
};

describe('SessionListComponent', () => {
  let fixture: ComponentFixture<SessionListComponent>;
  let component: SessionListComponent;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSessionService.getSessions.mockReturnValue(of({ sessions: [mockSession], total: 1 }));

    await TestBed.configureTestingModule({
      imports: [SessionListComponent],
      providers: [
        { provide: SessionService, useValue: mockSessionService },
        provideRouter([]),
        provideAnimationsAsync('noop'),
        provideTranslateService({
          loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('calls SessionService.getSessions once after ngOnInit', () => {
    expect(mockSessionService.getSessions).toHaveBeenCalledTimes(1);
  });

  it('sets the sessions signal to the array returned by the service', () => {
    expect(component.sessions()).toEqual([mockSession]);
  });

  it('sets the loading signal to false after the service responds', () => {
    expect(component.loading()).toBe(false);
  });

  it('sessions signal is empty when the service returns an empty list', async () => {
    mockSessionService.getSessions.mockReturnValue(of({ sessions: [], total: 0 }));
    vi.clearAllMocks();
    mockSessionService.getSessions.mockReturnValue(of({ sessions: [], total: 0 }));

    fixture = TestBed.createComponent(SessionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.sessions()).toEqual([]);
  });
});
