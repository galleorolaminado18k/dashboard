# ⚡ EJECUTAR AHORA - COMANDO ÚNICO

**COPIA Y PEGA ESTE COMANDO COMPLETO EN TU VPS**:

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
echo "✅ Archivo creado" && cd ~ && docker-compose -f docker-compose.evolution.yml up -d && sleep 50 && echo "=== CONTENEDORES ===" && docker ps && echo "" && echo "=== LOGS ===" && docker logs evolution --tail 50 && echo "" && echo "=== PRUEBA ===" && curl -i http://127.0.0.1:8080/health && echo "" && echo "=== IP PUBLICA ===" && curl -i http://31.220.58.83:8080/health
```

---

**SI VES `200 OK`** → Ve a Vercel:
1. Settings → Environment Variables
2. Agregar:
   - `EVO_BASE_URL = http://31.220.58.83:8080`
   - `EVO_API_KEY = 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb`
3. Deployments → Redeploy
4. Probar en `/configuracion`

---

**SI SIGUE 404** → Pega TODOS los logs aquí para diagnóstico final.

