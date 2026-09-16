# AURION — Gestión de Gastos e Ingresos (v2.0)
 
Sistema full-stack para control fiscal y visualización de ingresos, gastos, ahorro y usuarios, diseñado bajo el sistema de diseño AURION v2.0. Soporta la normativa tributaria de Guatemala (IVA 12%, ISR 5%, IGSS 4.83%), control de acceso por roles (RBAC) y una arquitectura zoneless en el frontend basada en Signals.
 
> **Nota rápida:** Este proyecto usa `pnpm` exclusivamente. No uses `npm` ni `yarn` porque el lockfile y los scripts están calibrados para pnpm.
 
---
 
## ¿Qué hace esto?
 
Es una aplicación de gestión financiera con dos perfiles de usuario:
 
- **Administrador:** acceso total. Puede crear, editar y anular ingresos, gestionar egresos por categorías, administrar fondos de contingencia (ahorro) y controlar cuentas de usuario. Ve todos los KPIs y gráficos en tiempo real.
- **Usuario estándar:** modo lectura. Puede consultar información y reportes, pero tiene deshabilitada cualquier mutación de datos (crear, editar, anular o eliminar).
El backend calcula automáticamente las deducciones fiscales según el tipo de ingreso (factura o planilla) y el frontend presenta todo de forma visual con gráficos SVG nativos y tarjetas interactivas, sin depender de librerías externas de charts.
 
---
 
## Novedades y Cambios Implementados (v2.0)
 
Esta versión reestructura la arquitectura central del sistema, expande la cobertura de módulos y refuerza la seguridad y el tipado general:
 
- **Renombre del dominio:** el módulo `income` pasó a llamarse `ingresos` tanto en backend como en frontend, garantizando coherencia idiomática en el código (rutas, DTOs, servicios e interfaces).
- **Tipado más estricto:** se centralizaron las interfaces (`auth.model.ts`, `ingresos.model.ts`, `ingresos.types.ts`, `ahorro.model.ts`) y se eliminó cualquier uso residual de `any`.
- **Configuración fiscal centralizada:** creación de `backend/src/config/parametros-fiscales.ts` para abstraer las constantes y reglas de cálculo tributario (IVA 12%, ISR 5%, IGSS 4.83%), evitando valores fijos dispersos en el código de negocio.
- **Cálculo fiscal en tiempo real:** el desglose de Base Imponible, IVA, ISR e IGSS se refleja dinámicamente en los formularios del frontend y en la respuesta de los endpoints, sin requerir guardado previo del registro.
- **Módulo de Gastos e Historial:** implementación completa de servicios (`gastos.service.ts`) y vistas para categorización de egresos (Alimentos, Hogar, Ropa, Vehículo, Otros) y tarjetas por método de pago.
- **Módulo de Ahorro para Emergencia:** arquitectura de reserva estratégica (`ahorro.service.ts`, `ahorro.model.ts`) con seguimiento de metas, aportes, retiros y barra de progreso porcentual.
- **Gestor de Usuarios y Control de Acceso (RBAC):** panel interactivo (`users.service.ts`) para altas, bajas, conmutación de estado (Activo/Inactivo) y asignación de roles.
- **RBAC reforzado:** el middleware `requireAdmin` se formalizó como `roleMiddleware(['ADMIN'])`, reutilizable en todos los módulos para esquemas de permisos granulares.
- **Sesión e inactividad:** `SessionService` integrado con la Page Visibility API y `jwt-decode` para el cierre automático por expiración o inactividad.
- **Zoneless al 100%:** retiro total de `zone.js`; la aplicación corre sobre `provideZonelessChangeDetection()`.
---

## Arquitectura

