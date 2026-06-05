import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatChipsModule } from '@angular/material/chips';

const STACK = ['Python', 'FastAPI', 'OpenAI', 'Qdrant', 'PostgreSQL', 'Angular', 'Angular Material'];

@Component({
  selector: 'app-about',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, MatChipsModule],
  template: `
    <div class="about-container">
      <h1>{{ 'about.title' | translate }}</h1>
      <p>{{ 'about.p1' | translate }}</p>
      <p>{{ 'about.p2' | translate }}</p>
      <p>{{ 'about.p3' | translate }}</p>

      <h2>{{ 'about.stack_title' | translate }}</h2>
      <mat-chip-set class="stack-chips">
        @for (tech of stack; track tech) {
          <mat-chip>{{ tech }}</mat-chip>
        }
      </mat-chip-set>
    </div>
  `,
  styles: [`
    .about-container {
      max-width: 760px;
      margin: 48px auto;
      padding: 0 24px;
    }
    h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #1565C0;
      margin-bottom: 24px;
    }
    h2 {
      font-size: 1.2rem;
      font-weight: 600;
      margin: 32px 0 16px;
      color: #1a1a2e;
    }
    p {
      font-size: 1rem;
      line-height: 1.75;
      color: #37474F;
      margin-bottom: 16px;
    }
    .stack-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  `],
})
export class AboutComponent {
  stack = STACK;
}
