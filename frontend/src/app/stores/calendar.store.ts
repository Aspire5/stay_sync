import { Injectable, computed, inject, signal } from '@angular/core';
import {
  CalendarDay,
  DateRangeSelection,
  ImportSummary,
  Property,
  Unit,
  UnitReservation,
} from '../models/calendar.model';
import { CalendarMockService } from '../services/calendar-mock.service';

export type DrawerState = 'none' | 'actions' | 'booking' | 'pricing' | 'block';

@Injectable({
  providedIn: 'root',
})
export class CalendarStore {
  private mockService = inject(CalendarMockService);

  // State Signals
  readonly property = signal<Property | null>(null);
  readonly unit = signal<Unit | null>(null);
  readonly currentMonth = signal<Date>(new Date(2026, 7, 1)); // Default August 2026
  readonly calendarDays = signal<CalendarDay[]>([]);
  readonly selectedRange = signal<DateRangeSelection>({ start: null, end: null });
  readonly activeDrawer = signal<DrawerState>('none');
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly toastMessage = signal<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  readonly lastImportSummary = signal<ImportSummary | null>(null);

  // Computed Signals
  readonly monthTitle = computed(() => {
    const d = this.currentMonth();
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  });

  readonly selectedNightsCount = computed(() => {
    const { start, end } = this.selectedRange();
    if (!start || !end) return 0;
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays;
  });

  readonly formattedSelectedRange = computed(() => {
    const { start, end } = this.selectedRange();
    if (!start) return 'No dates selected';
    if (!end || start === end) return this.formatDisplayDate(start);
    return `${this.formatDisplayDate(start)} – ${this.formatDisplayDate(end)}`;
  });

  readonly selectedDaysSummary = computed(() => {
    const { start, end } = this.selectedRange();
    if (!start) return [];
    const days = this.calendarDays();
    const effectiveEnd = end || start;
    return days.filter((d) => d.date >= start && d.date <= effectiveEnd);
  });

  /**
   * Returns unique active reservations overlapping the selected date range
   */
  readonly selectedReservations = computed(() => {
    const { start, end } = this.selectedRange();
    if (!start) return [];
    const effectiveEnd = end || start;

    const resMap = new Map<string, UnitReservation>();
    for (const day of this.calendarDays()) {
      if (day.date >= start && day.date <= effectiveEnd && day.reservations) {
        for (const res of day.reservations) {
          if (res.status === 'ACTIVE') {
            resMap.set(res.id, res);
          }
        }
      }
    }
    return Array.from(resMap.values());
  });

  constructor() {
    this.initStore();
  }

  initStore(): void {
    this.isLoading.set(true);
    this.mockService.getProperty().subscribe((prop) => this.property.set(prop));
    this.mockService.getUnit().subscribe((unit) => this.unit.set(unit));
    this.refreshCalendar();
  }

  refreshCalendar(): void {
    this.isLoading.set(true);
    const month = this.currentMonth();
    this.mockService
      .getCalendarDays(month.getFullYear(), month.getMonth())
      .subscribe((days) => {
        this.updateDaysWithSelection(days);
        this.isLoading.set(false);
      });
  }

  prevMonth(): void {
    const current = this.currentMonth();
    this.currentMonth.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
    this.clearSelection();
    this.refreshCalendar();
  }

  nextMonth(): void {
    const current = this.currentMonth();
    this.currentMonth.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
    this.clearSelection();
    this.refreshCalendar();
  }

  goToToday(): void {
    const today = new Date();
    this.currentMonth.set(new Date(today.getFullYear(), today.getMonth(), 1));
    this.clearSelection();
    this.refreshCalendar();
  }

  handleDayClick(dateStr: string): void {
    const { start, end } = this.selectedRange();

    if (!start || (start && end)) {
      this.selectedRange.set({ start: dateStr, end: null });
      this.activeDrawer.set('actions');
    } else {
      if (dateStr >= start) {
        this.selectedRange.set({ start, end: dateStr });
      } else {
        this.selectedRange.set({ start: dateStr, end: start });
      }
      this.activeDrawer.set('actions');
    }

    this.updateDaysWithSelection(this.calendarDays());
  }

