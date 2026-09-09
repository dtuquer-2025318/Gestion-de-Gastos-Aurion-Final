import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { IngresoResponse, IngresoKPIs } from './ingresos.types';
import { CreateIngresoDTO, UpdateIngresoDTO } from './dto/ingresos.dto';

// Función auxiliar para cálculo de impuestos fiscales
function calcularFiscales(montoBruto: Prisma.Decimal | number, tipoComprobante: string) {
  const bruto = montoBruto instanceof Prisma.Decimal ? montoBruto : new Prisma.Decimal(montoBruto);
  let igss = new Prisma.Decimal(0);
  let ivaIsr = new Prisma.Decimal(0);

  if (tipoComprobante === 'SALARIO') {
    igss = bruto.mul(0.0483);
  } else if (tipoComprobante === 'FACTURA') {
    const baseImponible = bruto.div(1.12);
    const montoIva = bruto.minus(baseImponible);
    const montoIsr = baseImponible.mul(0.05);
    ivaIsr = montoIva.plus(montoIsr);
  }

  const ingresoNeto = bruto.minus(igss).minus(ivaIsr);

  return {
    igss: igss.toDecimalPlaces(2),
    ivaIsr: ivaIsr.toDecimalPlaces(2),
    ingresoNeto: ingresoNeto.toDecimalPlaces(2),
  };
}

// Filtro reutilizable: Ingresos propios O creados por un ADMIN
const getWhereClause = (userId: string): Prisma.IngresoWhereInput => ({
  OR: [
    { userId },
    { user: { role: 'ADMIN' } }
  ]
});

export async function listarIngresos(userId: string): Promise<IngresoResponse[]> {
  return prisma.ingreso.findMany({
    where: getWhereClause(userId),
    orderBy: { fecha: 'desc' },
  }) as Promise<IngresoResponse[]>;
}

export async function obtenerKPIs(userId: string): Promise<IngresoKPIs> {
  const baseWhere = getWhereClause(userId);

  const [brutoAgregado, facturaAgregada, salarioAgregado] = await Promise.all([
    prisma.ingreso.aggregate({
      where: { ...baseWhere, estado: { not: 'ANULADO' } },
      _sum: { montoBruto: true },
    }),
    prisma.ingreso.aggregate({
      where: { ...baseWhere, estado: { not: 'ANULADO' }, tipoComprobante: 'FACTURA' },
      _sum: { ivaIsr: true },
    }),
    prisma.ingreso.aggregate({
      where: { ...baseWhere, estado: { not: 'ANULADO' }, tipoComprobante: 'SALARIO' },
      _sum: { igss: true },
    }),
  ]);

  const totalIngresosBrutos = brutoAgregado._sum.montoBruto ?? new Prisma.Decimal(0);
  const previsionImpuestos = facturaAgregada._sum.ivaIsr ?? new Prisma.Decimal(0);
  const retencionesIgss = salarioAgregado._sum.igss ?? new Prisma.Decimal(0);
  const ingresoNetoReal = totalIngresosBrutos.minus(previsionImpuestos).minus(retencionesIgss);

  return {
    totalIngresosBrutos: totalIngresosBrutos.toNumber(),
    previsionImpuestos: previsionImpuestos.toNumber(),
    retencionesIgss: retencionesIgss.toNumber(),
    ingresoNetoReal: ingresoNetoReal.toNumber(),
  };
}

export async function crearIngreso(data: CreateIngresoDTO, userId: string): Promise<IngresoResponse> {
  const fiscales = calcularFiscales(data.montoBruto, data.tipoComprobante);

  return prisma.ingreso.create({
    data: {
      clienteOrigen: data.clienteOrigen,
      categoria: data.categoria,
      montoBruto: new Prisma.Decimal(data.montoBruto),
      fecha: data.fecha,
      tipoComprobante: data.tipoComprobante,
      estado: data.estado ?? 'PAGADO',
      igss: fiscales.igss,
      ivaIsr: fiscales.ivaIsr,
      ingresoNeto: fiscales.ingresoNeto,
      userId,
    },
  }) as Promise<IngresoResponse>;
}

export async function actualizarIngreso(id: string, data: UpdateIngresoDTO, userId: string): Promise<IngresoResponse> {
  return prisma.$transaction(async (tx) => {
    const existente = await tx.ingreso.findFirst({ where: { id } });
    if (!existente) throw new Error('Ingreso no encontrado');

    const montoBruto = data.montoBruto !== undefined ? data.montoBruto : existente.montoBruto.toNumber();
    const tipo = data.tipoComprobante ?? existente.tipoComprobante;
    const fiscales = calcularFiscales(montoBruto, tipo);

    return tx.ingreso.update({
      where: { id },
      data: {
        ...(data.clienteOrigen && { clienteOrigen: data.clienteOrigen }),
        ...(data.categoria && { categoria: data.categoria }),
        ...(data.montoBruto !== undefined && { montoBruto: new Prisma.Decimal(data.montoBruto) }),
        ...(data.fecha && { fecha: data.fecha }),
        ...(data.tipoComprobante && { tipoComprobante: data.tipoComprobante }),
        ...(data.estado && { estado: data.estado }),
        igss: fiscales.igss,
        ivaIsr: fiscales.ivaIsr,
        ingresoNeto: fiscales.ingresoNeto,
      },
    }) as Promise<IngresoResponse>;
  });
}

export async function anularIngreso(id: string, userId: string): Promise<IngresoResponse> {
  const actualizado = await prisma.ingreso.updateMany({
    where: { id },
    data: { estado: 'ANULADO' },
  });

  if (actualizado.count === 0) throw new Error('Ingreso no encontrado');

  return prisma.ingreso.findUnique({ where: { id } }) as Promise<IngresoResponse>;
}