# 📋 Guía de Configuración del Dashboard - Para Nueva Empresa

Esta guía te ayudará a configurar completamente el dashboard para una nueva empresa en pocos pasos.

## 🚀 Pasos de Configuración Inicial

### 1️⃣ Base de Datos (Supabase)

1. Ve a [Supabase](https://supabase.com) y crea un nuevo proyecto
2. En el SQL Editor, ejecuta el script de migración:
   ```sql
   -- Copiar y ejecutar: scripts/055_crm_config_table.sql
   ```
3. Obtén tus credenciales:
   - **Supabase URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: En Settings > API > anon public key

4. Crea un archivo `.env.local` con:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_aqui
   ```

---

### 2️⃣ Configuración del CRM (Dashboard)

1. Accede a: **Dashboard > Configuración**
2. Ve a la pestaña **"CRM & WhatsApp"**

#### WhatsApp Business
- Ingresa tu número de WhatsApp Business (sin +57)
- Se generará automáticamente un código QR
- Escanea el QR con tu WhatsApp Business para vincular
- Las notificaciones empezarán a llegar automáticamente

#### Email de Notificaciones
- Ingresa el email donde quieres recibir alertas
- Ejemplo: `notificaciones@tuempresa.com`

---

### 3️⃣ Integraciones Externas

#### MiPaquete (Envíos)
1. Accede a [MiPaquete](https://www.mipaquete.com) y crea una cuenta
2. Obtén tus credenciales API:
   - **API Key**: En tu panel de MiPaquete > API
   - **Session Tracker**: Proporcionado al activar la API
3. En el dashboard: **Configuración > Integraciones > MiPaquete**
4. Pega las credenciales y guarda

#### Supabase Database
- Copia las credenciales de tu proyecto Supabase
- Pégalas en: **Configuración > Integraciones > Supabase**
- Estas ya deberían estar en `.env.local`, pero puedes verificarlas aquí

#### Webhooks (Opcional)
- Si necesitas recibir notificaciones de servicios externos
- Ingresa tu URL de webhook: `https://tudominio.com/api/webhooks`

---

### 4️⃣ Datos de la Empresa

1. Ve a: **Configuración > Datos Empresa**
2. Completa:
   - **Nombre de la Empresa**: Tu razón social
   - **URL del Logo**: Link a tu logo (PNG/JPG transparente recomendado)

---

## ✅ Verificación de Configuración

### Checklist:
- [ ] Base de datos Supabase creada y migración ejecutada
- [ ] Variables de entorno `.env.local` configuradas
- [ ] WhatsApp Business vinculado (código QR escaneado)
- [ ] Email de notificaciones configurado
- [ ] Credenciales MiPaquete ingresadas
- [ ] Datos de empresa completados

---

## 🔧 Solución de Problemas

### El código QR de WhatsApp no aparece
- Verifica que el número tenga 10 dígitos
- No incluyas el código de país (+57)
- Recarga la página

### Error al guardar configuración
- Verifica que Supabase esté activo
- Revisa que la migración se ejecutó correctamente
- Revisa la consola del navegador (F12) para más detalles

### Las notificaciones de WhatsApp no llegan
- Asegúrate de haber escaneado el código QR
- Verifica que tu WhatsApp Business esté activo
- El número debe ser el mismo que usas en WhatsApp Business

---

## 📞 Soporte

Si tienes problemas con la configuración:
1. Revisa esta guía paso a paso
2. Verifica los logs en la consola del navegador (F12)
3. Asegúrate de que todas las credenciales sean correctas

---

## 🎯 Próximos Pasos

Una vez configurado:
1. Crea tu primera venta en **Ventas**
2. Genera una factura en **Facturas**
3. Crea un envío con contraentrega
4. Las notificaciones comenzarán a llegar automáticamente

---

**Última actualización**: 2025-11-06  
**Versión del dashboard**: v4.0-CRM