```
gestion-de-gastos/
├── backend/                          # API REST (Node + TypeScript + Express + Prisma)
│   ├── prisma/
│   │   ├── migrations/               # Historial de migraciones SQL
│   │   ├── schema.prisma             # Modelo de datos (User, Ingreso, Gasto, MetaAhorro,
│   │   │                             #   MovimientoAhorro, Role, Categoria, Comprobante, Estado)
│   │   └── seed.ts                   # Datos iniciales de prueba (Admin y registros base)
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts                # Validación estricta de variables de entorno
│   │   │   ├── prisma.ts             # Cliente Prisma singleton
│   │   │   ├── security.ts           # Configuración de Helmet y Rate Limiting
│   │   │   └── parametros-fiscales.ts # Tasas y reglas tributarias centralizadas (IVA/ISR/IGSS)
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts    # Verificación JWT + extracción de usuario
│   │   │   ├── role.middleware.ts    # roleMiddleware(['ADMIN']) para protección de mutaciones HTTP
│   │   │   └── error.middleware.ts   # Manejo centralizado de errores (AppError, Zod, Prisma, JWT)
│   │   ├── modules/
│   │   │   ├── auth/                 # Módulo de autenticación (login, registro, perfil)
│   │   │   ├── ingresos/             # Módulo de ingresos y cálculos fiscales
│   │   │   │   ├── dto/              # Esquemas Zod (crearIngresoDto, actualizarIngresoDto)
│   │   │   │   ├── ingresos.controller.ts # Endpoints REST de ingresos y KPIs
│   │   │   │   ├── ingresos.routes.ts     # Definición de rutas protegidas por roles
│   │   │   │   └── ingresos.service.ts    # Lógica de negocio, deducciones fiscales y KPIs
│   │   │   ├── gastos/               # Módulo de egresos por categoría
│   │   │   │   ├── dto/              # Esquemas Zod (crearGastoDto, actualizarGastoDto)
│   │   │   │   ├── gastos.controller.ts   # Endpoints REST de gastos y totales por categoría
│   │   │   │   ├── gastos.routes.ts       # Definición de rutas protegidas por roles
│   │   │   │   └── gastos.service.ts      # Lógica de categorización y agregación de totales
│   │   │   ├── ahorro/               # Módulo de fondos de contingencia (ahorro)
│   │   │   │   ├── dto/              # Esquemas Zod (crearMetaDto, crearMovimientoDto)
│   │   │   │   ├── ahorro.controller.ts   # Endpoints REST de metas y movimientos
│   │   │   │   ├── ahorro.routes.ts       # Definición de rutas protegidas por roles
│   │   │   │   └── ahorro.service.ts      # Cálculo de progreso, aportes y retiros
│   │   │   └── usuarios/             # Módulo de administración de cuentas (RBAC)
│   │   │       ├── dto/              # Esquemas Zod (actualizarRolDto, actualizarEstadoDto)
│   │   │       ├── usuarios.controller.ts # Endpoints REST de gestión de usuarios
│   │   │       ├── usuarios.routes.ts     # Definición de rutas protegidas por roles
│   │   │       └── usuarios.service.ts    # Altas, bajas, cambio de estado y roles
│   │   ├── utils/                    # Validador de archivos subidos y helpers
│   │   └── index.ts                  # Punto de entrada principal de la API
│   ├── .env                          # Variables de entorno locales
│   ├── package.json                  # Dependencias + scripts (pnpm)
│   └── tsconfig.json                 # TypeScript strict mode
│
└── frontend/                         # SPA (Angular standalone, zoneless)
    ├── src/
    │   ├── app/
    │   │   ├── core/                         # Lógica global (singleton, infraestructura)
    │   │   │   ├── guards/                   # Protecciones de rutas por JWT (AuthGuard, RoleGuard)
    │   │   │   ├── interceptors/             # Adjunta Bearer token + captura de 401/403
    │   │   │   ├── models/                   # Interfaces TypeScript (auth.model.ts, ingresos.model.ts,
    │   │   │   │                             #   gastos.model.ts, ahorro.model.ts)
    │   │   │   └── services/
    │   │   │       ├── auth.service.ts       # Autenticación, signals de usuario y perfil
    │   │   │       ├── session.service.ts    # Control de inactividad y expiración
    │   │   │       ├── ingresos.service.ts   # Peticiones HTTP de ingresos y cálculo de KPIs
    │   │   │       ├── gastos.service.ts     # Peticiones HTTP de gastos y totales por categoría
    │   │   │       ├── ahorro.service.ts     # Peticiones HTTP de metas, aportes y retiros
    │   │   │       └── users.service.ts      # Peticiones HTTP de gestión de usuarios (RBAC)
    │   │   ├── features/                     # Módulos de pantalla
    │   │   │   ├── auth/
    │   │   │   │   ├── login/                # Componente de login (alertas estandarizadas en 3ª persona)
    │   │   │   │   └── register/             # Componente de registro de usuarios
    │   │   │   └── dashboard/
    │   │   │       ├── dashboard.component.ts # Layout principal, topbar, sidebar dinámico
    │   │   │       ├── inicio/               # Vista resumida y estadísticas iniciales
    │   │   │       ├── ingresos/             # CRUD de ingresos (modal, KPIs, filtros, soft delete)
    │   │   │       ├── gastos/               # CRUD de gastos (tarjetas por categoría, gráfico circular)
    │   │   │       ├── ahorro/               # Metas de ahorro, aportes/retiros y barra de progreso
    │   │   │       └── usuarios/             # Panel RBAC: búsqueda, roles y estado de cuentas
    │   │   ├── app.routes.ts                 # Rutas con lazy loading y guards
    │   │   └── app.config.ts                 # Configuración zoneless + HttpClient
    │   ├── environments/                     # Variables de entorno (development / production)
    │   └── styles.css                        # Sistema de diseño AURION v2.0
    ├── angular.json
    └── package.json
```

