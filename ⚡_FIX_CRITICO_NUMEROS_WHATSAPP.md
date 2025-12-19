# ⚡ FIX CRÍTICO: Números de WhatsApp Inválidos

**Fecha**: 2025-12-17
**Prioridad**: 🔴 CRÍTICA
**Estado**: ✅ Solución lista para aplicar

---

## 🔥 PROBLEMA IDENTIFICADO

El sistema estaba **enviando mensajes a números inválidos** (UUIDs, números con prefijos incorrectos) en lugar de responder a contactos reales.

### Ejemplos de números inválidos encontrados:
```
❌ 60dec0b92-915c-4551-a170-36d1fd679360  (UUID)
❌ 6038562588634                          (Prefijo incorrecto)
❌ 697599f7-72d8-4d9d-0022-789dc23904a4   (UUID)
✅ 573912439506                           (Correcto)
```

### Causa raíz:
1. **`formatPhone()` en `lib/crm-service.ts`** solo limpiaba pero NO normalizaba
2. **Webhook** guardaba números sin validar
3. **Base de datos** tenía registros con UUIDs y números basura

---

## ✅ SOLUCIÓN APLICADA

### 1. **Corrección de `formatPhone()` en crm-service.ts**
✅ Ahora normaliza correctamente:
- 10 dígitos con 3 → `57XXXXXXXXXX`
- Elimina duplicación `5757` → `57XXXXXXXXXX`
- Valida longitud (8-15 dígitos)
- Rechaza números inválidos

### 2. **Validación estricta en webhook**
✅ Ahora rechaza mensajes con números inválidos:
- Verifica que `from` no sea vacío ni UUID
- Normaliza ANTES de guardar
- Valida longitud (10-15 dígitos)
- Solo permite dígitos puros

### 3. **Script SQL de limpieza**
✅ Creado: `scripts/057_fix_invalid_phone_numbers.sql`
- Elimina conversaciones con UUIDs
- Elimina números < 10 o > 15 dígitos
- Normaliza números colombianos
- Elimina duplicaciones `5757`

---

## 🚀 PASOS PARA APLICAR LA SOLUCIÓN

### PASO 1: Ejecutar Script SQL en Supabase

1. **Abrir Supabase SQL Editor**:
   ```
   https://supabase.com/dashboard/project/[tu-project-id]/sql
   ```

2. **Copiar y ejecutar el script**:
   ```bash
   # Abrir el archivo:
   scripts/057_fix_invalid_phone_numbers.sql
   ```

3. **Ejecutar paso a paso** (recomendado):
   - Primero ejecutar SELECT para VER qué se va a eliminar
   - Luego ejecutar DELETE para limpiar
   - Finalmente ejecutar UPDATE para normalizar

4. **Verificar resultado**:
   ```sql
   SELECT phone, client_name, status
   FROM crm_conversations
   ORDER BY created_at DESC
   LIMIT 20;
   ```

### PASO 2: Hacer Commit de los cambios

```bash
git add .
git commit -m "fix(crm): normalización robusta de números WhatsApp - elimina UUIDs y valida formato"
git push
```

### PASO 3: Deploy en Vercel

Los cambios se deployarán automáticamente en Vercel al hacer push.

**Esperar 2-3 minutos para que se aplique el deploy.**

### PASO 4: Verificar en producción

1. **Ir al CRM**:
   ```
   https://tu-dashboard.vercel.app/crm
   ```

2. **Verificar que los números son válidos**:
   - Deben tener formato `573XXXXXXXXX` (Colombia)
   - No deben haber UUIDs ni números basura

3. **Probar envío de mensaje**:
   - Seleccionar una conversación
   - Enviar un mensaje de prueba
   - Verificar que se envíe al número correcto

---

## 📊 ANTES vs DESPUÉS

### ANTES ❌
```
Tabla: crm_conversations
+---------------------------------------+----------------+
| phone                                 | client_name    |
+---------------------------------------+----------------+
| 60dec0b92-915c-4551-a170-36d1fd679360 | Cliente 9360   |
| 6038562588634                         | Cliente 8634   |
| 697599f7-72d8-4d9d-0022-789dc23904a4  | Cliente 904a4  |
| 573912439506                          | Cliente Real   |
+---------------------------------------+----------------+
```

### DESPUÉS ✅
```
Tabla: crm_conversations
+--------------+----------------+
| phone        | client_name    |
+--------------+----------------+
| 573912439506 | Cliente Real   |
| 573194141483 | Juan Pérez     |
| 573001234567 | María López    |
+--------------+----------------+
```

---

## 🔍 ARCHIVOS MODIFICADOS

1. ✅ `lib/crm-service.ts` - Función `formatPhone()` mejorada
2. ✅ `app/api/whatsapp/webhook/route.ts` - Validación estricta
3. ✅ `scripts/057_fix_invalid_phone_numbers.sql` - Script de limpieza

---

## ⚠️ NOTAS IMPORTANTES

1. **Backup recomendado**: Antes de ejecutar el script SQL, hacer backup de `crm_conversations`
   ```sql
   CREATE TABLE crm_conversations_backup AS
   SELECT * FROM crm_conversations;
   ```

2. **Datos eliminados**: Las conversaciones con números inválidos SE ELIMINARÁN permanentemente

3. **Webhook gateway**: Asegurarse de que el gateway Baileys (31.220.58.83:3010) envíe el campo `from` correctamente

4. **Formato esperado**: Todos los números quedarán en formato `57XXXXXXXXXX` (12 dígitos para Colombia)

---

## 🎯 RESULTADO ESPERADO

Después de aplicar esta solución:

✅ El CRM solo guardará números válidos (10-15 dígitos, solo números)
✅ Números colombianos normalizados a `57XXXXXXXXXX`
✅ Se rechazarán UUIDs y números inválidos automáticamente
✅ Los mensajes se enviarán a los contactos REALES
✅ No más conversaciones fantasma con números basura

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Problema: Aún aparecen números inválidos después del fix

**Solución**:
1. Verificar que se ejecutó el script SQL completo
2. Hacer hard refresh del dashboard (Ctrl + Shift + R)
3. Verificar logs en Vercel para ver si hay errores

### Problema: No llegan mensajes al webhook

**Solución**:
1. Verificar que el gateway está corriendo: `http://31.220.58.83:3010/status`
2. Verificar configuración del webhook en el gateway
3. Revisar logs del webhook en Vercel: `/api/whatsapp/webhook`

### Problema: Mensajes se envían pero no se reciben

**Solución**:
1. Verificar que WhatsApp está conectado (QR escaneado)
2. Verificar que el número destino está en formato correcto
3. Revisar logs del gateway: `http://31.220.58.83:3010/logs`

---

## 📞 SOPORTE

Si tienes problemas después de aplicar esta solución:
1. Revisar logs en Vercel
2. Revisar logs del gateway
3. Verificar tabla `crm_conversations` en Supabase
4. Contactar al desarrollador con screenshots de los logs

---

**Desarrollado por**: Claude Code Assistant
**Versión**: 1.0.0
**Última actualización**: 2025-12-17
