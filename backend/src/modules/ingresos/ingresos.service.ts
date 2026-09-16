import { Prisma, TipoIngreso } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { PARAMETROS_FISCALES } from '../../config/parametros-fiscales';
import { DesgloseFiscal, IngresoResponse, IngresoKPIs } from './ingresos.types';
import { CreateIngresoDTO, UpdateIngresoDTO } from './dto';

export async function calcularDesgloseFiscal(
  tipoIngreso: TipoIngreso,
  montoBruto: number,
  userId: string,
  fecha: Date
): Promise<DesgloseFiscal> {
  const bruto = new Prisma.Decimal(montoBruto);

  switch (tipoIngreso) {
    case 'SALARIO': {
      // 1. Cálculo de IGSS Laboral sobre el salario bruto mensual.
      const igss = bruto.mul(PARAMETROS_FISCALES.igssTrabajador);

      // 2. Consulta de acumulado anual de salarios pagados en el mismo año fiscal.
      const inicioAno = new Date(fecha.getFullYear(), 0, 1);
      const finAno = new Date(fecha.getFullYear(), 11, 31, 23, 59, 59);

      const acumuladoPrevio = await prisma.ingreso.aggregate({
        where: {
          userId,
          tipoIngreso: 'SALARIO',
          estado: 'PAGADO',
          fecha: { gte: inicioAno, lte: finAno },
        },
        _sum: { montoBruto: true },
      });

      const montoAcumuladoPrevio = acumuladoPrevio._sum.montoBruto ?? new Prisma.Decimal(0);
      const totalSalarioAnualProyectado = montoAcumuladoPrevio.plus(bruto);

      // 3. Proyección de Renta Imponible Anual (Ley de Actualización Tributaria SAT Guatemala).
      const rentaImponibleAnual = totalSalarioAnualProyectado.minus(
        PARAMETROS_FISCALES.deduccionPersonalIsrAnual
      );

      let isr = new Prisma.Decimal(0);
      if (rentaImponibleAnual.greaterThan(0)) {
        if (rentaImponibleAnual.lessThanOrEqualTo(PARAMETROS_FISCALES.tramoIsrBajo)) {
          isr = rentaImponibleAnual.mul(PARAMETROS_FISCALES.tasaIsrBaja);
        } else {
          const excedente = rentaImponibleAnual.minus(PARAMETROS_FISCALES.tramoIsrBajo);
          isr = new Prisma.Decimal(PARAMETROS_FISCALES.cuotaFijaIsrAlto).plus(
            excedente.mul(PARAMETROS_FISCALES.tasaIsrAlta)
          );
        }
      }

      const neto = bruto.minus(igss).minus(isr);

      return {
        baseImponible: bruto.toNumber(),
        iva: 0,
        isr: Number(isr.toFixed(2)),
        igss: Number(igss.toFixed(2)),
        ivaPendientePago: 0,
        neto: Number(neto.toFixed(2)),
        cuentaComoIngreso: true,
      };
    }

    case 'SERVICIOS_PROFESIONALES': {
      // Retención de ISR sobre honorarios profesionales solo si supera el umbral configurable.
      let isr = new Prisma.Decimal(0);
      if (bruto.greaterThanOrEqualTo(PARAMETROS_FISCALES.umbralRetencionHonorarios)) {
        isr = bruto.mul(PARAMETROS_FISCALES.retencionIsrHonorarios);
      }
      const neto = bruto.minus(isr);

      return {
        baseImponible: bruto.toNumber(),
        iva: 0,
        isr: Number(isr.toFixed(2)),
        igss: 0,
        ivaPendientePago: 0,
        neto: Number(neto.toFixed(2)),
        cuentaComoIngreso: true,
      };
    }

    case 'VENTA': {
      // El IVA contenido en la venta no pertenece al negocio: es una reserva impositiva a trasladar a la SAT.
      const baseImponible = bruto.div(1 + PARAMETROS_FISCALES.tasaIva);
      const ivaPendiente = bruto.minus(baseImponible);

      return {
        baseImponible: Number(baseImponible.toFixed(2)),
        iva: Number(ivaPendiente.toFixed(2)),
        isr: 0,
        igss: 0,
        ivaPendientePago: Number(ivaPendiente.toFixed(2)),
        neto: Number(baseImponible.toFixed(2)),
        cuentaComoIngreso: true,
      };
    }

    case 'ALQUILER': {
      // Arrendamientos tributan en Régimen de Rentas de Capital con tasa propia.
      const isr = bruto.mul(PARAMETROS_FISCALES.isrAlquileres);
      const neto = bruto.minus(isr);

      return {
        baseImponible: bruto.toNumber(),
        iva: 0,
        isr: Number(isr.toFixed(2)),
        igss: 0,
        ivaPendientePago: 0,
        neto: Number(neto.toFixed(2)),
        cuentaComoIngreso: true,
      };
    }

    case 'INTERES': {
      // Rendimientos financieros. Asumido retenido por la entidad bancaria emisora en origen.
      return {
        baseImponible: bruto.toNumber(),
        iva: 0,
        isr: 0,
        igss: 0,
        ivaPendientePago: 0,
        neto: bruto.toNumber(),
        cuentaComoIngreso: true,
      };
    }

    case 'REEMBOLSO': {
      // Un reembolso es una devolución de capital previo. No constituye renta ni hecho generador fiscal.
      return {
        baseImponible: 0,
        iva: 0,
        isr: 0,
        igss: 0,
        ivaPendientePago: 0,
        neto: bruto.toNumber(),
        cuentaComoIngreso: false,
      };
    }

    case 'OTRO': {
      // Ingreso no tipificado formalmente; se registra íntegro sin retenciones automáticas.
      return {
        baseImponible: bruto.toNumber(),
        iva: 0,
        isr: 0,
        igss: 0,
        ivaPendientePago: 0,
        neto: bruto.toNumber(),
        cuentaComoIngreso: true,
      };
    }

    default: {
      const _exhaustiveCheck: never = tipoIngreso;
      throw new Error(`Tipo de ingreso no soportado fiscalmente: ${_exhaustiveCheck}`);
    }
  }
}

