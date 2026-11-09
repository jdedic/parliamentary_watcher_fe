import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SessionStatus } from '../../core/models/session.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  template: `
    <span [class]="'status-chip status-' + status?.toLowerCase()">
      {{ 'status.' + status | translate }}
    </span>
  `,
  styles: [`
    .status-chip {
      font-size: 0.65rem;
      font-weight: 500;
      padding: 4px 12px;
      border-radius: var(--radius);
      display: inline-block;
      background: var(--paper);
      border: 1px solid var(--line);
      color: var(--ink);
    }
    .status-downloaded { color: var(--text-muted); }
    .status-chunk_summarised { color: var(--anchor); }
    .status-summarised { color: var(--stance-support); }
    .status-failed { color: var(--stance-oppose); }
  `],
})
export class StatusBadgeComponent {
  @Input() status: SessionStatus | null = null;
}
