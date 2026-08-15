import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, TranslateModule],
  template: `
    <header class="site-head">
      <a class="logo" routerLink="/">
        <span class="mark">
          <svg viewBox="0 0 64 52" width="26" aria-hidden="true">
            <g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M32 40 C 19 38 9 33 6 25 C 16 26 27 33 32 40 Z"/>
              <path d="M32 40 C 45 38 55 33 58 25 C 48 26 37 33 32 40 Z"/>
              <path d="M32 40 C 23 35 17 25 17 16 C 25 20 30 31 32 40 Z"/>
              <path d="M32 40 C 41 35 47 25 47 16 C 39 20 34 31 32 40 Z"/>
              <path d="M32 40 C 27 31 27 18 32 9 C 37 18 37 31 32 40 Z"/>
              <path d="M12 43 C 24 47 40 47 52 43"/>
            </g>
            <circle cx="32" cy="39.5" r="2" fill="var(--accent)"/>
          </svg>
        </span>
        <span class="word">Demos</span>
      </a>
      <nav class="main">
        <a routerLink="/" routerLinkActive="active-link" [routerLinkActiveOptions]="{ exact: true }">
          {{ 'nav.home' | translate }}
        </a>
        <a routerLink="/sessions" routerLinkActive="active-link">
          {{ 'nav.sessions' | translate }}
        </a>
        <a routerLink="/about" routerLinkActive="active-link">
          {{ 'nav.about' | translate }}
        </a>
      </nav>
      <div class="lang-toggle">
        <button [class.lang-active]="currentLang === 'en'" (click)="setLang('en')">EN</button>
        <span class="lang-sep">|</span>
        <button [class.lang-active]="currentLang === 'nl'" (click)="setLang('nl')">NL</button>
      </div>
    </header>
  `,
  styles: [`
    .site-head {
      display: flex;
      align-items: center;
      gap: 28px;
      padding: 20px 24px;
      background: var(--paper);
      border-bottom: 1px solid var(--line);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
    }
    .mark { display: flex; color: var(--ink); }
    .mark svg { display: block; }
    .word {
      font-family: var(--font-display);
      font-weight: 500;
      font-size: 1.25rem;
      letter-spacing: -0.01em;
      color: var(--ink);
    }
    nav.main { display: flex; gap: 22px; font-size: 0.9rem; margin-left: 4px; }
    nav.main a { color: var(--text-muted); text-decoration: none; padding: 4px 0; }
    nav.main a:hover { color: var(--ink); }
    .active-link { color: var(--ink); border-bottom: 2px solid var(--anchor); }
    .lang-toggle { margin-left: auto; display: flex; align-items: center; gap: 8px; }
    .lang-toggle button {
      background: none; border: none; cursor: pointer;
      font-family: var(--font-body); font-size: 0.9rem; color: var(--text-muted); padding: 4px;
    }
    .lang-toggle button:hover { color: var(--ink); }
    .lang-sep { color: var(--line); }
    .lang-active { color: var(--ink); font-weight: 600; }
  `],
})
export class NavbarComponent {
  private translate = inject(TranslateService);
  currentLang = this.translate.currentLang || 'en';

  setLang(lang: string) {
    this.translate.use(lang);
    this.currentLang = lang;
  }
}
