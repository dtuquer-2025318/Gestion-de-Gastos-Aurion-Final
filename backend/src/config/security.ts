import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

/**
 * Configuración de Helmet: headers de seguridad HTTP reforzados.
 * Aplica OWASP Secure Headers y restricciones estrictas de CSP.
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  xFrameOptions: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

/**
 * Limitador de tasa estricto para mitigar ataques de fuerza bruta.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    statusCode: 429,
    message: 'Demasiados intentos de inicio de sesión. Por favor intenta más tarde.',
  },
});