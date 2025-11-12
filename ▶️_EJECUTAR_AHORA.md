# ⚡ EJECUTA ESTO AHORA EN EL VPS

## 🎯 SOLUCIÓN FINAL - Sin Prisma/Base de datos

## ✅ COMANDO DEFINITIVO (COPIAR Y PEGAR)

```bash
docker stop evolution 2>/dev/null || true && docker rm evolution 2>/dev/null || true && docker run -d --name evolution --restart unless-stopped -p 8080:8080 -v ~/evolution-data:/evolution/store -e SERVER_PORT=8080 -e SERVER_HOST=0.0.0.0 -e API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb -e AUTHENTICATION_API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb -e DATABASE_ENABLED=false -e DATABASE_SAVE_DATA_INSTANCE=false -e DATABASE_SAVE_DATA_NEW_MESSAGE=false -e DATABASE_SAVE_DATA_MESSAGE_UPDATE=false -e DATABASE_SAVE_DATA_CONTACTS=false -e DATABASE_SAVE_DATA_CHATS=false atendai/evolution-api:latest && sleep 25 && docker logs evolution --tail 40 && echo "=== PRUEBA ===" && curl -i http://127.0.0.1:8080/health
```

## 📋 QUÉ HACE:

1. ✅ Detiene y elimina Evolution existente
2. ✅ Levanta Evolution **SIN base de datos ni Prisma**
3. ✅ Variables correctas que evitan error de Prisma
4. ✅ Espera 25s y muestra logs
5. ✅ Prueba health check

## ✅ RESULTADO ESPERADO:

```
=== PRUEBA ===
HTTP/1.1 200 OK
content-type: application/json

{"status":"ok"}
```

## 📋 DESPUÉS:

1. Si curl responde **200 OK**, ve a Vercel
2. Verifica variables:
   - `EVO_BASE_URL = http://31.220.58.83:8080`
   - `EVO_API_KEY = 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb`
3. **Redeploy**
4. Prueba en `/configuracion`

---

**🚀 Cambios subidos a GitHub: commit `5679036`**

**📁 Archivos disponibles:**
- `🚨_PUERTO_8080_OCUPADO.md` - Guía completa con opciones
- `fix-port-8080.sh` - Script bash automatizado

**⚡ EJECUTA EL COMANDO EN EL VPS AHORA!**

