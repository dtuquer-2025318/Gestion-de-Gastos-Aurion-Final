import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { GastosService, Gasto } from '../../../core/services/gastos.service';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BaseChartDirective
  ],
  templateUrl: './gastos.component.html',
  styleUrls: ['./gastos.component.css']
})
export class GastosComponent implements OnInit {
  gastos: Gasto[] = [];
  gastoForm!: FormGroup;
  
  // Modales y estados
  mostrarModal = false;
  mostrarModalEliminar = false;
  cargando = false;
  mensajeError: string | null = null;
  
  categoriaActiva = 'ALIMENTOS';
  gastoEnEdicionId: string | null = null;
  gastoParaEliminar: Gasto | null = null;

  categorias = ['ALIMENTOS', 'HOGAR', 'ROPA', 'VEHICULO', 'OTROS'];

  placeholdersDetalle: Record<string, string> = {
    ALIMENTOS: '',
    HOGAR: '',
    ROPA: '',
    VEHICULO: '',
    OTROS: ''
  };

  // Configuración de Gráfica
  pieChartLabels: string[] = this.categorias;
  pieChartData: number[] = [0, 0, 0, 0, 0];
  pieChartType = 'doughnut' as const;
  pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false
  };

  constructor(
    private fb: FormBuilder,
    private gastosService: GastosService
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarGastos();
  }

  inicializarFormulario(): void {
    this.gastoForm = this.fb.group({
      fecha: [this.obtenerFechaLocal(), [Validators.required]],
      proveedorBeneficiario: ['', [Validators.required]],
      montoTotal: [null, [Validators.required, Validators.min(0.01)]],
      categoria: ['ALIMENTOS', [Validators.required]]
    });
  }

  obtenerFechaLocal(): string {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  cargarGastos(): void {
    this.cargando = true;
    this.gastosService.listar().subscribe({
      next: (res: any) => {
        this.gastos = res.data || res;
        this.actualizarGrafica();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar gastos:', err);
        this.mensajeError = 'Error al cargar el historial de gastos.';
        this.cargando = false;
      }
    });
  }

  actualizarGrafica(): void {
    this.pieChartData = this.categorias.map(cat => this.obtenerTotalPorCategoria(cat));
  }

  obtenerTotalPorCategoria(categoria: string): number {
    return this.gastos
      .filter(g => g.categoria?.toUpperCase() === categoria.toUpperCase())
      .reduce((sum, g) => sum + Number(g.montoTotal || 0), 0);
  }

  abrirModalCrear(categoria: string = 'ALIMENTOS'): void {
    this.categoriaActiva = categoria;
    this.gastoEnEdicionId = null;
    this.mensajeError = null;

    this.gastoForm.reset({
      fecha: this.obtenerFechaLocal(),
      proveedorBeneficiario: '',
      montoTotal: null,
      categoria: categoria
    });

    this.mostrarModal = true;
  }

  abrirModalEditar(gasto: Gasto): void {
    this.gastoEnEdicionId = String(gasto.id);
    this.categoriaActiva = gasto.categoria || 'ALIMENTOS';
    this.mensajeError = null;

    const fechaFormateada = gasto.fecha ? new Date(gasto.fecha).toISOString().split('T')[0] : this.obtenerFechaLocal();

    this.gastoForm.patchValue({
      fecha: fechaFormateada,
      proveedorBeneficiario: gasto.proveedorBeneficiario,
      montoTotal: gasto.montoTotal,
      categoria: gasto.categoria
    });

    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.gastoEnEdicionId = null;
    this.gastoForm.reset();
  }

  guardarGasto(): void {
    if (this.gastoForm.invalid) return;

    this.cargando = true;
    this.mensajeError = null;

    const payload = {
      ...this.gastoForm.value,
      montoTotal: Number(this.gastoForm.value.montoTotal),
      categoria: this.categoriaActiva
    };

    if (this.gastoEnEdicionId !== null) {
      this.gastosService.actualizar(this.gastoEnEdicionId, payload).subscribe({
        next: (res: any) => {
          const itemActualizado = res.data || res;
          const index = this.gastos.findIndex(g => String(g.id) === this.gastoEnEdicionId);
          if (index !== -1) {
            this.gastos[index] = itemActualizado;
            this.gastos = [...this.gastos];
          }
          this.actualizarGrafica();
          this.cargando = false;
          this.cerrarModal();
        },
        error: (err) => {
          this.cargando = false;
          console.error('Error al actualizar gasto:', err);
          this.mensajeError = 'No se pudo actualizar el registro.';
        }
      });
    } else {
      this.gastosService.crear(payload).subscribe({
        next: (res: any) => {
          const nuevoItem = res.data || res;
          this.gastos = [nuevoItem, ...this.gastos];
          this.actualizarGrafica();
          this.cargando = false;
          this.cerrarModal();
        },
        error: (err) => {
          this.cargando = false;
          console.error('Error al crear gasto:', err);
          this.mensajeError = 'No se pudo guardar el registro.';
        }
      });
    }
  }

  confirmarEliminar(gasto: Gasto): void {
    this.gastoParaEliminar = gasto;
    this.mostrarModalEliminar = true;
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.gastoParaEliminar = null;
  }

  ejecutarEliminacion(): void {
    if (!this.gastoParaEliminar) return;

    const gastoEliminado = this.gastoParaEliminar;
    const id = String(gastoEliminado.id);

    // 1. Eliminación Optimista: Ocultar de la interfaz inmediatamente
    this.gastos = this.gastos.filter(g => String(g.id) !== id);
    this.actualizarGrafica();
    this.cerrarModalEliminar();

    // 2. Ejecutar la petición en segundo plano sin congelar la UI
    this.gastosService.eliminar(id).subscribe({
      next: () => {
        // La eliminación fue exitosa en el servidor
      },
      error: (err) => {
        // 3. Rollback: Si falla el backend, restaurar el registro en la lista
        console.error('Error al eliminar gasto en servidor:', err);
        this.gastos = [gastoEliminado, ...this.gastos];
        this.actualizarGrafica();

        if (err.status === 404) {
          this.mensajeError = 'El registro no existe o ya fue eliminado.';
        } else {
          this.mensajeError = 'No se pudo eliminar el registro en el servidor.';
        }
      }
    });
  }
}