import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/inicio/inicio.component').then((m) => m.InicioComponent),
      },
      {
        path: 'ingresos',
        loadComponent: () =>
          import('./features/dashboard/ingresos/ingresos.component').then((m) => m.IngresosComponent),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/dashboard/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'gastos',
        loadComponent: () =>
          import('./features/dashboard/gastos/gastos.component').then((m) => m.GastosComponent),
      },
      {
        path: 'ahorro-emergencia',
        loadComponent: () =>
          import('./features/dashboard/ahorro/ahorro.component').then((m) => m.AhorroComponent),
      },
    ],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];