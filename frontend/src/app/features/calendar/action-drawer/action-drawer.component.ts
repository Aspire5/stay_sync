import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { DateRangeSelection, UnitReservation } from '../../../models/calendar.model';
import { DrawerState } from '../../../stores/calendar.store';

@Component({
  selector: 'app-action-drawer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTabsModule,
  ],
  template: `
    <div class="drawer-backdrop" *ngIf="activeDrawer !== 'none'" (click)="onClose.emit()"></div>

    <aside class="drawer-container" [class.open]="activeDrawer !== 'none'">
      <!-- Drawer Header -->
      <div class="drawer-header">
        <div>
          <h2 class="drawer-title">Manage Selected Dates</h2>
          <p class="drawer-subtitle">
            <span>{{ dateRangeText }}</span>
            <span *ngIf="nightsCount > 0" class="nights-badge">
              {{ nightsCount }} {{ nightsCount === 1 ? 'night' : 'nights' }}
            </span>
          </p>
        </div>

        <button mat-icon-button (click)="onClose.emit()" title="Close Drawer">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Error Banner (Friendly Validation Feedback) -->
      <div *ngIf="errorMessage" class="error-banner">
        <mat-icon class="error-icon">warning</mat-icon>
        <div class="error-content">
          <strong>Validation / Clash Alert</strong>
          <p>{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Action Tabs -->
      <mat-tab-group
        [selectedIndex]="activeTabIndex"
        (selectedIndexChange)="onTabChange($event)"
        class="custom-tabs"
        mat-stretch-tabs="false"
      >
        <!-- Tab 1: Booking Management -->
        <mat-tab label="Booking">
          <div class="drawer-form">
            <!-- Active Bookings Read-Only Cards -->
            <div *ngIf="activeBookings.length > 0" class="existing-cards-section">
              <h3 class="section-heading">Existing Active Reservation</h3>
              <div *ngFor="let res of activeBookings" class="detail-card booking-card">
                <div class="card-header">
                  <span class="card-title">
                    <mat-icon class="inline-icon">person</mat-icon> {{ res.guestName }}
                  </span>
                  <span class="badge source-badge">{{ res.source }}</span>
                </div>
                <div class="card-body">
                  <div class="info-row">
                    <span>Check In:</span> <strong>{{ res.checkIn }}</strong>
                  </div>
                  <div class="info-row">
                    <span>Check Out:</span> <strong>{{ res.checkOut }} (Morning)</strong>
                  </div>
                  <div class="info-row">
                    <span>Status:</span> <strong class="text-success">{{ res.status }}</strong>
                  </div>
                </div>
                <div class="card-actions">
                  <button
                    mat-stroked-button
                    color="warn"
                    type="button"
                    (click)="onCancelBooking.emit(res.id)"
                    [disabled]="isLoading"
                    class="full-width"
                  >
                    <mat-icon>cancel</mat-icon> Cancel Existing Booking
                  </button>
                </div>
              </div>
            </div>

            <!-- Fully Booked Notice if 0 units available -->
            <div *ngIf="availableUnits === 0 && activeBookings.length > 0" class="info-notice alert">
              <mat-icon class="info-icon">info</mat-icon>
              <span>Fully Booked — All units occupied for this date range.</span>
            </div>

            <!-- New Booking Form (Only if unit available) -->
            <form *ngIf="availableUnits > 0" [formGroup]="bookingForm" (ngSubmit)="submitBooking()" class="form-section">
              <h3 class="section-heading">
                Create Booking ({{ availableUnits }} {{ availableUnits === 1 ? 'Unit' : 'Units' }} Available)
              </h3>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Guest Name</mat-label>
                <input
                  matInput
                  formControlName="guestName"
                  placeholder="e.g. Sarah Connor"
                  required
                />
                <mat-icon matSuffix class="field-icon">person_outline</mat-icon>
                <mat-error *ngIf="bookingForm.get('guestName')?.hasError('required')">
                  Guest name is required
                </mat-error>
              </mat-form-field>

              <div class="date-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Check In (Inclusive)</mat-label>
                  <input matInput type="date" formControlName="checkIn" required />
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Check Out (Exclusive)</mat-label>
                  <input matInput type="date" formControlName="checkOut" required />
                </mat-form-field>
              </div>

              <div class="summary-box">
                <div class="summary-row">
                  <span>Checkout Convention:</span>
                  <strong>Exclusive Check-out</strong>
                </div>
                <div class="summary-row">
                  <span>Guest Departs:</span>
                  <strong>{{ bookingForm.value.checkOut || 'Selected Date' }} morning</strong>
                </div>
              </div>

              <div class="drawer-footer">
                <button mat-stroked-button type="button" (click)="onClose.emit()">
                  Cancel
                </button>
                <button
                  mat-raised-button
                  color="primary"
                  type="submit"
                  [disabled]="bookingForm.invalid || isLoading"
                  class="primary-submit-btn"
                >
                  Confirm New Booking
                </button>
              </div>
            </form>
          </div>
        </mat-tab>

        <!-- Tab 2: Override Price -->
        <mat-tab label="Set Custom Rate">
          <form [formGroup]="pricingForm" (ngSubmit)="submitPricing()" class="drawer-form">
            <div class="form-section">
              <div class="date-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Start Date</mat-label>
                  <input matInput type="date" formControlName="startDate" required />
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>End Date</mat-label>
                  <input matInput type="date" formControlName="endDate" required />
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width price-field">
                <mat-label>Nightly Rate (£ GBP)</mat-label>
                <span matTextPrefix class="currency-prefix">£&nbsp;</span>
                <input
                  matInput
                  type="number"
                  formControlName="price"
                  placeholder="150"
                  min="1"
                  required
                />
                <mat-error *ngIf="pricingForm.get('price')?.hasError('min')">
                  Price must be greater than £0
                </mat-error>
              </mat-form-field>
            </div>

            <div class="drawer-footer">
              <button mat-stroked-button type="button" (click)="onClose.emit()">
                Cancel
              </button>
              <button
                mat-raised-button
                color="primary"
                type="submit"
                [disabled]="pricingForm.invalid || isLoading"
                class="primary-submit-btn"
              >
                Apply Custom Rate
              </button>
            </div>
          </form>
        </mat-tab>

        <!-- Tab 3: Block / Unblock Range -->
        <mat-tab label="Block / Unblock">
          <div class="drawer-form">
            <!-- STATE A: IF ALREADY BLOCKED -> Show ONLY Block Details Card & Unblock Button -->
            <div *ngIf="activeBlocks.length > 0" class="existing-cards-section">
              <h3 class="section-heading">Active Block Details</h3>
              <div *ngFor="let block of activeBlocks" class="detail-card block-card">
                <div class="card-header">
                  <span class="card-title">
                    <mat-icon class="inline-icon">block</mat-icon> {{ block.guestName }}
                  </span>
                  <span class="badge block-badge">BLOCKED</span>
                </div>
                <div class="card-body">
                  <div class="info-row">
                    <span>Check In:</span> <strong>{{ block.checkIn }}</strong>
                  </div>
                  <div class="info-row">
                    <span>Check Out:</span> <strong>{{ block.checkOut }}</strong>
                  </div>
                </div>
                <div class="card-actions">
                  <button
                    mat-raised-button
                    color="warn"
                    type="button"
                    (click)="submitUnblock()"
                    [disabled]="isLoading"
                    class="full-width primary-warn-btn"
                  >
                    <mat-icon>lock_open</mat-icon> Unblock Selected Nights
                  </button>
                </div>
              </div>
            </div>

            <!-- STATE B: IF UNBLOCKED -> Show ONLY Block Dates Form & Block Button -->
            <form *ngIf="activeBlocks.length === 0" [formGroup]="blockForm" class="form-section">
              <h3 class="section-heading">Block Date Range</h3>
              <p class="section-desc">
                Select a single date or date range to block nights from being booked.
              </p>

              <div class="date-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Start Date</mat-label>
                  <input matInput type="date" formControlName="startDate" required />
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>End Date</mat-label>
                  <input matInput type="date" formControlName="endDate" required />
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Block Reason / Note</mat-label>
                <input
                  matInput
                  formControlName="reason"
                  placeholder="e.g. Maintenance & Renovations"
                />
                <mat-icon matSuffix class="field-icon">sticky_note_2</mat-icon>
              </mat-form-field>

              <div class="drawer-footer single-action">
                <button
                  mat-raised-button
                  color="warn"
                  type="button"
                  (click)="submitBlock()"
                  [disabled]="blockForm.invalid || isLoading"
                  class="primary-warn-btn"
                >
                  <mat-icon>block</mat-icon> Block Dates
                </button>
              </div>
            </form>
          </div>
        </mat-tab>
      </mat-tab-group>
    </aside>
  `,
  styles: [
    `
      .drawer-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(15, 23, 42, 0.4);
        backdrop-filter: blur(2px);
        z-index: 998;
      }

      .drawer-container {
        position: fixed;
        top: 0;
        right: -480px;
        width: 460px;
        max-width: 100vw;
        height: 100vh;
        background: #ffffff;
        box-shadow: var(--shadow-xl);
        z-index: 999;
        display: flex;
        flex-direction: column;
        transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .drawer-container.open {
        right: 0;
      }

      .drawer-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        padding: var(--space-lg);
        border-bottom: 1px solid var(--border-color);
        background: var(--surface-bg);
      }

      .drawer-title {
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--text-main);
      }

      .drawer-subtitle {
        font-size: 0.875rem;
        color: var(--text-muted);
        margin-top: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .nights-badge {
        background: var(--primary-light);
        color: var(--primary-text);
        font-size: 0.75rem;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: var(--radius-sm);
      }

      /* Error Banner */
      .error-banner {
        display: flex;
        align-items: flex-start;
        gap: var(--space-md);
        background: var(--danger-light);
        border-left: 4px solid var(--danger);
        padding: var(--space-md);
        margin: var(--space-md) var(--space-md) 0 var(--space-md);
        border-radius: var(--radius-sm);
      }

      .error-icon {
        color: var(--danger);
        font-size: 20px;
      }

      .error-content strong {
        display: block;
        color: var(--danger-text);
        font-size: 0.85rem;
      }

      .error-content p {
        font-size: 0.825rem;
        color: var(--danger-text);
        margin-top: 2px;
      }

      .custom-tabs {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
      }

      ::ng-deep .custom-tabs .mat-mdc-tab-header {
        border-bottom: 1px solid var(--border-color);
        background: #ffffff;
      }

      ::ng-deep .custom-tabs .mat-mdc-tab .mdc-tab__text-label {
        font-weight: 600 !important;
        font-size: 0.85rem !important;
      }

      .drawer-form {
        padding: var(--space-lg);
        display: flex;
        flex-direction: column;
        gap: var(--space-lg);
      }

      .existing-cards-section {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
      }

      .section-heading {
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--text-main);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .detail-card {
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: var(--space-md);
        background: var(--surface-bg);
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
      }

      .detail-card.booking-card {
        border-left: 4px solid var(--danger);
      }

      .detail-card.block-card {
        border-left: 4px solid var(--blocked);
      }

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .card-title {
        font-weight: 700;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .inline-icon {
        font-size: 18px !important;
        width: 18px !important;
        height: 18px !important;
      }

      .badge {
        font-size: 0.7rem;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        text-transform: uppercase;
      }

      .source-badge {
        background: var(--primary-light);
        color: var(--primary-text);
      }

      .block-badge {
        background: var(--blocked-light);
        color: var(--blocked-text);
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        color: var(--text-muted);
      }

      .info-row strong {
        color: var(--text-main);
      }

      .info-notice {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-md);
        border-radius: var(--radius-md);
        font-size: 0.85rem;
        font-weight: 600;
      }

      .info-notice.alert {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fca5a5;
      }

      .info-icon {
        font-size: 20px;
      }

      .form-section {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
      }

      .full-width {
        width: 100%;
      }

      .date-row {
        display: flex;
        gap: var(--space-md);
      }

      .half-width {
        flex: 1;
      }

      .currency-prefix {
        font-weight: 700;
        font-size: 1rem;
        color: var(--text-main);
      }

      .field-icon {
        color: var(--text-muted);
      }

      .summary-box {
        background: var(--surface-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: var(--space-md);
        font-size: 0.85rem;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        color: var(--text-muted);
      }

      .summary-row strong {
        color: var(--text-main);
      }

      .section-desc {
        font-size: 0.875rem;
        color: var(--text-muted);
        line-height: 1.4;
      }

      .drawer-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: var(--space-md);
        padding-top: var(--space-md);
        border-top: 1px solid var(--border-color);
      }

      .drawer-footer.single-action {
        justify-content: flex-end;
      }

      .primary-submit-btn {
        background-color: var(--primary) !important;
        font-weight: 600 !important;
      }

      .primary-warn-btn {
        background-color: var(--danger) !important;
        color: #ffffff !important;
        font-weight: 600 !important;
      }
    `,
  ],
})
export class ActionDrawerComponent implements OnChanges {
  private fb = inject(FormBuilder);

