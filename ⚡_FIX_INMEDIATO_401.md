# ⚡ FIX INMEDIATO - ERROR 401 EN PASO 1

## 🔍 PROBLEMA IDENTIFICADO

El test mostró **401 Unauthorized**, lo que significa que la API Key en `/opt/baileys/.env` no es la que WAHA está usando actualmente.

---

## ✅ SOLUCIÓN (1 COMANDO)

Ejecutar en el VPS:

```bash
curl -o fix-creds.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/fix-waha-credentials.sh && chmod +x fix-creds.sh && ./fix-creds.sh
```

---

## 🔧 QUÉ HACE ESTE SCRIPT

1. ✅ Detiene WAHA
2. ✅ Genera nuevas credenciales aleatorias
3. ✅ Las guarda en `/opt/baileys/.env`
4. ✅ Actualiza `docker-compose.yml` para usar `env_file`
5. ✅ Inicia WAHA con las nuevas credenciales
6. ✅ Verifica que funciona con 3 tests:
   - Health check (sin auth)
   - Server version (con nueva API Key)
   - Start session (con nueva API Key)

---

## 📋 RESULTADO ESPERADO

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📋 COPIAR ESTAS CREDENCIALES AHORA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WAHA_API_KEY=abc123def456...
WAHA_DASHBOARD_USERNAME=admin
WAHA_DASHBOARD_PASSWORD=xyz789...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧪 Test 1: Health check... Status: 200 ✅
🧪 Test 2: Server version... Status: 200 ✅
🧪 Test 3: Start session... Status: 200/201/409 ✅

✅ WAHA FUNCIONA CORRECTAMENTE
```

---

## 📝 DESPUÉS DE EJECUTAR EL SCRIPT

### 1. Copiar las credenciales que muestra

El script mostrará algo como:

```
WAHA_API_KEY=b903fe1306a34b2a989c7d41f8ae2c55
WAHA_DASHBOARD_USERNAME=admin
WAHA_DASHBOARD_PASSWORD=aa926c4bf0d44bdab34eccb17524760c
```

### 2. Agregarlas en Vercel

Ve a: https://vercel.com/galleorolaminado18ks-projects/dashboard/settings/environment-variables

**Agregar/Actualizar estas variables**:

| Name | Value |
|------|-------|
| `WAHA_BASE_URL` | `https://wpp.galle18k.com` |
| `WAHA_API_KEY` | (copiar del script) |
| `WAHA_DASHBOARD_USERNAME` | `admin` |
| `WAHA_DASHBOARD_PASSWORD` | (copiar del script) |

**Importante**: Guardar en **"All Environments"**

### 3. Redeploy en Vercel

Click en **"Redeploy"** para aplicar las nuevas credenciales.

### 4. Verificar endpoint de diagnóstico

Después del redeploy, ir a:

```
https://tu-dashboard.vercel.app/api/diag/waha
```

Debe mostrar:
```json
{
  "env": {
    "HAS_KEY": true,
    "KEY_LENGTH": 32
  },
  "waha": {
    "status": 200
  },
  "interpretation": {
    "diagnosis": "✅ TODO CORRECTO"
  }
}
```

---

## 🔍 POR QUÉ PASÓ ESTO

WAHA puede regenerar las credenciales en estos casos:

1. ❌ Si no encuentra el archivo `.env` al iniciar
2. ❌ Si el `docker-compose.yml` no tiene `env_file: - .env`
3. ❌ Si se reinicia el contenedor sin persistir las variables

**Solución**: El script asegura que:
- ✅ El `.env` existe con credenciales fijas
- ✅ El `docker-compose.yml` carga el `.env`
- ✅ Las credenciales persisten entre reinicios

---

## 🚀 FLUJO COMPLETO

```
1. VPS: Ejecutar fix-waha-credentials.sh
   ↓
   ✅ Nuevas credenciales generadas
   ✅ WAHA reiniciado
   ✅ Tests pasan (200 OK)
   ↓
2. Copiar: WAHA_API_KEY
   ↓
3. Vercel: Agregar variables → Redeploy
   ↓
4. Browser: /api/diag/waha
   ↓
   ✅ HAS_KEY: true, status: 200
   ↓
5. Dashboard: Conectar WhatsApp
   ↓
   ✅ QR aparece
```

---

## ⏱️ TIEMPO ESTIMADO

- Ejecutar script: 2 minutos
- Configurar Vercel: 2 minutos
- Redeploy: 2 minutos

**Total: ~6 minutos**

---

## 📞 SI SIGUE CON 401 DESPUÉS DEL SCRIPT

### Verificar que el .env se carga correctamente:

```bash
cd /opt/baileys
docker-compose exec waha printenv | grep WAHA
```

Debe mostrar:
```
WAHA_API_KEY=abc123...
WAHA_DASHBOARD_USERNAME=admin
WAHA_DASHBOARD_PASSWORD=xyz789...
```

### Si no muestra nada:

El contenedor no está cargando el `.env`. Verificar:

```bash
cat docker-compose.yml | grep -A 2 "env_file"
```

Debe mostrar:
```yaml
env_file:
  - .env
```

---

## ✅ COMANDO ÚNICO PARA COPIAR

```bash
curl -o fix-creds.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/fix-waha-credentials.sh && chmod +x fix-creds.sh && ./fix-creds.sh
```

**Este script resuelve el problema de raíz!** 🚀

