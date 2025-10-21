# 🔴 Estado de Devolución - Guía IQ 145

## 🎯 Propósito

Agregar estado `devolucion` al CRM para casos donde facturación marca un pedido como devuelto.

---

## 📋 Reglas Críticas

### 1. **Transición ÚNICA** 🔒
```
pedido-completo → devolucion
```
**Solo** se puede llegar a `devolucion` desde `pedido-completo`.  
Cualquier otro intento generará error en la base de datos.

### 2. **Trigger de Facturación**
- Facturación marca el pedido como "devolución"
- Motivo: Cliente no recibió el producto
- Sistema cambia estado automáticamente

### 3. **Visualización**
- Badge: 🔴 ROJO
- Productos en historial: Texto rojo + "(DEVOLUCIÓN)"
- Precio: Tachado en rojo

---

## 🚀 Implementación

### PASO 1: Ejecutar SQL

```bash
# 1. Abre Supabase SQL Editor
https://supabase.com/dashboard/project/eyrdjtsgpubazdtgywiv

# 2. Ejecuta este archivo:
scripts/032_add_devolucion_state.sql
```

**¿Qué hace este script?**
- ✅ Agrega valor `'devolucion'` al enum `conversation_status`
- ✅ Crea trigger de validación (solo desde pedido-completo)
- ✅ Agrega campos `devolucion_razon` y `devolucion_fecha`
- ✅ Crea función `mark_product_as_returned()`
- ✅ Crea vista `devoluciones` para analytics
- ✅ Simula devolución de Carlos Ramírez como ejemplo

### PASO 2: Verificar

```sql
-- Ver todas las devoluciones
SELECT * FROM devoluciones;

-- Ver conversaciones en estado devolución
SELECT 
  c.id,
  cl.name,
  c.devolucion_razon,
  c.devolucion_fecha
FROM conversations c
JOIN clients cl ON cl.id = c.client_id
WHERE c.status = 'devolucion';

-- Ver productos devueltos en purchases
SELECT 
  p.id,
  p.productos,
  p.total
FROM purchases p
WHERE p.productos::text LIKE '%"devuelto":true%';
```

### PASO 3: Ver en UI

```bash
pnpm run dev
# Abre: http://localhost:3000/crm
# Carlos Ramírez ahora debería estar en estado "Devolución" 🔴
```

---

## 💻 Uso desde Código

### Marcar conversación como devolución

```typescript
// Desde facturación o endpoint API
await supabase
  .from('conversations')
  .update({
    status: 'devolucion',
    devolucion_razon: 'Cliente no recibió el producto - marcado desde facturación'
  })
  .eq('id', conversationId)
  .eq('status', 'pedido-completo') // IMPORTANTE: Solo si está en pedido-completo
```

### Marcar producto específico como devuelto

```typescript
// Opción 1: Desde SQL
await supabase.rpc('mark_product_as_returned', {
  p_purchase_id: purchaseId,
  p_product_name: 'Vestido Midi Floral'
})

// Opción 2: Actualizar JSONB manualmente
const { data: purchase } = await supabase
  .from('purchases')
  .select('productos')
  .eq('id', purchaseId)
  .single()

const productosActualizados = purchase.productos.map(p => {
  if (p.nombre === 'Vestido Midi Floral') {
    return { ...p, devuelto: true }
  }
  return p
})

await supabase
  .from('purchases')
  .update({ productos: productosActualizados })
  .eq('id', purchaseId)
```

---

## 🎨 UI - Cómo se Ve

### Estado en badge
```
🔴 Devolución
```
- Color rojo (`bg-red-100 text-red-700 border-red-300`)
- Icono XCircle

### Historial de compras
```
📦 Vestido Midi Floral (DEVOLUCIÓN)  $̶3̶2̶0̶.̶0̶0̶0̶
```
- Texto rojo
- Precio tachado
- Badge "(DEVOLUCIÓN)" en negrita

### Sugerencias al agente
```
🔴 DEVOLUCIÓN REGISTRADA
❌ Este pedido fue marcado como devolución por facturación
📋 Motivo: Cliente no recibió el producto
⚠️ Contactar a cliente para coordinar reenvío o reembolso
📞 Verificar con facturación el estado del proceso
```

---

## 🔒 Protecciones Implementadas

### 1. Trigger de validación

```sql
-- Solo permite pedido-completo → devolucion
CREATE TRIGGER validate_devolucion_transition_trigger
  BEFORE UPDATE OF status ON conversations
  FOR EACH ROW
  WHEN (NEW.status = 'devolucion')
  EXECUTE FUNCTION validate_devolucion_transition();
```

