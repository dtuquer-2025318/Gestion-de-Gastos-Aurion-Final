import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment as env } from '../../../environments/environment';
import { Ingreso, IngresoKPIs, CreateIngresoPayload, UpdateIngresoPayload } from '../models/ingresos.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class IngresosService {
  private http = inject(HttpClient);
  private apiUrl = `${env.apiUrl}/ingresos`;

  listar(): Observable<ApiResponse<Ingreso[]>> {
    return this.http.get<ApiResponse<Ingreso[]>>(this.apiUrl);
  }

  obtenerKPIs(): Observable<ApiResponse<IngresoKPIs>> {
    return this.http.get<ApiResponse<IngresoKPIs>>(`${this.apiUrl}/kpis`);
  }

  crear(payload: CreateIngresoPayload): Observable<ApiResponse<Ingreso>> {
    return this.http.post<ApiResponse<Ingreso>>(this.apiUrl, payload);
  }

  actualizar(id: string, payload: UpdateIngresoPayload): Observable<ApiResponse<Ingreso>> {
    return this.http.put<ApiResponse<Ingreso>>(`${this.apiUrl}/${id}`, payload);
  }

  anular(id: string): Observable<ApiResponse<Ingreso>> {
    return this.http.patch<ApiResponse<Ingreso>>(`${this.apiUrl}/${id}/anular`, {});
  }
}