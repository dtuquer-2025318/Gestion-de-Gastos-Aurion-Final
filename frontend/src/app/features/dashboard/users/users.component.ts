import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService, UserItem, UserKPIs } from './users.service';
import { AuthService } from '../../../core/services/auth.service'; // Ajusta la ruta a tu AuthService

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService);
  private authService = inject(AuthService);

  // Rol del usuario actual
  currentUserRole = computed(() => this.authService.currentUser()?.role || 'USER');
  isAdmin = computed(() => this.currentUserRole() === 'ADMIN');

  usuarios = signal<UserItem[]>([]);
  kpis = signal<UserKPIs>({ totalUsuarios: 0, usuariosActivos: 0, usuariosInactivos: 0 });
  searchTerm = signal('');

  // Estado para Modal de Edición
  showModal = signal(false);
  selectedUser = signal<Partial<UserItem> | null>(null);

  usuariosFiltrados = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.usuarios();
    return this.usuarios().filter(
      (u) =>
        u.fullName.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.role.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.usersService.listar().subscribe({
      next: (res: any) => this.usuarios.set(Array.isArray(res) ? res : res.data || []),
      error: (err) => console.error('Error al listar usuarios:', err),
    });

    this.usersService.obtenerKPIs().subscribe({
      next: (res: any) => this.kpis.set(res.data || res),
      error: (err) => console.error('Error al obtener KPIs:', err),
    });
  }

  // Abrir Modal
  onEdit(user: UserItem): void {
    if (!this.isAdmin()) return;
    this.selectedUser.set({ ...user });
    this.showModal.set(true);
  }

  // Guardar Cambios del Modal
  guardarEdicion(): void {
    const user = this.selectedUser();
    if (!user || !user.id) return;

    this.usersService.actualizar(user.id, user).subscribe({
      next: () => {
        this.showModal.set(false);
        this.cargarDatos();
      },
      error: (err) => console.error('Error al actualizar:', err),
    });
  }

  onToggleEstado(user: UserItem): void {
    if (!this.isAdmin()) return;
    this.usersService.toggleEstado(user.id).subscribe(() => this.cargarDatos());
  }

  onSoftDelete(user: UserItem): void {
    if (!this.isAdmin()) return;
    this.usersService.deshabilitar(user.id).subscribe(() => this.cargarDatos());
  }
}