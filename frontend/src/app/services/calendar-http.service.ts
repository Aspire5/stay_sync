import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  CalendarDay,
  ImportSummary,
  Property,
  Unit,
  UnitPriceOverride,
  UnitReservation,
} from '../models/calendar.model';

@Injectable({
  providedIn: 'root',
})
export class CalendarHttpService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  getProperty(): Observable<Property> {
    return this.http
      .get<{ success: boolean; property: Property }>(`${this.apiUrl}/properties/default`)
      .pipe(
        map((res) => res.property),
        catchError(() =>
          of({
            id: 'prop-seaside-1',
            name: 'Seaside Cottage',
            ownerName: 'PropertyFlow',
            baseRate: 120,
            totalUnits: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        )
      );
  }

  getUnit(): Observable<Unit> {
    return this.http
      .get<{ success: boolean; unit: Unit }>(`${this.apiUrl}/properties/default`)
      .pipe(
        map((res) => res.unit),
        catchError(() =>
          of({
            id: 'unit-cottage-1',
            propertyId: 'prop-seaside-1',
            name: 'Main Cottage Unit',
          })
        )
      );
  }

  getCalendarDays(year: number, month: number): Observable<CalendarDay[]> {
    return this.http
      .get<{ success: boolean; days: CalendarDay[] }>(
        `${this.apiUrl}/calendar?year=${year}&month=${month}`
      )
      .pipe(
        map((res) => res.days),
        catchError((err) => {
          console.error('API Error fetching calendar days:', err);
          return of([]);
        })
      );
  }

  createBooking(
    guestName: string,
    checkIn: string,
    checkOut: string
  ): Observable<{ success: boolean; error?: string; reservation?: UnitReservation }> {
    return this.http
      .post<{ success: boolean; reservation?: UnitReservation }>(
        `${this.apiUrl}/reservations/booking`,
        { guestName, checkIn, checkOut }
      )
      .pipe(
        map((res) => ({ success: true, reservation: res.reservation })),
        catchError((err) => {
          const errorMsg = err.error?.error || 'Failed to connect to backend server.';
          return of({ success: false, error: errorMsg });
        })
      );
  }

  cancelReservation(id: string): Observable<{ success: boolean }> {
    return this.http
      .delete<{ success: boolean }>(`${this.apiUrl}/reservations/${id}`)
      .pipe(
        map(() => ({ success: true })),
        catchError((err) => of({ success: false }))
      );
  }

  setPriceOverride(
    startDate: string,
    endDate: string,
    price: number
  ): Observable<{ success: boolean }> {
    return this.http
      .post<{ success: boolean }>(`${this.apiUrl}/pricing/override`, {
        startDate,
        endDate,
        price,
      })
      .pipe(
        map(() => ({ success: true })),
        catchError(() => of({ success: false }))
      );
  }

  blockDateRange(
    startDate: string,
    endDate: string,
    reason: string = 'Owner Block'
  ): Observable<{ success: boolean; error?: string }> {
    return this.http
      .post<{ success: boolean }>(`${this.apiUrl}/reservations/block`, {
        startDate,
        endDate,
        reason,
      })
      .pipe(
        map(() => ({ success: true })),
        catchError((err) => {
          const errorMsg = err.error?.error || 'Failed to block date range.';
          return of({ success: false, error: errorMsg });
        })
      );
  }

  unblockDateRange(startDate: string, endDate: string): Observable<{ success: boolean }> {
    return this.http
      .post<{ success: boolean }>(`${this.apiUrl}/reservations/unblock`, {
        startDate,
        endDate,
      })
      .pipe(
        map(() => ({ success: true })),
        catchError(() => of({ success: false }))
      );
  }

  importChannelFeed(): Observable<ImportSummary> {
    return this.http
      .post<{ success: boolean; summary: ImportSummary }>(`${this.apiUrl}/channel/import`, {})
      .pipe(
        map((res) => res.summary),
        catchError(() =>
          of({
            importedCount: 0,
            duplicatesSkipped: 0,
            cancellationsProcessed: 0,
            conflictsDetected: 0,
            details: [],
          })
        )
      );
  }
}
