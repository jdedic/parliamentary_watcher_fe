import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslateModule, MatIconModule],
  template: `
    <section class="hero">
      <div class="hero-content">
        <span class="eyebrow">{{ 'home.eyebrow' | translate }}</span>
        <h1>{{ 'home.hero_title' | translate }}</h1>
        <p class="lede">{{ 'home.hero_subtitle' | translate }}</p>
        <a class="btn" routerLink="/sessions">{{ 'home.cta' | translate }} →</a>
      </div>
    </section>

    <section class="features">
      <div class="card feature-card">
        <mat-icon class="feature-icon">description</mat-icon>
        <h3>{{ 'home.feature_summaries_title' | translate }}</h3>
        <p>{{ 'home.feature_summaries_body' | translate }}</p>
      </div>
      <div class="card feature-card">
        <mat-icon class="feature-icon">how_to_vote</mat-icon>
        <h3>{{ 'home.feature_stances_title' | translate }}</h3>
        <p>{{ 'home.feature_stances_body' | translate }}</p>
      </div>
      <div class="card feature-card">
        <mat-icon class="feature-icon">link</mat-icon>
        <h3>{{ 'home.feature_sources_title' | translate }}</h3>
        <p>{{ 'home.feature_sources_body' | translate }}</p>
      </div>
      <div class="card feature-card">
        <mat-icon class="feature-icon">chat</mat-icon>
        <h3>{{ 'home.feature_chat_title' | translate }}</h3>
        <p>{{ 'home.feature_chat_body' | translate }}</p>
      </div>
    </section>
  `,
  styles: [`
    .hero {
      background: var(--paper);
      padding: 64px 24px 48px;
      text-align: center;
    }
    .hero-content {
      max-width: 640px;
      margin: 0 auto;
    }
    .eyebrow {
      display: block;
      font-family: var(--font-body);
      font-size: 0.8rem;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 18px;
    }
    .hero h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--ink);
      margin-bottom: 20px;
      line-height: 1.15;
      letter-spacing: -0.02em;
    }
    .lede {
      font-size: 1.1rem;
      line-height: 1.7;
      color: var(--text-muted);
      margin-bottom: 32px;
    }
    .btn {
      display: inline-block;
      background: var(--accent);
      color: var(--on-accent);
      border: 1px solid var(--accent);
      font-family: var(--font-body);
      font-size: 1rem;
      font-weight: 500;
      padding: 12px 28px;
      border-radius: var(--radius);
      cursor: pointer;
      transition: opacity .15s;
    }
    .btn:hover { opacity: .88; }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      max-width: 1100px;
      margin: 48px auto;
      padding: 0 24px;
    }
    .feature-card {
      padding: 24px 16px;
      text-align: center;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow-card);
    }
    .feature-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--anchor);
      margin-bottom: 12px;
    }
    .feature-card h3 {
      font-size: 1.15rem;
      font-weight: 500;
      margin-bottom: 12px;
      color: var(--ink);
    }
    .feature-card p {
      color: var(--text-muted);
      line-height: 1.6;
      font-size: 0.95rem;
    }
  `],
})
export class HomeComponent {}
