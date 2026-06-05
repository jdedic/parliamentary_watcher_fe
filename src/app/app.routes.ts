import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'sessions',
    loadComponent: () => import('./features/session-list/session-list.component').then(m => m.SessionListComponent),
  },
  {
    path: 'sessions/:id',
    loadComponent: () => import('./features/session-detail/session-detail.component').then(m => m.SessionDetailComponent),
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent),
  },
  { path: '**', redirectTo: '' },
];
