import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { CreateMetaDTO, CreateMovimientoDTO } from './dto/ahorro.dto';
import { MetaAhorroResponse, MovimientoAhorroResponse, ProgresoMeta } from './ahorro.types';

export async function calcularProgreso(metaId: string): Promise<ProgresoMeta> {
  const meta = await prisma.metaAhorro.findUnique({ where: { id: metaId } });
  if (!meta) throw new Error('Meta de ahorro no encontrada');

  const aportesResult = await prisma.movimientoAhorro.aggregate({
    _sum: { monto: true },
    where: { metaId, tipo: 'APORTE' },
  });

  const retirosResult = await prisma.movimientoAhorro.aggregate({
    _sum: { monto: true },
    where: { metaId, tipo: 'RETIRO' },
  });

  const totalAportes = Number(aportesResult._sum.monto ?? 0);
  const totalRetiros = Number(retirosResult._sum.monto ?? 0);

  const ahorrado = Math.max(0, totalAportes - totalRetiros);
  const montoMetaNum = Number(meta.montoMeta);
  const restante = Math.max(0, montoMetaNum - ahorrado);
  const porcentaje = Math.min(100, montoMetaNum > 0 ? (ahorrado / montoMetaNum) * 100 : 0);

  // Determinar el estado en función del saldo actual real
  const estadoCalculado = ahorrado >= montoMetaNum ? 'COMPLETADA' : 'ACTIVA';

  return {
    montoMeta: montoMetaNum,
    ahorrado: Number(ahorrado.toFixed(2)),
    restante: Number(restante.toFixed(2)),
    porcentaje: Number(porcentaje.toFixed(2)),
    estado: estadoCalculado,
  };
}

export async function listarMetas(userId: string): Promise<MetaAhorroResponse[]> {
  const metas = await prisma.metaAhorro.findMany({
    where: { usuarioId: userId },
    orderBy: { createdAt: 'desc' },
  });

  return await Promise.all(
    metas.map(async (m) => {
      const progreso = await calcularProgreso(m.id);
      
      // Sincronizar estado en DB si hubo discrepancias previas
      if (m.estado !== progreso.estado) {
        await prisma.metaAhorro.update({
          where: { id: m.id },
          data: { estado: progreso.estado },
        });
      }

      return {
        ...m,
        userId: m.usuarioId,
        updatedAt: m.createdAt,
        montoMeta: Number(m.montoMeta),
        estado: progreso.estado,
        progreso,
      };
    })
  );
}

export async function crearMeta(data: CreateMetaDTO, userId: string): Promise<MetaAhorroResponse> {
  const nueva = await prisma.metaAhorro.create({
    data: {
      nombre: data.nombre,
      montoMeta: new Prisma.Decimal(data.montoMeta),
      usuarioId: userId,
    },
  });

  const montoMetaNum = Number(nueva.montoMeta);

  return {
    ...nueva,
    userId: nueva.usuarioId,
    updatedAt: nueva.createdAt,
    montoMeta: montoMetaNum,
    progreso: {
      montoMeta: montoMetaNum,
      ahorrado: 0,
      restante: montoMetaNum,
      porcentaje: 0,
      estado: nueva.estado,
    },
  };
}

export async function registrarMovimiento(
  metaId: string,
  data: CreateMovimientoDTO,
  userId: string
): Promise<{ movimiento: MovimientoAhorroResponse; progresoActualizado: ProgresoMeta }> {
  const meta = await prisma.metaAhorro.findFirst({ where: { id: metaId, usuarioId: userId } });
  if (!meta) throw new Error('La meta de ahorro no existe o no pertenece al usuario');

  const progresoActual = await calcularProgreso(metaId);
  if (data.tipo === 'RETIRO' && data.monto > progresoActual.ahorrado) {
    throw new Error(`Saldo insuficiente. Intentas retirar Q${data.monto}, disponible: Q${progresoActual.ahorrado}`);
  }

  const mov = await prisma.movimientoAhorro.create({
    data: {
      metaId,
      tipo: data.tipo,
      monto: new Prisma.Decimal(data.monto),
      descripcion: data.descripcion ?? null,
    },
  });

  const nuevoProgreso = await calcularProgreso(metaId);

  // Actualizar estado en la base de datos si cambia tras el aporte o retiro
  const nuevoEstado = nuevoProgreso.ahorrado >= nuevoProgreso.montoMeta ? 'COMPLETADA' : 'ACTIVA';
  if (meta.estado !== nuevoEstado) {
    await prisma.metaAhorro.update({
      where: { id: metaId },
      data: { estado: nuevoEstado },
    });
  }

  nuevoProgreso.estado = nuevoEstado;

  return {
    movimiento: { ...mov, monto: Number(mov.monto) },
    progresoActualizado: nuevoProgreso,
  };
}

export async function obtenerHistorial(metaId: string, userId: string): Promise<MovimientoAhorroResponse[]> {
  const meta = await prisma.metaAhorro.findFirst({ where: { id: metaId, usuarioId: userId } });
  if (!meta) throw new Error('La meta de ahorro no existe');

  const movimientos = await prisma.movimientoAhorro.findMany({
    where: { metaId },
    orderBy: { fecha: 'desc' },
  });

  return movimientos.map((m) => ({ ...m, monto: Number(m.monto) }));
}