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
            'selected-single': day.isSelected && !day.isInRange,
            'range-start': day.isRangeStart,
            'range-end': day.isRangeEnd,
            'in-range': day.isInRange
          }"
          (click)="onDayClick.emit(day.date)"
        >
          <!-- Top Row: Date Number & Price Tag -->
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

          <!-- Cell Body: Status Pill & Unit Availability -->
          <div class="cell-body">
            <ng-container [ngSwitch]="day.status">
              <div *ngSwitchCase="'BOOKED'" class="status-pill booked">
                <mat-icon class="status-icon">person</mat-icon>
                <span class="guest-name" title="{{ day.reservation?.guestName }}">
                  {{ day.reservation?.guestName || 'Booked' }}
                </span>
              </div>

              <div *ngSwitchCase="'BLOCKED'" class="status-pill blocked">
                <mat-icon class="status-icon">block</mat-icon>
                <span class="blocked-label">Blocked</span>
              </div>

              <div *ngSwitchCase="'AVAILABLE'" class="status-pill available">
                <span class="available-dot"></span>
                <span class="available-label">
                  {{ day.availableUnits }} {{ day.availableUnits === 1 ? 'Unit' : 'Units' }} Available
                </span>
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
        box-shadow: var(--shadow-md);
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
        background: #f1f5f9;
        gap: 1px;
      }

      /* Base Day Cell */
      .day-cell {
        background: #ffffff;
        min-height: 110px;
        padding: 8px 10px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        cursor: pointer;
        transition: transform 0.1s ease, background-color 0.15s ease, box-shadow 0.15s ease;
        position: relative;
        user-select: none;
      }

      .day-cell:hover {
        opacity: 0.95;
        z-index: 2;
      }

      .day-cell.other-month {
        opacity: 0.45;
      }

      /* Full Box Background Color for Booked State */
      .day-cell.status-booked:not(.range-start):not(.range-end) {
        background-color: #fee2e2 !important;
        border-left: 3.5px solid var(--danger) !important;
      }

      /* Full Box Background Color for Blocked State */
      .day-cell.status-blocked:not(.range-start):not(.range-end) {
        background-color: #f1f5f9 !important;
        border-left: 3.5px solid var(--blocked) !important;
        background-image: repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 8px,
          rgba(0, 0, 0, 0.04) 8px,
          rgba(0, 0, 0, 0.04) 16px
        );
      }

      /* Single Date Clicked Highlight Ring (No ugly box outlines) */
      .day-cell.selected-single {
        box-shadow: inset 0 0 0 2.5px var(--primary), var(--shadow-sm) !important;
        border-radius: 10px;
        transform: scale(0.98);
        z-index: 3;
      }

      /* Continuous Range Ribbon Selection Styling */
      .day-cell.in-range:not(.range-start):not(.range-end) {
        background-color: #e0e7ff !important;
        color: #3730a3 !important;
        box-shadow: none !important;
        border: none !important;
      }

      .day-cell.in-range:not(.range-start):not(.range-end) .day-number {
        color: #3730a3 !important;
      }

      .day-cell.in-range:not(.range-start):not(.range-end) .available-label {
        color: #4338ca !important;
      }

      .day-cell.range-start {
        background-color: var(--primary) !important;
        color: #ffffff !important;
        border-top-left-radius: 12px !important;
        border-bottom-left-radius: 12px !important;
        box-shadow: var(--shadow-md) !important;
        z-index: 3;
      }

      .day-cell.range-end {
        background-color: var(--primary) !important;
        color: #ffffff !important;
        border-top-right-radius: 12px !important;
        border-bottom-right-radius: 12px !important;
        box-shadow: var(--shadow-md) !important;
        z-index: 3;
      }

      /* Adapt Text and Badges on Range Start & End Caps */
      .day-cell.range-start .day-number,
      .day-cell.range-end .day-number {
        color: #ffffff !important;
      }

      .day-cell.range-start .price-badge,
      .day-cell.range-end .price-badge {
        background: rgba(255, 255, 255, 0.25) !important;
        color: #ffffff !important;
        border-color: rgba(255, 255, 255, 0.3) !important;
      }

      .day-cell.range-start .available-label,
      .day-cell.range-end .available-label {
        color: rgba(255, 255, 255, 0.9) !important;
        font-weight: 600;
      }

      .day-cell.range-start .available-dot,
      .day-cell.range-end .available-dot {
        background: #ffffff !important;
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
        font-weight: 700;
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
        background: rgba(255, 255, 255, 0.85);
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        gap: 3px;
        border: 1px solid rgba(0, 0, 0, 0.06);
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

      /* Cell Body & Status Pills */
      .cell-body {
        margin-top: 6px;
      }

      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 4px 8px;
        border-radius: var(--radius-sm);
        font-size: 0.78rem;
        font-weight: 600;
        width: 100%;
      }

      .status-pill.booked {
        background: #ffffff;
        color: var(--danger-text);
        border: 1px solid #fca5a5;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      }

      .status-pill.blocked {
        background: #ffffff;
        color: var(--blocked-text);
        border: 1px solid #cbd5e1;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      }

      .status-pill.available {
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
        font-weight: 500;
      }

      .guest-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 600;
      }

      .status-icon {
        font-size: 16px !important;
        width: 16px !important;
        height: 16px !important;
        line-height: 16px !important;
      }
    `,
  ],
})
export class CalendarGridComponent {
  @Input({ required: true }) calendarDays: CalendarDay[] = [];
  @Output() onDayClick = new EventEmitter<string>();

  readonly weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
}
