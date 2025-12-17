#!/usr/bin/env bash
# server-setup.sh
# Script para ejecutar EN EL VPS (root@31.220.58.83)
# - instala docker si no existe
# - crea carpeta /opt/dashboard-gateway
# - copia los archivos (suponiendo ya presentes) y construye la imagen
# - ejecuta el contenedor con restart always

set -euo pipefail

echo "==> Comprobando Docker..."
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker no encontrado. Instalando Docker..."
  # Instalación para Debian/Ubuntu
  apt-get update
  apt-get install -y ca-certificates curl gnupg lsb-release
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/$(. /etc/os-release && echo "$ID")/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$(. /etc/os-release && echo "$ID") \
    $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
  echo "Docker ya instalado: $(docker --version)"
fi

TARGET_DIR=/opt/dashboard-gateway
mkdir -p "$TARGET_DIR"
chown root:root "$TARGET_DIR"

echo "==> Copiando archivos al directorio $TARGET_DIR"
# Asumimos que los archivos ya fueron scp/rsync al directorio
cd "$TARGET_DIR"

# Construir imagen Docker si hay Dockerfile
if [ -f Dockerfile ]; then
  echo "==> Construyendo imagen Docker dashboard-gateway:latest"
  docker build -t dashboard-gateway:latest .
  echo "==> Ejecutando contenedor dashboard-gateway"
  # Detener si ya existe
  if docker ps -a --format '{{.Names}}' | grep -q '^dashboard-gateway$'; then
    docker rm -f dashboard-gateway || true
  fi
  docker run -d --name dashboard-gateway --restart always -p 3010:3010 dashboard-gateway:latest
  echo "==> Contenedor iniciado"
else
  echo "No se encontró Dockerfile en $TARGET_DIR. Coloca gateway-audio-fix.cjs y Dockerfile aquí y vuelve a ejecutar este script."
  exit 1
fi

# Mostrar logs breves
sleep 1
echo "==> Estado del contenedor:"
docker ps --filter name=dashboard-gateway --format "table {{.Names}}	{{.Status}}	{{.Ports}}"

echo "==> Fin del script"

