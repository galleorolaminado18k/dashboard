# 🛒 Historial de Compras - Guía de Implementación

## 🎯 Objetivo (IQ 145)

**Problema**: Necesitamos ver QUÉ compró cada cliente cuando su pedido está completo.

**Solución**: Sistema automático que registra compras en tabla `purchases` con:
- ✅ Productos comprados (nombre, precio, cantidad)
- ✅ Totales calculados automáticamente
- ✅ Método de pago
- ✅ Información de envío
- ✅ Código de tracking (MiPaquete)
- ✅ UI colapsable tipo acordeón

---

## 📦 ¿Qué se ha implementado?

### 1. Base de Datos (Supabase)

**Tabla `purchases`**:
```sql
- id (UUID, primary key)
- client_id (relación con clients)
- conversation_id (relación con conversations)
- productos (JSONB) - Array de {nombre, precio, cantidad}
- subtotal, envio, descuento, total (calculados automáticamente)
- metodo_pago (enum: transferencia, nequi, contraentrega, etc.)
- direccion_envio, ciudad
- codigo_guia (tracking MiPaquete)
- entregado (boolean), fecha_entrega
- created_at, updated_at
```

**Triggers automáticos**:
- ✅ Calcular `total` = `subtotal` + `envio` - `descuento`
- ✅ Calcular `subtotal` desde array de productos JSONB
- ✅ Actualizar `updated_at` en cada modificación

**Vista `purchase_summary`**:
- Resumen por cliente con total de compras y monto
- JSON agregado de todas las compras del cliente

### 2. Frontend (Next.js + TypeScript)

**Componente `PurchaseHistory.tsx`**:
- Lista colapsable/expandible
- Muestra productos con iconos
- Precios formateados en COP
- Badges para método de pago
- Estado de entrega (✓ Entregado)
- Código de tracking con icono
- Diseño luxury con gold accents

**Integración en CRM**:
- Aparece automáticamente en el panel derecho
- Se actualiza cuando seleccionas un cliente
- Solo visible si el cliente tiene ID

---

## 🚀 Cómo Usar (PASO A PASO)

### **PASO 1: Ejecutar SQL en Supabase** (⚠️ OBLIGATORIO)

1. Abre Supabase: https://supabase.com/dashboard/project/eyrdjtsgpubazdtgywiv
2. Ve a **SQL Editor**
3. Copia el contenido de: `scripts/031_create_purchases_table.sql`
4. Pega y haz clic en **RUN** ▶️
5. Espera el mensaje: "Success"

**¿Qué hace este script?**
- ✅ Crea tabla `purchases`
- ✅ Crea enum `payment_method`
- ✅ Configura triggers automáticos
- ✅ Crea índices para performance
- ✅ Inserta 3 compras de ejemplo:
  - María González: Vestido ($320k) + Aretes ($50k) = $389k
  - Carlos Ramírez: Shorts ($560k) = $572k
  - Ana Martínez: Bolso ($200k) = $215k

### **PASO 2: Verificar en Supabase**

1. Ve a **Table Editor** en Supabase
2. Busca la tabla `purchases`
3. Deberías ver **3 filas** con los datos de ejemplo

### **PASO 3: Ver en la UI**

1. Ejecuta en tu terminal:
   ```bash
   pnpm run dev
   ```

2. Abre: http://localhost:3000/crm

3. Haz clic en cualquiera de los 3 clientes de ejemplo

4. En el panel derecho verás: **"Historial de Compras"** 🛒

5. Haz clic en el header para expandir/colapsar

**Deberías ver**:
- Productos listados con iconos 📦
- Precios en formato COP ($320.000)
- Método de pago (badge dorado)
- Ciudad con emoji 📍
- Código de tracking (si existe) 🚚
- Estado "✓ Entregado" (si aplica)

---

## 🤖 Próximos Pasos (TODO)

### **Automatización: Crear Purchase al Completar Pedido**

**Cuando una conversación llega a estado `pedido-completo`**:

1. **Extraer datos del chat** (usando regex/NLP):
   - Productos mencionados
   - Precios acordados
   - Método de pago
   - Dirección de envío

