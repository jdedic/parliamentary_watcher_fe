import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, TranslateModule],
  template: `
    <footer class="footer">
      <span class="copyright">&copy; 2026 Demos</span>
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
    </footer>
  `,
  styles: [`
    .footer {
      background: var(--paper);
      border-top: 1px solid var(--line);
      color: var(--text-muted);
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      font-size: 0.9rem;
    }
    .copyright { color: var(--text-muted); font-family: var(--font-display); }
    .footer-nav { display: flex; gap: 1.5rem; }
    .footer-nav a {
      color: var(--text-muted);
      text-decoration: none;
    }
    .footer-nav a:hover { color: var(--ink); }
    .active-link { color: var(--ink); border-bottom: 2px solid var(--anchor); }
  `],
})
export class FooterComponent {}
