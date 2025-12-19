# 🔥 COMANDO CORREGIDO - YAML válido

## ❌ ERROR IDENTIFICADO

```
services.evolution.environment.DATABASE_ENABLED contains true, which is an invalid type
```

**Causa**: Los valores booleanos (`true`/`false`) deben estar entre comillas en docker-compose.

---

## ✅ SOLUCIÓN: Recrear docker-compose.yml con valores entre comillas

**EJECUTA ESTE COMANDO EN EL VPS** (copia TODO):

```bash
cat > ~/docker-compose.evolution.yml << 'EOF'
version: '3.8'

services:
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
    depends_on:
      - postgres
    networks:
      - evolution-net

networks:
  evolution-net:
    driver: bridge

volumes:
  postgres_data:
EOF
echo "✅ Archivo docker-compose.yml recreado con valores entre comillas"
```

---

## 🚀 AHORA EJECUTA ESTE COMANDO:

```bash
cd ~ && docker-compose -f docker-compose.evolution.yml up -d && sleep 40 && echo "=== CONTENEDORES ===" && docker ps && echo "" && echo "=== LOGS EVOLUTION ===" && docker logs evolution --tail 30 && echo "" && echo "=== PRUEBA ===" && curl -i http://127.0.0.1:8080/health
```

---

## ✅ RESULTADO ESPERADO:

```
Creating network "evolution_evolution-net" with driver "bridge"
Creating volume "evolution_postgres_data" with default driver
Creating evolution-postgres ... done
Creating evolution          ... done

=== CONTENEDORES ===
CONTAINER ID   IMAGE                              STATUS         PORTS
evolution      atendai/evolution-api:latest       Up 35 seconds  0.0.0.0:8080->8080/tcp
evolution-postgres postgres:15-alpine             Up 40 seconds  5432/tcp

=== LOGS EVOLUTION ===
[LOG] - Server started on port 8080
[LOG] - Database connected successfully

=== PRUEBA ===
HTTP/1.1 200 OK
content-type: application/json

{"status":"ok"}
```

**Si ves `200 OK`** → ✅ **¡PROBLEMA RESUELTO!**

---

## 📋 DIFERENCIA CLAVE:

**❌ ANTES (causaba error)**:
```yaml
DATABASE_ENABLED: true  # Sin comillas
```

**✅ AHORA (correcto)**:
```yaml
DATABASE_ENABLED: "true"  # Con comillas
```

---

**🚀 EJECUTA LOS 2 COMANDOS ARRIBA EN EL VPS (PRIMERO RECREAR EL ARCHIVO, LUEGO LEVANTAR)!**

