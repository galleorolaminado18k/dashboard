#!/bin/bash
# Script para desactivar autenticación en Evolution API

echo "🔧 Desactivando autenticación en Evolution API..."

# Detener servicios
cd /root/evolution
docker-compose down

# Hacer backup
cp docker-compose.yml docker-compose.yml.backup

# Agregar variable para desactivar auth
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: evolution-postgres
    restart: always
    environment:
      POSTGRES_DB: evolution
      POSTGRES_USER: evolution
      POSTGRES_PASSWORD: evolution_pass_2024
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - evolution-net

  evolution:
    image: atendai/evolution-api:latest
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    volumes:
      - ./evolution-data:/evolution/store
    environment:
      - SERVER_PORT=8080
      - LOG_LEVEL=INFO
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://evolution:evolution_pass_2024@postgres:5432/evolution?schema=public
      - DATABASE_SAVE_DATA_INSTANCE=true
      - DATABASE_SAVE_DATA_NEW_MESSAGE=true
      - AUTHENTICATION_API_KEY=false
      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=false
    networks:
      - evolution-net

volumes:
  postgres_data:

networks:
  evolution-net:
    driver: bridge
EOF

# Reiniciar servicios
docker-compose up -d

echo "✅ Autenticación desactivada"
echo "⏳ Esperando 15 segundos para que Evolution API inicie..."
sleep 15

echo "🧪 Verificando..."
curl -s http://localhost:8080/ | head -n 1

echo ""
echo "✅ Script completado"

