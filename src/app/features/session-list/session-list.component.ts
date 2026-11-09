import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { SessionService } from '../../core/services/session.service';
import { PlenarySessionListItem } from '../../core/models/session.model';
import { ExcerptPipe } from '../../shared/excerpt.pipe';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-session-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, FormsModule, TranslateModule, DatePipe, ExcerptPipe, StatusBadgeComponent,
    MatCardModule, MatButtonModule, MatInputModule, MatFormFieldModule,
    MatPaginatorModule, MatProgressSpinnerModule, MatIconModule,
  ],
  template: `
    <div class="list-container">
      <h1>{{ 'sessions.page_title' | translate }}</h1>

      <mat-form-field class="search-field" appearance="outline">
        <mat-icon matPrefix>search</mat-icon>
        <input matInput
               [(ngModel)]="searchTerm"
               (ngModelChange)="onSearch($event)"
               [placeholder]="'sessions.search_placeholder' | translate">
      </mat-form-field>

      <!-- Finality filter: hidden for now; the list shows final sessions only
           (finalityFilter defaults to 'final'). Re-enable when needed.
      <div class="finality-filter">
        <button [class.filter-active]="finalityFilter() === 'all'" (click)="setFinalityFilter('all')">
          {{ 'sessions.filter_all' | translate }}
        </button>
        <button [class.filter-active]="finalityFilter() === 'final'" (click)="setFinalityFilter('final')">
          {{ 'sessions.filter_final' | translate }}
        </button>
        <button [class.filter-active]="finalityFilter() === 'provisional'" (click)="setFinalityFilter('provisional')">
          {{ 'sessions.filter_provisional' | translate }}
        </button>
      </div>
      -->

      @if (loading()) {
        <div class="spinner-wrap"><mat-spinner diameter="48"></mat-spinner></div>
      } @else if (sessions().length === 0) {
        <p class="empty-msg">
          {{ (finalityFilter() === 'provisional' ? 'sessions.no_provisional_results' : 'sessions.no_results') | translate }}
        </p>
      } @else {
        <div class="card-grid">
          @for (session of sessions(); track session.id) {
            <mat-card class="session-card">
              <div class="card-meta">
                <span class="meeting-label">
                  @if (session.meeting_number) { #{{ session.meeting_number }} · }
                  {{ session.parliamentary_year }}
                </span>
                <span class="session-date">{{ session.date | date:'d MMMM yyyy' }}</span>
                @if (session.status) {
                  <app-status-badge [status]="session.status"></app-status-badge>
                }
                <!-- Provisional chip: hidden for now, re-enable when needed.
                @if (!session.is_final) {
                  <span class="provisional-chip">{{ 'sessions.provisional_chip' | translate }}</span>
                }
                -->
              </div>
              <h2 class="card-title">{{ session.title || '—' }}</h2>
              <div class="card-details">
                <span class="detail-item">{{ session.room || '—' }}</span>
                @if (session.chair) {
                  <span class="detail-separator">·</span>
                  <span class="detail-item">{{ session.chair }}</span>
                }
              </div>
              <p class="card-excerpt">
                @let localSummary = currentLang() === 'en' ? (session.summary_en ?? session.summary) : session.summary;
                {{ localSummary ? (localSummary | excerpt) : ('sessions.no_summary' | translate) }}
              </p>
              <div class="card-footer">
                <button mat-stroked-button color="primary" [routerLink]="['/sessions', session.id]">
                  {{ 'sessions.read_more' | translate }} →
                </button>
              </div>
            </mat-card>
          }
        </div>

        <mat-paginator
          [length]="total()"
          [pageSize]="pageSize"
          [pageIndex]="currentPageIndex"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPage($event)"
          [showFirstLastButtons]="true">
        </mat-paginator>
      }
    </div>
  `,
  styles: [`
    .list-container { max-width: 1200px; margin: 40px auto; padding: 0 24px; }
    h1 { font-size: 1.75rem; font-weight: 700; color: var(--ink); margin-bottom: 24px; }
    .search-field { width: 100%; max-width: 480px; margin-bottom: 16px; }
    /* Finality filter: hidden for now, re-enable together with the template block.
    .finality-filter {
      display: inline-flex; gap: 4px; padding: 4px;
      background: var(--paper); border: 1px solid var(--line); border-radius: var(--radius);
      margin-bottom: 32px;
    }
    .finality-filter button {
      font-family: var(--font-body); font-size: 0.85rem; font-weight: 500;
      color: var(--text-muted); background: transparent; border: none;
      padding: 6px 14px; border-radius: calc(var(--radius) - 4px); cursor: pointer;
    }
    .finality-filter button:hover { color: var(--ink); }
    .finality-filter button.filter-active { background: var(--surface); color: var(--ink); box-shadow: var(--shadow-card); }
    */
    /* Provisional chip: hidden for now, re-enable together with the template block.
    .provisional-chip {
      font-size: 0.75rem; font-weight: 500; padding: 4px 12px;
      border-radius: var(--radius); border: 1px solid var(--line); color: var(--anchor);
    }
    */
    .spinner-wrap { display: flex; justify-content: center; padding: 60px; }
    .empty-msg { color: var(--text-muted); font-size: 1rem; text-align: center; padding: 60px 0; }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }
    .session-card {
      padding: 24px; display: flex; flex-direction: column; gap: 10px;
      background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius);
      box-shadow: var(--shadow-card);
    }
    .card-meta { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
    .meeting-label { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }
    .session-date {
      font-size: 0.8rem;
      font-weight: 500;
      padding: 4px 12px;
      border-radius: var(--radius);
      background: var(--paper);
      border: 1px solid var(--line);
      color: var(--ink);
    }
    .card-title {
      font-size: 1.05rem;
      font-weight: 500;
      color: var(--ink);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin: 0;
    }
    .card-details {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin: 8px 0 0;
    }
    .detail-item { font-weight: 500; }
    .detail-separator { color: var(--line); }
    .card-excerpt { font-size: 0.9rem; color: var(--text-muted); line-height: 1.6; flex: 1; margin: 0; font-style: italic; }
    .card-footer { margin-top: 8px; }
  `],
})
export class SessionListComponent implements OnInit {
  private sessionService = inject(SessionService);
  private destroyRef = inject(DestroyRef);
  private translateService = inject(TranslateService);