2. **Crear registro en `purchases`**:
   ```typescript
   const purchase = {
     client_id: conversation.client_id,
     conversation_id: conversation.id,
     productos: [
       { nombre: "Vestido Midi Floral", precio: 320000, cantidad: 1 }
     ],
     metodo_pago: "transferencia",
     direccion_envio: "...",
     ciudad: "Bogotá"
   }
   
   await supabase.from('purchases').insert(purchase)
   ```

3. **Actualizar UI automáticamente**:
   - SWR revalidará los datos
   - El historial se actualizará solo

**Dónde implementar**:
- Archivo: `lib/crm-estados-karla.ts`
- Función: `debeActualizarEstado()` 
- Condición: `if (nuevoEstado === 'pedido-completo')`

---

## 📊 Queries Útiles

### Ver compras de un cliente:
```sql
SELECT * FROM purchases 
WHERE client_id = 'uuid-del-cliente' 
ORDER BY created_at DESC;
```

### Resumen por cliente:
```sql
SELECT * FROM purchase_summary 
WHERE client_name LIKE '%María%';
```

### Compras pendientes de entrega:
```sql
SELECT 
  p.*,
  c.name AS cliente,
  c.phone
FROM purchases p
JOIN clients c ON c.id = p.client_id
WHERE p.entregado = false;
```

### Total vendido este mes:
```sql
SELECT 
  SUM(total) AS total_mes,
  COUNT(*) AS num_compras
FROM purchases
WHERE created_at >= DATE_TRUNC('month', NOW());
```

---

## 🎨 Personalización

### Cambiar colores del componente:

Edita `components/crm/PurchaseHistory.tsx`:

```tsx
// Gold accent actual: #D8BD80
// Para cambiar a otro color (ej: azul):
className="text-[#3B82F6]"  // Azul
className="bg-[#3B82F6]/10"  // Fondo azul claro
```

### Agregar más campos:

1. Modifica `scripts/031_create_purchases_table.sql`
2. Agrega campo: `ALTER TABLE purchases ADD COLUMN nuevo_campo TEXT;`
3. Actualiza tipo en `lib/types.ts` → `Purchase` interface
4. Muestra en `PurchaseHistory.tsx`

---

## ❓ Troubleshooting

### ❌ Error: "relation purchases does not exist"

**Solución**: No ejecutaste el script SQL.
1. Ve a Supabase SQL Editor
2. Ejecuta `scripts/031_create_purchases_table.sql`

### ❌ No se ve el historial en el CRM

**Causas posibles**:
1. El cliente no tiene `client_id` → verifica en Supabase
2. No hay compras para ese cliente → agrega una manualmente:
   ```sql
   INSERT INTO purchases (client_id, productos, total, metodo_pago)
   VALUES (
     'uuid-del-cliente',
     '[{"nombre":"Test","precio":100000,"cantidad":1}]'::jsonb,
     100000,
     'transferencia'
   );
   ```

### ❌ Total no se calcula correctamente

El trigger lo calcula automáticamente. Si falla:
```sql
-- Recalcular todos los totales
UPDATE purchases SET updated_at = NOW();
```

---

## 🏆 Ventajas del Diseño IQ 145

1. **JSONB para productos** = Flexibilidad total (sin schema rígido)
2. **Triggers automáticos** = No calcular totales manualmente
3. **Vista agregada** = Analytics listos con 1 query
4. **Índices optimizados** = Queries rápidas incluso con miles de compras
5. **RLS permisivo** = Sin problemas de permisos en desarrollo
6. **UI colapsable** = No ocupa espacio hasta que lo necesitas
7. **Relación bidireccional** = Puedes navegar desde cliente o conversación

---

## 📚 Recursos

- Archivo de migración: `scripts/031_create_purchases_table.sql`
- Componente UI: `components/crm/PurchaseHistory.tsx`
- Tipos TypeScript: `lib/types.ts` (Purchase, ProductoPurchase)
- Integración: `app/crm/page.tsx` (línea ~665)
- Documentación de instalación: `docs/EJECUTAR_SQL_SUPABASE.md`

---

**Siguiente paso recomendado**: Implementar auto-creación de purchases cuando el estado cambia a `pedido-completo`. Esto hará el sistema 100% automático. 🤖
