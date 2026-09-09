import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { AppError } from '../../middleware/error.middleware';
import type { LoginDTO } from './dto/login.dto';
import type { RegisterDTO } from './dto/register.dto';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export class AuthService {
  static async register(data: RegisterDTO) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new AppError('El correo electrónico ya está registrado.', 409);
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUsername) {
      throw new AppError('El nombre de usuario ya está en uso.', 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        gender: data.gender,
        birthDate: new Date(data.birthDate),
        phone: data.phone,
      },
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    };
  }

  static async login(data: LoginDTO) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError('Credenciales incorrectas.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Tu cuenta se encuentra deshabilitada. Contacta al administrador.', 403);
    }

    if (!user.password) {
      throw new AppError('Esta cuenta fue registrada con Google. Por favor inicia sesión con Google.', 400);
    }

    const isMatch = await bcrypt.compare(data.password, user.password);

    if (!isMatch) {
      throw new AppError('Credenciales incorrectas.', 401);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    const token = this.generateToken(updatedUser.id, updatedUser.email, updatedUser.role);

    return {
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        lastLoginAt: updatedUser.lastLoginAt,
      },
      token,
    };
  }

  static async googleLogin(idToken: string) {
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
    } catch (error) {
      throw new AppError('El token de Google es inválido o ha expirado.', 401);
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new AppError('No se pudo verificar la información de la cuenta de Google.', 400);
    }

    const { email, sub: googleId, given_name, family_name } = payload;

    // 1. Verificar si la cuenta de Google ya está vinculada
    const existingAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: googleId,
        },
      },
      include: { user: true },
    });

    if (existingAccount) {
      if (!existingAccount.user.isActive) {
        throw new AppError('Tu cuenta se encuentra deshabilitada. Contacta al administrador.', 403);
      }

      const updatedUser = await prisma.user.update({
        where: { id: existingAccount.user.id },
        data: { lastLoginAt: new Date() },
      });

      const token = this.generateToken(updatedUser.id, updatedUser.email, updatedUser.role);

      return {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          role: updatedUser.role,
          lastLoginAt: updatedUser.lastLoginAt,
        },
        token,
      };
    }

    // 2. Opción B: Si el email ya existe por registro con contraseña, bloquear el ingreso
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError(
        'Ya existe una cuenta asociada a este correo. Por favor inicie sesión con su contraseña.',
        409
      );
    }

    // 3. Crear nuevo usuario OAuth
    const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const username = `${baseUsername}${randomSuffix}`;

    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        firstName: given_name || 'Usuario',
        lastName: family_name || 'Google',
        isActive: true,
        lastLoginAt: new Date(),
        accounts: {
          create: {
            provider: 'google',
            providerAccountId: googleId,
          },
        },
      },
    });

    const token = this.generateToken(newUser.id, newUser.email, newUser.role);

    return {
      user: {
        id: newUser.id,
        username: newUser.username,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        lastLoginAt: newUser.lastLoginAt,
      },
      token,
    };
  }

  private static generateToken(userId: string, email: string, role: string): string {
    return jwt.sign(
      { sub: userId, email, role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        gender: true,
        phone: true,
        birthDate: true,
        isActive: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new AppError('Usuario no encontrado.', 404);
    }

    if (!user.isActive) {
      throw new AppError('Tu cuenta se encuentra deshabilitada.', 403);
    }

    return user;
  }
}