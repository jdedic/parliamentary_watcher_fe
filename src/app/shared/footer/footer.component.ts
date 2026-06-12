import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, TranslateModule],
  template: `
    <footer class="footer">
      <span class="copyright">&copy; 2026 ParlAI</span>
      <nav class="footer-nav">
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
    </footer>
  `,
  styles: [`
    .footer {
      background: #1565C0;
      color: rgba(255,255,255,0.85);
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      font-size: 0.9rem;
    }
    .copyright { color: rgba(255,255,255,0.7); }
    .footer-nav { display: flex; gap: 1.5rem; }
    .footer-nav a {
      color: rgba(255,255,255,0.85);
      text-decoration: none;
    }
    .footer-nav a:hover { color: white; }
    .active-link { color: white; text-decoration: underline; }
    .lang-toggle { display: flex; align-items: center; gap: 4px; }
    .lang-toggle button {
      background: none;
      border: none;
      color: rgba(255,255,255,0.85);
      cursor: pointer;
      font-size: 0.9rem;
      padding: 0 4px;
    }
    .lang-toggle button:hover { color: white; }
    .lang-active { color: white !important; font-weight: 600; }
    .lang-sep { color: rgba(255,255,255,0.5); }
  `],
})
export class FooterComponent {
  private translate = inject(TranslateService);
  currentLang = this.translate.currentLang || 'en';

  setLang(lang: string) {
    this.translate.use(lang);
    this.currentLang = lang;
  }
}
