import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { TranslateNoOpLoader } from '@ngx-translate/core';

import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({
          loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
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
      expect(copyright.textContent).toContain('2026 Demos');
    });
  });
});
