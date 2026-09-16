import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IngresosService } from '../../../core/services/ingresos.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  Ingreso,
  IngresoKPIs,
  CreateIngresoPayload,
  UpdateIngresoPayload,
  CategoriaIngreso,
  TipoIngreso,
  TipoComprobante,
  EstadoIngreso,
  DesgloseFiscalDTO
} from '../../../core/models/ingresos.model';

@Component({
  selector: 'app-ingresos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.css']
})
export class IngresosComponent implements OnInit {
  private ingresosService = inject(IngresosService);
  private authService = inject(AuthService);

  ingresos = signal<Ingreso[]>([]);
  kpis = signal<IngresoKPIs>({
    totalIngresosBrutos: 0,
    retencionIsr: 0,
    retencionesIgss: 0,
    ivaPendientePago: 0,
    ingresoNetoReal: 0,
  });

  loading = signal(false);
  error = signal<string | null>(null);
  isAdmin = signal(false);

  showModal = signal(false);
  isEditing = signal(false);
  editingId = signal<string | null>(null);

  form = signal<CreateIngresoPayload>({
  clienteOrigen: '',
  descripcion: '',
  categoria: 'SERVICIOS',
  tipoIngreso: 'SERVICIOS_PROFESIONALES',
  montoBruto: 0,
  fecha: new Date().toISOString().split('T')[0],
  tipoComprobante: 'FACTURA',
  estado: 'PAGADO',
});
  showAnularConfirm = signal(false);
  anularId = signal<string | null>(null);

  categorias: CategoriaIngreso[] = ['SERVICIOS', 'PLANILLA', 'PRODUCTOS', 'CONSULTORIA', 'OTROS'];
  tiposIngreso: TipoIngreso[] = [
    'SALARIO',
    'SERVICIOS_PROFESIONALES',
    'VENTA',
    'ALQUILER',
    'INTERES',
    'REEMBOLSO',
    'OTRO'
  ];
  comprobantes: TipoComprobante[] = ['FACTURA', 'SALARIO'];
  estados: EstadoIngreso[] = ['PAGADO', 'PENDIENTE'];

  // Cálculo en tiempo real reactivo derivado del Signal 'form'
  desgloseModal = computed<DesgloseFiscalDTO>(() => {
    const f = this.form();
    const monto = f.montoBruto || 0;

    if (f.estado === 'PENDIENTE') {
      return { baseImponible: monto, iva: 0, isr: 0, igss: 0, ivaPendientePago: 0, neto: monto, cuentaComoIngreso: true };
    }

    switch (f.tipoIngreso) {
      case 'SALARIO': {
        const igss = Number((monto * 0.0483).toFixed(2));
        return { baseImponible: monto, iva: 0, isr: 0, igss, ivaPendientePago: 0, neto: Number((monto - igss).toFixed(2)), cuentaComoIngreso: true };
      }
      case 'SERVICIOS_PROFESIONALES': {
        const isr = monto >= 2500 ? Number((monto * 0.05).toFixed(2)) : 0;
        return { baseImponible: monto, iva: 0, isr, igss: 0, ivaPendientePago: 0, neto: Number((monto - isr).toFixed(2)), cuentaComoIngreso: true };
      }
      case 'VENTA': {
        const base = Number((monto / 1.12).toFixed(2));
        const iva = Number((monto - base).toFixed(2));
        return { baseImponible: base, iva, isr: 0, igss: 0, ivaPendientePago: iva, neto: base, cuentaComoIngreso: true };
      }
      case 'ALQUILER': {
        const isr = Number((monto * 0.10).toFixed(2));
        return { baseImponible: monto, iva: 0, isr, igss: 0, ivaPendientePago: 0, neto: Number((monto - isr).toFixed(2)), cuentaComoIngreso: true };
      }
      case 'REEMBOLSO': {
        return { baseImponible: 0, iva: 0, isr: 0, igss: 0, ivaPendientePago: 0, neto: monto, cuentaComoIngreso: false };
      }
      case 'INTERES':
      case 'OTRO':
      default:
        return { baseImponible: monto, iva: 0, isr: 0, igss: 0, ivaPendientePago: 0, neto: monto, cuentaComoIngreso: true };
    }
  });

