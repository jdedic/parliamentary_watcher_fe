import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SpeakerService } from '../../core/services/speaker.service';
import { Speaker } from '../../core/models/speaker.model';

@Component({
  selector: 'app-speaker-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, TranslateModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="detail-container">
      <button mat-button color="primary" routerLink="/sessions">
        <mat-icon>arrow_back</mat-icon> {{ 'detail.back' | translate }}
      </button>

      @if (loading()) {
        <div class="spinner-wrap"><mat-spinner diameter="48"></mat-spinner></div>
      } @else if (error()) {
        <p class="empty-placeholder">{{ 'speaker.not_found' | translate }}</p>
      } @else if (speaker(); as s) {
        <div class="speaker-card">
          <div class="photo-wrap">
            @if (imageUrl()) {
              <img [src]="imageUrl()" [alt]="s.name" class="speaker-photo">
            } @else {
              <div class="photo-skeleton"><mat-spinner diameter="32"></mat-spinner></div>
            }
          </div>

          <div class="speaker-info">
            <h1>{{ s.name }}</h1>

            @if (s.function) {
              <p class="speaker-function">{{ 'speaker.function' | translate }}: {{ s.function }}</p>
            }

            @if (partyLabel(); as label) {
              <p class="speaker-party">
                {{ 'speaker.party' | translate }}: {{ label }}
                @if (s.party_afkorting && partyNameShown()) {
                  <span class="party-abbr"> ({{ s.party_afkorting }})</span>
                }
              </p>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-container { max-width: 640px; margin: 0 auto; padding: 28px 24px 48px; }
    .spinner-wrap { display: flex; justify-content: center; padding: 80px; }
    .empty-placeholder { color: var(--text-muted); font-style: italic; margin-top: 24px; }

    .speaker-card {
      display: flex; gap: 24px; align-items: flex-start;
      background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius);
      box-shadow: var(--shadow-card);
      padding: 24px; margin-top: 20px;
    }
    .photo-wrap { flex-shrink: 0; width: 120px; height: 120px; }
    .speaker-photo { width: 120px; height: 120px; object-fit: cover; border-radius: var(--radius); }
    .photo-skeleton {
      width: 120px; height: 120px; border-radius: var(--radius); background: var(--paper);
      display: flex; align-items: center; justify-content: center;
    }
    .speaker-info h1 { font-size: 1.4rem; font-weight: 700; color: var(--ink); margin: 0 0 8px; }
    .speaker-function { font-size: 0.9rem; color: var(--text-muted); margin: 0 0 4px; }
    .speaker-party { font-size: 0.9rem; color: var(--text-muted); margin: 0; }
    .party-abbr { color: var(--text-muted); }
  `],
})
export class SpeakerDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private speakerService = inject(SpeakerService);
  private destroyRef = inject(DestroyRef);
  private translateService = inject(TranslateService);

  speaker = signal<Speaker | null>(null);
  loading = signal(true);
  error = signal(false);
  currentLang = signal('en');
  imageUrl = signal<string | null>(null);

  private partyName = computed<string | null>(() => {
    const s = this.speaker();
    if (!s) return null;
    return (this.currentLang() === 'en' ? s.party_name_en : s.party_name_nl) ?? null;
  });

  partyNameShown = computed<boolean>(() => this.partyName() !== null);

  partyLabel = computed<string | null>(() => {
    const s = this.speaker();
    if (!s) return null;
    return this.partyName() ?? s.party_afkorting ?? null;
  });

  ngOnInit() {
    this.translateService.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(e => this.currentLang.set(e.lang));

    this.destroyRef.onDestroy(() => {
      const url = this.imageUrl();
      if (url) URL.revokeObjectURL(url);
    });

    this.route.paramMap
      .pipe(
        switchMap(params => {
          this.loading.set(true);
          this.error.set(false);
          this.speaker.set(null);
          this.revokeImage();
          return this.speakerService.getSpeaker(Number(params.get('id')));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: s => {
          this.speaker.set(s);
          this.loading.set(false);
          this.loadImage(s.id);
        },
        error: () => {
          this.loading.set(false);
          this.error.set(true);
        },
      });
  }

  private loadImage(id: number): void {
    this.speakerService.getSpeakerImage(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: blob => {
          const url = URL.createObjectURL(blob);
          this.imageUrl.set(url);
        },
      });
  }

  private revokeImage(): void {
    const url = this.imageUrl();
    if (url) {
      URL.revokeObjectURL(url);
      this.imageUrl.set(null);
    }
  }
}