El backend sigue una estructura por módulos autocontenidos. Cada módulo tiene su propia capa de validación (Zod), lógica de negocio (service) y presentación (controller). El frontend usa Angular standalone con change detection zoneless (sin zone.js), signals para estado reactivo y RxJS solo para HTTP.

---

## Stack
 
### Backend
- **Node.js 22.x**
- **TypeScript 5.6+** (strict mode)
- **Express 4.21+**
- **Prisma 5.20+** + PostgreSQL 14+
- **Zod** para validación de inputs
- **JWT** (jsonwebtoken) + BCryptJS para auth
- **Helmet** + **express-rate-limit** para headers de seguridad y protección contra fuerza bruta
### Frontend
- **Angular 22** (standalone components, zoneless, Signals)
- **TypeScript 6.0.2**
- **RxJS 7.8** (solo para peticiones HTTP)
- **Bootstrap 5.3.8** + Bootstrap Icons
- **jwt-decode** para monitorear expiración de token en el cliente
### Dev
- **pnpm 11.15.1** (gestor de paquetes obligatorio)
- **Angular CLI 22.0.8**
- **Nodemon** + **ts-node** para desarrollo backend
---

## Antes de empezar
 
Necesitas esto instalado:
 
```bash
node -v      # v22.23.1 o superior
pnpm -v      # 11.15.1
psql --version  # PostgreSQL 14+
```
 
Si no tienes pnpm:
```bash
npm install -g pnpm
```
 
---
 
## Backend
 
### 1. Crear la base de datos
 
```bash
psql -U postgres
```
 
```sql
CREATE DATABASE aurion_db;
```
 
### 2. Instalar dependencias
 
```bash
cd backend
pnpm install
```
 
Instala las dependencias de seguridad (no vienen en el package.json base por si prefieres configurarlas manualmente):
 
```bash
pnpm add express-rate-limit helmet
pnpm add -D @types/express-rate-limit
```
 
### 3. Configurar variables de entorno
 
```bash
cp .env.example .env
```
 
Edita `.env`:
 
```env
PORT=3000
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/aurion_db?schema=public"
JWT_SECRET=""  # Genera esto con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_EXPIRES_IN="1h"
NODE_ENV="development"
FRONTEND_URL="http://localhost:4200"
```
 
> **Importante:** el JWT_SECRET debe tener mínimo 64 caracteres hex. No lo inventes a mano, usa el comando de arriba. Y nunca subas `.env` a Git.
 
### 4. Generar Prisma Client y migrar
 
```bash
pnpm prisma generate
pnpm prisma migrate dev --name init
```
 
