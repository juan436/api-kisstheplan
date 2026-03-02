# ============================================================
# Stage 1: Builder — instala deps y compila TypeScript
# ============================================================
FROM node:22-alpine AS builder

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar manifiestos primero (cache de capas óptimo)
COPY package.json pnpm-lock.yaml* ./

# Instalar TODAS las dependencias (dev + prod) para compilar
RUN pnpm install --frozen-lockfile

# Copiar código fuente y configuración
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src/ ./src/

# Compilar TypeScript → dist/
RUN pnpm run build


# ============================================================
# Stage 2: Production — imagen mínima, solo lo necesario
# ============================================================
FROM node:22-alpine AS production

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Variables de entorno de producción
ENV NODE_ENV=production

WORKDIR /app

# Copiar manifiestos para instalar solo dependencias de producción
COPY package.json pnpm-lock.yaml* ./

# Solo dependencias de producción (sin devDependencies)
RUN pnpm install --frozen-lockfile --prod

# Copiar el build compilado desde el stage anterior
COPY --from=builder /app/dist ./dist

# Usar usuario no-root por seguridad
RUN chown -R node:node /app
USER node

# El puerto que expone el servicio
EXPOSE 3001

# Health check para docker compose / orquestadores
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/api').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Comando de inicio en producción
CMD ["node", "dist/main"]
