import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslateModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <section class="hero">
      <div class="hero-content">
        <h1>{{ 'home.hero_title' | translate }}</h1>
        <p>{{ 'home.hero_subtitle' | translate }}</p>
        <button mat-flat-button class="cta-btn" routerLink="/sessions">
          {{ 'home.cta' | translate }} →
        </button>
      </div>
    </section>

    <section class="features">
      <mat-card class="feature-card">
        <mat-icon class="feature-icon">description</mat-icon>
        <h3>{{ 'home.feature_summaries_title' | translate }}</h3>
        <p>{{ 'home.feature_summaries_body' | translate }}</p>
      </mat-card>
      <mat-card class="feature-card">
        <mat-icon class="feature-icon">how_to_vote</mat-icon>
        <h3>{{ 'home.feature_stances_title' | translate }}</h3>
        <p>{{ 'home.feature_stances_body' | translate }}</p>
      </mat-card>
      <mat-card class="feature-card">
        <mat-icon class="feature-icon">link</mat-icon>
        <h3>{{ 'home.feature_sources_title' | translate }}</h3>
        <p>{{ 'home.feature_sources_body' | translate }}</p>
      </mat-card>
    </section>
  `,
  styles: [`
    .hero {
      background: linear-gradient(135deg, #1565C0 0%, #1976D2 100%);
      color: white;
      padding: 80px 24px;
      text-align: center;
    }
    .hero-content {
      max-width: 720px;
      margin: 0 auto;
    }
    .hero h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 20px;
      line-height: 1.2;
    }
    .hero p {
      font-size: 1.15rem;
      line-height: 1.7;
      color: rgba(255,255,255,0.9);
      margin-bottom: 36px;
    }
    .cta-btn {
      background: white;
      color: #1565C0;
      font-size: 1rem;
      font-weight: 600;
      padding: 12px 32px;
      border-radius: 4px;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      max-width: 1100px;
      margin: 48px auto;
      padding: 0 24px;
    }
    .feature-card {
      padding: 32px 24px;
      text-align: center;
    }
    .feature-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #1565C0;
      margin-bottom: 16px;
    }
    .feature-card h3 {
      font-size: 1.15rem;
      font-weight: 600;
      margin-bottom: 12px;
      color: #1a1a2e;
    }
    .feature-card p {
      color: #546E7A;
      line-height: 1.6;
      font-size: 0.95rem;
    }
  `],
})
export class HomeComponent {}
