export type ReservationType = 'BOOKING' | 'BLOCK';
export type ReservationStatus = 'ACTIVE' | 'CANCELLED';
export type ReservationSource = 'MANUAL' | 'CHANNEL';
export type PriceOverrideSource = 'MANUAL' | 'DYNAMIC';
export type CalendarDayStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED';

export interface Property {
  id: string;
  name: string;
  ownerName: string;
  baseRate: number; // in £ (GBP) or base integer
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  propertyId: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UnitPriceOverride {
  id: string;
  unitId: string;
  date: string; // YYYY-MM-DD
  price: number;
  source?: PriceOverrideSource;
  createdAt?: string;
  updatedAt?: string;
}

export interface UnitReservation {
  id: string;
  unitId: string;
  externalId?: string | null;
  guestName: string;
  type: ReservationType;
  status: ReservationStatus;
  source: ReservationSource;
  checkIn: string; // YYYY-MM-DD (inclusive check-in date)
  checkOut: string; // YYYY-MM-DD (exclusive check-out date)
  createdAt?: string;
  updatedAt?: string;
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
  price: number;
  hasPriceOverride: boolean;
  status: CalendarDayStatus;
  reservation?: UnitReservation;
  priceOverride?: UnitPriceOverride;
}

export interface DateRangeSelection {
  start: string | null; // YYYY-MM-DD
  end: string | null;   // YYYY-MM-DD
}

export interface ImportFeedItem {
  id: string;
  guest: string;
  checkIn: string;
  checkOut: string;
}

export type ImportItemStatus =
  | 'IMPORTED'
  | 'DUPLICATE_SKIPPED'
  | 'CANCELLED_IGNORED'
  | 'CONFLICT_DETECTED';

export interface ImportConflictDetail {
  feedId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: ImportItemStatus;
  reason: string;
}

export interface ImportSummary {
  importedCount: number;
  duplicatesSkipped: number;
  cancellationsProcessed: number;
  conflictsDetected: number;
  details: ImportConflictDetail[];
}
