#!/bin/bash

# ⚡ SCRIPT AUTOMÁTICO - Iniciar Cloudflare Tunnel para WAHA
# Ejecutar: ./tunnel-waha.sh

echo ""
echo "========================================"
echo "   CLOUDFLARE TUNNEL - WAHA"
echo "========================================"
echo ""

# Verificar que WAHA esté corriendo
echo "[1/4] Verificando WAHA..."
if ! docker ps | grep -q waha; then
    echo "❌ WAHA no está corriendo"
    echo ""
    echo "Iniciando WAHA..."
    docker-compose -f docker-compose.waha.yml up -d
    sleep 10
fi
echo "✅ WAHA está corriendo"

# Verificar health
echo ""
echo "[2/4] Verificando health..."
if ! curl -s http://127.0.0.1:3000/health | grep -q "ok"; then
    echo "❌ WAHA no responde"
    echo "Por favor verifica manualmente: curl http://127.0.0.1:3000/health"
    exit 1
fi
echo "✅ WAHA responde OK"

# Verificar cloudflared
echo ""
echo "[3/4] Verificando cloudflared..."
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared no está instalado"
    echo ""
    echo "Instala con:"
    echo "  macOS:  brew install cloudflare/cloudflare/cloudflared"
    echo "  Linux:  wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && sudo dpkg -i cloudflared-linux-amd64.deb"
    exit 1
fi
echo "✅ cloudflared instalado"

# Iniciar túnel
echo ""
echo "[4/4] Iniciando túnel HTTPS público..."
echo ""
echo "========================================"
echo " COPIAR LA URL QUE APARECE ABAJO"
echo " Ejemplo: https://abc123xyz.trycloudflare.com"
echo "========================================"
echo ""
echo "📋 SIGUIENTE PASO:"
echo "   1. Copiar la URL del túnel"
echo "   2. Ir a: https://vercel.com/dashboard"
echo "   3. Settings → Environment Variables"
echo "   4. WAHA_BASE_URL = [PEGAR URL]"
echo "   5. Redeploy"
echo ""
echo "⚠️  MANTENER ESTA TERMINAL ABIERTA"
echo ""

cloudflared tunnel --url http://127.0.0.1:3000
# ⚡ SOLUCIÓN RÁPIDA - Cloudflare Tunnel (10 MINUTOS)

## 🎯 PROBLEMA
```
Error 500/502: No se pudo conectar con WAHA: fetch failed
```

**Causa:** Vercel no puede acceder a `localhost:3000` de tu PC.

**Solución:** Exponer WAHA por HTTPS público con Cloudflare Tunnel (GRATIS).

---

## 🚀 PASO 1: Verificar WAHA Local (1 min)

```bash
# Verificar que WAHA esté corriendo
docker ps | grep waha

# Test health
curl http://127.0.0.1:3000/health
# Debe responder: {"status": "ok"}
```

**Si no está corriendo:**
```bash
cd C:\Users\USUARIO\WebstormProjects\dashboard
docker-compose -f docker-compose.waha.yml up -d
```

---

## 🚀 PASO 2: Instalar Cloudflare Tunnel (2 min)

### **Windows:**
```powershell
# Descargar cloudflared
winget install --id Cloudflare.cloudflared

# O descarga manual:
# https://github.com/cloudflare/cloudflared/releases/latest
# Descarga: cloudflared-windows-amd64.exe
# Renombra a: cloudflared.exe
# Mueve a: C:\Windows\System32\
```

### **Verificar instalación:**
```bash
cloudflared --version
# Debe mostrar: cloudflared version 2024.x.x
```

---

## 🚀 PASO 3: Iniciar Túnel HTTPS (1 min)

```bash
# Exponer WAHA en puerto 3000
cloudflared tunnel --url http://127.0.0.1:3000
```

**Verás algo como:**
```
2024-11-06T19:40:00Z INF +--------------------------------------------------------------------------------------------+
2024-11-06T19:40:00Z INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
2024-11-06T19:40:00Z INF |  https://abc123xyz.trycloudflare.com                                                       |
2024-11-06T19:40:00Z INF +--------------------------------------------------------------------------------------------+
```

**✅ COPIAR ESA URL:** `https://abc123xyz.trycloudflare.com`

⚠️ **IMPORTANTE:** Dejar esta terminal abierta (el túnel debe seguir corriendo).

---

## 🚀 PASO 4: Verificar Túnel Público (1 min)

**Desde otra terminal o navegador:**
```bash
# Test desde internet (no localhost)
curl https://abc123xyz.trycloudflare.com/health
# Debe responder: {"status": "ok"}

# Test API de sesión
curl https://abc123xyz.trycloudflare.com/api/session/default/state
# Debe responder: {"state": "STOPPED"} o similar
```

---

## 🚀 PASO 5: Configurar en Vercel (2 min)

1. **Ir a:** https://vercel.com/dashboard

2. **Seleccionar:** tu proyecto `dashboard-galle`

3. **Settings → Environment Variables**

