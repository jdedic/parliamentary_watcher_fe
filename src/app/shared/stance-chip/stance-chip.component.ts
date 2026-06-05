import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-stance-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  template: `
    <span [class]="'stance-chip stance-' + stance">
      {{ 'stance.' + stance | translate }}
    </span>
  `,
  styles: [`
    .stance-chip {
      font-size: 0.75rem; font-weight: 600;
      padding: 4px 12px; border-radius: 16px; display: inline-block;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .stance-support { background: #c8e6c9; color: #2e7d32; }
    .stance-oppose  { background: #ffcdd2; color: #c62828; }
    .stance-unclear { background: #e0e0e0; color: #616161; }
  `],
})
export class StanceChipComponent {
  @Input() stance: 'support' | 'oppose' | 'unclear' = 'unclear';
}
