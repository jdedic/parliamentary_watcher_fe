import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { provideTranslateService, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { TranslateNoOpLoader } from '@ngx-translate/core';

import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let translateService: TranslateService;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({
          loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader },
        }),
      ],
    }).compileComponents();

    translateService = TestBed.inject(TranslateService);
    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('initialisation', () => {
    it('defaults currentLang to en when TranslateService.currentLang is falsy', () => {
      // TranslateNoOpLoader with no defaultLanguage leaves currentLang undefined at construction
      expect(component.currentLang).toBe('en');
    });

    it('picks up TranslateService.currentLang when it is already set before component creation', () => {
      // currentLang is a getter on TranslateService — spy on the getter to simulate a
      // language already being active (e.g. the app bootstrapped with 'nl')
      vi.spyOn(translateService, 'currentLang', 'get').mockReturnValue('nl');
      const localFixture = TestBed.createComponent(FooterComponent);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();
      expect(localComponent.currentLang).toBe('nl');
    });
  });

  describe('setLang', () => {
    it('calls translate.use with the specified language', () => {
      vi.spyOn(translateService, 'use');
      component.setLang('nl');
      expect(translateService.use).toHaveBeenCalledWith('nl');
    });

    it('calls translate.use exactly once per invocation', () => {
      vi.spyOn(translateService, 'use');
      component.setLang('nl');
      expect(translateService.use).toHaveBeenCalledTimes(1);
    });

    it('updates currentLang to the supplied language', () => {
      vi.spyOn(translateService, 'use');
      component.setLang('nl');
      expect(component.currentLang).toBe('nl');
    });

    it('switches currentLang back to en from nl', () => {
      vi.spyOn(translateService, 'use');
      component.currentLang = 'nl';
      component.setLang('en');
      expect(component.currentLang).toBe('en');
      expect(translateService.use).toHaveBeenCalledWith('en');
    });

    it('passes the exact lang string to translate.use without modification', () => {
      vi.spyOn(translateService, 'use');
      component.setLang('nl');
      expect(translateService.use).toHaveBeenCalledWith('nl');
      // Ensure no coercion or trimming happens
      expect(translateService.use).not.toHaveBeenCalledWith('NL');
    });
  });

  describe('language toggle — CSS class bindings', () => {
    function getLangButtons(): { en: HTMLButtonElement; nl: HTMLButtonElement } {
      const buttons = fixture.nativeElement.querySelectorAll(
        '.lang-toggle button',
      ) as NodeListOf<HTMLButtonElement>;
      return { en: buttons[0], nl: buttons[1] };
    }

    it('EN button has lang-active class when currentLang is en (default)', () => {
      const { en } = getLangButtons();
      expect(en.classList.contains('lang-active')).toBe(true);
    });

    it('NL button does not have lang-active class when currentLang is en (default)', () => {
      const { nl } = getLangButtons();
      expect(nl.classList.contains('lang-active')).toBe(false);
    });

    it('NL button gains lang-active class after setLang nl', () => {
      vi.spyOn(translateService, 'use');
      component.setLang('nl');
      fixture.detectChanges();
      const { nl } = getLangButtons();
      expect(nl.classList.contains('lang-active')).toBe(true);
    });

    it('EN button loses lang-active class after setLang nl', () => {
      vi.spyOn(translateService, 'use');
      component.setLang('nl');
      fixture.detectChanges();
      const { en } = getLangButtons();
      expect(en.classList.contains('lang-active')).toBe(false);
    });

    it('EN button regains lang-active class after switching back from nl to en', () => {
      vi.spyOn(translateService, 'use');
      component.setLang('nl');
      fixture.detectChanges();

      component.setLang('en');
      fixture.detectChanges();

      const { en, nl } = getLangButtons();
      expect(en.classList.contains('lang-active')).toBe(true);
      expect(nl.classList.contains('lang-active')).toBe(false);
    });
  });

  describe('language toggle — click events', () => {
    it('clicking the EN button calls translate.use with en', () => {
      vi.spyOn(translateService, 'use');
      const enButton: HTMLButtonElement = fixture.nativeElement.querySelectorAll(
        '.lang-toggle button',
      )[0];
      enButton.click();
      expect(translateService.use).toHaveBeenCalledWith('en');
    });

    it('clicking the NL button calls translate.use with nl', () => {
      vi.spyOn(translateService, 'use');
      const nlButton: HTMLButtonElement = fixture.nativeElement.querySelectorAll(
        '.lang-toggle button',
      )[1];
      nlButton.click();
      expect(translateService.use).toHaveBeenCalledWith('nl');
    });

    it('clicking the NL button updates currentLang to nl', () => {
      vi.spyOn(translateService, 'use');
      const nlButton: HTMLButtonElement = fixture.nativeElement.querySelectorAll(
        '.lang-toggle button',
      )[1];
      nlButton.click();
      expect(component.currentLang).toBe('nl');
    });
  });

  describe('navigation links', () => {
    it('renders a Home link pointing to /', () => {
      const links = fixture.nativeElement.querySelectorAll(
        '.footer-nav a',
      ) as NodeListOf<HTMLAnchorElement>;
      const homeLink = Array.from(links).find((a) => a.getAttribute('href') === '/');
      expect(homeLink).toBeTruthy();
    });

    it('renders a Sessions link pointing to /sessions', () => {
      const links = fixture.nativeElement.querySelectorAll(
        '.footer-nav a',
      ) as NodeListOf<HTMLAnchorElement>;
      const sessionsLink = Array.from(links).find((a) => a.getAttribute('href') === '/sessions');
      expect(sessionsLink).toBeTruthy();
    });

    it('renders an About link pointing to /about', () => {
      const links = fixture.nativeElement.querySelectorAll(
        '.footer-nav a',
      ) as NodeListOf<HTMLAnchorElement>;
      const aboutLink = Array.from(links).find((a) => a.getAttribute('href') === '/about');
      expect(aboutLink).toBeTruthy();
    });

    it('renders exactly three navigation links', () => {
      const links = fixture.nativeElement.querySelectorAll('.footer-nav a');
      expect(links.length).toBe(3);
    });
  });

  describe('copyright text', () => {
    it('renders the copyright notice with the correct year and brand name', () => {
      const copyright = fixture.nativeElement.querySelector('.copyright') as HTMLElement;
      expect(copyright.textContent).toContain('2026 ParlAI');
    });
  });
});
