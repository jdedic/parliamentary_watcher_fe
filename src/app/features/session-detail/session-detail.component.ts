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
import { MatTableModule } from '@angular/material/table';

import { SessionService } from '../../core/services/session.service';
import { ChatAuthService } from '../../core/services/chat-auth.service';
import { PlenarySession, Stance, SummarySource } from '../../core/models/session.model';
import { ChatMessage, ChunkDetail } from '../../core/models/chat.model';
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
    MatTableModule,
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
            @if (!session()!.is_final) {
              <span class="provisional-chip">{{ 'sessions.provisional_chip' | translate }}</span>
            }
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

        @if (!session()!.is_final) {
          <div class="provisional-banner">
            <mat-icon class="banner-icon">info</mat-icon>
            <p>
              <strong>{{ 'detail.provisional_banner_title' | translate }}</strong>
              {{ 'detail.provisional_banner_body' | translate }}
            </p>
          </div>
        }

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
                          @if (stance.speaker_id) {
                            <a class="speaker-name" [routerLink]="['/speakers', stance.speaker_id]">{{ stance.speaker }}</a>
                          } @else {
                            <span class="speaker-name">{{ stance.speaker }}</span>
                          }
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
                    <p class="gate-contact">
                      {{ 'chat.gate_contact' | translate }}
                      <a href="mailto:jelena.dedic.it@gmail.com">jelena.dedic.it@gmail.com</a>
                    </p>

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

                    <button class="gate-submit"
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
                  @if (chatError()) {
                    <p class="chat-error">{{ chatError() }}</p>
                  }
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

          <!-- Retrieval tab (debug-only, enable via window.enableRetrievalTab() in console) -->
          @if (debugMode()) {
            <mat-tab label="Retrieval">
              <div class="tab-content">
                @if (lastChunks().length === 0) {
                  <p class="empty-placeholder">Ask a question in the Chat tab to see retrieval details.</p>
                } @else {
                  <table mat-table [dataSource]="lastChunks()" class="retrieval-table">
                    <ng-container matColumnDef="rank">
                      <th mat-header-cell *matHeaderCellDef>#</th>
                      <td mat-cell *matCellDef="let c; let i = index">{{ i + 1 }}</td>
                    </ng-container>
                    <ng-container matColumnDef="chunk_id">
                      <th mat-header-cell *matHeaderCellDef>Chunk ID</th>
                      <td mat-cell *matCellDef="let c" class="mono">{{ c.chunk_id.slice(0, 8) }}</td>
                    </ng-container>
                    <ng-container matColumnDef="rrf_score">
                      <th mat-header-cell *matHeaderCellDef>RRF score</th>
                      <td mat-cell *matCellDef="let c">{{ c.rrf_score }}</td>
                    </ng-container>
                    <ng-container matColumnDef="rerank_score">
                      <th mat-header-cell *matHeaderCellDef>Rerank score</th>
                      <td mat-cell *matCellDef="let c">{{ c.rerank_score ?? '—' }}</td>
                    </ng-container>
                    <ng-container matColumnDef="chunk_index">
                      <th mat-header-cell *matHeaderCellDef>Index</th>
                      <td mat-cell *matCellDef="let c">{{ c.chunk_index ?? '—' }}</td>
                    </ng-container>
                    <ng-container matColumnDef="type">
                      <th mat-header-cell *matHeaderCellDef>Type</th>
                      <td mat-cell *matCellDef="let c">
                        <span [class]="c.is_neighbor ? 'badge-neighbor' : 'badge-retrieved'">
                          {{ c.is_neighbor ? 'neighbor' : 'retrieved' }}
                        </span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="speakers">
                      <th mat-header-cell *matHeaderCellDef>Speakers</th>
                      <td mat-cell *matCellDef="let c">{{ c.speakers.join(', ') || '—' }}</td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="retrievalColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: retrievalColumns"></tr>
                  </table>
                }
              </div>
            </mat-tab>
          }

        </mat-tab-group>
      </div>
    }
  `,
  styles: [`
    .spinner-wrap { display: flex; justify-content: center; padding: 80px; }
    .detail-container { max-width: 1000px; margin: 0 auto; padding: 28px 24px 48px; }

    .detail-header {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow-card);
      padding: 20px 24px 24px;
      margin-bottom: 20px;
    }
    .header-title-row { display: flex; align-items: center; gap: 16px; margin: 12px 0; flex-wrap: wrap; }
    h1 { font-size: 1.6rem; font-weight: 700; color: var(--ink); margin: 0; flex: 1; }
    .provisional-chip {
      font-size: 0.75rem; font-weight: 500; padding: 4px 12px;
      border-radius: var(--radius); border: 1px solid var(--line); color: var(--anchor);
      flex-shrink: 0;
    }

    .meta-chips { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 8px; }
    .meta-item { display: flex; align-items: center; gap: 4px; font-size: 0.875rem; color: var(--text-muted); }
    .meta-item mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .provisional-banner {
      display: flex; align-items: flex-start; gap: 12px;
      background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius);
      padding: 14px 18px; margin-bottom: 20px;
    }
    .provisional-banner .banner-icon { color: var(--anchor); font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; margin-top: 1px; }
    .provisional-banner p { margin: 0; font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; }
    .provisional-banner p strong { color: var(--ink); font-weight: 600; }

    :host ::ng-deep .mat-mdc-tab-header {
      background: var(--surface);
      border: 1px solid var(--line);
      border-bottom: none;
      border-radius: var(--radius) var(--radius) 0 0;
    }
    :host ::ng-deep .mat-mdc-tab-body-wrapper {
      background: var(--surface);
      border: 1px solid var(--line);
      border-top: none;
      border-radius: 0 0 var(--radius) var(--radius);
      box-shadow: var(--shadow-card);
    }

    .tab-content { padding: 28px 24px; }
    .summary-text { font-size: 1rem; line-height: 1.8; color: var(--text-muted); white-space: pre-wrap; }
    .empty-placeholder { color: var(--text-muted); font-style: italic; }

    .stances-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
    .stance-card {
      padding: 20px; display: flex; flex-direction: column;
      background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius);
      box-shadow: var(--shadow-card);
    }
    .stance-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .speaker-name { font-weight: 600; color: var(--ink); }
    a.speaker-name { text-decoration: none; cursor: pointer; }
    a.speaker-name:hover { color: var(--anchor); text-decoration: underline; }
    .party-label { color: var(--text-muted); }
    .activity-label { font-size: 0.8rem; color: var(--text-muted); font-style: italic; margin: 4px 0 0; }
    .stance-summary { font-size: 0.9rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 12px; flex: 1; }
    .evidence-panel { margin-bottom: 12px; box-shadow: none !important; border: 1px solid var(--line); }
    .evidence-quote {
      font-family: var(--font-voice);
      border-left: 3px solid var(--accent);
      background: rgba(224, 165, 38, 0.06);
      padding: 8px 16px; color: var(--ink); margin: 0;
    }
    .utterance-count { display: flex; align-items: center; gap: 4px; font-size: 0.78rem; color: var(--text-muted); margin: 0; }
    .small-icon { font-size: 14px; width: 14px; height: 14px; }

    .uid-list { display: flex; flex-direction: column; gap: 8px; padding: 8px 0; }
    .uid-chip {
      font-family: monospace; font-size: 0.78rem; background: var(--paper);
      padding: 6px 12px; border-radius: 4px; cursor: pointer; color: var(--anchor);
      border: 1px solid var(--line);
    }
    .uid-chip:hover { background: var(--line); }

