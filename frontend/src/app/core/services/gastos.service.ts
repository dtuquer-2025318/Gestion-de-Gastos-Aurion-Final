import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Gasto {
  id: string;
  fecha: Date | string;
  proveedorBeneficiario: string;
  categoria: string;
  montoTotal: number;
  estado?: string;
  comprobanteUrl?: string | null;
  userId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface GastosKPIs {
  gastoTotalMes: number;
  presupuestoUtilizadoPorcentaje: number;
  totalRegistrosMes: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GastosService {
  private readonly apiUrl = `${environment.apiUrl || 'http://localhost:3000/api'}/gastos`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista completa de gastos del usuario autenticado
   */
  listar(): Observable<Gasto[]> {
    return this.http.get<ApiResponse<Gasto[]>>(this.apiUrl).pipe(
      map((res) => res.data || []),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene los indicadores KPI del presupuesto de gastos
   */
  obtenerKPIs(): Observable<GastosKPIs> {
    return this.http.get<ApiResponse<GastosKPIs>>(`${this.apiUrl}/kpis`).pipe(
      map((res) => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * Crea un nuevo registro de gasto
   */
  crear(gasto: Partial<Gasto>): Observable<Gasto> {
    return this.http.post<ApiResponse<Gasto>>(this.apiUrl, gasto).pipe(
      map((res) => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza un gasto existente mediante su ID
   */
  actualizar(id: string, gasto: Partial<Gasto>): Observable<Gasto> {
    return this.http.put<ApiResponse<Gasto>>(`${this.apiUrl}/${id}`, gasto).pipe(
      map((res) => res.data),
      catchError(this.handleError)
    );
  }

  /**
   * Elimina un registro de gasto por su ID
   */
  eliminar(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(() => undefined),
      catchError(this.handleError)
    );
  }

  /**
   * Manejador centralizado de errores HTTP para presentar mensajes formateados
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let mensaje = 'Ocurrió un error inesperado al procesar la solicitud.';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente o de red
      mensaje = `Error de conexión: ${error.error.message}`;
    } else if (error.error && error.error.message) {
      // Error devuelto explícitamente por la API Express
      mensaje = error.error.message;
    } else if (error.status === 404) {
      mensaje = 'El registro solicitado no fue encontrado.';
    } else if (error.status === 401 || error.status === 403) {
      mensaje = 'No tienes autorización para realizar esta operación.';
    }

    return throwError(() => new Error(mensaje));
  }
}