  @Input() activeDrawer: DrawerState = 'none';
  @Input() dateRange: DateRangeSelection = { start: null, end: null };
  @Input() nightsCount: number = 0;
  @Input() dateRangeText: string = '';
  @Input() errorMessage: string | null = null;
  @Input() isLoading: boolean = false;
  @Input() existingReservations: UnitReservation[] = [];
  @Input() availableUnits: number = 1;

  @Output() onClose = new EventEmitter<void>();
  @Output() onCreateBooking = new EventEmitter<{
    guestName: string;
    checkIn: string;
    checkOut: string;
  }>();
  @Output() onCancelBooking = new EventEmitter<string>();
  @Output() onSetPrice = new EventEmitter<{
    startDate: string;
    endDate: string;
    price: number;
  }>();
  @Output() onBlockDates = new EventEmitter<{
    startDate: string;
    endDate: string;
    reason: string;
  }>();
  @Output() onUnblockDates = new EventEmitter<{
    startDate: string;
    endDate: string;
  }>();

  activeTabIndex = 0;

  bookingForm: FormGroup = this.fb.group({
    guestName: ['', Validators.required],
    checkIn: ['', Validators.required],
    checkOut: ['', Validators.required],
  });

  pricingForm: FormGroup = this.fb.group({
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    price: [150, [Validators.required, Validators.min(1)]],
  });

