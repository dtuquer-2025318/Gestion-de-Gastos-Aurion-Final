import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { CreateGastoDTO, UpdateGastoDTO } from './dto/gastos.dto';
import { GastoResponse, GastosKPIs } from './gastos.types';

export async function listarGastos(userId: string): Promise<GastoResponse[]> {
  const gastos = await prisma.gasto.findMany({
    where: { userId, estado: { not: 'ANULADO' } },
    orderBy: { fecha: 'desc' },
  });

  return gastos.map((g) => ({
    ...g,
    montoTotal: Number(g.montoTotal),
  }));
}

export async function obtenerKPIs(userId: string): Promise<GastosKPIs> {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

  // Suma total de gastos en el mes actual
  const totalMes = await prisma.gasto.aggregate({
    where: {
      userId,
      fecha: { gte: inicioMes },
      estado: { not: 'ANULADO' },
    },
    _sum: { montoTotal: true },
    _count: { id: true },
  });

  const montoTotal = totalMes._sum.montoTotal ? Number(totalMes._sum.montoTotal) : 0;
  
  // Presupuesto mensual de referencia (Q 10,000.00 para gastos personales)
  const presupuestoBase = 10000;
  const porcentaje = Math.min(Math.round((montoTotal / presupuestoBase) * 100), 100);

  return {
    gastoTotalMes: montoTotal,
    presupuestoUtilizadoPorcentaje: porcentaje,
    totalRegistrosMes: totalMes._count.id,
  };
}

export async function crearGasto(data: CreateGastoDTO, userId: string): Promise<GastoResponse> {
  const nuevo = await prisma.gasto.create({
    data: {
      fecha: data.fecha,
      proveedorBeneficiario: data.proveedorBeneficiario,
      categoria: data.categoria,
      montoTotal: new Prisma.Decimal(data.montoTotal),
      estado: data.estado,
      comprobanteUrl: data.comprobanteUrl,
      userId,
    },
  });

  return { ...nuevo, montoTotal: Number(nuevo.montoTotal) };
}

export async function actualizarGasto(
  id: string,
  data: UpdateGastoDTO,
  userId: string
): Promise<GastoResponse> {
  const existente = await prisma.gasto.findFirst({ where: { id, userId } });
  if (!existente) throw new Error('El gasto no fue encontrado');

  const actualizado = await prisma.gasto.update({
    where: { id },
    data: {
      ...data,
      ...(data.montoTotal !== undefined && { montoTotal: new Prisma.Decimal(data.montoTotal) }),
    },
  });

  return { ...actualizado, montoTotal: Number(actualizado.montoTotal) };
}

export async function eliminarGasto(id: string, userId: string): Promise<void> {
  const existente = await prisma.gasto.findFirst({ where: { id, userId } });
  if (!existente) throw new Error('El gasto a eliminar no existe');

  await prisma.gasto.delete({
    where: { id },
  });
}