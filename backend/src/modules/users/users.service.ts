import { prisma } from '../../config/prisma';
import { UserResponse, UserKPIs } from './users.types';
import { UpdateUserDTO } from './dto/users.dto';

// 1. Listar todos los usuarios
export async function listarUsuarios(): Promise<UserResponse[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return users.map((u: any) => ({
    id: u.id,
    username: u.username,
    firstName: u.firstName || '',
    lastName: u.lastName || '',
    fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
    email: u.email,
    gender: u.gender || 'OTHER',
    birthDate: u.birthDate,
    phone: u.phone || 'N/A',
    role: u.role,
    isActive: u.isActive ?? true,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    lastLoginAt: u.lastLoginAt,
  }));
}

// 2. Obtener métricas KPI
export async function obtenerKPIs(): Promise<UserKPIs> {
  const [totalUsuarios, usuariosActivos, usuariosInactivos] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: false } }),
  ]);

  return { totalUsuarios, usuariosActivos, usuariosInactivos };
}

// 3. Actualizar un usuario por ID
export async function actualizarUsuario(id: string, data: UpdateUserDTO): Promise<UserResponse> {
  const user = await prisma.user.update({
    where: { id },
    data,
  });

  return {
    ...user,
    fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
  };
}

// 4. Alternar estado (Activo / Inactivo)
export async function toggleEstadoUsuario(id: string): Promise<UserResponse> {
  const actual = await prisma.user.findUnique({ where: { id } });
  if (!actual) throw new Error('Usuario no encontrado');

  return actualizarUsuario(id, { isActive: !actual.isActive });
}

// 5. Soft Delete (Deshabilitar)
export async function softDeleteUsuario(id: string): Promise<UserResponse> {
  return actualizarUsuario(id, { isActive: false });
}