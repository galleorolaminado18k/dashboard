# Gateway Dockerfile - Build minimal image to run gateway-audio-fix.cjs
# Usa node:20-slim para estabilidad
FROM node:20-slim

# Crear directorio de la app
WORKDIR /usr/src/gateway

# Copiar package files si existen para instalar dependencias
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Instalar dependencias; soporta npm o pnpm (fallback)
RUN set -eux; \
    if [ -f pnpm-lock.yaml ]; then \
      npm install -g pnpm@8 && pnpm install --frozen-lockfile || npm ci; \
    elif [ -f package-lock.json ]; then \
      npm ci; \
    elif [ -f package.json ]; then \
      npm install; \
    fi

# Copiar el gateway script y archivos necesarios
COPY gateway-audio-fix.cjs ./gateway-audio-fix.cjs

# Exponer puerto si el gateway usa uno (ajusta si es necesario)
EXPOSE 3010

# Ejecutar el gateway (pm2/forever no necesario aquí, Docker reiniciará el contenedor)
CMD ["node", "gateway-audio-fix.cjs"]

