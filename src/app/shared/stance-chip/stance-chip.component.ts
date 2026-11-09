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
      font-size: 0.75rem; font-weight: 500;
      padding: 4px 12px; border-radius: var(--radius); display: inline-block;
      border: 1px solid var(--line);
    }
    .stance-support { color: var(--stance-support); }
    .stance-oppose  { color: var(--stance-oppose); }
    .stance-unclear { color: var(--stance-unclear); font-style: italic; }
  `],
})
export class StanceChipComponent {
  @Input() stance: 'support' | 'oppose' | 'unclear' = 'unclear';
}
