import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  CalendarDay,
  CalendarDayStatus,
  ImportConflictDetail,
  ImportFeedItem,
  ImportSummary,
  Property,
  Unit,
  UnitPriceOverride,
  UnitReservation,
} from '../models/calendar.model';

@Injectable({
  providedIn: 'root',
})
export class CalendarMockService {
  private property: Property = {
    id: 'prop-seaside-1',
    name: 'Seaside Cottage',
    ownerName: 'PropertyFlow',
    baseRate: 120,
    totalUnits: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  private unit: Unit = {
    id: 'unit-cottage-1',
    propertyId: 'prop-seaside-1',
    name: 'Main Cottage Unit',
  };

  private priceOverrides: UnitPriceOverride[] = [
    {
      id: 'ovr-1',
      unitId: 'unit-cottage-1',
      date: '2026-08-07',
      price: 150,
      source: 'DYNAMIC',
    },
    {
      id: 'ovr-2',
      unitId: 'unit-cottage-1',
      date: '2026-08-08',
      price: 150,
      source: 'DYNAMIC',
    },
    {
      id: 'ovr-3',
      unitId: 'unit-cottage-1',
      date: '2026-08-14',
      price: 160,
      source: 'MANUAL',
    },
    {
      id: 'ovr-4',
      unitId: 'unit-cottage-1',
      date: '2026-08-15',
      price: 160,
      source: 'MANUAL',
    },
  ];

  private reservations: UnitReservation[] = [
    {
      id: 'res-1001',
      unitId: 'unit-cottage-1',
      externalId: '1001',
      guestName: 'John D.',
      type: 'BOOKING',
      status: 'ACTIVE',
      source: 'CHANNEL',
      checkIn: '2026-08-10',
      checkOut: '2026-08-15',
    },
    {
      id: 'res-block-1',
      unitId: 'unit-cottage-1',
      externalId: null,
      guestName: 'Maintenance Block',
      type: 'BLOCK',
      status: 'ACTIVE',
      source: 'MANUAL',
      checkIn: '2026-08-01',
      checkOut: '2026-08-05',
    },
  ];

  private mockChannelFeed: ImportFeedItem[] = [
    {
      id: '1001',
      guest: 'John D.',
      checkIn: '2026-08-10',
      checkOut: '2026-08-15',
    },
    {
      id: '1002',
      guest: 'Maria S.',
      checkIn: '2026-08-15',
      checkOut: '2026-08-20',
    },
    {
      id: '1001',
      guest: 'John D.',
      checkIn: '2026-08-10',
      checkOut: '2026-08-15',
    },
    {
      id: '0999',
      guest: '—',
      checkIn: '2026-08-01',
      checkOut: '2026-08-04',
    },
    {
      id: '1003',
      guest: 'Sam P.',
      checkIn: '2026-08-13',
      checkOut: '2026-08-17',
    },
  ];

  getProperty(): Observable<Property> {
    return of({ ...this.property }).pipe(delay(150));
  }

  getUnit(): Observable<Unit> {
    return of({ ...this.unit }).pipe(delay(150));
  }

  getReservations(): Observable<UnitReservation[]> {
    return of([...this.reservations]).pipe(delay(150));
  }

  getPriceOverrides(): Observable<UnitPriceOverride[]> {
    return of([...this.priceOverrides]).pipe(delay(150));
  }

  getCalendarDays(year: number, month: number): Observable<CalendarDay[]> {
    const todayStr = this.formatDateIso(new Date());
    const days: CalendarDay[] = [];

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const pDate = new Date(year, month - 1, prevMonthLastDay - i);
      const dateStr = this.formatDateIso(pDate);
      days.push(this.buildCalendarDay(dateStr, pDate.getDate(), false, todayStr));
    }

    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const cDate = new Date(year, month, d);
      const dateStr = this.formatDateIso(cDate);
      days.push(this.buildCalendarDay(dateStr, d, true, todayStr));
    }

    const remainingDays = 42 - days.length;
    for (let n = 1; n <= remainingDays; n++) {
      const nDate = new Date(year, month + 1, n);
      const dateStr = this.formatDateIso(nDate);
      days.push(this.buildCalendarDay(dateStr, n, false, todayStr));
    }