### 5. (Opcional) Cargar datos de prueba
 
```bash
pnpm ts-node prisma/seed.ts
```
 
Esto crea un usuario admin y algunos registros base para que no empieces con tablas vacías.
 
### 6. Levantar servidor
 
```bash
pnpm dev
```
 
Deberías ver algo como:
 
```
🚀 Servidor backend escuchando en: http://localhost:3000
🩺 Health check: http://localhost:3000/api/v1/health
🌐 CORS habilitado para: http://localhost:4200
📝 Entorno: development
```
 
### 7. Probar la API rápidamente
 
```bash
# Health check
curl http://localhost:3000/api/v1/health
 
# Registro
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan Pérez","email":"juan@aurion.com","password":"Aurion2026!"}'
 
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@aurion.com","password":"Aurion2026!"}'
```
 
Si quieres explorar la base de datos visualmente:
```bash
pnpm prisma studio
```
 
---
 
## Frontend
 
### 1. Instalar Angular CLI (si no lo tienes)
 
```bash
pnpm add -g @angular/cli@22.1.4
```
 
### 2. Instalar dependencias
 
```bash
cd frontend
pnpm install
```
 
> **Ojo:** si `zone.js` aparece en las dependencias, elimínalo. Este proyecto usa `provideZonelessChangeDetection()` y zone.js solo te dará problemas:
> ```bash
> pnpm remove zone.js
> ```
 
### 3. Configurar entorno
 
Edita `frontend/src/environments/environment.ts`:
 
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  inactivityTimeoutMinutes: 2,
};
```
 
Para producción, edita `environment.prod.ts`:
 
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-dominio.com/api/v1',
  inactivityTimeoutMinutes: 5,
};
```
 
### 4. Levantar en desarrollo
 
```bash
pnpm start
```
 
Abre `http://localhost:4200`.
 
---
 
## Flujo de prueba recomendado
 
1. Ve a `/register` y crea una cuenta. La contraseña necesita mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.
2. Inicia sesión en `/login`.
3. Explora el dashboard: fíjate en el sidebar, las tarjetas de KPIs y el gráfico de barras SVG.
4. El header debe mostrar tu nombre real y tu rol (Admin o Usuario).
5. Con un usuario **Admin**, registra un ingreso, un gasto por categoría y crea una meta de ahorro con un aporte — verifica que las tarjetas KPI de cada módulo se actualicen en tiempo real.
6. Con un usuario **estándar**, confirma que las acciones de creación/edición/anulación están deshabilitadas y que solo puede consultar información.
7. Cambia de pestaña del navegador y espera el tiempo configurado en `inactivityTimeoutMinutes`. La sesión se cierra automáticamente por inactividad (usa la Page Visibility API + expiración del JWT).
8. Vuelve a la pestaña: deberías ver el mensaje de cierre por inactividad en el login.
---
 
## Detalle de Módulos Implementados
 
### 1. Módulo de Ingresos (`/ingresos`)
 
- **KPIs en tiempo real:** Total Ingresos Brutos, Previsión Impuestos (IVA/ISR), Retenciones IGSS e Ingreso Neto Real.
- **Cálculo tributario:** procesamiento automático según el tipo de comprobante (Factura o Planilla), usando las tasas centralizadas en `parametros-fiscales.ts`.
- **Anulación lógica (soft delete):** permite anular transacciones manteniendo el registro visual en la tabla (estilo tachado), mientras se restan automáticamente los montos de los indicadores.
### 2. Módulo de Gastos (`/gastos`)
 
- **Categorización:** clasificación en Alimentos, Hogar, Ropa, Vehículo y Otros.
- **Visualización:** tarjetas con el total consumido en Quetzales (Q), botón de registro directo (+) y gráfico circular de distribución porcentual.
- **Historial:** listado detallado con badges según método de pago (Efectivo, Tarjeta de Crédito, Débito), con soporte de edición y eliminación.
### 3. Módulo de Ahorro para Emergencia (`/ahorro`)
 