**Si intentas cambiar a `devolucion` desde otro estado**:
```
ERROR: Solo se puede pasar a devolución desde pedido-completo. Estado actual: pendiente-guia
```

### 2. Fecha automática

Al cambiar a `devolucion`, se registra automáticamente `devolucion_fecha = NOW()`

### 3. Estado terminal

Una vez en `devolucion`, NO progresa automáticamente a otro estado.

---

## 📊 Analytics de Devoluciones

### Vista pre-creada

```sql
SELECT * FROM devoluciones;
```

**Columnas**:
- conversation_id
- client_id, client_name, phone
- devolucion_razon
- devolucion_fecha
- purchase_id
- productos (JSONB)
- total, metodo_pago, codigo_guia

### Métricas útiles

```sql
-- Total de devoluciones este mes
SELECT COUNT(*) AS total_devoluciones
FROM conversations
WHERE status = 'devolucion'
  AND devolucion_fecha >= DATE_TRUNC('month', NOW());

-- Monto total devuelto
SELECT 
  SUM(p.total) AS monto_devuelto,
  COUNT(*) AS num_devoluciones
FROM purchases p
JOIN conversations c ON c.id = p.conversation_id
WHERE c.status = 'devolucion';

-- Clientes con más devoluciones
SELECT 
  cl.name,
  COUNT(*) AS total_devoluciones
FROM conversations c
JOIN clients cl ON cl.id = c.client_id
WHERE c.status = 'devolucion'
GROUP BY cl.id, cl.name
ORDER BY total_devoluciones DESC;
```

---

## 🧪 Testing

### Test manual

```sql
-- 1. Crear conversación de prueba en pedido-completo
INSERT INTO conversations (client_id, status, canal)
VALUES (
  (SELECT id FROM clients LIMIT 1),
  'pedido-completo',
  'whatsapp'
);

-- 2. Intentar cambiar a devolución (debería funcionar)
UPDATE conversations 
SET status = 'devolucion',
    devolucion_razon = 'Test de devolución'
WHERE id = 'uuid-de-la-conversacion-de-prueba';

-- 3. Intentar desde pendiente-datos (debería fallar)
INSERT INTO conversations (client_id, status, canal)
VALUES (
  (SELECT id FROM clients LIMIT 1),
  'pendiente-datos',
  'whatsapp'
);

UPDATE conversations 
SET status = 'devolucion' -- ❌ ERROR esperado
WHERE id = 'uuid-de-la-conversacion-de-prueba-2';
```

---

## ⚠️ Casos Edge

### ¿Qué pasa si el cliente dice "devuelvo"?

**NO** se activa automáticamente. Solo facturación puede marcar devoluciones.

### ¿Se puede revertir una devolución?

**Manualmente sí**, pero NO recomendado:

```sql
-- Solo en casos excepcionales
UPDATE conversations 
SET status = 'pedido-completo'
WHERE id = 'conversation-id'
  AND status = 'devolucion';
```

### ¿Se eliminan los datos de purchase?

**NO**. Los productos quedan marcados con `"devuelto": true` pero permanecen en el historial para auditoría.

---

## 🎯 Próximos Pasos

1. **Integración con Facturación**:
   - Crear endpoint API: `POST /api/crm/conversations/:id/devolucion`
   - Botón en módulo de facturación para marcar devoluciones

2. **Notificaciones**:
   - Email automático a cliente cuando se marca devolución
   - WhatsApp mensaje explicando proceso de reembolso

3. **Workflow de Reembolso**:
   - Agregar campo `reembolso_procesado: boolean`
   - Estados adicionales: `devolucion-procesando`, `devolucion-reembolsado`

---

## 📚 Archivos Relacionados

- Migración SQL: `scripts/032_add_devolucion_state.sql`
- Tipos TypeScript: `lib/types.ts` (ConversationStatus + ProductoPurchase)
- Estados CRM: `lib/crm-estados-karla.ts`
- Configuración UI: `app/crm/page.tsx` (ESTADOS_CONFIG)
- Historial compras: `components/crm/PurchaseHistory.tsx`

---

**IQ 145 Design Decisions**:
1. Trigger de validación → Imposible llegar a devolución incorrectamente
2. Vista SQL agregada → Analytics lista sin queries complejas
3. Campo `devuelto` en JSONB → Flexibilidad sin ALTER TABLE
4. Estado terminal → No progresa automáticamente (intencional)
5. Fecha automática → Auditoría sin intervención manual
