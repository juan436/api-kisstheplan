# KissthePlan — API

Backend del SaaS de planificación de bodas KissthePlan. **NestJS 11 + MongoDB (Mongoose)**, API REST bajo el prefijo `/api`, documentada con Swagger.

El frontend está en [`kisstheplan`](https://github.com/juan436/kisstheplan).

- API: `http://localhost:3001/api`
- Swagger: `http://localhost:3001/api/docs`

---

## Arquitectura

### Módulos (uno por dominio)

`auth` · `user` · `wedding` · `collaborator` · `guest` · `budget` · `vendor` · `task` · `calendar` · `script` (guión) · `notes` · `seating` (plano de mesas) · `web-page` (web pública) · `subscription` · `payment` (Stripe) · `mailer` · `excel` · `upload` · `dashboard` · `admin` · `lead`

### Colaboración multi-usuario sobre un mismo recurso

La pieza central está en `auth`: al emitir tokens se resuelve el **contexto de boda** del usuario en dos pasos — primero si es dueño de una boda, si no, si es colaborador aceptado de una ajena. El JWT lleva siempre `weddingId` y `role` (`owner` / `collaborator` / `admin`) ya resueltos, así el resto del sistema no necesita saber quién pide qué. `POST /api/auth/switch-wedding` cambia la boda activa cuando el usuario tiene acceso a varias.

Dos flujos de incorporación de colaboradores: invitación por email con token único (se acepta con login, registro o Google) y alta manual de cuenta por el dueño.

### Auth

- JWT de acceso (corto) + refresh token (largo), ambos con secreto propio.
- Google OAuth 2.0 (`passport-google-oauth20`).
- Rate limiting con `@nestjs/throttler`.
- Contraseñas con `bcryptjs`.

### Capa de respuesta (`toResponse`)

Cada módulo transforma el documento de MongoDB a la forma que espera el frontend antes de devolverlo (`firstName+lastName` → `name`, `paidAt` → `paid` booleano, `_id` → `id` string, fechas a `YYYY-MM-DD`, `shape: 'rect'` → `'rectangular'`). La API real del frontend hace la conversión inversa al enviar.

### Modelo de datos (embebido vs. referencia)

| Dato | Estrategia | Motivo |
|---|---|---|
| `ExpenseItem` | Embebido en `ExpenseCategory` | Siempre se consultan juntos |
| `Guest` | Colección propia | Muchos, se filtran de forma independiente |
| `PaymentSchedule` | Colección propia | Compartida entre presupuesto y proveedores |
| `mealOptions[]` | Embebido en `Wedding` | Config del dueño, no crece |

### Otras piezas

- **Pagos:** suscripción anual vía Stripe (checkout, portal de cliente, webhook con body raw).
- **Export:** Excel con `exceljs` (invitados, presupuesto), PDF con `pdfkit` (plano de mesas, guión).
- **Email:** `@nestjs-modules/mailer` + Handlebars para invitaciones y notificaciones.
- **Uploads:** `multer` a disco local, servidos como estáticos con URL absoluta.

---

## Correr en local

Requisitos: Node, pnpm, MongoDB.

```bash
pnpm install
cp .env.example .env          # completar valores (ver el propio archivo)
pnpm start:dev                  # http://localhost:3001/api  ·  watch mode
```

### Seeds y migraciones

```bash
pnpm seed          # datos de ejemplo (boda de prueba)
pnpm seed:admin    # usuario admin del panel
pnpm seed:tasks    # plantilla de tareas con fechas
pnpm migrate:roles # migración de roles de usuario
```

Usuario de prueba tras el seed: `lucia@example.com` / `password123`.

---

## Variables de entorno

Lista completa y comentada en [`.env.example`](.env.example). Grupos: servidor, MongoDB, JWT (acceso + refresh), CORS, Google OAuth, Stripe, mailer. **Nunca** se hace commit del `.env`.

---

## Despliegue

Se empaqueta con el `Dockerfile` incluido y corre como contenedor detrás de un reverse proxy con TLS. La ruta del webhook de Stripe (`/api/payments/stripe/webhook`) recibe el body sin parsear; el resto de la API usa el parser JSON normal.

---

## Forma de trabajo

- **NestJS modular:** un módulo por dominio, con `controller` / `service` / `schema` / `dto`. La lógica vive en el service, nunca en el controller.
- **Cero `any`:** los subdocumentos de Mongoose se tipan; se usan patrones específicos para evitar `as any`.
- **DTOs validados** con `class-validator` en cada endpoint de escritura.
- Commits en Conventional Commits (`feat:`, `fix:`, `refactor:`). Rama `main`.
