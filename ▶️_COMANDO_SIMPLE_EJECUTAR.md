# 🚨 SOLUCIÓN DEFINITIVA - PostgreSQL local con Docker Compose

## ⚡ EJECUTA ESTOS COMANDOS EN EL VPS

Evolution requiere PostgreSQL o MySQL. Vamos a usar PostgreSQL local con Docker Compose.

### PASO 1: Crear docker-compose.yml (COPIAR TODO):

```bash
docker stop $(docker ps -q) 2>/dev/null && docker rm $(docker ps -aq) 2>/dev/null && cat > ~/docker-compose.evolution.yml << 'EOF'
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
      SERVER_URL: http://localhost:8080
      SERVER_PORT: 8080
      AUTHENTICATION_API_KEY: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb
      DATABASE_ENABLED: true
      DATABASE_PROVIDER: postgresql
      DATABASE_CONNECTION_URI: postgresql://evolution:evolution123@postgres:5432/evolution
      DATABASE_CONNECTION_CLIENT_NAME: evolution
      DATABASE_SAVE_DATA_INSTANCE: true
      DATABASE_SAVE_DATA_NEW_MESSAGE: false
      DATABASE_SAVE_DATA_MESSAGE_UPDATE: false
      DATABASE_SAVE_DATA_CONTACTS: false
      DATABASE_SAVE_DATA_CHATS: false
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
echo "✅ Archivo docker-compose.yml creado"
```

### PASO 2: Levantar servicios (COPIAR TODO):

```bash
cd ~ && docker compose -f docker-compose.evolution.yml up -d && sleep 40 && echo "=== CONTENEDORES ===" && docker ps && echo "" && echo "=== LOGS EVOLUTION ===" && docker logs evolution --tail 30 && echo "" && echo "=== PRUEBA ===" && curl -i http://127.0.0.1:8080/health
```

## ✅ RESULTADO ESPERADO:

```
=== CONTENEDORES ===
evolution          Up    0.0.0.0:8080->8080/tcp
evolution-postgres Up    5432/tcp

=== PRUEBA ===
HTTP/1.1 200 OK
{"status":"ok"}
```

## ✅ RESULTADO ESPERADO:

```
=== PRUEBA ===
HTTP/1.1 200 OK
```

---

## 🔍 SI SIGUE FALLANDO, EJECUTA EL DIAGNÓSTICO:

```bash
bash diagnostico-completo.sh
```

O manualmente:

```bash
# Ver contenedores
docker ps -a

# Ver qué usa el puerto 8080
netstat -tulpn | grep 8080

# Ver logs completos de Evolution
docker logs evolution

# Detener TODO y limpiar
docker stop $(docker ps -q) && docker rm $(docker ps -aq)
```

---

## 📝 COPIA Y PEGA EL RESULTADO COMPLETO

Cuando ejecutes el comando, **copia TODO el output** (desde donde empiezas hasta el final) y pégalo aquí para que pueda ver exactamente qué está pasando.

Específicamente necesito ver:
- ✅ Los logs de Evolution
- ✅ La respuesta de curl
- ✅ Cualquier error que aparezca

---

**🚀 EJECUTA EL COMANDO SIMPLE ARRIBA Y PEGA EL RESULTADO COMPLETO AQUÍ**