.chat-container { display: flex; flex-direction: column; height: 520px; }
    .chat-messages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding: 16px 0; }
    .chat-bubble { max-width: 75%; padding: 10px 16px; border-radius: 16px; font-size: 0.9rem; line-height: 1.6; }
    .chat-user { align-self: flex-end; background: var(--anchor); color: #fff; border-bottom-right-radius: 4px; }
    .chat-assistant { align-self: flex-start; background: var(--surface); color: var(--ink); border: 1px solid var(--line); border-bottom-left-radius: 4px; box-shadow: var(--shadow-card); }
    .chat-loading { padding: 12px 16px; }
    .chat-input-row { display: flex; gap: 8px; align-items: center; padding-top: 8px; border-top: 1px solid var(--line); }
    .chat-field { flex: 1; }
    .chat-send-btn {
      height: 56px; width: 56px; flex-shrink: 0;
      background: var(--anchor); color: #fff; border: none; border-radius: var(--radius);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .chat-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .chat-send-btn mat-icon { font-size: 24px; width: 24px; height: 24px; line-height: 24px; }
    .chat-error { color: var(--stance-oppose); font-size: 0.85rem; margin: 4px 0 8px; text-align: center; }

    .chat-gate { display: flex; justify-content: center; padding: 48px 16px; }
    .chat-gate-card {
      max-width: 420px; width: 100%; padding: 40px 32px; display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center;
      background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow-card);
    }
    .gate-icon { font-size: 48px; width: 48px; height: 48px; color: var(--anchor); }
    .chat-gate-card h2 { font-size: 1.25rem; font-weight: 500; color: var(--ink); margin: 0; }
    .gate-description { font-size: 0.9rem; color: var(--text-muted); margin: 0; }
    .gate-contact { font-size: 0.85rem; color: var(--text-muted); margin: 0; }
    .gate-contact a { color: var(--anchor); }
    .gate-field { width: 100%; }
    .gate-error { color: var(--stance-oppose); font-size: 0.85rem; margin: 0; }
    .gate-submit {
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--accent); color: var(--on-accent); border: 1px solid var(--accent);
      font-family: var(--font-body); font-size: 1rem; font-weight: 500;
      padding: 10px 24px; border-radius: var(--radius); cursor: pointer;
      transition: opacity .15s;
    }
    .gate-submit:hover { opacity: .88; }
    .gate-submit:disabled { opacity: 0.5; cursor: not-allowed; }

    .retrieval-table { width: 100%; }
    .retrieval-table th { font-weight: 500; color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .retrieval-table td { font-size: 0.875rem; color: var(--ink); }
    .mono { font-family: monospace; font-size: 0.8rem; }
    .badge-retrieved, .badge-neighbor { background: var(--paper); color: var(--ink); border: 1px solid var(--line); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; }
    .badge-neighbor { color: var(--text-muted); }
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
  currentLang = signal('en');
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
  chatError = signal<string | null>(null);

  chatPassword = signal('');
  chatPasswordError = signal(false);
  chatPasswordLoading = signal(false);

  lastChunks = signal<ChunkDetail[]>([]);
  readonly retrievalColumns = ['rank', 'chunk_id', 'rrf_score', 'rerank_score', 'chunk_index', 'type', 'speakers'];
  debugMode = signal(localStorage.getItem('debugRetrieval') === '1');

  ngOnInit() {
    (window as any).enableRetrievalTab = (enabled: boolean = true) => {
      localStorage.setItem('debugRetrieval', enabled ? '1' : '0');
      this.debugMode.set(enabled);
    };

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
          this.chatAuthService.unlock(pwd);
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
    this.chatError.set(null);
    this.chatLoading.set(true);
    this.sessionService.chat(this.session()!.id, msg, historyBeforeThisMessage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.chatHistory.update(h => [...h, { role: 'assistant', content: res.answer }]);
          this.lastChunks.set(res.chunks ?? []);
          this.chatLoading.set(false);
        },
        error: (err) => {
          this.chatError.set(err?.error?.detail ?? 'Something went wrong. Please try again.');
          this.chatLoading.set(false);
        },
      });
  }

  copyId(uid: string) {
    navigator.clipboard.writeText(uid);
    this.snackBar.open('Copied!', '', { duration: 1500 });
  }
}
