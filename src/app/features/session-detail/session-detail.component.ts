import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

import { SessionService } from '../../core/services/session.service';
import { ChatAuthService } from '../../core/services/chat-auth.service';
import { PlenarySession, Stance, SummarySource } from '../../core/models/session.model';
import { ChatMessage } from '../../core/models/chat.model';
import { StanceChipComponent } from '../../shared/stance-chip/stance-chip.component';
import { MarkdownPipe } from '../../shared/markdown.pipe';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, TranslateModule, DatePipe, FormsModule,
    MatTabsModule, MatButtonModule, MatIconModule, MatCardModule,
    MatExpansionModule, MatProgressSpinnerModule, MatChipsModule,
    MatTooltipModule, MatSnackBarModule, MatInputModule, MatFormFieldModule,
    StanceChipComponent, MarkdownPipe,
  ],
  template: `
    @if (loading()) {
      <div class="spinner-wrap"><mat-spinner diameter="48"></mat-spinner></div>
    } @else if (session()) {
      <div class="detail-container">

        <!-- Header -->
        <div class="detail-header">
          <button mat-button color="primary" routerLink="/sessions">
            <mat-icon>arrow_back</mat-icon> {{ 'detail.back' | translate }}
          </button>
          <div class="header-title-row">
            <h1>{{ session()!.title || '—' }}</h1>
          </div>
          <div class="meta-chips">
            @if (session()!.date) {
              <span class="meta-item"><mat-icon>event</mat-icon> {{ session()!.date | date:'d MMMM yyyy' }}</span>
            }
            @if (session()!.chair) {
              <span class="meta-item"><mat-icon>person</mat-icon> {{ 'detail.chair' | translate }}: {{ session()!.chair }}</span>
            }
            @if (session()!.room) {
              <span class="meta-item"><mat-icon>meeting_room</mat-icon> {{ 'detail.room' | translate }}: {{ session()!.room }}</span>
            }
            @if (session()!.parliamentary_year) {
              <span class="meta-item"><mat-icon>calendar_today</mat-icon> {{ session()!.parliamentary_year }}</span>
            }
          </div>
        </div>

        <!-- Tabs -->
        <mat-tab-group animationDuration="200ms">

          <!-- Summary tab -->
          <mat-tab [label]="'detail.tab_summary' | translate">
            <div class="tab-content">
              @if (currentSummary()) {
                <div class="summary-text" [innerHTML]="currentSummary() | markdown"></div>
              } @else {
                <p class="empty-placeholder">{{ 'detail.no_summary' | translate }}</p>
              }
            </div>
          </mat-tab>

          <!-- Stances tab -->
          <mat-tab [label]="'detail.tab_stances' | translate">
            <div class="tab-content">
              @if (currentStances().length > 0) {
                <div class="stances-grid">
                  @for (stance of currentStances(); track stance.speaker + stance.activity) {
                    <mat-card class="stance-card">
                      <div class="stance-header">
                        <div>
                          <span class="speaker-name">{{ stance.speaker }}</span>
                          @if (stance.party) {
                            <span class="party-label"> ({{ stance.party }})</span>
                          }
                          <p class="activity-label">{{ stance.activity }}</p>
                        </div>
                        <app-stance-chip [stance]="stance.stance"></app-stance-chip>
                      </div>
                      <div class="stance-summary" [innerHTML]="stance.summary | markdown"></div>
                      <mat-expansion-panel class="evidence-panel">
                        <mat-expansion-panel-header>
                          <mat-panel-title>{{ 'detail.evidence' | translate }}</mat-panel-title>
                        </mat-expansion-panel-header>
                        <div class="evidence-quote" [innerHTML]="stance.evidence | markdown"></div>
                      </mat-expansion-panel>
                      @if (stance.utterance_ids.length) {
                        <p class="utterance-count">
                          <mat-icon class="small-icon">link</mat-icon>
                          {{ stance.utterance_ids.length }} {{ 'detail.utterances' | translate }}
                        </p>
                      }
                    </mat-card>
                  }
                </div>
              } @else {
                <p class="empty-placeholder">{{ 'detail.no_stances' | translate }}</p>
              }

            </div>
          </mat-tab>


          <!-- Chat tab -->
          <mat-tab [label]="'detail.tab_chat' | translate">
            <div class="tab-content">

              @if (!chatAuthService.unlocked()) {
                <!-- Password gate -->
                <div class="chat-gate">
                  <mat-card class="chat-gate-card">
                    <mat-icon class="gate-icon">lock</mat-icon>
                    <h2>{{ 'chat.gate_heading' | translate }}</h2>
                    <p class="gate-description">{{ 'chat.gate_description' | translate }}</p>

                    <mat-form-field appearance="outline" class="gate-field">
                      <mat-label>{{ 'chat.password_label' | translate }}</mat-label>
                      <input matInput
                             type="password"
                             [ngModel]="chatPassword()"
                             (ngModelChange)="chatPassword.set($event); chatPasswordError.set(false)"
                             (keydown.enter)="submitChatPassword()"
                             [placeholder]="'chat.password_placeholder' | translate"
                             [disabled]="chatPasswordLoading()">
                    </mat-form-field>

                    @if (chatPasswordError()) {
                      <p class="gate-error">{{ 'chat.error_wrong_password' | translate }}</p>
                    }

                    <button mat-flat-button color="primary"
                            (click)="submitChatPassword()"
                            [disabled]="!chatPassword().trim() || chatPasswordLoading()">
                      @if (chatPasswordLoading()) {
                        <mat-spinner diameter="20"></mat-spinner>
                      } @else {
                        {{ 'chat.submit_button' | translate }}
                      }
                    </button>
                  </mat-card>
                </div>

              } @else {
                <!-- Chat interface -->
                <div class="chat-container">
                  <div class="chat-messages">
                    @for (msg of chatHistory(); track $index) {
                      <div [class]="'chat-bubble chat-' + msg.role">
                        <div [innerHTML]="msg.content | markdown"></div>
                      </div>
                    }
                    @if (chatLoading()) {
                      <div class="chat-bubble chat-assistant chat-loading">
                        <mat-spinner diameter="20"></mat-spinner>
                      </div>
                    }
                  </div>
                  <div class="chat-input-row">
                    <mat-form-field appearance="outline" class="chat-field" subscriptSizing="dynamic">
                      <input matInput [(ngModel)]="chatInput"
                             (keydown.enter)="sendMessage()"
                             [placeholder]="'chat.input_placeholder' | translate"
                             maxlength="200">
                    </mat-form-field>
                    <button class="chat-send-btn" (click)="sendMessage()" [disabled]="chatLoading()">
                      <mat-icon>send</mat-icon>
                    </button>
                  </div>
                </div>
              }

            </div>
          </mat-tab>

        </mat-tab-group>
      </div>
    }
  `,
  styles: [`
    .spinner-wrap { display: flex; justify-content: center; padding: 80px; }
    .detail-container { max-width: 1000px; margin: 32px auto; padding: 0 24px; }

    .detail-header { margin-bottom: 32px; }
    .header-title-row { display: flex; align-items: flex-start; gap: 16px; margin: 12px 0; flex-wrap: wrap; }
    h1 { font-size: 1.6rem; font-weight: 700; color: #1a1a2e; margin: 0; flex: 1; }

    .meta-chips { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 8px; }
    .meta-item { display: flex; align-items: center; gap: 4px; font-size: 0.875rem; color: #546E7A; }
    .meta-item mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .tab-content { padding: 32px 0; }
    .summary-text { font-size: 1rem; line-height: 1.8; color: #37474F; white-space: pre-wrap; }
    .empty-placeholder { color: #90A4AE; font-style: italic; }

    .stances-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
    .stance-card { padding: 20px; display: flex; flex-direction: column; }
    .stance-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .speaker-name { font-weight: 600; color: #1a1a2e; }
    .party-label { color: #546E7A; }
    .activity-label { font-size: 0.8rem; color: #90A4AE; font-style: italic; margin: 4px 0 0; }
    .stance-summary { font-size: 0.9rem; color: #37474F; line-height: 1.6; margin-bottom: 12px; flex: 1; }
    .evidence-panel { margin-bottom: 12px; box-shadow: none !important; border: 1px solid #e0e0e0; }
    .evidence-quote { border-left: 3px solid #1565C0; padding: 8px 16px; color: #546E7A; font-style: italic; margin: 0; }
    .utterance-count { display: flex; align-items: center; gap: 4px; font-size: 0.78rem; color: #90A4AE; margin: 0; }
    .small-icon { font-size: 14px; width: 14px; height: 14px; }

    .uid-list { display: flex; flex-direction: column; gap: 8px; padding: 8px 0; }
    .uid-chip {
      font-family: monospace; font-size: 0.78rem; background: #F5F7FA;
      padding: 6px 12px; border-radius: 4px; cursor: pointer; color: #1565C0;
      border: 1px solid #e0e0e0;
    }
    .uid-chip:hover { background: #E3F2FD; }

.chat-container { display: flex; flex-direction: column; height: 520px; }
    .chat-messages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding: 16px 0; }
    .chat-bubble { max-width: 75%; padding: 10px 16px; border-radius: 16px; font-size: 0.9rem; line-height: 1.6; }
    .chat-user { align-self: flex-end; background: #1565C0; color: #fff; border-bottom-right-radius: 4px; }
    .chat-assistant { align-self: flex-start; background: #fff; color: #37474F; border: 1px solid #e0e0e0; border-bottom-left-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
    .chat-loading { padding: 12px 16px; }
    .chat-input-row { display: flex; gap: 8px; align-items: center; padding-top: 8px; border-top: 1px solid #e0e0e0; }
    .chat-field { flex: 1; }
    .chat-send-btn {
      height: 56px; width: 56px; flex-shrink: 0;
      background: #1565C0; color: #fff; border: none; border-radius: 4px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .chat-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .chat-send-btn mat-icon { font-size: 24px; width: 24px; height: 24px; line-height: 24px; }

    .chat-gate { display: flex; justify-content: center; padding: 48px 16px; }
    .chat-gate-card { max-width: 420px; width: 100%; padding: 40px 32px; display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; }
    .gate-icon { font-size: 48px; width: 48px; height: 48px; color: #1565C0; }
    .chat-gate-card h2 { font-size: 1.25rem; font-weight: 600; color: #1a1a2e; margin: 0; }
    .gate-description { font-size: 0.9rem; color: #546E7A; margin: 0; }
    .gate-field { width: 100%; }
    .gate-error { color: #c62828; font-size: 0.85rem; margin: 0; }
  `],
})
export class SessionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private sessionService = inject(SessionService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private translateService = inject(TranslateService);
  chatAuthService = inject(ChatAuthService);

  session = signal<PlenarySession | null>(null);
  loading = signal(true);
  currentLang = signal(this.translateService.currentLang ?? 'nl');
  sources = computed<SummarySource[]>(() => this.session()?.summary_sources ?? []);

  currentSummary = computed<string | null>(() => {
    const s = this.session();
    if (!s) return null;
    return this.currentLang() === 'en' ? (s.summary_en ?? s.summary) : s.summary;
  });

  currentStances = computed<Stance[]>(() => {
    const s = this.session();
    if (!s) return [];
    const src = this.currentLang() === 'en' ? (s.stances_en ?? s.stances) : s.stances;
    return src?.stances ?? [];
  });

  chatHistory = signal<ChatMessage[]>([]);
  chatInput = '';
  chatLoading = signal(false);

  chatPassword = signal('');
  chatPasswordError = signal(false);
  chatPasswordLoading = signal(false);

  ngOnInit() {
    this.translateService.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(e => this.currentLang.set(e.lang));

    this.route.paramMap
      .pipe(
        switchMap(params => {
          this.loading.set(true);
          this.session.set(null);
          return this.sessionService.getSession(params.get('id')!);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: s => { this.session.set(s); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  submitChatPassword(): void {
    const pwd = this.chatPassword().trim();
    if (!pwd || this.chatPasswordLoading()) return;
    this.chatPasswordError.set(false);
    this.chatPasswordLoading.set(true);
    this.sessionService.verifyChat(pwd)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.chatAuthService.unlock();
          this.chatPasswordLoading.set(false);
        },
        error: () => {
          this.chatPasswordError.set(true);
          this.chatPasswordLoading.set(false);
        },
      });
  }

  sendMessage() {
    const msg = this.chatInput.trim();
    if (!msg || msg.length > 200 || this.chatLoading()) return;
    const historyBeforeThisMessage = this.chatHistory();
    const userMsg: ChatMessage = { role: 'user', content: msg };
    this.chatHistory.update(h => [...h, userMsg]);
    this.chatInput = '';
    this.chatLoading.set(true);
    this.sessionService.chat(this.session()!.id, msg, historyBeforeThisMessage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.chatHistory.update(h => [...h, { role: 'assistant', content: res.answer }]);
          this.chatLoading.set(false);
        },
        error: () => this.chatLoading.set(false),
      });
  }

  copyId(uid: string) {
    navigator.clipboard.writeText(uid);
    this.snackBar.open('Copied!', '', { duration: 1500 });
  }
}
