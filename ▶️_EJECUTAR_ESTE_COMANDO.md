# ⚡ COMANDO FINAL - Con Redis + PostgreSQL

## ✅ PASO 1: Recrear docker-compose.yml CON REDIS (COPIAR TODO)

**Errores anteriores resueltos**:
- ✅ Valores con comillas en YAML
- ✅ Redis agregado (requerido por Evolution)
- ✅ Cache deshabilitado para evitar problemas

```bash
docker-compose -f ~/docker-compose.evolution.yml down && cat > ~/docker-compose.evolution.yml << 'EOF'
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: evolution-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - evolution-net

  postgres:
    image: postgres:15-alpine
    container_name: evolution-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: evolution
      POSTGRES_PASSWORD: evolution123
      POSTGRES_DB: evolution
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - evolution-net

  evolution:
    image: atendai/evolution-api:latest
    container_name: evolution
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - ~/evolution-data:/evolution/store
    environment:
      SERVER_URL: "http://localhost:8080"
      SERVER_PORT: "8080"
      AUTHENTICATION_API_KEY: "81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb"
      DATABASE_ENABLED: "true"
      DATABASE_PROVIDER: "postgresql"
      DATABASE_CONNECTION_URI: "postgresql://evolution:evolution123@postgres:5432/evolution"
      DATABASE_CONNECTION_CLIENT_NAME: "evolution"
      DATABASE_SAVE_DATA_INSTANCE: "true"
      DATABASE_SAVE_DATA_NEW_MESSAGE: "false"
      DATABASE_SAVE_DATA_MESSAGE_UPDATE: "false"
      DATABASE_SAVE_DATA_CONTACTS: "false"
      DATABASE_SAVE_DATA_CHATS: "false"
      REDIS_ENABLED: "true"
      REDIS_URI: "redis://redis:6379"
      REDIS_PREFIX: "evolution"
      CACHE_REDIS_ENABLED: "false"
    depends_on:
      - redis
      - postgres
    networks:
      - evolution-net

networks:
  evolution-net:
    driver: bridge

volumes:
  redis_data:
  postgres_data:
EOF
echo "✅ Archivo recreado con Redis"
```

---

## ✅ PASO 2: Levantar servicios (COPIAR TODO)

```bash
cd ~ && docker-compose -f docker-compose.evolution.yml up -d && sleep 45 && echo "=== CONTENEDORES ===" && docker ps && echo "" && echo "=== LOGS EVOLUTION ===" && docker logs evolution --tail 40 && echo "" && echo "=== PRUEBA ===" && curl -i http://127.0.0.1:8080/health
```


## ✅ RESULTADO ESPERADO:

```
=== CONTENEDORES ===
NAME                  STATUS         PORTS
evolution             Up 35 seconds  0.0.0.0:8080->8080/tcp
evolution-postgres    Up 40 seconds  5432/tcp

=== LOGS EVOLUTION ===
[LOG] - Server started on port 8080
[LOG] - Database connected

=== PRUEBA ===
HTTP/1.1 200 OK
content-type: application/json

{"status":"ok"}
```

**Si ves `200 OK`** → ✅ **¡PROBLEMA RESUELTO!**

---

## 📋 DESPUÉS DEL 200 OK:

```bash
# Probar IP pública
curl -i http://31.220.58.83:8080/health

# Abrir firewall
ufw allow 8080/tcp
ufw reload
```

**Luego**:
1. Vercel → Variables → Configurar
2. Redeploy
3. Probar en `/configuracion`

---

**🚀 EJECUTA EL COMANDO ARRIBA Y PEGA EL RESULTADO AQUÍ!**