  ngOnInit(): void {
    this.isAdmin.set(this.authService.currentUser()?.role === 'ADMIN');
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.ingresosService.listar().subscribe({
      next: (res) => {
        this.ingresos.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al cargar los ingresos.');
        this.loading.set(false);
      },
    });

    this.ingresosService.obtenerKPIs().subscribe({
      next: (res) => this.kpis.set(res.data),
      error: () => {},
    });
  }

  onTipoIngresoChange(nuevoTipo: TipoIngreso): void {
    let tipoComp: TipoComprobante = 'FACTURA';
    let cat: CategoriaIngreso = 'SERVICIOS';

    if (nuevoTipo === 'SALARIO') {
      tipoComp = 'SALARIO';
      cat = 'PLANILLA';
    } else if (nuevoTipo === 'VENTA') {
      cat = 'PRODUCTOS';
    }

    this.form.update((f) => ({
      ...f,
      tipoIngreso: nuevoTipo,
      tipoComprobante: tipoComp,
      categoria: cat,
    }));
  }

  openCreate(): void {
    if (!this.isAdmin()) return;
    this.isEditing.set(false);
    this.editingId.set(null);
    this.form.set({
      clienteOrigen: '',
      categoria: 'SERVICIOS',
      tipoIngreso: 'SERVICIOS_PROFESIONALES',
      montoBruto: 0,
      fecha: new Date().toISOString().split('T')[0],
      tipoComprobante: 'FACTURA',
      estado: 'PAGADO',
    });
    this.showModal.set(true);
  }

  openEdit(ing: Ingreso): void {
    if (!this.isAdmin()) return;
    this.isEditing.set(true);
    this.editingId.set(ing.id);
    this.form.set({
      clienteOrigen: ing.clienteOrigen,
      categoria: ing.categoria,
      tipoIngreso: ing.tipoIngreso,
      montoBruto: ing.montoBruto,
      fecha: ing.fecha.split('T')[0],
      tipoComprobante: ing.tipoComprobante,
      estado: ing.estado,
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  save(): void {
    if (!this.isAdmin()) return;

    const payload = this.form();
    if (payload.montoBruto <= 0) {
      this.error.set('El monto bruto debe ser mayor a 0');
      return;
    }

    if (this.isEditing() && this.editingId()) {
      this.ingresosService.actualizar(this.editingId()!, payload as UpdateIngresoPayload).subscribe({
        next: () => {
          this.closeModal();
          this.cargarDatos();
        },
        error: (err) => this.error.set(err.error?.message || 'Error al actualizar'),
      });
    } else {
      this.ingresosService.crear(payload).subscribe({
        next: () => {
          this.closeModal();
          this.cargarDatos();
        },
        error: (err) => this.error.set(err.error?.message || 'Error al crear'),
      });
    }
  }

  confirmAnular(id: string): void {
    if (!this.isAdmin()) return;
    this.anularId.set(id);
    this.showAnularConfirm.set(true);
  }

  cancelAnular(): void {
    this.showAnularConfirm.set(false);
    this.anularId.set(null);
  }

  doAnular(): void {
    if (!this.isAdmin() || !this.anularId()) return;
    this.ingresosService.anular(this.anularId()!).subscribe({
      next: () => {
        this.cancelAnular();
        this.cargarDatos();
      },
      error: (err) => this.error.set(err.error?.message || 'Error al anular'),
    });
  }

  formatMoney(value: number): string {
    return 'Q ' + value.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  estadoClass(estado: EstadoIngreso | string): string {
    switch (estado) {
      case 'PAGADO':
        return 'badge-pagado';
      case 'PENDIENTE':
        return 'badge-pendiente';
      case 'ANULADO':
        return 'badge-anulado';
      default:
        return '';
    }
  }
}