const getWhereClause = (userId: string): Prisma.IngresoWhereInput => ({
  OR: [{ userId }, { user: { role: 'ADMIN' } }],
});

export async function listarIngresos(userId: string): Promise<IngresoResponse[]> {
  const ingresos = await prisma.ingreso.findMany({
    where: getWhereClause(userId),
    orderBy: { fecha: 'desc' },
  });

  return ingresos.map((ing) => ({
    ...ing,
    montoBruto: ing.montoBruto.toNumber(),
    igss: ing.igss.toNumber(),
    ivaIsr: ing.ivaIsr.toNumber(),
    ivaPendientePago: ing.ivaPendientePago.toNumber(),
    ingresoNeto: ing.ingresoNeto.toNumber(),
  }));
}

export async function obtenerKPIs(userId: string): Promise<IngresoKPIs> {
  const baseWhere = getWhereClause(userId);

  // Excluir registros ANULADOS, PENDIENTES y REEMBOLSOS del flujo financiero ejecutado
  const wherePagadosValidos: Prisma.IngresoWhereInput = {
    ...baseWhere,
    estado: 'PAGADO',
    tipoIngreso: { not: 'REEMBOLSO' },
  };

  const [brutoAgregado, isrAgregado, igssAgregado, ivaPendienteAgregado] = await Promise.all([
    prisma.ingreso.aggregate({
      where: wherePagadosValidos,
      _sum: { montoBruto: true },
    }),
    prisma.ingreso.aggregate({
      where: wherePagadosValidos,
      _sum: { ivaIsr: true },
    }),
    prisma.ingreso.aggregate({
      where: { ...wherePagadosValidos, tipoIngreso: 'SALARIO' },
      _sum: { igss: true },
    }),
    prisma.ingreso.aggregate({
      where: { ...wherePagadosValidos, tipoIngreso: 'VENTA' },
      _sum: { ivaPendientePago: true },
    }),
  ]);

  const totalIngresosBrutos = brutoAgregado._sum.montoBruto ?? new Prisma.Decimal(0);
  const retencionIsr = isrAgregado._sum.ivaIsr ?? new Prisma.Decimal(0);
  const retencionesIgss = igssAgregado._sum.igss ?? new Prisma.Decimal(0);
  const ivaPendientePago = ivaPendienteAgregado._sum.ivaPendientePago ?? new Prisma.Decimal(0);

  const ingresoNetoReal = totalIngresosBrutos
    .minus(retencionIsr)
    .minus(retencionesIgss)
    .minus(ivaPendientePago);

  return {
    totalIngresosBrutos: totalIngresosBrutos.toNumber(),
    retencionIsr: retencionIsr.toNumber(),
    retencionesIgss: retencionesIgss.toNumber(),
    ivaPendientePago: ivaPendientePago.toNumber(),
    ingresoNetoReal: ingresoNetoReal.toNumber(),
  };
}

