# 🚨 SOLUCIÓN DEFINITIVA - Database provider invalid

## ❌ ERROR ACTUAL

```
Error: Database provider invalid.
curl: (7) Failed to connect to 127.0.0.1 port 8080
```

**Causa**: Evolution API requiere especificar `DATABASE_PROVIDER` incluso cuando la base de datos está deshabilitada.

---

## ✅ SOLUCIÓN INMEDIATA (COPIAR Y PEGAR EN EL VPS)

```bash
docker stop evolution 2>/dev/null || true && docker rm evolution 2>/dev/null || true && docker run -d --name evolution --restart unless-stopped -p 8080:8080 -v ~/evolution-data:/evolution/store -e SERVER_PORT=8080 -e SERVER_HOST=0.0.0.0 -e API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb -e AUTHENTICATION_API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb -e DATABASE_ENABLED=false -e DATABASE_PROVIDER=postgresql -e DATABASE_CONNECTION_URI='' -e STORE_MESSAGES=false -e STORE_CONTACTS=false -e STORE_CHATS=false atendai/evolution-api:latest && sleep 25 && docker logs evolution --tail 40 && echo "=== PRUEBA ===" && curl -i http://127.0.0.1:8080/health
```

## 📋 CAMBIOS APLICADOS:

1. ✅ `DATABASE_ENABLED=false` - Base de datos deshabilitada
2. ✅ `DATABASE_PROVIDER=postgresql` - Proveedor especificado (requerido)
3. ✅ `DATABASE_CONNECTION_URI=''` - URI vacía (no se usa)
4. ✅ `STORE_MESSAGES=false` - No guardar mensajes
5. ✅ `STORE_CONTACTS=false` - No guardar contactos
6. ✅ `STORE_CHATS=false` - No guardar chats

---

## ✅ RESULTADO ESPERADO:

Después de 25 segundos deberías ver:

```
=== PRUEBA ===
HTTP/1.1 200 OK
date: Tue, 11 Nov 2025 04:10:00 GMT
content-type: application/json
...
```

**Si ves `200 OK`** → ✅ **¡ÉXITO!**

---

## 📋 SI FUNCIONA (200 OK):

### 1. Probar desde IP pública:

```bash
curl -i http://31.220.58.83:8080/health
```

**Debe responder**: `200 OK` ✅

### 2. Configurar en Vercel:

https://vercel.com/dashboard → Tu proyecto → **Settings** → **Environment Variables**

Agregar/Verificar:
```
EVO_BASE_URL = http://31.220.58.83:8080
EVO_API_KEY = 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb
```

### 3. Redeploy en Vercel:

**Deployments** → Último deployment → **3 puntos** → **Redeploy**

### 4. Esperar 2-3 minutos y probar:

Ve a: `https://tu-app.vercel.app/configuracion`
- Ingresar número
- Click "Conectar WhatsApp"
- ✅ QR debe aparecer en 2-5 segundos

---

## 🐛 SI SIGUE FALLANDO:

### Opción alternativa (sin variables de base de datos):

```bash
docker stop evolution && docker rm evolution && docker run -d --name evolution --restart unless-stopped -p 8080:8080 -v ~/evolution-data:/evolution/store -e SERVER_PORT=8080 -e SERVER_HOST=0.0.0.0 -e API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb atendai/evolution-api:latest && sleep 25 && docker logs evolution --tail 50
```

Esta versión usa la configuración mínima sin especificar variables de base de datos.

---

## 📝 COMANDOS ÚTILES:

```bash
# Ver logs en tiempo real
docker logs -f evolution

# Ver TODOS los logs
docker logs evolution

# Reiniciar Evolution
docker restart evolution

# Ver estado
docker ps

# Entrar al contenedor (debug)
docker exec -it evolution sh
```

---

## ✅ CHECKLIST:

- [ ] Ejecuté el comando en el VPS
- [ ] Esperé 25 segundos
- [ ] `curl http://127.0.0.1:8080/health` responde 200 OK
- [ ] `curl http://31.220.58.83:8080/health` responde 200 OK
- [ ] Variables configuradas en Vercel
- [ ] Redeploy ejecutado en Vercel
- [ ] Deployment muestra "Ready" ✅
- [ ] Probé en `/configuracion` y apareció el QR

---

**🚀 EJECUTA EL COMANDO AHORA EN EL VPS!**

**Este es el comando CORRECTO con todas las variables necesarias** ✅

