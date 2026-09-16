import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ProgresoMeta {
  montoMeta: number;
  ahorrado: number;
  restante: number;
  porcentaje: number;
  estado: 'ACTIVA' | 'COMPLETADA' | 'CANCELADA';
}

export interface MetaAhorro {
  id: string;
  nombre: string;
  montoMeta: number;
  estado: 'ACTIVA' | 'COMPLETADA' | 'CANCELADA';
  userId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  progreso: ProgresoMeta;
}

export interface MovimientoAhorro {
  id: string;
  tipo: 'APORTE' | 'RETIRO';
  monto: number;
  descripcion?: string | null;
  fecha: Date | string;
}

@Injectable({
  providedIn: 'root'
})
export class AhorroService {
  private readonly apiUrl = `${environment.apiUrl || 'http://localhost:3000/api'}/ahorros`;

  constructor(private http: HttpClient) {}

  listarMetas(): Observable<MetaAhorro[]> {
    return this.http.get<any>(`${this.apiUrl}/metas`).pipe(
      map((res) => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.data)) return res.data;
        return [];
      }),
      catchError(this.handleError)
    );
  }

  crearMeta(meta: { nombre: string; montoMeta: number }): Observable<MetaAhorro> {
    return this.http.post<any>(`${this.apiUrl}/metas`, meta).pipe(
      map((res) => res.data || res),
      catchError(this.handleError)
    );
  }

  registrarMovimiento(
    metaId: string, 
    movimiento: { tipo: 'APORTE' | 'RETIRO'; monto: number; descripcion?: string }
  ): Observable<{ movimiento: MovimientoAhorro; progresoActualizado: ProgresoMeta }> {
    return this.http.post<any>(
      `${this.apiUrl}/metas/${metaId}/movimientos`, 
      movimiento
    ).pipe(
      map((res) => res.data || res),
      catchError(this.handleError)
    );
  }

  obtenerHistorial(metaId: string): Observable<MovimientoAhorro[]> {
    return this.http.get<any>(`${this.apiUrl}/metas/${metaId}/movimientos`).pipe(
      map((res) => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.data)) return res.data;
        return [];
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let mensaje = 'Ocurrió un error inesperado al procesar la solicitud.';
    if (error.error instanceof ErrorEvent) {
      mensaje = `Error de conexión: ${error.error.message}`;
    } else if (error.error && error.error.message) {
      mensaje = error.error.message;
    } else if (error.status === 404) {
      mensaje = 'La meta de ahorro solicitada no fue encontrada.';
    } else if (error.status === 401 || error.status === 403) {
      mensaje = 'No tienes autorización para realizar esta operación.';
    }
    return throwError(() => new Error(mensaje));
  }
}