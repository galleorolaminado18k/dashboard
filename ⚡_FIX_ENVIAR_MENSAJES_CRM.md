# 🔧 SOLUCIÓN: Mensajes no salen del CRM

## ❌ Problema
Los mensajes **entran** correctamente al CRM, pero cuando intentas **enviar** desde el CRM aparece:
```
Error enviando mensaje: fetch failed
```

## 🎯 Causa
Vercel no puede conectarse al gateway de WhatsApp en `http://31.220.58.83:3010` porque:
1. La variable `WHATSAPP_GATEWAY_URL` no está configurada en Vercel
2. El puerto 3010 puede estar bloqueado o el gateway no está corriendo

---

## ✅ PASO 1: Configurar Variable en Vercel

1. Ve a: https://vercel.com/galleaprobaciones-9369s-projects/dashboard-galle/settings/environment-variables

2. Agrega esta variable:
   - **Name**: `WHATSAPP_GATEWAY_URL`
   - **Value**: `http://31.220.58.83:3010`
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development

3. Haz clic en **Save**

---

## ✅ PASO 2: Verificar que el Gateway está corriendo en el VPS

Conéctate al VPS y ejecuta:

```bash
ssh root@31.220.58.83

# Verificar si el gateway está corriendo
pm2 status

# Si no está corriendo, iniciarlo
cd /root/whatsapp-gateway
pm2 start index.cjs --name wa-gateway

# Ver logs
pm2 logs wa-gateway --lines 20
```

---

## ✅ PASO 3: Verificar conectividad

Desde tu navegador, visita:
```
http://31.220.58.83:3010/health
```

Deberías ver algo como:
```json
{"ok":true,"isConnected":true,"hasQR":false,"phone":"573XXXXXXXXX"}
```

Si no puedes acceder, el puerto 3010 está bloqueado.

---

## ✅ PASO 4: Abrir el puerto 3010 (si está bloqueado)

En el VPS:
```bash
# Para UFW
sudo ufw allow 3010

# Para iptables
sudo iptables -A INPUT -p tcp --dport 3010 -j ACCEPT
```

---

## ✅ PASO 5: Redesplegar en Vercel

Después de agregar la variable de entorno:

1. Ve a: https://vercel.com/galleaprobaciones-9369s-projects/dashboard-galle/deployments
2. Haz clic en los 3 puntos del deployment más reciente
3. Selecciona **Redeploy**
4. Espera 1-2 minutos

---

## 🧪 PASO 6: Probar envío

1. Refresca el CRM: https://dashboard-galle-git-fea-98639c-galleaprobaciones-9369s-projects.vercel.app/crm
2. Selecciona una conversación
3. Escribe un mensaje y presiona Enter

---

## 🔍 Diagnóstico adicional

Puedes verificar el estado del gateway desde la app visitando:
```
https://dashboard-galle-git-fea-98639c-galleaprobaciones-9369s-projects.vercel.app/api/crm/gateway-status
```

Esto te mostrará si Vercel puede conectarse al gateway.

---

## 📝 Resumen de Variables de Entorno requeridas

| Variable | Valor |
|----------|-------|
| `WHATSAPP_GATEWAY_URL` | `http://31.220.58.83:3010` |

