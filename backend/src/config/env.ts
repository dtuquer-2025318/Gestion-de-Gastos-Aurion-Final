import { config } from 'dotenv';

config();

interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  GOOGLE_CLIENT_ID: string;
  NODE_ENV: 'development' | 'production' | 'test';
  FRONTEND_URL: string;
}

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`[ENV] La variable de entorno "${key}" es obligatoria pero no está definida. Verifica tu archivo .env`);
  }
  return value;
}

function validateJwtSecret(secret: string): string {
  if (secret.length < 32) {
    throw new Error(
      '[ENV] JWT_SECRET debe tener al menos 32 caracteres. ' +
      'Genera uno seguro con: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    );
  }
  return secret;
}

export const env: EnvVars = {
  PORT: parseInt(getEnvVar('PORT'), 10) || 3000,
  DATABASE_URL: getEnvVar('DATABASE_URL'),
  JWT_SECRET: validateJwtSecret(getEnvVar('JWT_SECRET')),
  JWT_EXPIRES_IN: getEnvVar('JWT_EXPIRES_IN'),
  GOOGLE_CLIENT_ID: getEnvVar('GOOGLE_CLIENT_ID'),
  NODE_ENV: (process.env.NODE_ENV as EnvVars['NODE_ENV']) || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:4200',
};