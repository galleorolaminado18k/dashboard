# 🔍 DIAGNÓSTICO: Valor de Envío No Se Muestra en Factura

## 📋 Problema Reportado

**Usuario dice:** "El valor del envio se coloco cuando se creo la factura y no lo veo el real debe colocar hay en el valor que se coloca en la facturacion cuando se esta creando"

## 🎯 Análisis del Problema

El usuario está reportando que:
1. ✅ El valor de envío SÍ se ingresó al crear la factura
2. ❌ Pero NO se muestra en la vista de la factura
3. ❌ El valor real que se ingresó no aparece

## 🔍 Pasos de Diagnóstico Implementados

### 1. ✅ Logs en el Backend (API)

**Archivo:** `app/api/invoices/route.ts`

Agregado log para ver qué valor llega al crear la factura:
```typescript
console.log("[v0] Creating invoice - shipping_cost from body:", body.shipping_cost, "final shippingCost:", shippingCost)
```

**Archivo:** `app/api/invoices/[id]/route.ts`

Agregado log para ver qué valor se devuelve al consultar:
```typescript
console.log("[v0] Invoice found:", data.invoice_number, "Items:", data.invoice_items?.length || 0, "Shipping cost:", data.shipping_cost)
```

### 2. ✅ Logs en el Frontend (Componente)

**Archivo:** `components/invoice-view-dialog.tsx`

Agregado log para ver qué valor llega al componente:
```typescript
console.log('[InvoiceViewDialog] Invoice data:', {
  invoice_number: invoice?.invoice_number,
  shipping_cost: invoice?.shipping_cost,
  shipping_cost_type: typeof invoice?.shipping_cost
})
```

### 3. ✅ Script SQL de Verificación

**Archivo:** `scripts/VERIFICAR_SHIPPING_COST.sql`

Ejecuta este script en Supabase SQL Editor para ver:
- Todas las facturas con sus valores de shipping_cost
- Estadísticas generales
- Una factura específica

## 📝 Instrucciones para Diagnosticar

### Paso 1: Verificar en la Base de Datos

1. Abre **Supabase Dashboard**
2. Ve a **SQL Editor**
3. Ejecuta el script `scripts/VERIFICAR_SHIPPING_COST.sql`
4. Verifica:
   - ¿La factura 000021 tiene un valor en `shipping_cost`?
   - ¿Es NULL, 0, o tiene un valor real?
   - ¿Cuántas facturas tienen `shipping_cost` con valor?

### Paso 2: Verificar en la Consola del Navegador

1. Abre el dashboard
2. Presiona **F12** para abrir la consola
3. Abre una factura (por ejemplo, la 000021)
4. Busca en la consola los logs:
   - `[v0] Invoice found:` → Ver qué valor tiene `Shipping cost:`
   - `[InvoiceViewDialog] Invoice data:` → Ver `shipping_cost` y su tipo

### Paso 3: Crear una Factura Nueva de Prueba

1. Ve a **Facturación** → **Nueva Factura**
2. Agrega un producto (ejemplo: $100.000)
3. **Ingresa un valor de envío** (ejemplo: $15.000)
4. Crea la factura
5. Verifica en la consola:
   - `[v0] Creating invoice - shipping_cost from body:` → Debe mostrar 15000
6. Abre la factura recién creada
7. Verifica si se muestra el envío en la tabla

## 🔍 Posibles Causas del Problema

### Causa 1: Campo No Existe en DB (MUY PROBABLE)
- El campo `shipping_cost` no existe en la tabla `invoices`
- **Solución:** Ejecutar migración para agregar el campo

### Causa 2: Valor es NULL o 0
- Las facturas existentes tienen `shipping_cost = NULL` o `0`
- **Solución:** Ya implementado - ahora se muestra siempre (incluso si es $0)

### Causa 3: Conversión de Tipo Incorrecta
- El valor se guarda como string en vez de number
- **Solución:** Ajustar la conversión en el API

### Causa 4: Campo con Nombre Diferente
- El campo se llama diferente en la DB (ej: `cost_shipping`, `envio`, etc.)
- **Solución:** Verificar el nombre real en Supabase

## 🛠️ Soluciones Según el Diagnóstico

### Si el campo NO existe en la DB:

**Ejecutar en Supabase SQL Editor:**
```sql
-- Agregar columna shipping_cost si no existe
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(12,2) DEFAULT 0;

-- Agregar comentario
COMMENT ON COLUMN invoices.shipping_cost IS 'Costo de envío sin IVA';
```

### Si el valor es NULL en facturas existentes:

**Actualizar facturas existentes con valor por defecto:**
```sql
-- Actualizar facturas con NULL a 0
UPDATE invoices 
SET shipping_cost = 0 
WHERE shipping_cost IS NULL;
```

### Si el tipo de dato es incorrecto:

**Convertir el tipo de dato:**
```sql
-- Ver el tipo actual
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invoices' 
AND column_name = 'shipping_cost';

-- Si es TEXT, convertir a NUMERIC
ALTER TABLE invoices 
ALTER COLUMN shipping_cost 
TYPE NUMERIC(12,2) 
USING shipping_cost::NUMERIC(12,2);
```

## ✅ Commits Realizados

1. `e080e1d` - Logs de depuración en componente y API GET
2. `33ff3ca` - Logs adicionales en API POST y script SQL

## 🚀 Próximos Pasos

1. **EJECUTA** el script SQL `VERIFICAR_SHIPPING_COST.sql` en Supabase
2. **REVISA** los logs en la consola del navegador
3. **REPORTA** los resultados aquí:
   - ¿Qué valor tiene `shipping_cost` en la DB?
   - ¿Qué valor muestra la consola del navegador?
   - ¿El campo existe en la tabla?

Con esa información podremos aplicar la solución correcta.

---

**Fecha:** 3 de noviembre de 2025  
**Estado:** 🔍 DIAGNÓSTICO EN CURSO  
**Rama:** `feature/meta-ads-integration-v2`  
**Último commit:** `33ff3ca`

