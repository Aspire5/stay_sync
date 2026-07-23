import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImportSummary } from '../../../models/calendar.model';
import { CalendarStore } from '../../../stores/calendar.store';

@Component({
  selector: 'app-import-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-header">
      <div class="header-title-row">
        <span class="dialog-icon">
          <mat-icon>sync_alt</mat-icon>
        </span>
        <div>
          <h2 mat-dialog-title class="dialog-title">Channel Feed Import & Reconciliation</h2>
          <p class="dialog-subtitle">Ingest and reconcile external OTA reservation feed</p>
        </div>
      </div>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="dialog-content">
      <!-- Intro Info Box -->
      <div class="info-card">
        <mat-icon class="info-icon">info</mat-icon>
        <div>
          <strong>Channel Feed Conventions Applied:</strong>
          <ul class="convention-list">
            <li><strong>Exclusive Check-out:</strong> Guest departs morning of checkOut date.</li>
            <li><strong>Idempotent Import:</strong> Duplicates skipped automatically.</li>
            <li><strong>Conflict Rejection:</strong> Overlapping date ranges are flagged without double-booking.</li>
          </ul>
        </div>
      </div>

      <!-- Action Button (Before Run) -->
      <div *ngIf="!summary && !isLoading" class="action-container">
        <p class="mock-feed-text">
          Feed ready to ingest: <strong>5 Mock Channel Reservations</strong> (John D., Maria S., Sam P., Duplicate & Cancellation).
        </p>
        <button mat-raised-button color="primary" class="run-btn" (click)="runImport()">
          <mat-icon>play_arrow</mat-icon> Run Channel Reconciliation
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-state">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Reconciling channel feed against calendar reservations...</p>
      </div>

      <!-- Summary Metrics & Decision Log (After Run) -->
      <div *ngIf="summary" class="results-container">
        <div class="metrics-grid">
          <div class="metric-card success">
            <span class="metric-value">{{ summary.importedCount }}</span>
            <span class="metric-label">Imported</span>
          </div>

          <div class="metric-card warning">
            <span class="metric-value">{{ summary.duplicatesSkipped }}</span>
            <span class="metric-label">Duplicates Skipped</span>
          </div>

          <div class="metric-card muted">
            <span class="metric-value">{{ summary.cancellationsProcessed }}</span>
            <span class="metric-label">Cancellations</span>
          </div>

          <div class="metric-card danger">
            <span class="metric-value">{{ summary.conflictsDetected }}</span>
            <span class="metric-label">Conflicts Flagged</span>
          </div>
        </div>

        <h3 class="log-title">Reconciliation Log & Decisions</h3>

        <div class="log-list">
          <div
            *ngFor="let detail of summary.details"
            class="log-item"
            [ngClass]="detail.status.toLowerCase()"
          >
            <div class="log-top">
              <span class="log-status-badge">
                {{ formatStatus(detail.status) }}
              </span>
              <span class="log-guest">
                <strong>{{ detail.guestName }}</strong> (#{{ detail.feedId }})
              </span>
              <span class="log-dates">{{ detail.checkIn }} – {{ detail.checkOut }}</span>
            </div>
            <p class="log-reason">{{ detail.reason }}</p>
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button mat-dialog-close>Close</button>
      <button
        *ngIf="summary"
        mat-stroked-button
        color="primary"
        (click)="runImport()"
      >
        Re-run Import
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-lg);
        border-bottom: 1px solid var(--border-color);
        background: var(--surface-bg);
      }

      .header-title-row {
        display: flex;
        align-items: center;
        gap: var(--space-md);
      }

      .dialog-icon {
        width: 40px;
        height: 40px;
        border-radius: var(--radius-md);
        background: var(--primary-light);
        color: var(--primary);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .dialog-title {
        font-size: 1.15rem !important;
        font-weight: 700 !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .dialog-subtitle {
        font-size: 0.85rem;
        color: var(--text-muted);
        margin: 0;
      }

      .dialog-content {
        padding: var(--space-lg) !important;
        max-height: 75vh;
        overflow-y: auto;
      }

      .info-card {
        display: flex;
        align-items: flex-start;
        gap: var(--space-md);
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: var(--radius-md);
        padding: var(--space-md);
        font-size: 0.85rem;
        color: #0369a1;
      }

      .info-icon {
        color: #0284c7;
      }

      .convention-list {
        margin-top: 4px;
        padding-left: 18px;
      }

      .action-container {
        text-align: center;
        padding: var(--space-xl) 0;
      }

      .mock-feed-text {
        font-size: 0.95rem;
        color: var(--text-main);
        margin-bottom: var(--space-md);
      }

      .run-btn {
        border-radius: var(--radius-md) !important;
        height: 44px !important;
        padding: 0 24px !important;
        font-weight: 600 !important;
      }

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-md);
        padding: var(--space-xl) 0;
        color: var(--text-muted);
      }

      /* Results */
      .results-container {
        margin-top: var(--space-lg);
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--space-md);
        margin-bottom: var(--space-lg);
      }

      .metric-card {
        background: var(--surface-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 12px;
        text-align: center;

        .metric-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .metric-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
        }
      }

      .metric-card.success .metric-value { color: var(--success); }
      .metric-card.warning .metric-value { color: var(--warning); }
      .metric-card.muted .metric-value { color: var(--secondary); }
      .metric-card.danger .metric-value { color: var(--danger); }

      .log-title {
        font-size: 0.95rem;
        font-weight: 700;
        margin-bottom: var(--space-md);
        color: var(--text-main);
      }

      .log-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
      }

      .log-item {
        background: #ffffff;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 10px 14px;
        font-size: 0.85rem;
      }

      .log-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 4px;
      }

      .log-status-badge {
        font-size: 0.7rem;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        text-transform: uppercase;
      }

      .imported .log-status-badge { background: var(--success-light); color: var(--success-text); }
      .duplicate_skipped .log-status-badge { background: var(--warning-light); color: var(--warning-text); }
      .cancelled_ignored .log-status-badge { background: var(--blocked-light); color: var(--blocked-text); }
      .conflict_detected .log-status-badge { background: var(--danger-light); color: var(--danger-text); }

      .log-dates {
        font-size: 0.78rem;
        color: var(--text-muted);
      }

      .log-reason {
        color: var(--text-muted);
        font-size: 0.8rem;
        margin-top: 2px;
      }

      .dialog-actions {
        padding: var(--space-md) var(--space-lg);
        border-top: 1px solid var(--border-color);
      }
    `,
  ],
})
export class ImportDialogComponent {
  private store = inject(CalendarStore);
  private dialogRef = inject(MatDialogRef<ImportDialogComponent>);

  summary: ImportSummary | null = null;
  isLoading = false;

  runImport(): void {
    this.isLoading = true;
    this.store.importChannelFeed((summary) => {
      this.summary = summary;
      this.isLoading = false;
    });
  }

  formatStatus(status: string): string {
    return status.replace('_', ' ');
  }
}
