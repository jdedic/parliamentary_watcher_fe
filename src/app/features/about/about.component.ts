import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

const STACK = ['Python', 'FastAPI', 'OpenAI', 'Qdrant', 'PostgreSQL', 'Angular', 'Angular Material'];

@Component({
  selector: 'app-about',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  template: `
    <div class="about-container">
      <h1>{{ 'about.title' | translate }}</h1>
      <p>{{ 'about.p1' | translate }}</p>
      <p>{{ 'about.p2' | translate }}</p>
      <p>{{ 'about.p3' | translate }}</p>

      <h2>{{ 'about.stack_title' | translate }}</h2>
      <div class="stack-chips">
        @for (tech of stack; track tech) {
          <span class="chip">{{ tech }}</span>
        }
      </div>
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
      color: var(--ink);
      margin-bottom: 24px;
    }
    h2 {
      font-size: 1.2rem;
      font-weight: 500;
      margin: 32px 0 16px;
      color: var(--ink);
    }
    p {
      font-size: 1rem;
      line-height: 1.75;
      color: var(--text-muted);
      margin-bottom: 16px;
    }
    .stack-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip {
      font-size: 13px;
      padding: 6px 13px;
      border: 1px solid var(--line);
      border-radius: var(--radius-pill);
      color: var(--ink);
      background: var(--surface);
    }
  `],
})
export class AboutComponent {
  stack = STACK;
}
