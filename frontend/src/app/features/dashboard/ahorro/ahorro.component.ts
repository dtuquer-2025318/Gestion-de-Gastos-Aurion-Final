import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartType } from 'chart.js';
import { AhorroService, MetaAhorro, MovimientoAhorro } from '../../../core/services/ahorro.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-ahorro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BaseChartDirective,
    DecimalPipe,
    DatePipe
  ],
  templateUrl: './ahorro.component.html',
  styleUrls: ['./ahorro.component.css']
})
export class AhorroComponent implements OnInit {
  metas: MetaAhorro[] = [];
  historialMovimientos: MovimientoAhorro[] = [];
  metaSeleccionada: MetaAhorro | null = null;

  cargando: boolean = false;
  mensajeError: string | null = null;
  mensajeAdvertencia: string | null = null;
  esAdmin: boolean = false;

  mostrarModalMeta: boolean = false;
  mostrarModalMovimiento: boolean = false;
  mostrarModalHistorial: boolean = false;
  tipoMovimientoActivo: 'APORTE' | 'RETIRO' = 'APORTE';

  metaForm!: FormGroup;
  movimientoForm!: FormGroup;

  pieChartLabels: string[] = [];
  pieChartData: number[] = [];
  pieChartType: ChartType = 'pie';
  pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false
  };

  constructor(
    private ahorroService: AhorroService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.verificarRolUsuario();
    this.inicializarFormularios();
    this.cargarMetas();
  }

  // Intercepta las teclas para evitar signos menos, mas y notacion cientifica (e/E)
  prevenirSignoMenos(event: KeyboardEvent): void {
    if (['-', '+', 'e', 'E'].includes(event.key)) {
      event.preventDefault();
    }
  }

  verificarRolUsuario(): void {
    const authAny = this.authService as any;
    let roleStr = '';

    const userRole = authAny.role || authAny.getRole?.() || authAny.currentUserValue?.role;
    if (userRole) {
      roleStr = Array.isArray(userRole) ? userRole.join(',') : String(userRole);
    } else {
      roleStr = localStorage.getItem('user_role') || localStorage.getItem('role') || '';
      
      if (!roleStr) {
        const token = localStorage.getItem('token') || localStorage.getItem('access_token');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            roleStr = payload.role || payload.roles || '';
          } catch (e) {
            roleStr = '';
          }
        }
      }
    }

    this.esAdmin = roleStr.toUpperCase().includes('ADMIN');
    this.cdr.markForCheck();
  }

  inicializarFormularios(): void {
    this.metaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      montoMeta: [null, [Validators.required, Validators.min(0.01)]]
    });

    this.movimientoForm = this.fb.group({
      monto: [null, [Validators.required, Validators.min(0.01)]],
      descripcion: ['']
    });
  }

  cargarMetas(): void {
    this.cargando = true;
    this.mensajeError = null;

    this.ahorroService.listarMetas().subscribe({
      next: (data: MetaAhorro[]) => {
        this.metas = Array.isArray(data) ? data : [];
        this.actualizarGrafica();
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err: Error) => {
        this.mensajeError = err.message || 'Error de comunicación con el backend.';
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  actualizarGrafica(): void {
    if (!this.metas || this.metas.length === 0) {
      this.pieChartLabels = ['Sin registros'];
      this.pieChartData = [0];
      return;
    }
    
    this.pieChartLabels = this.metas.map((m: MetaAhorro) => m.nombre);
    this.pieChartData = this.metas.map((m: MetaAhorro) => m.progreso?.ahorrado || 0);
  }

  abrirModalMeta(): void {
    if (!this.esAdmin) return;
    this.metaForm.reset();
    this.mensajeError = null;
    this.mensajeAdvertencia = null;
    this.mostrarModalMeta = true;
    this.cdr.markForCheck();
  }

  cerrarModalMeta(): void {
    this.mostrarModalMeta = false;
    this.cdr.markForCheck();
  }

  abrirModalMovimiento(meta: MetaAhorro, tipo: 'APORTE' | 'RETIRO'): void {
    if (!this.esAdmin) return;
    this.metaSeleccionada = meta;
    this.tipoMovimientoActivo = tipo;
    this.mensajeError = null;
    this.mensajeAdvertencia = null;

    const descripcionControl = this.movimientoForm.get('descripcion');
    if (tipo === 'RETIRO') {
      descripcionControl?.setValidators([Validators.required]);
    } else {
      descripcionControl?.clearValidators();
    }
    descripcionControl?.updateValueAndValidity();

    this.movimientoForm.reset();
    this.mostrarModalMovimiento = true;
    this.cdr.markForCheck();
  }

  cerrarModalMovimiento(): void {
    this.mostrarModalMovimiento = false;
    this.metaSeleccionada = null;
    this.cdr.markForCheck();
  }

  verHistorial(meta: MetaAhorro): void {
    this.metaSeleccionada = meta;
    this.cargando = true;

    this.ahorroService.obtenerHistorial(meta.id).subscribe({
      next: (movs: MovimientoAhorro[]) => {
        this.historialMovimientos = Array.isArray(movs) ? movs : [];
        this.mostrarModalHistorial = true;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err: Error) => {
        this.mensajeError = err.message || 'No se pudo obtener el historial.';
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  cerrarModalHistorial(): void {
    this.mostrarModalHistorial = false;
    this.metaSeleccionada = null;
    this.historialMovimientos = [];
    this.cdr.markForCheck();
  }

  guardarMeta(): void {
    if (!this.esAdmin || this.metaForm.invalid) return;

    const monto = Number(this.metaForm.value.montoMeta);
    if (isNaN(monto) || monto <= 0) {
      this.mensajeError = 'El monto meta debe ser un valor positivo mayor a Q 0.00.';
      return;
    }

    this.cargando = true;
    this.ahorroService.crearMeta(this.metaForm.value).subscribe({
      next: () => {
        this.cerrarModalMeta();
        this.cargarMetas();
      },
      error: (err: Error) => {
        this.mensajeError = err.message || 'Error al guardar la meta.';
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  guardarMovimiento(): void {
    if (!this.esAdmin) {
      this.mensajeError = 'Acción restringida. Solo administradores pueden realizar movimientos.';
      return;
    }

    if (this.movimientoForm.invalid || !this.metaSeleccionada) return;

    const monto = Number(this.movimientoForm.value.monto);
    if (isNaN(monto) || monto <= 0) {
      this.mensajeAdvertencia = 'El monto debe ser un valor positivo mayor a Q 0.00.';
      return;
    }

    const ahorradoActual = this.metaSeleccionada.progreso?.ahorrado || 0;

    if (this.tipoMovimientoActivo === 'RETIRO' && monto > ahorradoActual) {
      this.mensajeAdvertencia = `No es posible retirar Q ${monto.toFixed(2)}. El saldo acumulado en "${this.metaSeleccionada.nombre}" es de solo Q ${ahorradoActual.toFixed(2)}.`;
      return;
    }

    this.cargando = true;
    this.mensajeError = null;
    this.mensajeAdvertencia = null;

    this.ahorroService.registrarMovimiento(this.metaSeleccionada.id, {
      ...this.movimientoForm.value,
      tipo: this.tipoMovimientoActivo
    }).subscribe({
      next: () => {
        this.cerrarModalMovimiento();
        this.cargarMetas();
      },
      error: (err: Error) => {
        this.mensajeError = err.message || 'Ocurrió un fallo al procesar la transacción.';
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }
}