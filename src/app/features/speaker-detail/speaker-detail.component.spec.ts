import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { vi } from 'vitest';
import { provideTranslateService, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { TranslateNoOpLoader } from '@ngx-translate/core';

const makeParamMap = (params: Record<string, string>): ParamMap => ({
  has: (key: string) => key in params,
  get: (key: string) => params[key] ?? null,
  getAll: (key: string) => (params[key] ? [params[key]] : []),
  keys: Object.keys(params),
});

import { SpeakerDetailComponent } from './speaker-detail.component';
import { SpeakerService } from '../../core/services/speaker.service';
import { Speaker } from '../../core/models/speaker.model';

const mockSpeaker: Speaker = {
  id: 1,
  name: 'Jane Doe',
  function: 'Minister of Finance',
  party_afkorting: 'GRN',
  party_name_nl: 'Groene Partij',
  party_name_en: 'Green Party',
  image_url: '',
  resolved: true,
};

const mockSpeakerService = {
  getSpeaker: vi.fn(),
  getSpeakerImage: vi.fn(),
};

let paramMapSubject: Subject<ParamMap>;
let objectUrlCounter: number;
let createObjectURLSpy: ReturnType<typeof vi.fn>;
let revokeObjectURLSpy: ReturnType<typeof vi.fn>;

describe('SpeakerDetailComponent', () => {
  let fixture: ComponentFixture<SpeakerDetailComponent>;
  let component: SpeakerDetailComponent;

  const navigateTo = (id: string) => paramMapSubject.next(makeParamMap({ id }));

  beforeEach(async () => {
    vi.clearAllMocks();
    paramMapSubject = new Subject<ParamMap>();
    objectUrlCounter = 0;

    mockSpeakerService.getSpeaker.mockReturnValue(of(mockSpeaker));
    mockSpeakerService.getSpeakerImage.mockReturnValue(of(new Blob(['fake-image'])));

    // jsdom does not implement createObjectURL/revokeObjectURL by default.
    createObjectURLSpy = vi.fn(() => `blob:mock-url-${++objectUrlCounter}`);
    revokeObjectURLSpy = vi.fn();
    (URL as any).createObjectURL = createObjectURLSpy;
    (URL as any).revokeObjectURL = revokeObjectURLSpy;

    await TestBed.configureTestingModule({
      imports: [SpeakerDetailComponent],
      providers: [
        { provide: SpeakerService, useValue: mockSpeakerService },
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: paramMapSubject.asObservable() } },
        provideTranslateService({
          loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SpeakerDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // runs ngOnInit; subscribes to paramMap (nothing emitted yet)
  });

  // -------------------------------------------------------------------------
  // Initialisation / loading state
  // -------------------------------------------------------------------------

  describe('initialisation', () => {
    it('loading() is true before any route param has arrived', () => {
      expect(component.loading()).toBe(true);
    });

    it('calls SpeakerService.getSpeaker with the numeric route param id', () => {
      navigateTo('7');
      expect(mockSpeakerService.getSpeaker).toHaveBeenCalledWith(7);
    });

    it('loading() is true after navigation while the service call is pending', () => {
      const pending = new Subject<Speaker>();
      mockSpeakerService.getSpeaker.mockReturnValue(pending.asObservable());

      navigateTo('1');
      fixture.detectChanges();

      expect(component.loading()).toBe(true);

      pending.next(mockSpeaker);
      pending.complete();
    });

    it('sets speaker() and loading() becomes false on success', () => {
      navigateTo('1');
      fixture.detectChanges();

      expect(component.speaker()).toEqual(mockSpeaker);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  describe('error handling', () => {
    it('sets error() to true and loading() to false on a 404', () => {
      mockSpeakerService.getSpeaker.mockReturnValue(
        throwError(() => ({ status: 404, statusText: 'Not Found' })),
      );

      navigateTo('999');
      fixture.detectChanges();

      expect(component.error()).toBe(true);
      expect(component.loading()).toBe(false);
    });

    it('leaves speaker() as null when the service errors', () => {
      mockSpeakerService.getSpeaker.mockReturnValue(
        throwError(() => ({ status: 404, statusText: 'Not Found' })),
      );

      navigateTo('999');
      fixture.detectChanges();

      expect(component.speaker()).toBeNull();
    });

    it('does not attempt to fetch the image when getSpeaker errors', () => {
      mockSpeakerService.getSpeaker.mockReturnValue(
        throwError(() => ({ status: 404, statusText: 'Not Found' })),
      );

      navigateTo('999');
      fixture.detectChanges();

      expect(mockSpeakerService.getSpeakerImage).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Image loading / object URL lifecycle
  // -------------------------------------------------------------------------

  describe('speaker image', () => {
    it('fetches the image via getSpeakerImage(id) after the speaker loads', () => {
      navigateTo('1');
      fixture.detectChanges();

      expect(mockSpeakerService.getSpeakerImage).toHaveBeenCalledWith(1);
    });

    it('sets imageUrl() to the object URL created from the returned blob', () => {
      navigateTo('1');
      fixture.detectChanges();

      expect(createObjectURLSpy).toHaveBeenCalledOnce();
      expect(component.imageUrl()).toBe('blob:mock-url-1');
    });

    it('revokes the previous object URL before requesting a new speaker image', () => {
      navigateTo('1');
      fixture.detectChanges();
      const firstUrl = component.imageUrl();
      expect(firstUrl).toBe('blob:mock-url-1');

      navigateTo('2');
      fixture.detectChanges();

      expect(revokeObjectURLSpy).toHaveBeenCalledWith(firstUrl);
      expect(component.imageUrl()).toBe('blob:mock-url-2');
    });

    it('revokes the object URL on component destroy', () => {
      navigateTo('1');
      fixture.detectChanges();
      const url = component.imageUrl();

      fixture.destroy();

      expect(revokeObjectURLSpy).toHaveBeenCalledWith(url);
    });

    it('does not call revokeObjectURL on destroy when no image was ever loaded', () => {
      // No navigation happened, so imageUrl() is still null.
      fixture.destroy();

      expect(revokeObjectURLSpy).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // partyLabel / partyNameShown computed signals
  // -------------------------------------------------------------------------

  describe('partyLabel computed', () => {
    it('is null when speaker() is null', () => {
      expect(component.speaker()).toBeNull();
      expect(component.partyLabel()).toBeNull();
    });

    it('prefers party_name_en over party_afkorting when currentLang() is "en" (default)', () => {
      component.speaker.set(mockSpeaker);
      fixture.detectChanges();

      expect(component.currentLang()).toBe('en');
      expect(component.partyLabel()).toBe('Green Party');
    });

    it('prefers party_name_nl over party_afkorting when currentLang() is "nl"', () => {
      component.currentLang.set('nl');
      component.speaker.set(mockSpeaker);
      fixture.detectChanges();

      expect(component.partyLabel()).toBe('Groene Partij');
    });

    it('falls back to party_afkorting when the language-specific name is null', () => {
      component.speaker.set({ ...mockSpeaker, party_name_en: null });
      fixture.detectChanges();

      expect(component.partyLabel()).toBe('GRN');
    });

    it('is null when both the party name and the abbreviation are null', () => {
      component.speaker.set({
        ...mockSpeaker,
        party_name_en: null,
        party_name_nl: null,
        party_afkorting: null,
      });
      fixture.detectChanges();

      expect(component.partyLabel()).toBeNull();
    });
  });

  describe('partyNameShown computed', () => {
    it('is true when a full party name is being shown', () => {
      component.speaker.set(mockSpeaker);
      fixture.detectChanges();

      expect(component.partyNameShown()).toBe(true);
    });

    it('is false when only the abbreviation is available (name field is null)', () => {
      component.speaker.set({ ...mockSpeaker, party_name_en: null });
      fixture.detectChanges();

      expect(component.partyNameShown()).toBe(false);
    });

    it('is false when speaker() is null', () => {
      expect(component.partyNameShown()).toBe(false);
    });
  });

  describe('currentLang updates from TranslateService.onLangChange', () => {
    it('updates currentLang() (and therefore partyLabel()) when the active language changes', async () => {
      component.speaker.set(mockSpeaker);
      fixture.detectChanges();
      expect(component.partyLabel()).toBe('Green Party');

      const translateService = TestBed.inject(TranslateService);
      translateService.use('nl');
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.currentLang()).toBe('nl');
      expect(component.partyLabel()).toBe('Groene Partij');
    });
  });

  // -------------------------------------------------------------------------
  // Template rendering
  // -------------------------------------------------------------------------

  describe('template', () => {
    it('shows the spinner while loading()', () => {
      const nativeEl: HTMLElement = fixture.nativeElement;
      expect(nativeEl.querySelector('.spinner-wrap')).not.toBeNull();
      expect(nativeEl.querySelector('.speaker-card')).toBeNull();
    });

    it('shows the not-found placeholder on error', () => {
      mockSpeakerService.getSpeaker.mockReturnValue(
        throwError(() => ({ status: 404, statusText: 'Not Found' })),
      );

      navigateTo('999');
      fixture.detectChanges();

      const nativeEl: HTMLElement = fixture.nativeElement;
      expect(nativeEl.querySelector('.empty-placeholder')).not.toBeNull();
      expect(nativeEl.querySelector('.speaker-card')).toBeNull();
    });

    it('renders the name, function and party when loaded with all fields present', () => {
      navigateTo('1');
      fixture.detectChanges();

      const nativeEl: HTMLElement = fixture.nativeElement;
      expect(nativeEl.querySelector('h1')?.textContent).toContain('Jane Doe');
      expect(nativeEl.querySelector('.speaker-function')).not.toBeNull();
      expect(nativeEl.querySelector('.speaker-function')?.textContent).toContain('Minister of Finance');
      expect(nativeEl.querySelector('.speaker-party')).not.toBeNull();
      expect(nativeEl.querySelector('.speaker-party')?.textContent).toContain('Green Party');
    });

    it('hides the function paragraph entirely when function is null', () => {
      mockSpeakerService.getSpeaker.mockReturnValue(of({ ...mockSpeaker, function: null }));

      navigateTo('1');
      fixture.detectChanges();

      const nativeEl: HTMLElement = fixture.nativeElement;
      expect(nativeEl.querySelector('.speaker-function')).toBeNull();
    });

    it('hides the party paragraph entirely when party name and abbreviation are both null', () => {
      mockSpeakerService.getSpeaker.mockReturnValue(of({
        ...mockSpeaker,
        party_name_en: null,
        party_name_nl: null,
        party_afkorting: null,
      }));

      navigateTo('1');
      fixture.detectChanges();

      const nativeEl: HTMLElement = fixture.nativeElement;
      expect(nativeEl.querySelector('.speaker-party')).toBeNull();
    });

    it('shows the abbreviation alongside the full name only when a full name is shown', () => {
      navigateTo('1');
      fixture.detectChanges();

      const nativeEl: HTMLElement = fixture.nativeElement;
      expect(nativeEl.querySelector('.party-abbr')?.textContent).toContain('GRN');
    });

    it('does not show the parenthesised abbreviation when only the abbreviation itself is displayed', () => {
      mockSpeakerService.getSpeaker.mockReturnValue(of({ ...mockSpeaker, party_name_en: null, party_name_nl: null }));

      navigateTo('1');
      fixture.detectChanges();

      const nativeEl: HTMLElement = fixture.nativeElement;
      // partyLabel() is now just 'GRN' (the abbreviation itself); partyNameShown() is false
      // so the redundant "(GRN)" suffix must not be rendered.
      expect(nativeEl.querySelector('.party-abbr')).toBeNull();
      expect(nativeEl.querySelector('.speaker-party')?.textContent).toContain('GRN');
    });
  });
});