- **Gestión de planes:** monitoreo de fondos estratégicos de contingencia, con estado (ACTIVA/FINALIZADA).
- **Indicador de progreso:** cálculo automático del porcentaje acumulado sobre la meta total.
- **Operaciones:** flujos de aportes (+ Aporte), retiros (− Retiro) y creación de nuevas metas financieras.
### 4. Módulo de Control de Usuarios (`/usuarios`)
 
- **Administración RBAC:** panel exclusivo para consultar y gestionar operadores del sistema.
- **Indicadores:** tarjetas con el conteo de Total Usuarios, Usuarios Activos e Inactivos.
- **Operaciones directas:** búsqueda en tiempo real, cambio de estado (Activo/Inactivo), reasignación de roles (ADMIN/USER) y restablecimiento de accesos.
---
 
## Cálculos fiscales implementados
 
Las tasas y umbrales de esta tabla viven en `backend/src/config/parametros-fiscales.ts`, no como constantes sueltas en el código de negocio.
 
| Tipo de comprobante | Base imponible | IVA (12%) | ISR (5%) | IGSS (4.83%) | Previsión fiscal total |
|---|---|---|---|---|---|
| **Factura** (Servicios, Productos, Consultoría, Otros) | Monto Bruto / 1.12 | Monto Bruto − Base Imponible | Base Imponible × 0.05 | N/A | IVA + ISR |
| **Planilla** (Salarios) | Monto Bruto | Q 0.00 | Q 0.00 | Monto Bruto × 0.0483 | Q 0.00 (se registra el IGSS aparte) |
 
### Anulación lógica (soft delete)
 
Cuando un admin anula un ingreso, el registro sigue visible en la lista con estilo tachado y badge "ANULADO", pero sus valores se descuentan automáticamente de los KPIs globales. Esto mantiene el historial contable intacto.
 
---
 
## Scripts disponibles
 
### Backend
 
| Script | Comando | Qué hace |
|---|---|---|
| Dev | `pnpm dev` | Nodemon + ts-node con hot-reload |
| Build | `pnpm build` | Compila TypeScript a `dist/` |
| Start | `pnpm start` | Ejecuta el build compilado |
| Prisma Generate | `pnpm prisma:generate` | Genera cliente Prisma tipado |
| Prisma Migrate | `pnpm prisma:migrate` | Crea y aplica migraciones |
| Prisma Studio | `pnpm prisma:studio` | UI visual de la base de datos |
| Seed | `pnpm seed` | Ejecuta datos de prueba |
 
### Frontend
 
| Script | Comando | Qué hace |
|---|---|---|
| Dev | `pnpm start` | Servidor Angular en `localhost:4200` |
| Build | `pnpm build` | Build de producción optimizado |
| Watch | `pnpm watch` | Build en modo observación |
| Test | `pnpm test` | Suite de pruebas unitarias |
 
---
 
## Seguridad y buenas prácticas
 
- **Validación doble:** Zod valida en el backend antes de tocar la base de datos. El frontend también valida en tiempo real para dar feedback inmediato.
- **Hashing:** BCrypt con 12 salt rounds. Mensajes de error genéricos en login para evitar enumeración de usuarios.
- **Rate limiting:** máximo 5 intentos de login fallidos por IP cada 15 minutos.
- **Helmet:** headers de seguridad HTTP activados por defecto (XSS, clickjacking, MIME sniffing).
- **RBAC transversal:** el middleware `roleMiddleware(['ADMIN'])` bloquea mutaciones HTTP (POST, PUT, DELETE) a usuarios estándar en **todos** los módulos (ingresos, gastos, ahorro, usuarios), devolviendo 403.
- **Aislamiento por usuario:** toda consulta se filtra por el `usuario_id` extraído del JWT, nunca por un valor recibido en el cuerpo de la petición, evitando que los datos de un usuario se mezclen con los de otro.
- **Errores centralizados:** un solo middleware captura errores de Zod, Prisma, JWT e internos. En producción nunca se expone el stack trace.
- **Sesión inteligente:** el frontend monitorea la expiración del JWT con `jwt-decode` y usa la Page Visibility API para detectar inactividad al cambiar de pestaña.
---
 