  sessions = signal<PlenarySessionListItem[]>([]);
  total = signal(0);
  loading = signal(false);
  currentLang = signal(this.translateService.currentLang ?? 'en');
  // Defaults to 'final': the list shows only final (official-record) sessions.
  finalityFilter = signal<'all' | 'final' | 'provisional'>('final');
  searchTerm = '';
  pageSize = 20;
  currentSkip = 0;
  currentPageIndex = 0;

  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.translateService.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(e => this.currentLang.set(e.lang));

    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(term => {
        this.currentSkip = 0;
        this.currentPageIndex = 0;
        this.loadSessions(term);
      });
    this.loadSessions();
  }

  onSearch(term: string) {
    this.searchSubject.next(term);
  }

  onPage(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPageIndex = event.pageIndex;
    this.currentSkip = event.pageIndex * event.pageSize;
    this.loadSessions(this.searchTerm);
  }

  setFinalityFilter(filter: 'all' | 'final' | 'provisional') {
    if (this.finalityFilter() === filter) return;
    this.finalityFilter.set(filter);
    this.currentSkip = 0;
    this.currentPageIndex = 0;
    this.loadSessions(this.searchTerm);
  }

  private isFinalParam(): boolean | undefined {
    const filter = this.finalityFilter();
    if (filter === 'final') return true;
    if (filter === 'provisional') return false;
    return undefined;
  }

  private loadSessions(title?: string) {
    this.loading.set(true);
    this.sessionService.getSessions(this.currentSkip, this.pageSize, title || undefined, this.isFinalParam())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.sessions.set(res.sessions);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