  selectRangeManually(start: string, end: string): void {
    this.selectedRange.set({ start, end });
    this.activeDrawer.set('actions');
    this.updateDaysWithSelection(this.calendarDays());
  }

  openDrawer(drawer: DrawerState): void {
    this.activeDrawer.set(drawer);
  }

  closeDrawer(): void {
    this.activeDrawer.set('none');
  }

  clearSelection(): void {
    this.selectedRange.set({ start: null, end: null });
    this.activeDrawer.set('none');
    this.errorMessage.set(null);
    this.updateDaysWithSelection(this.calendarDays());
  }

  createBooking(guestName: string, checkIn: string, checkOut: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.mockService.createBooking(guestName, checkIn, checkOut).subscribe((res) => {
      this.isLoading.set(false);
      if (res.success) {
        this.showToast(`Booking successfully created for ${guestName}!`, 'success');
        this.clearSelection();
        this.refreshCalendar();
      } else {
        this.errorMessage.set(res.error || 'Failed to create booking.');
      }
    });
  }

  cancelBooking(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.mockService.cancelReservation(id).subscribe((res) => {
      this.isLoading.set(false);
      if (res.success) {
        this.showToast('Reservation cancelled successfully.', 'info');
        this.clearSelection();
        this.refreshCalendar();
      } else {
        this.errorMessage.set('Failed to cancel reservation.');
      }
    });
  }

  setPriceOverride(startDate: string, endDate: string, price: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.mockService.setPriceOverride(startDate, endDate, price).subscribe((res) => {
      this.isLoading.set(false);
      if (res.success) {
        this.showToast(`Nightly rate set to £${price} for selected range!`, 'success');
        this.clearSelection();
        this.refreshCalendar();
      } else {
        this.errorMessage.set('Failed to set price override.');
      }
    });
  }

  blockDates(startDate: string, endDate: string, reason: string = 'Blocked'): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.mockService.blockDateRange(startDate, endDate, reason).subscribe((res) => {
      this.isLoading.set(false);
      if (res.success) {
        this.showToast(`Dates blocked from ${startDate} to ${endDate}.`, 'info');
        this.clearSelection();
        this.refreshCalendar();
      } else {
        this.errorMessage.set(res.error || 'Failed to block dates.');
      }
    });
  }

  unblockDates(startDate: string, endDate: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.mockService.unblockDateRange(startDate, endDate).subscribe((res) => {
      this.isLoading.set(false);
      if (res.success) {
        this.showToast(`Blocked dates released successfully!`, 'success');
        this.clearSelection();
        this.refreshCalendar();
      } else {
        this.errorMessage.set('Failed to unblock dates.');
      }
    });
  }

  importChannelFeed(onComplete?: (summary: ImportSummary) => void): void {
    this.isLoading.set(true);
    this.mockService.importChannelFeed().subscribe((summary) => {
      this.isLoading.set(false);
      this.lastImportSummary.set(summary);
      this.showToast(
        `Channel feed imported: ${summary.importedCount} new, ${summary.duplicatesSkipped} duplicates skipped, ${summary.conflictsDetected} conflicts.`,
        summary.conflictsDetected > 0 ? 'info' : 'success'
      );
      this.refreshCalendar();
      if (onComplete) onComplete(summary);
    });
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.toastMessage.set({ message, type });
    setTimeout(() => {
      if (this.toastMessage()?.message === message) {
        this.dismissToast();
      }
    }, 4500);
  }

  dismissToast(): void {
    this.toastMessage.set(null);
  }

  private updateDaysWithSelection(days: CalendarDay[]): void {
    const { start, end } = this.selectedRange();
    const updated = days.map((d) => {
      const isStart = start === d.date;
      const isEnd = end === d.date;
      const inRange = !!(start && end && d.date >= start && d.date <= end);
      const isSel = isStart || isEnd || inRange;

      return {
        ...d,
        isSelected: isSel,
        isRangeStart: isStart,
        isRangeEnd: isEnd,
        isInRange: inRange,
      };
    });

    this.calendarDays.set(updated);
  }

  private formatDisplayDate(isoStr: string): string {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length !== 3) return isoStr;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
}
