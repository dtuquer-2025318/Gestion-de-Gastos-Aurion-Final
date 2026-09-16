import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  exp: number;
}

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Si estamos en el servidor (SSR), permitir el paso para evaluación en cliente
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const token = localStorage.getItem('token');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const isExpired = decoded.exp * 1000 <= Date.now();

    if (isExpired) {
      localStorage.removeItem('token');
      router.navigate(['/login'], { queryParams: { sessionExpired: 'true' } });
      return false;
    }

    // Token presente y vigente: permitir el acceso a la ruta
    return true;
  } catch {
    localStorage.removeItem('token');
    router.navigate(['/login']);
    return false;
  }
};