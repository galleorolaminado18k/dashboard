- Tests: ~10 segundos

**Total**: ~3 minutos

---

## 🎯 VENTAJAS DEL NUEVO SCRIPT

1. ✅ **No requiere docker-compose** - Funciona solo con Docker
2. ✅ **Más simple** - Menos pasos, menos cosas que pueden fallar
3. ✅ **Universal** - Funciona en cualquier sistema con Docker
4. ✅ **Rápido** - Menos tiempo de ejecución
5. ✅ **Mismo resultado** - WAHA funcionando perfectamente

---

## 📞 COMANDO PARA COPIAR

```bash
curl -o fix-simple.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/fix-waha-simple.sh && chmod +x fix-simple.sh && ./fix-simple.sh
```

---

## ✅ CHECKLIST

- [ ] Ejecutar script en VPS
- [ ] Esperar ~3 minutos
- [ ] Verificar que los 3 tests pasan ✅
- [ ] Copiar las credenciales
- [ ] Test desde PC: `curl https://wpp.galle18k.com/health`
- [ ] Si es necesario, actualizar variables en Vercel
- [ ] Si actualizaste variables, redeploy
- [ ] Probar en dashboard → Conectar WhatsApp
- [ ] ✅ Error "fetch failed" desaparece

---

**ESTE SCRIPT ES MÁS SIMPLE Y FUNCIONARÁ EN TU SISTEMA** 🚀

No necesita docker-compose, solo Docker puro.
# ⚡ FIX SIMPLE - WAHA sin Docker Compose

## 🎯 PROBLEMA ANTERIOR

El script anterior intentaba instalar `docker-compose-plugin` pero tu sistema no lo tiene disponible en los repositorios.

**Error**:
```
E: Unable to locate package docker-compose-plugin
```

---

## ✅ NUEVA SOLUCIÓN

He creado un **script simplificado** que **NO necesita Docker Compose**. Usa Docker directamente con comandos `docker run`.

### Ventajas:
- ✅ No necesita docker-compose
- ✅ Funciona en cualquier sistema con Docker
- ✅ Más simple y directo
- ✅ Mismo resultado

---

## ⚡ EJECUTAR AHORA EN EL VPS

```bash
curl -o fix-simple.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/fix-waha-simple.sh && chmod +x fix-simple.sh && ./fix-simple.sh
```

---

## 📊 QUÉ HACE EL NUEVO SCRIPT

### PASO 0: Verifica el directorio
- Usa `/opt/baileys` o `/root/waha`

### PASO 1: Limpieza
- Detiene y elimina contenedores anteriores
- Limpia redes y volúmenes

### PASO 2: Crea credenciales
```env
WAHA_API_KEY=bb841979e8b66e6a0f563235b5df3d9a
WAHA_DASHBOARD_USERNAME=admin
WAHA_DASHBOARD_PASSWORD=3e15bf389c14df504b858886b30b03a7
```

### PASO 3: Crea Caddyfile
- Configuración de reverse proxy
- Headers correctos

### PASO 4: Inicia contenedores con Docker
```bash
# WAHA
docker run -d --name waha-api ...

# Caddy
docker run -d --name caddy ...
```

### PASO 5: Verifica con 3 tests
- Health check → 200
- Server version → 200
- Start session → 200/201/409

---

## 📋 RESULTADO ESPERADO

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔧 FIX DEFINITIVO: WAHA Limpio y Funcionando
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[PASO 1/5] Limpieza completa ✅
[PASO 2/5] Credenciales creadas ✅
[PASO 3/5] Archivos de configuración ✅
[PASO 4/5] Contenedores iniciados ✅
[PASO 5/5] Verificación:

🧪 TEST 1: Health Check... ✅ 200
🧪 TEST 2: Server Version... ✅ 200
🧪 TEST 3: Start Session... ✅ 200

✅✅✅ WAHA FUNCIONA CORRECTAMENTE ✅✅✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📋 CREDENCIALES PARA VERCEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WAHA_BASE_URL=https://wpp.galle18k.com
WAHA_API_KEY=bb841979e8b66e6a0f563235b5df3d9a
WAHA_DASHBOARD_USERNAME=admin
WAHA_DASHBOARD_PASSWORD=3e15bf389c14df504b858886b30b03a7
```

---

## 📝 DESPUÉS DEL SCRIPT

### 1. Copiar las credenciales

Las credenciales que muestra el script.

### 2. Verificar desde internet

Desde tu PC:

```bash
curl -i https://wpp.galle18k.com/health
```

**Debe responder**: `HTTP/2 200`

### 3. Agregar en Vercel

Si las credenciales no están o cambiaron:

Ve a: https://vercel.com/galleorolaminado18ks-projects/dashboard/settings/environment-variables

Agregar/Actualizar:
- `WAHA_BASE_URL` = `https://wpp.galle18k.com`
- `WAHA_API_KEY` = `bb841979e8b66e6a0f563235b5df3d9a`
- `WAHA_DASHBOARD_USERNAME` = `admin`
- `WAHA_DASHBOARD_PASSWORD` = `3e15bf389c14df504b858886b30b03a7`

### 4. Redeploy en Vercel

Solo si cambiaste las variables.

### 5. Probar en el dashboard

Ir a: Configuración → Conectar WhatsApp

El error "fetch failed" debe desaparecer.

---

## 🔧 DIFERENCIAS CON EL SCRIPT ANTERIOR

| Aspecto | Script anterior | Script nuevo |
|---------|----------------|--------------|
| Docker Compose | Requiere v2 | No necesita |
| Instalación | `apt-get install` | No instala nada |
| Comandos | `docker compose up` | `docker run` |
| Compatibilidad | Limitada | Universal |
| Complejidad | Mayor | Menor |

---

## 📊 COMANDOS ÚTILES POST-FIX

### Ver contenedores:
```bash
docker ps
```

### Ver logs:
```bash
docker logs waha-api
docker logs caddy
```

### Reiniciar:
```bash
docker restart waha-api caddy
```

### Detener:
```bash
docker stop waha-api caddy
```

### Iniciar de nuevo:
```bash
docker start waha-api caddy
```

### Ver credenciales:
```bash
cat /opt/baileys/.env
```

---

## 🚨 SI ALGÚN TEST FALLA

### Test 1 falla (Health):
```bash
docker logs waha-api --tail 50
```

Ver si hay errores en el inicio de WAHA.

### Test 2 o 3 falla (API Key):
Verificar que las variables se cargaron:

```bash
docker exec waha-api printenv | grep WAHA
```

Debe mostrar:
```
WAHA_API_KEY=bb841979e8b66e6a0f563235b5df3d9a
WAHA_DASHBOARD_USERNAME=admin
WAHA_DASHBOARD_PASSWORD=3e15bf389c14df504b858886b30b03a7
```

### Caddy no inicia:
```bash
docker logs caddy --tail 50
```

Ver si hay errores de configuración.

---

## ⏱️ TIEMPO DE EJECUCIÓN

- Limpieza: ~10 segundos
- Creación de archivos: ~5 segundos
- Descarga imágenes Docker: ~2 minutos (primera vez)
- Inicio de contenedores: ~30 segundos

