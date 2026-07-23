import { Routes } from '@angular/router';
import { CalendarDashboardComponent } from './features/calendar/calendar-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: CalendarDashboardComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
