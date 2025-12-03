// guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.currentUser()) {
    return true;
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.currentUser() && authService.isAdmin()) {
    return true;
  }

  // Rediriger vers dashboard data scientist si non admin
  router.navigate(['/data-scientist/dashboard']);
  return false;
};

//Guard pour data scientist
export const dataScientistGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const userProfile = authService.getUserProfile();
  
  if (authService.currentUser() && userProfile?.role === 'data scientist') {
    return true;
  }

  // Rediriger vers dashboard admin si c'est un admin
  if (userProfile?.role === 'admin') {
    router.navigate(['/home/dashboard']);
    return false;
  }

  router.navigate(['/login']);
  return false;
};