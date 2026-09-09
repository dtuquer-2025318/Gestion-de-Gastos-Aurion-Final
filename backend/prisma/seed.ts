import { PrismaClient, Role, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Generar contraseñas encriptadas para los usuarios iniciales
  const hashedAdminPassword = await bcrypt.hash('Admin#2026Secure', 12);
  const hashedUserPassword = await bcrypt.hash('User#2026Secure', 12);

  // 1. Crear Usuario Administrador
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aurion.com' },
    update: {},
    create: {
      username: 'admin_aurion',
      firstName: 'Administrador',
      lastName: 'Sistema',
      email: 'admin@aurion.com',
      password: hashedAdminPassword,
      gender: Gender.PREFER_NOT_TO_SAY,
      birthDate: new Date('1990-01-01'),
      phone: '12345678',
      role: Role.ADMIN,
    },
  });

  // 2. Crear Usuario Estándar
  const user = await prisma.user.upsert({
    where: { email: 'usuario@aurion.com' },
    update: {},
    create: {
      username: 'usuario_demo',
      firstName: 'Carlos',
      lastName: 'Mendoza',
      email: 'usuario@aurion.com',
      password: hashedUserPassword,
      gender: Gender.MALE,
      birthDate: new Date('2000-05-15'),
      phone: '87654321',
      role: Role.USER,
    },
  });

  console.log('Seed completado con éxito:');
  console.log('ADMIN creado:', admin.email);
  console.log('USER creado:', user.email);
}

main()
  .catch((e) => {
    console.error('Error durante la ejecución del seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });