# ✅ VERIFICACIÓN DEL FIX DE NÚMEROS WHATSAPP

**Fecha**: 2025-12-17
**Status**: 🟡 Esperando deploy en Vercel

---

## 📋 CHECKLIST DE VERIFICACIÓN

### 1. ✅ Base de datos limpia
```sql
SELECT phone, client_name FROM crm_conversations;
```
**Resultado**: Solo 1 conversación válida con número `573043878388` ✅

---

### 2. 🟡 Verificar deploy en Vercel

**Ir a**: https://vercel.com/galleaprobaciones-9369s-projects/v0-nuevocursor-withvercelfix

**Buscar el commit**: `fix(crm): normalización robusta de números WhatsApp`

**Estado esperado**:
- 🟢 Building... → Ready ✅

**Tiempo estimado**: 2-3 minutos

---

### 3. 🔍 Verificar que el código nuevo esté en producción

**Opción A: Revisar logs en Vercel**

1. Ir a: https://vercel.com/.../deployments
2. Hacer clic en el deployment más reciente
3. Ir a "Function Logs"
4. Buscar endpoint: `/api/whatsapp/webhook`

**Opción B: Enviar mensaje de prueba desde WhatsApp**

1. Desde tu teléfono, envía un mensaje al número conectado
2. Verificar en logs de Vercel que aparezca:
   ```
   💬 Mensaje entrante para CRM:
   from: 57XXXXXXXXXX (normalizado)
   original: 57XXXXXXXXXX@s.whatsapp.net
   ```

---

### 4. 🧪 PRUEBA EN VIVO

**Paso a paso:**

1. **Conectar WhatsApp** (si no está conectado):
   - Ir a tu dashboard CRM
   - Escanear QR si es necesario

2. **Enviar mensaje de prueba**:
   - Desde tu teléfono personal
   - Enviar: "Hola, prueba de número válido"

3. **Verificar en Supabase**:
   ```sql
   SELECT phone, client_name, last_message, created_at
   FROM crm_conversations
   ORDER BY created_at DESC
   LIMIT 5;
   ```

4. **Resultado esperado**:
   - El número debe ser `57XXXXXXXXXX` (12 dígitos)
   - NO debe ser UUID ni número con letras
   - El mensaje debe aparecer correctamente

---

### 5. ✅ Verificar logs del webhook

**En Vercel Function Logs, buscar:**

```
✅ Logs correctos (DESPUÉS del fix):
💬 Mensaje entrante para CRM:
  from: 573001234567 (normalizado)
  original: 573001234567@s.whatsapp.net
📋 Conversación CRM:
  phone: 573001234567

❌ Logs incorrectos (ANTES del fix):
💬 Mensaje entrante para CRM:
  from: 60dec0b92-915c-4551...
  original: 60dec0b92-915c-4551...
```

---

## 🎯 CRITERIOS DE ÉXITO

El fix está funcionando correctamente si:

- ✅ Nuevos mensajes se guardan con números válidos (57XXXXXXXXXX)
- ✅ NO aparecen UUIDs en crm_conversations
- ✅ NO aparecen números con letras (a-f)
- ✅ Todos los números tienen entre 10-15 dígitos
- ✅ Los mensajes se envían a los contactos correctos
- ✅ En logs aparece "from: 57XXXXXXXXXX" y "original: ..."

---

## 🚨 SI EL FIX NO FUNCIONA

### Problema 1: Aún aparecen UUIDs

**Solución**:
1. Verificar que el deploy se completó en Vercel
2. Hard refresh del dashboard (Ctrl + Shift + R)
3. Verificar que el gateway Baileys esté enviando el campo `from` correctamente

### Problema 2: El webhook no recibe mensajes

**Solución**:
1. Verificar conexión WhatsApp: `http://31.220.58.83:3010/status`
2. Verificar webhook configurado en gateway
3. Revisar logs en Vercel: `/api/whatsapp/webhook`

### Problema 3: Números se guardan sin el prefijo 57

**Solución**:
1. Ejecutar este UPDATE en Supabase:
   ```sql
   UPDATE crm_conversations
   SET phone = '57' || phone
   WHERE length(phone) = 10 AND phone LIKE '3%';
   ```

---

## 📞 COMANDOS ÚTILES PARA DEBUGGING

### Ver todas las conversaciones:
```sql
SELECT phone, client_name, status, created_at
FROM crm_conversations
ORDER BY created_at DESC;
```

### Ver mensajes de una conversación:
```sql
SELECT sender, content, timestamp
FROM crm_messages
WHERE conversation_id = 'TU_CONVERSATION_ID'
ORDER BY timestamp DESC;
```

### Ver números que empiezan con algo raro:
```sql
SELECT phone, client_name
FROM crm_conversations
WHERE phone NOT LIKE '57%'
ORDER BY created_at DESC;
```

### Eliminar conversación específica:
```sql
DELETE FROM crm_conversations
WHERE phone = 'NUMERO_INVALIDO';
```

---

## 🎉 PRÓXIMOS PASOS (DESPUÉS DE VERIFICAR)

1. **Hacer merge a main** (si todo funciona correctamente)
2. **Monitorear logs** durante las próximas horas
3. **Documentar** el incidente y la solución
4. **Considerar agregar alertas** para detectar números inválidos automáticamente

---

**Desarrollado por**: Claude Code Assistant
**Versión**: 1.0.0
**Última actualización**: 2025-12-17
