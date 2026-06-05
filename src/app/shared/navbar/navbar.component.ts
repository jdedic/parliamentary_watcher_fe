import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, TranslateModule, MatToolbarModule, MatButtonModule],
  template: `
    <mat-toolbar class="navbar">
      <span class="brand" routerLink="/">ParlAI</span>
      <span class="spacer"></span>
      <nav>
        <a mat-button routerLink="/" routerLinkActive="active-link" [routerLinkActiveOptions]="{ exact: true }">
          {{ 'nav.home' | translate }}
        </a>
        <a mat-button routerLink="/sessions" routerLinkActive="active-link">
          {{ 'nav.sessions' | translate }}
        </a>
        <a mat-button routerLink="/about" routerLinkActive="active-link">
          {{ 'nav.about' | translate }}
        </a>
      </nav>
      <div class="lang-toggle">
        <button mat-button [class.lang-active]="currentLang === 'en'" (click)="setLang('en')">EN</button>
        <span class="lang-sep">|</span>
        <button mat-button [class.lang-active]="currentLang === 'nl'" (click)="setLang('nl')">NL</button>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .navbar {
      background: #1565C0;
      color: white;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .brand {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      cursor: pointer;
      color: white;
    }
    .spacer { flex: 1; }
    nav a, .lang-toggle button {
      color: rgba(255,255,255,0.85);
      font-size: 0.95rem;
    }
    nav a:hover, .lang-toggle button:hover { color: white; }
    .active-link { color: white; border-bottom: 2px solid white; border-radius: 0; }
    .lang-sep { color: rgba(255,255,255,0.5); }
    .lang-active { color: white; font-weight: 600; }
    .lang-toggle { margin-left: 8px; }
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
