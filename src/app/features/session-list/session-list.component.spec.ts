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
  is_final: true,
};

const mockProvisionalSession: PlenarySessionListItem = {
  ...mockSession,
  id: 'session-2',
  title: 'Provisional Session',
  is_final: false,
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

  // ---------------------------------------------------------------------
  // finalityFilter signal + setFinalityFilter()
  // ---------------------------------------------------------------------

  describe('finalityFilter', () => {
    it('defaults to "all"', () => {
      expect(component.finalityFilter()).toBe('all');
    });

    it('calls getSessions with isFinal=undefined on initial load (default "all" filter)', () => {
      expect(mockSessionService.getSessions).toHaveBeenCalledWith(0, 20, undefined, undefined);
    });

    it('setFinalityFilter("final") sets the signal and reloads with isFinal=true', () => {
      vi.clearAllMocks();
      mockSessionService.getSessions.mockReturnValue(of({ sessions: [mockSession], total: 1 }));

      component.setFinalityFilter('final');

      expect(component.finalityFilter()).toBe('final');
      expect(mockSessionService.getSessions).toHaveBeenCalledWith(0, 20, undefined, true);
    });

    it('setFinalityFilter("provisional") sets the signal and reloads with isFinal=false', () => {
      vi.clearAllMocks();
      mockSessionService.getSessions.mockReturnValue(of({ sessions: [mockProvisionalSession], total: 1 }));

      component.setFinalityFilter('provisional');

      expect(component.finalityFilter()).toBe('provisional');
      expect(mockSessionService.getSessions).toHaveBeenCalledWith(0, 20, undefined, false);
    });

    it('setFinalityFilter("all") reloads with isFinal=undefined after switching away from "all"', () => {
      component.setFinalityFilter('final');
      vi.clearAllMocks();
      mockSessionService.getSessions.mockReturnValue(of({ sessions: [mockSession], total: 1 }));

      component.setFinalityFilter('all');

      expect(component.finalityFilter()).toBe('all');
      expect(mockSessionService.getSessions).toHaveBeenCalledWith(0, 20, undefined, undefined);
    });

    it('resets currentSkip/currentPageIndex back to 0 when the filter changes', () => {
      component.onPage({ pageIndex: 2, pageSize: 20, length: 100 });
      expect(component.currentSkip).toBe(40);
      expect(component.currentPageIndex).toBe(2);

      vi.clearAllMocks();
      mockSessionService.getSessions.mockReturnValue(of({ sessions: [mockSession], total: 1 }));

      component.setFinalityFilter('final');

      expect(component.currentSkip).toBe(0);
      expect(component.currentPageIndex).toBe(0);
      expect(mockSessionService.getSessions).toHaveBeenCalledWith(0, 20, undefined, true);
    });

    it('is a no-op (does not reload) when called with the already-active filter', () => {
      // finalityFilter is already 'all' by default
      vi.clearAllMocks();

      component.setFinalityFilter('all');

      expect(mockSessionService.getSessions).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------
  // Filter buttons — template
  // ---------------------------------------------------------------------

  describe('finality filter buttons (template)', () => {
    it('marks the "All" button as filter-active by default and the others as not', () => {
      const buttons: NodeListOf<HTMLButtonElement> =
        fixture.nativeElement.querySelectorAll('.finality-filter button');

      expect(buttons.length).toBe(3);
      expect(buttons[0].classList.contains('filter-active')).toBe(true);
      expect(buttons[1].classList.contains('filter-active')).toBe(false);
      expect(buttons[2].classList.contains('filter-active')).toBe(false);
    });

    it('marks the "Final" button as filter-active after it is clicked', () => {
      const buttons: NodeListOf<HTMLButtonElement> =
        fixture.nativeElement.querySelectorAll('.finality-filter button');

      buttons[1].click();
      fixture.detectChanges();

      expect(buttons[1].classList.contains('filter-active')).toBe(true);
      expect(buttons[0].classList.contains('filter-active')).toBe(false);
      expect(buttons[2].classList.contains('filter-active')).toBe(false);
    });

    it('calls setFinalityFilter("provisional") when the "Provisional" button is clicked', () => {
      const spy = vi.spyOn(component, 'setFinalityFilter');
      const buttons: NodeListOf<HTMLButtonElement> =
        fixture.nativeElement.querySelectorAll('.finality-filter button');

      buttons[2].click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith('provisional');
    });
  });

  // ---------------------------------------------------------------------
  // No provisional chip on session cards (removed for now)
  // ---------------------------------------------------------------------

  describe('provisional chip on session cards', () => {
    it('does not render .provisional-chip even for a session with is_final: false', async () => {
      vi.clearAllMocks();
      mockSessionService.getSessions.mockReturnValue(of({ sessions: [mockProvisionalSession], total: 1 }));

      fixture = TestBed.createComponent(SessionListComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.session-card')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('.provisional-chip')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------
  // Empty-state message
  // ---------------------------------------------------------------------

  describe('empty state message', () => {
    it('shows sessions.no_results when the result set is empty and filter is "all"', async () => {
      vi.clearAllMocks();
      mockSessionService.getSessions.mockReturnValue(of({ sessions: [], total: 0 }));

      fixture = TestBed.createComponent(SessionListComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const emptyMsg = fixture.nativeElement.querySelector('.empty-msg');
      expect(emptyMsg?.textContent?.trim()).toBe('sessions.no_results');
    });

    it('shows sessions.no_provisional_results when the result set is empty and filter is "provisional"', () => {
      vi.clearAllMocks();
      mockSessionService.getSessions.mockReturnValue(of({ sessions: [], total: 0 }));

      component.setFinalityFilter('provisional');
      fixture.detectChanges();

      const emptyMsg = fixture.nativeElement.querySelector('.empty-msg');
      expect(emptyMsg?.textContent?.trim()).toBe('sessions.no_provisional_results');
    });

    it('still shows sessions.no_results (not the provisional variant) when empty and filter is "final"', () => {
      vi.clearAllMocks();
      mockSessionService.getSessions.mockReturnValue(of({ sessions: [], total: 0 }));

      component.setFinalityFilter('final');
      fixture.detectChanges();

      const emptyMsg = fixture.nativeElement.querySelector('.empty-msg');
      expect(emptyMsg?.textContent?.trim()).toBe('sessions.no_results');
    });
  });
});
