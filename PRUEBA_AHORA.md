# ✅ FIX APLICADO - Prueba AHORA

## 🎯 Cambios Realizados

### ✅ **APIs Corregidas:**
- ❌ ANTES: `/api/sessions/default` (incorrecto)
- ✅ AHORA: `/api/session/default/start` (correcto según WAHA docs)

### ✅ **Rutas Actualizadas:**
1. `POST /api/whatsapp/session` → Inicia sesión en WAHA
2. `GET /api/whatsapp/qr` → Obtiene QR real
3. `GET /api/whatsapp/health` → Verifica que WAHA esté ON

### ✅ **Logs Mejorados:**
- Ahora verás logs claros en consola (F12)
- Mensajes de error más descriptivos

---

## 🚀 PRUEBA INMEDIATA (5 minutos)

### **Paso 1: Levantar WAHA**

```bash
cd C:\Users\USUARIO\WebstormProjects\dashboard
docker-compose -f docker-compose.waha.yml up -d
```

**Verificar:**
```bash
docker ps
# Debe mostrar: waha-whatsapp ... Up
```

---

### **Paso 2: Verificar Health de WAHA**

```bash
curl http://127.0.0.1:3000/health
```

**Debe responder:**
```json
{"status": "ok"}
```

Si no responde = WAHA no está corriendo.

---

### **Paso 3: Correr Dashboard en LOCAL**

```bash
# En la misma carpeta
pnpm dev
```

Espera a que diga:
```
✓ Ready in 3.5s
○ Local:   http://localhost:3001
```

---

### **Paso 4: Probar Conexión**

1. **Abrir:** `http://localhost:3001/configuracion`

2. **Abrir DevTools:** Presiona `F12`

3. **Ir a tab "Console"**

4. **Ingresar número:** `3012439596`

5. **Click:** "Conectar WhatsApp"

6. **Ver logs en consola:**
   ```
   🚀 Iniciando sesión de WhatsApp...
   📡 Llamando a /api/whatsapp/session...
   📥 Respuesta de sesión: {ok: true, ...}
   ✅ Sesión iniciada, comenzando polling...
   🔄 Obteniendo QR...
   ✅ QR recibido!
   ```

7. **Ver el QR en pantalla** ✅

---

## 🧪 PRUEBAS ADICIONALES

### **Test 1: Health Check**

En tu navegador, abre una nueva tab:
```
http://localhost:3001/api/whatsapp/health
```

**Debe mostrar:**
```json
{
  "ok": true,
  "waha": "healthy",
  "url": "http://127.0.0.1:3000"
}
```

---

### **Test 2: Endpoint de Sesión**

En Postman o terminal:
```bash
curl -X POST http://localhost:3001/api/whatsapp/session
```

**Debe responder:**
```json
{
  "ok": true,
  "session": {
    "name": "default",
    "status": "STARTING",
    "message": "Sesión iniciada..."
  }
}
```

---

### **Test 3: Endpoint de QR**

```bash
curl http://localhost:3001/api/whatsapp/qr
```

**Debe responder:**
```json
{
  "ok": true,
  "qr": "data:image/png;base64,iVBORw0KGg...",
  "message": "Escanea este código QR..."
}
```

---

## 📊 DIAGNÓSTICO DE ERRORES

### Si el health check falla:

```bash
# Ver logs de WAHA
docker logs waha-whatsapp

# Si ves errores de puerto:
# Cambiar puerto en docker-compose.waha.yml
ports:
  - "3001:3000"  # Cambiar a 3001
```

### Si el QR no aparece:

1. **Ver consola del navegador (F12)**
   - ¿Qué error muestra?

2. **Ver logs del servidor Next.js**
   - ¿Qué dice en la terminal donde corriste `pnpm dev`?

3. **Probar endpoint directo de WAHA:**
```bash
curl -X POST http://127.0.0.1:3000/api/session/default/start
curl http://127.0.0.1:3000/api/session/default/qr
```

---

## ✅ CHECKLIST FINAL

- [ ] Docker corriendo (`docker ps` muestra waha)
- [ ] Health check OK (`/api/whatsapp/health`)
- [ ] Dashboard en local (`pnpm dev`)
- [ ] F12 abierto para ver logs
- [ ] Número ingresado (10 dígitos)
- [ ] Click "Conectar WhatsApp"
- [ ] Logs en consola (🚀📡✅)
- [ ] QR visible en pantalla

---

## 🎯 SIGUIENTE PASO

Si TODO funciona en local pero NO en Vercel:

**Es normal** - Vercel no puede conectar con `localhost:3000`.

**Opciones:**
1. **Para desarrollo:** Usa siempre `localhost:3001`
2. **Para producción:** Despliega WAHA en Railway/Render
3. **Para demo:** Graba video del local funcionando

---

## 📝 NOTAS IMPORTANTES

### Cambios clave aplicados:

**ANTES (INCORRECTO):**
```typescript
fetch(`${WAHA_URL}/api/sessions/default`)  // ❌ sessions (plural)
fetch(`${WAHA_URL}/api/sessions/default/qr`)  // ❌
```

**AHORA (CORRECTO):**
```typescript
fetch(`${WAHA_URL}/api/session/default/start`)  // ✅ session (singular)
fetch(`${WAHA_URL}/api/session/default/qr`)  // ✅
fetch(`${WAHA_URL}/api/session/default/state`)  // ✅
```

---

**Última actualización**: 2025-11-06 19:30  
**Commit**: `2069c24`  
**Estado**: ✅ APIs corregidas, listo para probar

---

## 🚀 ACCIÓN INMEDIATA

**Ejecuta AHORA:**

```bash
# Terminal 1
cd C:\Users\USUARIO\WebstormProjects\dashboard
docker-compose -f docker-compose.waha.yml up -d
docker ps  # Verificar

# Terminal 2
pnpm dev

# Navegador
# http://localhost:3001/configuracion
# F12 → Console
# Ingresar número → Click "Conectar WhatsApp"
```

¡Debería funcionar! 🎉