4. **Add New:**
   ```
   Name:  WAHA_BASE_URL
   Value: https://abc123xyz.trycloudflare.com

   Apply to:
   ☑ Production
   ☑ Preview
   ☑ Development
   ```

5. **Click:** `Save`

---

## 🚀 PASO 6: Redeploy en Vercel (1 min)

**Opción A (Automático):**
- Vercel redeploy automáticamente al cambiar variables
- Espera 1-2 minutos

**Opción B (Manual):**
```
Vercel Dashboard
→ Deployments
→ Último deploy
→ ... (menú)
→ Redeploy
```

**Opción C (Forzar desde Git):**
```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

---

## 🚀 PASO 7: VERIFICAR ¡FUNCIONA! (2 min)

1. **Esperar:** 1-2 minutos a que Vercel termine el deploy

2. **Ir a:** https://dashboard-galle.vercel.app/configuracion

3. **Ingresar número:** `+57 3012439596`

4. **Click:** "Conectar WhatsApp"

5. **✅ DEBE APARECER:** QR CODE sin error 500

6. **Escanear:** QR con WhatsApp Business

7. **✅ ÉXITO:** Verás "Conectado" en el dashboard

---

## 🔍 TROUBLESHOOTING

### ❌ Error: "tunnel timeout"

**Solución:**
```bash
# Detener túnel (Ctrl+C)
# Reiniciar con más logs
cloudflared tunnel --url http://127.0.0.1:3000 --loglevel debug
```

### ❌ Error: "WAHA_UNREACHABLE" en Vercel

**Verificar:**
```bash
# 1. Túnel sigue corriendo (no cerraste la terminal)
# 2. WAHA responde
curl https://tu-url.trycloudflare.com/health

# 3. Variable configurada en Vercel
# Ver: Vercel → Settings → Environment Variables

# 4. Redeploy realizado
# Ver: Vercel → Deployments (último debe ser reciente)
```

### ❌ Error: "cloudflared: command not found"

**Solución Windows:**
```powershell
# Instalar manualmente
# 1. Descargar: https://github.com/cloudflare/cloudflared/releases/latest
# 2. Descarga: cloudflared-windows-amd64.exe
# 3. Renombra: cloudflared.exe
# 4. Mueve a: C:\Windows\System32\
# 5. Abre nueva terminal y prueba: cloudflared --version
```

### ❌ Error: "Connection refused"

**Solución:**
```bash
# Verificar WAHA corriendo
docker ps | grep waha

# Si no está:
docker-compose -f docker-compose.waha.yml up -d

# Esperar 10 segundos
sleep 10

# Test
curl http://127.0.0.1:3000/health
```

---

## 📊 CHECKLIST FINAL

- [ ] WAHA corriendo (`docker ps`)
- [ ] Health OK (`curl localhost:3000/health`)
- [ ] Cloudflared instalado
- [ ] Túnel iniciado (terminal abierta)
- [ ] URL pública funciona (`curl https://...trycloudflare.com/health`)
- [ ] Variable `WAHA_BASE_URL` en Vercel
- [ ] Redeploy en Vercel
- [ ] QR aparece sin error 500
- [ ] QR escaneado con WhatsApp
- [ ] Conexión exitosa

---

## 💡 ALTERNATIVA: ngrok

Si Cloudflare Tunnel no funciona:

```bash
# Instalar ngrok
winget install --id ngrok.ngrok

# O descarga: https://ngrok.com/download

# Iniciar túnel
ngrok http 3000

# Copiar URL: https://xxxxx.ngrok.io
# Configurar en Vercel: WAHA_BASE_URL = https://xxxxx.ngrok.io
```

---

## 🎯 MANTENER TÚNEL SIEMPRE ACTIVO

### **Opción 1: Dejar terminal abierta**
- Más simple
- Requiere PC encendida

### **Opción 2: Ejecutar como servicio (Windows)**
```powershell
# Crear archivo: C:\cloudflared\config.yml
tunnel: auto
url: http://127.0.0.1:3000
logfile: C:\cloudflared\tunnel.log

# Instalar servicio
cloudflared service install
cloudflared service start

# Ver logs
Get-Content C:\cloudflared\tunnel.log -Wait
```

### **Opción 3: Deploy WAHA en Railway (permanente)**
Ver: `GUIA_DESPLIEGUE_WAHA.md`

---

## 📞 SOPORTE

**¿Túnel funciona pero Vercel sigue dando error?**

Ver logs de Vercel:
```
Vercel → Deployments → último deploy → Runtime Logs
Buscar: "WAHA_UNREACHABLE" o "WAHA_START_" o "WAHA_QR_"
```

**¿Necesitas ayuda?**

1. Compartir URL de túnel
2. Compartir logs de Vercel
3. Compartir respuesta de: `curl https://tu-tunnel.trycloudflare.com/health`

---

**Tiempo total:** 10 minutos
**Costo:** $0 (GRATIS)
**Resultado:** ✅ Error 500 resuelto

---

**Última actualización:** 2025-11-06 19:45
**Prioridad:** 🔴 CRÍTICO - Ejecutar AHORA

