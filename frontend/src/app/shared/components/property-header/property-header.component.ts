import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-property-header',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <header class="header-container">
      <div class="property-info">
        <div class="title-row">
          <span class="property-icon">
            <mat-icon>home_work</mat-icon>
          </span>
          <div>
            <h1 class="property-name">{{ propertyName }}</h1>
            <div class="property-meta">
              <span class="meta-item">
                <mat-icon class="inline-icon">bed</mat-icon> 1 Bookable Unit
              </span>
              <span class="meta-divider">•</span>
              <span class="meta-item rate-tag">
                Base Rate: <strong>£{{ baseRate }}/night</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="month-navigation">
        <button mat-icon-button (click)="onPrevMonth.emit()" title="Previous Month">
          <mat-icon>chevron_left</mat-icon>
        </button>

        <span class="current-month-label">{{ monthTitle }}</span>

        <button mat-icon-button (click)="onNextMonth.emit()" title="Next Month">
          <mat-icon>chevron_right</mat-icon>
        </button>

        <button mat-stroked-button (click)="onToday.emit()" class="today-btn">
          Today
        </button>
      </div>

      <div class="header-actions">
        <button
          mat-stroked-button
          color="primary"
          (click)="onImportFeed.emit()"
          class="import-btn"
        >
          <mat-icon>sync_alt</mat-icon>
          Import Feed
        </button>

        <button
          mat-raised-button
          color="primary"
          (click)="onNewBooking.emit()"
          class="new-booking-btn"
        >
          <mat-icon>add</mat-icon>
          New Booking
        </button>
      </div>
    </header>
  `,
  styles: [
    `
      .header-container {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-md);
        padding: var(--space-md) var(--space-lg);
        background: var(--card-bg);
        border-bottom: 1px solid var(--border-color);
        box-shadow: var(--shadow-sm);
      }

      .property-info {
        display: flex;
        align-items: center;
      }

      .title-row {
        display: flex;
        align-items: center;
        gap: var(--space-md);
      }

      .property-icon {
        width: 44px;
        height: 44px;
        border-radius: var(--radius-md);
        background: var(--primary-light);
        color: var(--primary);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .property-name {
        font-size: 1.35rem;
        font-weight: 700;
        color: var(--text-main);
        line-height: 1.2;
      }

      .property-meta {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        font-size: 0.875rem;
        color: var(--text-muted);
        margin-top: 2px;
      }

      .meta-item {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .inline-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .meta-divider {
        color: #cbd5e1;
      }

      .rate-tag strong {
        color: var(--primary-text);
        font-weight: 600;
      }

      .month-navigation {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        background: var(--surface-bg);
        padding: 4px 8px;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
      }

      .current-month-label {
        font-size: 1.05rem;
        font-weight: 600;
        min-width: 150px;
        text-align: center;
        color: var(--text-main);
      }

      .today-btn {
        border-radius: var(--radius-sm) !important;
        height: 32px !important;
        line-height: 32px !important;
        font-size: 0.85rem !important;
        margin-left: 4px;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: var(--space-md);
      }

      .import-btn, .new-booking-btn {
        border-radius: var(--radius-md) !important;
        height: 40px !important;
        font-weight: 600 !important;
      }

      .new-booking-btn {
        background-color: var(--primary) !important;
      }
    `,
  ],
})
export class PropertyHeaderComponent {
  @Input({ required: true }) propertyName: string = 'Property';
  @Input({ required: true }) baseRate: number = 0;
  @Input({ required: true }) monthTitle: string = '';

  @Output() onPrevMonth = new EventEmitter<void>();
  @Output() onNextMonth = new EventEmitter<void>();
  @Output() onToday = new EventEmitter<void>();
  @Output() onImportFeed = new EventEmitter<void>();
  @Output() onNewBooking = new EventEmitter<void>();
}
