# ⚡ EJECUTA ESTO AHORA EN EL VPS

## 🎯 PROBLEMA: Database provider invalid + Puerto ocupado

## ✅ SOLUCIÓN DEFINITIVA: Un solo comando (COPIAR Y PEGAR)

```bash
docker stop evolution 2>/dev/null || true && docker rm evolution 2>/dev/null || true && docker run -d --name evolution --restart unless-stopped -p 8080:8080 -v ~/evolution-data:/evolution/store -e SERVER_PORT=8080 -e SERVER_HOST=0.0.0.0 -e API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb -e AUTHENTICATION_API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb -e DATABASE_ENABLED=false -e DATABASE_PROVIDER=postgresql -e DATABASE_CONNECTION_URI='' -e STORE_MESSAGES=false -e STORE_CONTACTS=false -e STORE_CHATS=false atendai/evolution-api:latest && sleep 25 && docker logs evolution --tail 40 && echo "=== PRUEBA ===" && curl -i http://127.0.0.1:8080/health
```

## 📋 QUÉ HACE ESTE COMANDO:

1. ✅ Detiene contenedor Evolution (si existe)
2. ✅ Elimina contenedor Evolution (si existe)
3. ✅ Levanta Evolution con configuración CORRECTA:
   - `DATABASE_ENABLED=false` - Sin base de datos
   - `DATABASE_PROVIDER=postgresql` - **CRÍTICO: Evita error "Database provider invalid"**
   - `DATABASE_CONNECTION_URI=''` - URI vacía (no se usa)
   - `STORE_MESSAGES=false` - No guardar mensajes
   - `STORE_CONTACTS=false` - No guardar contactos
   - `STORE_CHATS=false` - No guardar chats
4. ✅ Espera 25 segundos para que Evolution inicie
5. ✅ Muestra logs (últimos 40 líneas)
6. ✅ Prueba health check

## ✅ RESULTADO ESPERADO:

```
=== PRUEBA ===
HTTP/1.1 200 OK
date: Tue, 11 Nov 2025 04:10:00 GMT
content-type: application/json
content-length: 15

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

