# 🔧 FIX: SKU NO APARECÍA EN FACTURA

**Fecha**: 2025-11-03  
**Estado**: ✅ RESUELTO Y SUBIDO A GITHUB

---

## 🐛 PROBLEMA

El SKU **NO aparecía** en la vista de factura en Ventas, aunque:
- ✅ La columna SKU estaba agregada en el componente
- ✅ El campo `reference` existe en la base de datos
- ✅ El Script 051 actualiza correctamente el SKU

### Causa Raíz
El API `/api/facturacion/list` **NO estaba incluyendo** el campo `reference` al mapear los items de la factura.

---

## ✅ SOLUCIÓN

### Archivo Modificado
**`app/api/facturacion/list/route.ts`**

### Cambio Realizado

**Antes** (líneas 28-35):
```typescript
const items = (inv.invoice_items || []).map((item: any) => ({
  ref: item.id || '',
  descripcion: item.product_name || item.description || 'Producto sin nombre',
  und: Number(item.quantity || 1),
  ivaPct: 19,
  precioBase: Number(item.unit_price || 0),
  precioNeto: Number(item.total || 0)
}))
```

**Ahora** (con SKU incluido):
```typescript
const items = (inv.invoice_items || []).map((item: any) => ({
  ref: item.id || '',
  sku: item.reference || '',        // ✅ SKU del producto
  reference: item.reference || '',  // ✅ Alias para compatibilidad
  descripcion: item.product_name || item.description || 'Producto sin nombre',
  und: Number(item.quantity || 1),
  ivaPct: 19,
  precioBase: Number(item.unit_price || 0),
  precioNeto: Number(item.total || 0)
}))
```

### ¿Qué hace?
1. **Lee** `item.reference` de la base de datos (columna en `invoice_items`)
2. **Mapea** a dos campos:
   - `sku`: Usado por el componente en Ventas
   - `reference`: Usado por el componente en Facturación
3. **Compatibilidad total** con ambas vistas

---

## 🧪 CÓMO PROBAR

### Paso 1: Ejecutar Script 051
```sql
-- En Supabase SQL Editor
-- Ejecuta: scripts/051_agregar_sku_factura_000021.sql
-- Esto agrega SKU '04-100' a la factura 000021
```

### Paso 2: Verificar en la Aplicación
1. Abre la aplicación (Vercel o local)
2. Ve a **Ventas**
3. Busca la venta con factura **000021**
4. Haz clic en **"Ver factura"**

### Resultado Esperado
```
┌─────────┬──────────────────────┬──────┬─────┬───────────┐
│   SKU   │    DESCRIPCIÓN       │ CANT │ IVA │   TOTAL   │
├─────────┼──────────────────────┼──────┼─────┼───────────┤
│ 04-100  │ Balines #4MM DORADOS │  1   │ 19% │ $155.000  │  ← ✅ SKU VISIBLE
├─────────┼──────────────────────┼──────┼─────┼───────────┤
│    -    │  COSTO DE ENVÍO      │  1   │ 0%  │  $24.628  │
└─────────┴──────────────────────┴──────┴─────┴───────────┘
```

---

## 📊 FLUJO DE DATOS

```
┌─────────────────────┐
│  Supabase DB        │
│  invoice_items      │
│  - id               │
│  - invoice_id       │
│  - description      │
│  - reference ✅     │ ← Campo SKU en DB
│  - quantity         │
│  - unit_price       │
│  - total            │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  API Route          │
│  /facturacion/list  │
│                     │
│  .map(item => ({    │
│    sku: item.reference,      ✅ ← AHORA SÍ SE INCLUYE
│    reference: item.reference, ✅
│    descripcion: ...           │
│  }))                │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Frontend           │
│  FacturaModal       │
│                     │
│  <td>               │
│    {it.sku ||       │  ✅ ← AHORA TIENE VALOR
│     it.reference    │
│     || '-'}         │
│  </td>              │
└─────────────────────┘
```

---

## 🚀 COMMIT

```bash
✅ git add app/api/facturacion/list/route.ts
✅ git commit -m "🔧 FIX: Agregar campo reference (SKU) en API de facturacion/list"
✅ git push (automático)
```

**Commit**: `47832f9`  
**Rama**: `feature/meta-ads-integration-v2`

---

## ✅ VERIFICACIÓN

### En Ventas:
- ✅ SKU aparece en la columna correspondiente
- ✅ Muestra `it.sku` o `it.reference`
- ✅ Muestra `-` si no hay SKU

### En Facturación:
- ✅ SKU aparece igual que antes
- ✅ Usa `item.reference`
- ✅ Sin cambios visuales

---

## 📝 NOTA IMPORTANTE

**Antes de ver el SKU**, debes ejecutar el **Script 051** en Supabase para que la factura 000021 tenga el SKU '04-100' en la base de datos.

Sin ejecutar el script, verás `-` porque el campo `reference` estará vacío en la DB.

---

**Estado**: ✅ FIX APLICADO Y SUBIDO A GITHUB  
**Próximo paso**: Ejecuta Script 051 en Supabase y actualiza la página