export async function crearIngreso(data: CreateIngresoDTO, userId: string): Promise<IngresoResponse> {
  const estado = data.estado ?? 'PAGADO';
  let igss = 0;
  let isr = 0;
  let ivaPendientePago = 0;
  let ingresoNeto = data.montoBruto;

  if (estado === 'PAGADO') {
    const desglose = await calcularDesgloseFiscal(data.tipoIngreso, data.montoBruto, userId, data.fecha);
    igss = desglose.igss;
    isr = desglose.isr;
    ivaPendientePago = desglose.ivaPendientePago;
    ingresoNeto = desglose.neto;
  }

  const creado = await prisma.ingreso.create({
  data: {
      clienteOrigen: data.clienteOrigen,
      descripcion: data.descripcion ?? null,
      categoria: data.categoria,
      tipoIngreso: data.tipoIngreso,
      montoBruto: new Prisma.Decimal(data.montoBruto),
      fecha: data.fecha,
      tipoComprobante: data.tipoComprobante,
      estado,
      igss: new Prisma.Decimal(igss),
      ivaIsr: new Prisma.Decimal(isr),
      ivaPendientePago: new Prisma.Decimal(ivaPendientePago),
      ingresoNeto: new Prisma.Decimal(ingresoNeto),
      userId,
    },
  });

  return {
    ...creado,
    montoBruto: creado.montoBruto.toNumber(),
    igss: creado.igss.toNumber(),
    ivaIsr: creado.ivaIsr.toNumber(),
    ivaPendientePago: creado.ivaPendientePago.toNumber(),
    ingresoNeto: creado.ingresoNeto.toNumber(),
  };
}

export async function actualizarIngreso(
  id: string,
  data: UpdateIngresoDTO,
  userId: string
): Promise<IngresoResponse> {
  return prisma.$transaction(async (tx) => {
    const existente = await tx.ingreso.findFirst({ where: { id } });
    if (!existente) throw new Error('Ingreso no encontrado');

    const montoBruto = data.montoBruto ?? existente.montoBruto.toNumber();
    const tipoIngreso = data.tipoIngreso ?? existente.tipoIngreso;
    const fecha = data.fecha ?? existente.fecha;
    const estado = data.estado ?? existente.estado;

    let igss = 0;
    let isr = 0;
    let ivaPendientePago = 0;
    let ingresoNeto = montoBruto;

    if (estado === 'PAGADO') {
      const desglose = await calcularDesgloseFiscal(tipoIngreso, montoBruto, userId, fecha);
      igss = desglose.igss;
      isr = desglose.isr;
      ivaPendientePago = desglose.ivaPendientePago;
      ingresoNeto = desglose.neto;
    }

    const actualizado = await tx.ingreso.update({
    where: { id },
    data: {
        ...(data.clienteOrigen && { clienteOrigen: data.clienteOrigen }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
        ...(data.categoria && { categoria: data.categoria }),
        ...(data.tipoIngreso && { tipoIngreso: data.tipoIngreso }),
        ...(data.montoBruto !== undefined && { montoBruto: new Prisma.Decimal(data.montoBruto) }),
        ...(data.fecha && { fecha: data.fecha }),
        ...(data.tipoComprobante && { tipoComprobante: data.tipoComprobante }),
        ...(data.estado && { estado: data.estado }),
        igss: new Prisma.Decimal(igss),
        ivaIsr: new Prisma.Decimal(isr),
        ivaPendientePago: new Prisma.Decimal(ivaPendientePago),
        ingresoNeto: new Prisma.Decimal(ingresoNeto),
      },
    });

    return {
      ...actualizado,
      montoBruto: actualizado.montoBruto.toNumber(),
      igss: actualizado.igss.toNumber(),
      ivaIsr: actualizado.ivaIsr.toNumber(),
      ivaPendientePago: actualizado.ivaPendientePago.toNumber(),
      ingresoNeto: actualizado.ingresoNeto.toNumber(),
    };
  });
}

export async function anularIngreso(id: string, userId: string): Promise<IngresoResponse> {
  const actualizado = await prisma.ingreso.updateMany({
    where: { id },
    data: { estado: 'ANULADO' },
  });

  if (actualizado.count === 0) throw new Error('Ingreso no encontrado');

  const reg = await prisma.ingreso.findUnique({ where: { id } });
  if (!reg) throw new Error('Ingreso no encontrado');

  return {
    ...reg,
    montoBruto: reg.montoBruto.toNumber(),
    igss: reg.igss.toNumber(),
    ivaIsr: reg.ivaIsr.toNumber(),
    ivaPendientePago: reg.ivaPendientePago.toNumber(),
    ingresoNeto: reg.ingresoNeto.toNumber(),
  };
}