import { Role, Gender } from '@prisma/client';

export interface UserResponse {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  role: string;
  gender: Gender;
  birthDate: Date | null; // <-- Asegúrate de agregar "| null" aquí
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
  failedAttempts?: number;
  lockedUntil?: Date | null;
}

export interface UserKPIs {
  totalUsuarios: number;
  usuariosActivos: number;
  usuariosInactivos: number;
}