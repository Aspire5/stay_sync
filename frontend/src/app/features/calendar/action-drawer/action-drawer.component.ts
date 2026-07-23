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
import { DateRangeSelection } from '../../../models/calendar.model';
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
          <strong>Booking Clash / Error</strong>
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
        <!-- Tab 1: Create Booking -->
        <mat-tab label="New Booking">
          <form [formGroup]="bookingForm" (ngSubmit)="submitBooking()" class="drawer-form">
            <div class="form-section">
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
                  <span>Checkout Rule:</span>
                  <strong>Exclusive Check-out</strong>
                </div>
                <div class="summary-row">
                  <span>Guest departs:</span>
                  <strong>{{ bookingForm.value.checkOut || 'Selected Date' }} morning</strong>
                </div>
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
                Confirm Booking
              </button>
            </div>
          </form>
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
          <form [formGroup]="blockForm" class="drawer-form">
            <div class="form-section">
              <p class="section-desc">
                Select a single date or date range to block nights or release existing blocks.
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
            </div>

            <div class="drawer-footer block-actions">
              <button
                mat-stroked-button
                color="warn"
                type="button"
                (click)="submitUnblock()"
                [disabled]="blockForm.invalid || isLoading"
              >
                <mat-icon>lock_open</mat-icon> Unblock Nights
              </button>

              <button
                mat-raised-button
                color="warn"
                type="button"
                (click)="submitBlock()"
                [disabled]="blockForm.invalid || isLoading"
              >
                <mat-icon>block</mat-icon> Block Dates
              </button>
            </div>
          </form>
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
        width: 440px;
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
        height: 100%;
        justify-content: space-between;
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
        padding-top: var(--space-lg);
        border-top: 1px solid var(--border-color);
      }

      .primary-submit-btn {
        background-color: var(--primary) !important;
        font-weight: 600 !important;
      }

      .block-actions {
        justify-content: space-between;
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

  @Output() onClose = new EventEmitter<void>();
  @Output() onCreateBooking = new EventEmitter<{
    guestName: string;
    checkIn: string;
    checkOut: string;
  }>();
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