## Convenciones del proyecto
 
- **pnpm exclusivo.** No uses npm ni yarn.
- **TypeScript strict mode** en backend y frontend.
- **Archivos:** `kebab-case` (ej: `auth.service.ts`, `ahorro.service.ts`). **Clases:** `PascalCase` (ej: `AuthService`).
- **Barrel exports:** cada carpeta `dto/` tiene un `index.ts` para importaciones limpias.
- **Sin `any`:** usa tipos explícitos o `unknown` cuando sea necesario.
- **Alertas:** los mensajes de alerta se redactan en tercera persona y sin botón de cierre desalineado (ej. "Su sesión se cerró por inactividad...", "Verifique sus credenciales...").
- **Dominio en español:** los módulos de negocio y sus derivados (rutas, servicios, componentes) se nombran en español (`ingresos`, `gastos`, `ahorro`, `usuarios`) para mantener consistencia idiomática en todo el proyecto.
- **Cada módulo nuevo replica la estructura de `ingresos/`:** `dto/`, `<módulo>.controller.ts`, `<módulo>.routes.ts`, `<módulo>.service.ts` — esto es lo que permitió incorporar Gastos, Ahorro y Usuarios sin romper el patrón existente.
---
 
## Escalabilidad
 
La arquitectura está pensada para agregar módulos sin tocar lo existente:
 
1. **Nuevo módulo backend:** crea carpeta en `src/modules/nuevo-modulo/` con su `dto/`, `controller.ts`, `service.ts`, `routes.ts`.
2. **Nueva feature frontend:** crea carpeta en `src/app/features/nueva-feature/` con componentes standalone.
3. **Nuevo modelo Prisma:** añade a `schema.prisma` y corre `pnpm prisma:migrate`.
4. **Registro de rutas:** importa en `src/index.ts` (backend) o `app.routes.ts` (frontend).
Este patrón es exactamente el que se siguió para incorporar Gastos, Ahorro y Usuarios sobre la base ya existente de Ingresos, sin modificar su lógica ni su estructura.
 
---
 
## Troubleshooting
 
**Error: `Cannot find module '@prisma/client'`**
> Corré `pnpm prisma generate`. El cliente tipado no se genera automáticamente al clonar.
 
**Error de CORS en el frontend**
> Verifica que `FRONTEND_URL` en el `.env` del backend coincida exactamente con la URL donde corre Angular (incluyendo el puerto).
 
**La sesión se cierra inmediatamente al loguearme**
> Revisa que el reloj de tu sistema esté sincronizado. JWT es sensible a diferencias de tiempo. También verifica que `JWT_EXPIRES_IN` no esté en un valor ridículamente bajo como `5s`.
 
**El gráfico SVG no renderiza**
> Asegúrate de que haya al menos un registro activo (ingreso, gasto o meta de ahorro) en la base de datos. Los gráficos se alimentan de datos reales, no de mock data.
 
**Zone.js errors en consola**
> Ejecuta `pnpm remove zone.js` y reinicia el servidor de desarrollo. Este proyecto no usa zone.js.
 
---
 
## Variables de entorno (referencia rápida)
 
### Backend `.env`
 
| Variable | Requerida | Descripción |
|---|---|---|
| `PORT` | Sí | Puerto del servidor Express |
| `DATABASE_URL` | Sí | URL de conexión PostgreSQL |
| `JWT_SECRET` | Sí | Clave para firmar tokens (mínimo 32 chars, recomendado 64+) |
| `JWT_EXPIRES_IN` | Sí | Vida del token (ej: `1h`, `15m`) |
| `NODE_ENV` | No | `development`, `production` o `test` |
| `FRONTEND_URL` | No | Origen permitido por CORS (default: `http://localhost:4200`) |
 
### Frontend `environment.ts`
 
| Variable | Descripción |
|---|---|
| `apiUrl` | URL base de la API backend |
| `inactivityTimeoutMinutes` | Minutos de tolerancia antes de cerrar sesión por cambio de pestaña |
 
---
 
*Desarrollado con estándares profesionales — AURION 2026*