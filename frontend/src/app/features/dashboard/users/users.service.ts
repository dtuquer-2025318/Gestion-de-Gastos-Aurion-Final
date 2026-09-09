import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface UserItem {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  gender: string;
  birthDate: string;
  phone: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  createdAt: string;
}

export interface UserKPIs {
  totalUsuarios: number;
  usuariosActivos: number;
  usuariosInactivos: number;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  listar(): Observable<{ success: boolean; data: UserItem[] }> {
    return this.http.get<{ success: boolean; data: UserItem[] }>(this.apiUrl);
  }

  obtenerKPIs(): Observable<{ success: boolean; data: UserKPIs }> {
    return this.http.get<{ success: boolean; data: UserKPIs }>(`${this.apiUrl}/kpis`);
  }

  toggleEstado(id: string): Observable<{ success: boolean; data: UserItem }> {
    return this.http.patch<{ success: boolean; data: UserItem }>(`${this.apiUrl}/${id}/toggle`, {});
  }

  deshabilitar(id: string): Observable<{ success: boolean; data: UserItem }> {
    return this.http.patch<{ success: boolean; data: UserItem }>(`${this.apiUrl}/${id}/deshabilitar`, {});
  }

  actualizar(id: string, data: Partial<UserItem>): Observable<{ success: boolean; data: UserItem }> {
    return this.http.put<{ success: boolean; data: UserItem }>(`${this.apiUrl}/${id}`, data);
  }
}