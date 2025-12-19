# 🚀 GUÍA RÁPIDA: Vincular WhatsApp Business REAL

## ✅ CAMBIOS IMPLEMENTADOS

Tu dashboard ahora está configurado para usar **QR REAL de WhatsApp Web** mediante WAHA.

---

## 📋 PASOS PARA VINCULAR WHATSAPP

### Paso 1: Instalar Docker

**Windows:**
1. Descarga Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Instala y reinicia tu PC
3. Abre Docker Desktop (debe estar corriendo)

**Verificar instalación:**
```bash
docker --version
# Debe mostrar: Docker version 24.x.x
```

---

### Paso 2: Levantar WAHA

En la raíz del proyecto (carpeta `dashboard`), ejecuta:

```bash
docker-compose -f docker-compose.waha.yml up -d
```

**Verificar que está corriendo:**
```bash
docker ps
# Debe mostrar: waha-whatsapp con status "Up"
```

**Ver logs (opcional):**
```bash
docker logs -f waha-whatsapp
```

---

### Paso 3: Configurar en el Dashboard

1. **Accede a**: `https://tu-dashboard.vercel.app/configuracion`

2. **Ingresa tu número** de WhatsApp Business (10 dígitos, sin +57)
   - Ejemplo: `3001234567`

3. **Click en "Conectar WhatsApp"**
   - Espera unos segundos
   - Aparecerá el QR REAL de WhatsApp Web

4. **Escanea el QR** con tu WhatsApp Business:
   - Abre WhatsApp Business en tu teléfono
   - Ve a: `⋮ Más opciones > Dispositivos vinculados`
   - Click en: `Vincular un dispositivo`
   - Escanea el código QR del dashboard

5. **¡Listo!** 
   - El estado cambiará a "✅ WhatsApp Conectado"
   - Ya puedes enviar/recibir mensajes desde el dashboard

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### "Error conectando con WAHA"
```bash
# Verificar que Docker está corriendo
docker ps

# Si no está corriendo, levántalo
docker-compose -f docker-compose.waha.yml up -d

# Ver logs para más detalles
docker logs waha-whatsapp
```

### "El QR no aparece"
```bash
# Reiniciar WAHA
docker-compose -f docker-compose.waha.yml restart

# Luego en el dashboard, click en "Conectar WhatsApp" nuevamente
```

### "QR expirado"
- El QR expira después de 2 minutos
- Recarga la página y click en "Conectar WhatsApp" de nuevo

### "No puedo escanear el QR"
- Asegúrate de usar **WhatsApp Business** (no WhatsApp normal)
- El número del dashboard debe coincidir con tu WhatsApp Business
- Verifica que tu teléfono tenga internet

### "Reloj del servidor desfasado"
```bash
# Sincronizar hora del sistema (Windows)
# En PowerShell como Administrador:
net stop w32time
net start w32time
w32tm /resync
```

---

## 📊 VERIFICAR ESTADO

### Verificar sesión en WAHA:
```bash
curl http://localhost:3000/api/sessions/default
```

Debe responder:
```json
{
  "name": "default",
  "status": "WORKING"  // Significa conectado
}
```

### Estados posibles:
- `STOPPED` - Sesión detenida
- `STARTING` - Iniciando
- `SCAN_QR_CODE` - Esperando escaneo de QR
- `WORKING` - ✅ Conectado y funcionando
- `FAILED` - Error

---

## 🧪 PROBAR ENVÍO DE MENSAJE

Una vez conectado, prueba enviar un mensaje:

```bash
curl -X POST http://localhost:3000/api/sendText \
  -H "Content-Type: application/json" \
  -d '{
    "session": "default",
    "chatId": "573001234567@c.us",
    "text": "¡Prueba desde WAHA! ✅"
  }'
```

(Reemplaza `573001234567` con un número real)

---

## 🔄 COMANDOS ÚTILES

### Ver logs en tiempo real:
```bash
docker logs -f waha-whatsapp
```

### Reiniciar WAHA:
```bash
docker-compose -f docker-compose.waha.yml restart
```

### Detener WAHA:
```bash
docker-compose -f docker-compose.waha.yml down
```

### Eliminar y recrear:
```bash
docker-compose -f docker-compose.waha.yml down -v
docker-compose -f docker-compose.waha.yml up -d
```

---

## 📱 DESDE EL DASHBOARD

### Flujo de uso:
1. ✅ Levantar WAHA con Docker
2. ✅ Ir a `/configuracion`
3. ✅ Ingresar número
4. ✅ Click "Conectar WhatsApp"
5. ✅ Escanear QR
6. ✅ Estado: "WhatsApp Conectado"
7. ✅ Click "Guardar Configuración"

### Desconectar:
- Click en "Desconectar WhatsApp"
- Esto cerrará la sesión en WAHA

---

## ⚠️ NOTAS IMPORTANTES

### Persistencia de sesión:
- Los datos de sesión se guardan en `./waha-data/`
- No elimines esta carpeta o tendrás que escanear el QR nuevamente

### Límites de WhatsApp:
- ⚠️ No envíes mensajes masivos (riesgo de baneo)
- ⚠️ Usa delays aleatorios entre mensajes
- ⚠️ Mantén volumen bajo al inicio
- ⚠️ Prefiere que los clientes inicien la conversación

### Producción:
- En producción, WAHA debe correr en un servidor separado
- Usa HTTPS para el dashboard
- Configura webhooks para mensajes entrantes
- Implementa rate limiting

---

## 📞 CHECKLIST FINAL

Antes de usar en producción:

- [ ] Docker instalado y corriendo
- [ ] WAHA levantado (`docker ps` muestra contenedor activo)
- [ ] QR escaneado exitosamente
- [ ] Estado: "WhatsApp Conectado" en dashboard
- [ ] Prueba de envío exitosa
- [ ] Carpeta `waha-data/` con permisos correctos
- [ ] Logs sin errores críticos

---

## 🎯 RESUMEN

**Antes:**
- ❌ QR de `wa.me` (solo link de contacto)
- ❌ No se puede vincular como dispositivo
- ❌ Sin automatización

**Ahora:**
- ✅ QR REAL de WhatsApp Web
- ✅ Se vincula como dispositivo
- ✅ Envío/recepción automatizada
- ✅ Sesión persistente
- ✅ Webhooks disponibles

---

**Última actualización**: 2025-11-06 18:30  
**Commit**: `bce6f5d`  
**Estado**: ✅ Implementación completa lista para usar

