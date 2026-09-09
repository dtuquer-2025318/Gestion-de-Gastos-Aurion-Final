import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IngresosService } from '../../../core/services/ingresos.service';
import { AuthService } from '../../../core/services/auth.service';
import { Ingreso, IngresoKPIs, CreateIngresoPayload, UpdateIngresoPayload, CategoriaIngreso, TipoComprobante, EstadoIngreso } from '../../../core/models/ingresos.model';

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
    previsionImpuestos: 0,
    retencionesIgss: 0,
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
    categoria: 'SERVICIOS',
    montoBruto: 0,
    fecha: new Date().toISOString().split('T')[0],
    tipoComprobante: 'FACTURA',
    estado: 'PAGADO',
  });

  showAnularConfirm = signal(false);
  anularId = signal<string | null>(null);

  categorias: CategoriaIngreso[] = ['SERVICIOS','PLANILLA','PRODUCTOS','CONSULTORIA','HONORARIOS','VENTAS','ALQUILERES','INTERESES','REIMBOLSOS','OTROS'];
  comprobantes: TipoComprobante[] = ['FACTURA', 'SALARIO'];
  estados: EstadoIngreso[] = ['PAGADO', 'PENDIENTE'];

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

  onCategoriaChange(nuevaCategoria: CategoriaIngreso): void {
  let tipoComp: TipoComprobante = this.form().tipoComprobante;

  if (nuevaCategoria === 'PLANILLA') {
    tipoComp = 'SALARIO';
  } else if (['SERVICIOS', 'PRODUCTOS', 'CONSULTORIA', 'HONORARIOS', 'VENTAS', 'ALQUILERES'].includes(nuevaCategoria)) {
    tipoComp = 'FACTURA';
  }

  this.form.update(f => ({
    ...f,
    categoria: nuevaCategoria,
    tipoComprobante: tipoComp
  }));
}

  openCreate(): void {
    if (!this.isAdmin()) return;
    this.isEditing.set(false);
    this.editingId.set(null);
    this.form.set({
      clienteOrigen: '',
      categoria: 'SERVICIOS',
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

  get deduccionEstimadaModal(): number {
    const monto = this.form().montoBruto || 0;
    const tipo = this.form().tipoComprobante;

    if (tipo === 'SALARIO') {
      return Number((monto * 0.0483).toFixed(2));
    } else if (tipo === 'FACTURA') {
      return Number((monto * 0.15).toFixed(2));
    }
    return 0;
  }

  get labelDeduccionModal(): string {
    return this.form().tipoComprobante === 'SALARIO'
      ? 'Deducción IGSS Estimada (4.83%):'
      : 'Deducción Fiscal Estimada (IVA/ISR):';
  }

  get netoEstimadoModal(): number {
    const monto = this.form().montoBruto || 0;
    return Number((monto - this.deduccionEstimadaModal).toFixed(2));
  }
}