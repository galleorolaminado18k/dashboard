# 🔍 DIAGNÓSTICO: Por qué no aparece el QR

## 🎯 Problema Actual

Cuando haces click en "Conectar WhatsApp" NO aparece el código QR.

---

## 📊 Posibles Causas

### 1. **WAHA no está corriendo** ⚠️ (MÁS PROBABLE)

**Cómo verificar:**
```bash
docker ps
```

**Si NO ves `waha-whatsapp`:**
```bash
# Levantar WAHA
cd C:\Users\USUARIO\WebstormProjects\dashboard
docker-compose -f docker-compose.waha.yml up -d

# Verificar logs
docker logs waha-whatsapp
```

**Si ves errores en logs:**
- Puerto 3000 ocupado: Cambiar a otro puerto
- Falta Docker: Instalar Docker Desktop
- Imagen no descarga: Verificar internet

---

### 2. **Error de red entre Dashboard y WAHA**

**En Vercel**, el dashboard está en la nube pero WAHA está en tu localhost.

**Solución temporal (solo para desarrollo):**
1. Corre el dashboard en local:
```bash
cd C:\Users\USUARIO\WebstormProjects\dashboard
pnpm dev
```

2. Abre: `http://localhost:3001/configuracion`

3. Ahora sí podrá conectar con WAHA en `localhost:3000`

**Solución para producción:**
- WAHA debe estar en un servidor público (no localhost)
- Opciones:
  - Railway.app (gratis)
  - DigitalOcean ($5/mes)
  - AWS EC2
  - Google Cloud

---

### 3. **Variables de entorno incorrectas**

**Verificar `.env.local`:**
```env
WAHA_URL=http://localhost:3000
NEXT_PUBLIC_URL=http://localhost:3001
```

⚠️ **En producción (Vercel):**
```env
WAHA_URL=https://tu-waha-servidor.com
NEXT_PUBLIC_URL=https://tu-dashboard.vercel.app
```

---

### 4. **Caché de Vercel**

Si estás en Vercel y los cambios no aparecen:

1. Ve a: https://vercel.com/tu-proyecto/deployments
2. Click en "Redeploy"
3. Marca "Clear Build Cache"
4. Click "Redeploy"

---

## 🧪 PRUEBAS DE DIAGNÓSTICO

### Prueba 1: Ver logs del navegador

1. Abre el dashboard: `/configuracion`
2. Presiona F12 (abrir consola)
3. Click en "Conectar WhatsApp"
4. Mira la consola (tab "Console")

**Qué buscar:**
- ✅ `🚀 Iniciando sesión de WhatsApp...`
- ✅ `📡 Llamando a /api/whatsapp/session...`
- ✅ `📥 Respuesta de sesión: {...}`
- ❌ Si ves errores en rojo, cópialos

### Prueba 2: Probar endpoint directo

**Si WAHA está en localhost:**
```bash
# Crear sesión
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"name":"default"}'

# Debería responder con status "STARTING" o "SCAN_QR_CODE"
```

**Luego obtener QR:**
```bash
curl http://localhost:3000/api/sessions/default/qr
```

**Debería responder:**
```json
{
  "qr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

Si esto funciona, WAHA está bien. El problema está en la conexión dashboard → WAHA.

### Prueba 3: Probar desde el dashboard en local

```bash
# Terminal 1: Levantar WAHA
docker-compose -f docker-compose.waha.yml up

# Terminal 2: Levantar dashboard en local
pnpm dev

# Navegar a: http://localhost:3001/configuracion
# Click en "Conectar WhatsApp"
```

Si funciona en local pero no en Vercel = **problema de red** (ver solución 2).

---

## 🎯 SOLUCIÓN RÁPIDA (Desarrollo)

**Paso a paso:**

```bash
# 1. Levantar WAHA
cd C:\Users\USUARIO\WebstormProjects\dashboard
docker-compose -f docker-compose.waha.yml up -d

# 2. Verificar que está corriendo
docker ps
# Debe mostrar: waha-whatsapp ... Up

# 3. Correr dashboard en LOCAL (no Vercel)
pnpm dev

# 4. Abrir en navegador
# http://localhost:3001/configuracion

# 5. Presionar F12 para ver consola

# 6. Click "Conectar WhatsApp"

# 7. Ver logs en consola (F12)
```

**Si ves el QR:**
✅ **¡Funciona!** El problema era que Vercel no puede conectar con localhost.

**Si NO ves el QR:**
1. Copia los mensajes de error de la consola
2. Copia los logs de WAHA: `docker logs waha-whatsapp`
3. Comparte ambos para diagnosticar

---

## 📝 CHECKLIST DE DIAGNÓSTICO

Marca lo que ya verificaste:

- [ ] Docker Desktop instalado y corriendo
- [ ] Ejecuté: `docker-compose -f docker-compose.waha.yml up -d`
- [ ] `docker ps` muestra `waha-whatsapp` con status "Up"
- [ ] `docker logs waha-whatsapp` no muestra errores críticos
- [ ] Probé en `http://localhost:3001` (no Vercel)
- [ ] Presioné F12 y vi la consola
- [ ] Hice click en "Conectar WhatsApp"
- [ ] Vi los mensajes en la consola (🚀📡📥)

---

## 🚨 ERRORES COMUNES

### "Cannot connect to WAHA"
```bash
# WAHA no está corriendo
docker-compose -f docker-compose.waha.yml up -d
```

### "Port 3000 already in use"
```bash
# Otro servicio usa el puerto 3000
# Opción 1: Detener el otro servicio
# Opción 2: Cambiar puerto en docker-compose.waha.yml:
#   ports: ["3001:3000"]  # Cambiar a 3001
```

### "CORS error"
- Esto es normal si usas Vercel apuntando a localhost
- Solución: Corre el dashboard en local con `pnpm dev`

### "QR expired"
- El QR expira cada 60 segundos
- Click en "Conectar WhatsApp" de nuevo

---

## 🎬 ACCIÓN INMEDIATA

**Haz esto AHORA para diagnosticar:**

1. Abre PowerShell/CMD
2. Ejecuta:
```bash
cd C:\Users\USUARIO\WebstormProjects\dashboard
docker-compose -f docker-compose.waha.yml up
```

3. Deja esa terminal abierta (verás los logs de WAHA)

4. Abre otra terminal:
```bash
cd C:\Users\USUARIO\WebstormProjects\dashboard
pnpm dev
```

5. Abre navegador: `http://localhost:3001/configuracion`

6. Presiona F12

7. Click "Conectar WhatsApp"

8. **Toma screenshot de:**
   - La terminal de WAHA (Terminal 1)
   - La consola del navegador (F12)
   - La página web

9. Comparte esos 3 screenshots para diagnóstico exacto

---

**Última actualización**: 2025-11-06 19:00  
**Commit**: `39535bf`  
**Estado**: Debugging en progreso

