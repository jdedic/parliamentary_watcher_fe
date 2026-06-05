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
      border-radius: 16px;
      display: inline-block;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .status-downloaded { background: #e0e0e0; color: #616161; }
    .status-chunk_summarised { background: #bbdefb; color: #1565c0; }
    .status-summarised { background: #c8e6c9; color: #2e7d32; }
    .status-failed { background: #ffcdd2; color: #c62828; }
  `],
})
export class StatusBadgeComponent {
  @Input() status: SessionStatus | null = null;
}
