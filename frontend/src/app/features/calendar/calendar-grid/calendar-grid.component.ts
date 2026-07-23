import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CalendarDay } from '../../../models/calendar.model';

@Component({
  selector: 'app-calendar-grid',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="calendar-wrapper">
      <!-- Days of Week Header -->
      <div class="weekdays-header">
        <div *ngFor="let day of weekDays" class="weekday-cell">
          {{ day }}
        </div>
      </div>

      <!-- Calendar Days Grid -->
      <div class="days-grid">
        <div
          *ngFor="let day of calendarDays"
          class="day-cell"
          [ngClass]="{
            'other-month': !day.isCurrentMonth,
            'today': day.isToday,
            'status-available': day.status === 'AVAILABLE',
            'status-booked': day.status === 'BOOKED',
            'status-blocked': day.status === 'BLOCKED',
            'selected': day.isSelected,
            'range-start': day.isRangeStart,
            'range-end': day.isRangeEnd,
            'in-range': day.isInRange
          }"
          (click)="onDayClick.emit(day.date)"
        >
          <!-- Top Row: Date Number & Badges -->
          <div class="cell-top">
            <span class="day-number" [class.today-badge]="day.isToday">
              {{ day.dayNumber }}
            </span>

            <span
              class="price-badge"
              [class.price-override]="day.hasPriceOverride"
              title="{{ day.hasPriceOverride ? 'Custom Rate Override' : 'Base Rate' }}"
            >
              £{{ day.price }}
              <span *ngIf="day.hasPriceOverride" class="override-dot"></span>
            </span>
          </div>

          <!-- Middle / Bottom Content: Status & Guest Info -->
          <div class="cell-body">
            <ng-container [ngSwitch]="day.status">
              <div *ngSwitchCase="'BOOKED'" class="status-content booked">
                <mat-icon class="status-icon">person</mat-icon>
                <span class="guest-name" title="{{ day.reservation?.guestName }}">
                  {{ day.reservation?.guestName || 'Booked' }}
                </span>
              </div>

              <div *ngSwitchCase="'BLOCKED'" class="status-content blocked">
                <mat-icon class="status-icon">block</mat-icon>
                <span class="blocked-label">Blocked</span>
              </div>

              <div *ngSwitchCase="'AVAILABLE'" class="status-content available">
                <span class="available-dot"></span>
                <span class="available-label">Available</span>
              </div>
            </ng-container>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .calendar-wrapper {
        background: var(--card-bg);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--border-color);
        overflow: hidden;
        margin: var(--space-md);
      }

      .weekdays-header {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        background: var(--surface-bg);
        border-bottom: 1px solid var(--border-color);
      }

      .weekday-cell {
        padding: 12px;
        text-align: center;
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .days-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        background: var(--border-color);
        gap: 1px;
      }

      .day-cell {
        background: #ffffff;
        min-height: 105px;
        padding: 8px 10px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        cursor: pointer;
        transition: var(--transition-fast);
        position: relative;
        user-select: none;
      }

      .day-cell:hover {
        background: #f1f5f9;
        z-index: 2;
      }

      .day-cell.other-month {
        background: #f8fafc;
        opacity: 0.5;
      }

      /* Selection & Range Styles */
      .day-cell.selected {
        background: var(--primary-light) !important;
      }

      .day-cell.in-range {
        background: #eef2ff !important;
      }

      .day-cell.range-start {
        border-top-left-radius: var(--radius-md);
        border-bottom-left-radius: var(--radius-md);
        outline: 2px solid var(--primary);
      }

      .day-cell.range-end {
        border-top-right-radius: var(--radius-md);
        border-bottom-right-radius: var(--radius-md);
        outline: 2px solid var(--primary);
      }

      .day-cell.today {
        box-shadow: inset 0 0 0 2px var(--primary);
      }

      /* Cell Top Row */
      .cell-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .day-number {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--text-main);
        width: 26px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }

      .day-number.today-badge {
        background: var(--primary);
        color: #ffffff;
      }

      .price-badge {
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--text-muted);
        background: var(--surface-bg);
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        gap: 3px;
      }

      .price-badge.price-override {
        background: var(--warning-light);
        color: var(--warning-text);
        border: 1px solid #fcd34d;
      }

      .override-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--warning);
      }

      /* Cell Body & Status Badges */
      .cell-body {
        margin-top: 6px;
      }

      .status-content {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 6px;
        border-radius: var(--radius-sm);
        font-size: 0.78rem;
        font-weight: 500;
      }

      .status-content.booked {
        background: var(--danger-light);
        color: var(--danger-text);
        border: 1px solid #fca5a5;
      }

      .status-content.blocked {
        background: var(--blocked-light);
        color: var(--blocked-text);
        border: 1px solid #cbd5e1;
        background-image: repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 5px,
          rgba(0, 0, 0, 0.03) 5px,
          rgba(0, 0, 0, 0.03) 10px
        );
      }

      .status-content.available {
        color: var(--success-text);
      }

      .available-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--success);
      }

      .available-label {
        font-size: 0.75rem;
        color: var(--text-muted);
      }

      .guest-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 600;
      }

      .status-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    `,
  ],
})
export class CalendarGridComponent {
  @Input({ required: true }) calendarDays: CalendarDay[] = [];
  @Output() onDayClick = new EventEmitter<string>();

  readonly weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
}