    return of(days).pipe(delay(200));
  }

  private checkOverlap(
    checkIn1: string,
    checkOut1: string,
    checkIn2: string,
    checkOut2: string
  ): boolean {
    return checkIn1 < checkOut2 && checkOut1 > checkIn2;
  }

  createBooking(
    guestName: string,
    checkIn: string,
    checkOut: string
  ): Observable<{ success: boolean; error?: string; reservation?: UnitReservation }> {
    if (checkIn >= checkOut) {
      return of({
        success: false,
        error: 'Check-out date must be after check-in date.',
      }).pipe(delay(150));
    }

    const conflictingRes = this.reservations.find(
      (r) =>
        r.status === 'ACTIVE' &&
        this.checkOverlap(checkIn, checkOut, r.checkIn, r.checkOut)
    );

    if (conflictingRes) {
      const typeLabel = conflictingRes.type === 'BLOCK' ? 'blocked period' : 'existing booking';
      return of({
        success: false,
        error: `Date range (${checkIn} to ${checkOut}) clashes with a ${typeLabel} (${conflictingRes.guestName}: ${conflictingRes.checkIn} to ${conflictingRes.checkOut}).`,
      }).pipe(delay(200));
    }

    const newRes: UnitReservation = {
      id: `res-${Date.now()}`,
      unitId: this.unit.id,
      externalId: null,
      guestName,
      type: 'BOOKING',
      status: 'ACTIVE',
      source: 'MANUAL',
      checkIn,
      checkOut,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.reservations.push(newRes);

    return of({ success: true, reservation: newRes }).pipe(delay(200));
  }

  cancelReservation(id: string): Observable<{ success: boolean }> {
    this.reservations = this.reservations.map((r) =>
      r.id === id ? { ...r, status: 'CANCELLED' } : r
    );
    return of({ success: true }).pipe(delay(200));
  }

  setPriceOverride(
    startDate: string,
    endDate: string,
    price: number
  ): Observable<{ success: boolean }> {
    let curr = new Date(startDate);
    const end = new Date(endDate);

    while (curr <= end) {
      const dateStr = this.formatDateIso(curr);
      const existingIdx = this.priceOverrides.findIndex((p) => p.date === dateStr);
      if (existingIdx >= 0) {
        this.priceOverrides[existingIdx].price = price;
        this.priceOverrides[existingIdx].source = 'MANUAL';
      } else {
        this.priceOverrides.push({
          id: `ovr-${Date.now()}-${Math.random()}`,
          unitId: this.unit.id,
          date: dateStr,
          price,
          source: 'MANUAL',
        });
      }
      curr.setDate(curr.getDate() + 1);
    }

    return of({ success: true }).pipe(delay(200));
  }

  blockDateRange(
    startDate: string,
    endDate: string,
    reason: string = 'Property Block'
  ): Observable<{ success: boolean; error?: string }> {
    const conflict = this.reservations.find(
      (r) =>
        r.status === 'ACTIVE' &&
        r.type === 'BOOKING' &&
        this.checkOverlap(startDate, endDate, r.checkIn, r.checkOut)
    );

    if (conflict) {
      return of({
        success: false,
        error: `Cannot block range (${startDate} to ${endDate}) because it overlaps with active booking for ${conflict.guestName}.`,
      }).pipe(delay(200));
    }

    const blockRes: UnitReservation = {
      id: `block-${Date.now()}`,
      unitId: this.unit.id,
      externalId: null,
      guestName: reason,
      type: 'BLOCK',
      status: 'ACTIVE',
      source: 'MANUAL',
      checkIn: startDate,
      checkOut: endDate,
    };

    this.reservations.push(blockRes);
    return of({ success: true }).pipe(delay(200));
  }

  unblockDateRange(startDate: string, endDate: string): Observable<{ success: boolean }> {
    this.reservations = this.reservations.map((r) => {
      if (
        r.type === 'BLOCK' &&
        r.status === 'ACTIVE' &&
        this.checkOverlap(startDate, endDate, r.checkIn, r.checkOut)
      ) {
        return { ...r, status: 'CANCELLED' };
      }
      return r;
    });

    return of({ success: true }).pipe(delay(200));
  }

  importChannelFeed(): Observable<ImportSummary> {
    const details: ImportConflictDetail[] = [];
    let importedCount = 0;
    let duplicatesSkipped = 0;
    let cancellationsProcessed = 0;
    let conflictsDetected = 0;

    const seenExternalIds = new Set<string>();

    for (const item of this.mockChannelFeed) {
      if (!item.guest || item.guest === '—' || item.guest.trim() === '') {
        cancellationsProcessed++;
        details.push({
          feedId: item.id,
          guestName: item.guest || '—',
          checkIn: item.checkIn,
          checkOut: item.checkOut,
          status: 'CANCELLED_IGNORED',
          reason: 'Feed entry represents a cancellation or unassigned block. Ignored.',
        });
        continue;
      }

      const existingInDb = this.reservations.find(
        (r) => r.externalId === item.id && r.status === 'ACTIVE'
      );

      if (existingInDb || seenExternalIds.has(item.id)) {
        duplicatesSkipped++;
        details.push({
          feedId: item.id,
          guestName: item.guest,
          checkIn: item.checkIn,
          checkOut: item.checkOut,
          status: 'DUPLICATE_SKIPPED',
          reason: `External reservation #${item.id} already ingested or duplicated in feed batch.`,
        });
        continue;
      }

      const conflictingRes = this.reservations.find(
        (r) =>
          r.status === 'ACTIVE' &&
          this.checkOverlap(item.checkIn, item.checkOut, r.checkIn, r.checkOut)
      );

      if (conflictingRes) {
        conflictsDetected++;
        details.push({
          feedId: item.id,
          guestName: item.guest,
          checkIn: item.checkIn,
          checkOut: item.checkOut,
          status: 'CONFLICT_DETECTED',
          reason: `Conflict: Range ${item.checkIn} to ${item.checkOut} clashes with existing ${conflictingRes.type.toLowerCase()} for ${conflictingRes.guestName} (${conflictingRes.checkIn} to ${conflictingRes.checkOut}).`,
        });
        continue;
      }

      seenExternalIds.add(item.id);
      importedCount++;
      const importedRes: UnitReservation = {
        id: `res-ch-${item.id}`,
        unitId: this.unit.id,
        externalId: item.id,
        guestName: item.guest,
        type: 'BOOKING',
        status: 'ACTIVE',
        source: 'CHANNEL',
        checkIn: item.checkIn,
        checkOut: item.checkOut,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.reservations.push(importedRes);

      details.push({
        feedId: item.id,
        guestName: item.guest,
        checkIn: item.checkIn,
        checkOut: item.checkOut,
        status: 'IMPORTED',
        reason: `Successfully reconciled as channel booking #${item.id}.`,
      });
    }

    const summary: ImportSummary = {
      importedCount,
      duplicatesSkipped,
      cancellationsProcessed,
      conflictsDetected,
      details,
    };

    return of(summary).pipe(delay(400));
  }

  private buildCalendarDay(
    dateStr: string,
    dayNumber: number,
    isCurrentMonth: boolean,
    todayStr: string
  ): CalendarDay {
    const override = this.priceOverrides.find((p) => p.date === dateStr);
    const price = override ? override.price : this.property.baseRate;

    const activeReservations = this.reservations.filter(
      (r) => r.status === 'ACTIVE' && r.checkIn <= dateStr && dateStr < r.checkOut
    );

    const totalUnits = this.property.totalUnits || 1;
    const bookedUnits = activeReservations.length;
    const availableUnits = Math.max(0, totalUnits - bookedUnits);

    let status: CalendarDayStatus = 'AVAILABLE';
    if (activeReservations.length > 0) {
      const firstRes = activeReservations[0];
      status = firstRes.type === 'BLOCK' ? 'BLOCKED' : 'BOOKED';
    }

    return {
      date: dateStr,
      dayNumber,
      isCurrentMonth,
      isToday: dateStr === todayStr,
      isSelected: false,
      isRangeStart: false,
      isRangeEnd: false,
      isInRange: false,
      price,
      hasPriceOverride: !!override,
      status,
      totalUnits,
      bookedUnits,
      availableUnits,
      reservation: activeReservations[0],
      reservations: activeReservations,
      priceOverride: override,
    };
  }

  private formatDateIso(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
