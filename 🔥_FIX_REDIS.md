# 🔥 SOLUCIÓN - Agregar Redis y deshabilitar cache

## ❌ ERRORES IDENTIFICADOS

1. `redis disconnected` - Evolution requiere Redis
2. `404 Not Found /health` - Evolution no levantó correctamente

## ✅ SOLUCIÓN: Agregar Redis al docker-compose

**EJECUTA ESTE COMANDO EN EL VPS**:

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
      
      # Database
      DATABASE_ENABLED: "true"
      DATABASE_PROVIDER: "postgresql"
      DATABASE_CONNECTION_URI: "postgresql://evolution:evolution123@postgres:5432/evolution"
      DATABASE_CONNECTION_CLIENT_NAME: "evolution"
      DATABASE_SAVE_DATA_INSTANCE: "true"
      DATABASE_SAVE_DATA_NEW_MESSAGE: "false"
      DATABASE_SAVE_DATA_MESSAGE_UPDATE: "false"
      DATABASE_SAVE_DATA_CONTACTS: "false"
      DATABASE_SAVE_DATA_CHATS: "false"
      
      # Redis
      REDIS_ENABLED: "true"
      REDIS_URI: "redis://redis:6379"
      REDIS_PREFIX: "evolution"
      
      # Cache (deshabilitar para evitar problemas)
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
echo "✅ docker-compose.yml actualizado con Redis"
```

---

## 🚀 AHORA LEVANTA LOS SERVICIOS:

```bash
cd ~ && docker-compose -f docker-compose.evolution.yml up -d && sleep 45 && echo "=== CONTENEDORES ===" && docker ps && echo "" && echo "=== LOGS REDIS ===" && docker logs evolution-redis --tail 10 && echo "" && echo "=== LOGS EVOLUTION ===" && docker logs evolution --tail 40 && echo "" && echo "=== PRUEBA ===" && curl -i http://127.0.0.1:8080/health
```

---

## ✅ RESULTADO ESPERADO:

```
Creating evolution-redis    ... done
Creating evolution-postgres ... done
Creating evolution          ... done

=== CONTENEDORES ===
evolution-redis       Up 40 seconds  6379/tcp
evolution-postgres    Up 40 seconds  5432/tcp
evolution             Up 35 seconds  0.0.0.0:8080->8080/tcp

=== LOGS EVOLUTION ===
[LOG] - Redis connected successfully
[LOG] - Database connected successfully
[LOG] - Server started on port 8080

=== PRUEBA ===
HTTP/1.1 200 OK
content-type: application/json

{"status":"ok"}
```

---

## 📋 QUÉ SE AGREGÓ:

1. ✅ **Servicio Redis** - Para cache y sesiones
2. ✅ `REDIS_ENABLED: "true"` - Habilita Redis
3. ✅ `REDIS_URI: "redis://redis:6379"` - Conexión a Redis
4. ✅ `CACHE_REDIS_ENABLED: "false"` - Deshabilita cache opcional

---

**🚀 EJECUTA LOS 2 COMANDOS ARRIBA EN EL VPS!**

**Con Redis agregado, Evolution API funcionará correctamente** ✅