  blockForm: FormGroup = this.fb.group({
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    reason: ['Owner Block'],
  });

  get activeBookings(): UnitReservation[] {
    return this.existingReservations.filter((r) => r.type === 'BOOKING');
  }

  get activeBlocks(): UnitReservation[] {
    return this.existingReservations.filter((r) => r.type === 'BLOCK');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dateRange'] && this.dateRange.start) {
      const start = this.dateRange.start;
      const end = this.dateRange.end || this.addDays(start, 1);

      this.bookingForm.patchValue({ checkIn: start, checkOut: end });
      this.pricingForm.patchValue({ startDate: start, endDate: this.dateRange.end || start });
      this.blockForm.patchValue({ startDate: start, endDate: end });
    }

    if (changes['activeDrawer']) {
      switch (this.activeDrawer) {
        case 'booking':
          this.activeTabIndex = 0;
          break;
        case 'pricing':
          this.activeTabIndex = 1;
          break;
        case 'block':
          this.activeTabIndex = 2;
          break;
        default:
          break;
      }
    }
  }

  onTabChange(index: number): void {
    this.activeTabIndex = index;
  }

  submitBooking(): void {
    if (this.bookingForm.invalid) return;
    const { guestName, checkIn, checkOut } = this.bookingForm.value;
    this.onCreateBooking.emit({ guestName, checkIn, checkOut });
  }

  submitPricing(): void {
    if (this.pricingForm.invalid) return;
    const { startDate, endDate, price } = this.pricingForm.value;
    this.onSetPrice.emit({ startDate, endDate, price: Number(price) });
  }

  submitBlock(): void {
    if (this.blockForm.invalid) return;
    const { startDate, endDate, reason } = this.blockForm.value;
    this.onBlockDates.emit({
      startDate,
      endDate,
      reason: reason || 'Owner Block',
    });
  }

  submitUnblock(): void {
    if (this.blockForm.invalid) return;
    const { startDate, endDate } = this.blockForm.value;
    this.onUnblockDates.emit({ startDate, endDate });
  }

  private addDays(isoStr: string, days: number): string {
    const d = new Date(isoStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }
}
