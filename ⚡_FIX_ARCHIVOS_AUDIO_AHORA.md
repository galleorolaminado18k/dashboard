# 🔧 FIX ENVÍO DE ARCHIVOS Y AUDIO - INSTRUCCIONES

## Problema
El upload a Supabase Storage no funciona, causando "Error de conexión al subir archivo".

## Solución Implementada
Se modificó el sistema para enviar archivos directamente como base64 al gateway, sin depender de Supabase Storage.

---

## PASO 1: Push a GitHub (en tu PC)

Abre **CMD** (no PowerShell) y ejecuta:

```cmd
cd C:\Users\USUARIO\WebstormProjects\dashboard
git add -A
git commit -m "fix: soporte base64 para envio de archivos y audio"
git push
```

---

## PASO 2: Actualizar Gateway en VPS

Conéctate al VPS:
```bash
ssh root@31.220.58.83
```

Luego ejecuta estos comandos:

```bash
cd /root/whatsapp-gateway

# Detener el gateway actual
pm2 stop gateway 2>/dev/null || true

# Hacer backup
cp gateway-updated.js gateway-backup.js

# Descargar el nuevo archivo desde GitHub
curl -sL "https://raw.githubusercontent.com/TU_USUARIO/TU_REPO/main/whatsapp-gateway/gateway-updated.js" -o gateway-updated.js

# O si prefieres, copia este contenido manualmente:
cat > gateway-updated.js << 'ENDOFFILE'
... (copiar el contenido de whatsapp-gateway/gateway-updated.js)
ENDOFFILE

# Reiniciar el gateway
pm2 restart gateway || pm2 start gateway-updated.js --name gateway

# Ver logs
pm2 logs gateway
```

---

## Cambios Realizados

### 1. Nueva API `/api/crm/send-file`
- Recibe archivos directamente como FormData
- Convierte a base64 y envía al gateway
- No depende de Supabase Storage

### 2. Gateway actualizado (`gateway-updated.js`)
- Endpoint `/send` ahora acepta `mediaData` (base64 data URL)
- Soporta buffers además de URLs
- Límite de body aumentado a 50MB

### 3. Frontend (`page.tsx`)
- `handleSendFile` usa el nuevo endpoint
- `startRecording` usa el nuevo endpoint
- Sin paso intermedio de upload a Storage

---

## Verificación

Después de actualizar:

1. Verifica que el gateway esté corriendo:
```bash
curl http://31.220.58.83:3010/health
```

2. En el CRM, intenta:
   - Enviar una imagen
   - Grabar y enviar una nota de voz
   - Enviar un documento PDF

---

## Si sigue fallando

Verifica los logs:
- **Vercel**: En el dashboard de Vercel > Deployments > Functions > Logs
- **Gateway**: `pm2 logs gateway`

El error más probable es que el gateway no se haya actualizado. Verifica con:
```bash
grep -c "mediaData" /root/whatsapp-gateway/gateway-updated.js
# Debe mostrar al menos 3 ocurrencias
```

