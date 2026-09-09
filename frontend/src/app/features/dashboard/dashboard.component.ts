import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';
import { User } from '../../core/models/auth.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private sessionService = inject(SessionService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;

  profileUser: User | null = null;
  profileLoading = false;
  profileError = '';
  private profileSub?: Subscription;

  sidebarOpen = false;
  showLogoutModal = signal(false);

  currentDate = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  currentTime = new Date().toLocaleTimeString('es-ES', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  navItems = [
    { path: '/dashboard', label: 'INICIO', icon: 'bi-house-door-fill', exact: true },
    { path: null, label: 'Tarjetas De Crédito', icon: 'bi-credit-card-fill', exact: false },
    { path: '/dashboard/usuarios', label: 'Usuarios', icon: 'bi-people-fill', exact: false },
    { path: null, label: 'Ahorro para Emergencia', icon: 'bi-piggy-bank-fill', exact: false },
    { path: null, label: 'Gastos', icon: 'bi-receipt', exact: false },
    { path: '/dashboard/ingresos', label: 'Ingresos', icon: 'bi-graph-up-arrow', exact: false },
];

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.profileSub?.unsubscribe();
  }

  private loadProfile(): void {
    this.profileLoading = true;
    this.profileError = '';

    this.profileSub = this.authService.getProfile().subscribe({
      next: (res) => {
        this.profileUser = res.user;
        this.profileLoading = false;
      },
      error: (err) => {
        this.profileLoading = false;
        this.profileError = err.error?.message || 'No se pudo cargar el perfil.';
      }
    });
  }

  get userRoleLabel(): string {
    const role = this.currentUser()?.role;
    return role === 'ADMIN' ? 'Admin' : 'Usuario';
  }

  openLogoutModal(): void {
    this.showLogoutModal.set(true);
  }

  closeLogoutModal(): void {
    this.showLogoutModal.set(false);
  }

  confirmLogout(): void {
    this.showLogoutModal.set(false);
    this.authService.logout();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeLogoutModal();
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
}