import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PropertyHeaderComponent } from '../../shared/components/property-header/property-header.component';
import { LegendBarComponent } from '../../shared/components/legend-bar/legend-bar.component';
import { ToastNotificationComponent } from '../../shared/components/toast-notification/toast-notification.component';
import { CalendarGridComponent } from './calendar-grid/calendar-grid.component';
import { ActionDrawerComponent } from './action-drawer/action-drawer.component';
import { ImportDialogComponent } from '../reservation-import/import-dialog/import-dialog.component';
import { CalendarStore } from '../../stores/calendar.store';

@Component({
  selector: 'app-calendar-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    PropertyHeaderComponent,
    LegendBarComponent,
    ToastNotificationComponent,
    CalendarGridComponent,
    ActionDrawerComponent,
  ],
  template: `
    <div class="dashboard-layout">
      <!-- Property & Calendar Header Banner -->
      <app-property-header
        [propertyName]="store.property()?.name || 'Seaside Cottage'"
        [baseRate]="store.property()?.baseRate || 120"
        [monthTitle]="store.monthTitle()"
        (onPrevMonth)="store.prevMonth()"
        (onNextMonth)="store.nextMonth()"
        (onToday)="store.goToToday()"
        (onImportFeed)="openImportDialog()"
        (onNewBooking)="openNewBookingDrawer()"
      ></app-property-header>

      <!-- Calendar Status Key Bar -->
      <app-legend-bar></app-legend-bar>

      <!-- Main Calendar Grid View -->
      <main class="calendar-container">
        <app-calendar-grid
          [calendarDays]="store.calendarDays()"
          (onDayClick)="store.handleDayClick($event)"
        ></app-calendar-grid>
      </main>

      <!-- Slide-Out Action Drawer -->
      <app-action-drawer
        [activeDrawer]="store.activeDrawer()"
        [dateRange]="store.selectedRange()"
        [nightsCount]="store.selectedNightsCount()"
        [dateRangeText]="store.formattedSelectedRange()"
        [errorMessage]="store.errorMessage()"
        [isLoading]="store.isLoading()"
        (onClose)="store.closeDrawer()"
        (onCreateBooking)="handleCreateBooking($event)"
        (onSetPrice)="handleSetPrice($event)"
        (onBlockDates)="handleBlockDates($event)"
        (onUnblockDates)="handleUnblockDates($event)"
      ></app-action-drawer>

      <!-- Toast Feedback Notifications -->
      <app-toast-notification
        [message]="store.toastMessage()?.message || null"
        [type]="store.toastMessage()?.type || 'info'"
        (onDismiss)="store.dismissToast()"
      ></app-toast-notification>
    </div>
  `,
  styles: [
    `
      .dashboard-layout {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background-color: var(--surface-bg);
      }

      .calendar-container {
        flex: 1;
        max-width: 1400px;
        width: 100%;
        margin: 0 auto;
      }
    `,
  ],
})
export class CalendarDashboardComponent {
  readonly store = inject(CalendarStore);
  private dialog = inject(MatDialog);

  openImportDialog(): void {
    this.dialog.open(ImportDialogComponent, {
      width: '650px',
      disableClose: false,
    });
  }

  openNewBookingDrawer(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    this.store.selectRangeManually(todayStr, tomorrowStr);
    this.store.openDrawer('booking');
  }

  handleCreateBooking(event: { guestName: string; checkIn: string; checkOut: string }): void {
    this.store.createBooking(event.guestName, event.checkIn, event.checkOut);
  }

  handleSetPrice(event: { startDate: string; endDate: string; price: number }): void {
    this.store.setPriceOverride(event.startDate, event.endDate, event.price);
  }

  handleBlockDates(event: { startDate: string; endDate: string; reason: string }): void {
    this.store.blockDates(event.startDate, event.endDate, event.reason);
  }

  handleUnblockDates(event: { startDate: string; endDate: string }): void {
    this.store.unblockDates(event.startDate, event.endDate);
  }
}
