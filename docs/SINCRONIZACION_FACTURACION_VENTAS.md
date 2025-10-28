# Sincronización Automática: Facturación → Ventas

**Fecha:** 2025-10-28  
**Migración:** 044_sync_invoices_to_sales.sql

## Resumen

Se ha implementado un sistema de sincronización automática bidireccional entre las secciones de **Facturación** y **Ventas**. Cuando se crea o actualiza una factura, automáticamente se crea o actualiza la venta correspondiente en la tabla de ventas.

## 🎯 Características Implementadas

### 1. Sincronización Automática mediante Trigger SQL

- ✅ Trigger `sync_invoice_to_sale()` que se ejecuta automáticamente al crear o actualizar una factura
- ✅ Mapeo automático de todos los campos entre facturas y ventas
- ✅ Conversión inteligente de estados:
  - `PAGADO/paid` → `pagada`
  - `PENDIENTE/pending/PENDIENTE PAGO/overdue` → `pendiente`
  - `DEVOLUCION/cancelled` → `devolucion`

### 2. Campos Agregados a la Tabla Invoices

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ciudad` | TEXT | Ciudad del cliente (sincroniza con `city` en sales) |
| `barrio` | TEXT | Barrio del cliente |
| `guia` | TEXT | Número de guía de envío (sincroniza con `mipaquete_code`) |
| `transportadora` | TEXT | Nombre de la transportadora |
| `evidencia` | TEXT | URL de evidencia de entrega |
| `vendedor` | TEXT | Nombre del vendedor (default: 'Sistema') |
| `sale_id` | UUID | ID de la venta asociada en tabla sales |

### 3. Mapeo de Columnas Facturación → Ventas

| Facturación (invoices) | Ventas (sales) | Notas |
|------------------------|----------------|-------|
| invoice_number | invoice_number | Número de factura |
| cliente | client_name | Nombre del cliente |
| issue_date | created_at | Fecha de la venta |
| invoice_items → JSONB | products | Productos como JSONB |
| total | total_amount | Total de la venta |
| status (mapeado) | status | Estado convertido |
| payment_method | payment_method | Método de pago |
| guia | mipaquete_code | Código de guía |
| transportadora | - | Info adicional |
| evidencia | - | URL evidencia |
| vendedor | - | Vendedor |
| invoice_number | invoice_id | Referencia cruzada |

### 4. Actualización del Formulario de Facturas

Se agregaron campos al formulario `create-invoice-dialog.tsx`:

- ✅ **Vendedor**: Campo opcional para identificar quién registró la factura
- ✅ **Evidencia**: Campo para URL de evidencia de entrega
- ✅ Los campos ya existentes: ciudad, barrio, guía, transportadora

### 5. Comportamiento del Sistema

#### Al Crear una Factura:
1. Se crea la factura en `invoices`
2. El trigger automáticamente:
   - Obtiene los items de `invoice_items`
   - Construye el JSONB de productos
   - Crea una nueva venta en `sales` con todos los datos
   - Actualiza la factura con el `sale_id` de la venta creada

#### Al Actualizar una Factura:
1. Se actualiza la factura en `invoices`
2. El trigger automáticamente:
   - Busca la venta asociada por `sale_id`
   - Actualiza todos los campos de la venta
   - Sincroniza el estado, productos, cliente, etc.

### 6. Migración de Datos Existentes

La migración SQL incluye un bloque `DO $$` que:
- ✅ Sincroniza todas las facturas existentes sin ventas asociadas
- ✅ Crea las ventas correspondientes automáticamente
- ✅ Establece la relación bidireccional entre facturas y ventas

## 📋 Archivos Modificados

### Base de Datos
- **`scripts/044_sync_invoices_to_sales.sql`** (NUEVO)
  - Agrega campos a `invoices`: ciudad, barrio, guia, transportadora, evidencia, vendedor, sale_id
  - Agrega campo a `sales`: invoice_id (referencia a factura)
  - Crea función `sync_invoice_to_sale()`
  - Crea trigger `trigger_sync_invoice_to_sale`
  - Migra datos existentes

### API
- **`app/api/invoices/route.ts`**
  - POST actualizado para incluir `vendedor` y `evidencia`
  - Default vendedor: 'Sistema'

### Frontend
- **`components/create-invoice-dialog.tsx`**
  - Agrega campo `vendedor` al formulario
  - Agrega campo `evidencia` al formulario
  - Actualiza estado del formulario
  - Actualiza reset del formulario

## 🔄 Flujo Completo

```
┌─────────────────┐
│  FACTURACIÓN    │
│   (Usuario)     │
└────────┬────────┘
         │
         │ 1. Crea/Actualiza Factura
         ▼
┌─────────────────┐
│   invoices      │
│   (Tabla)       │
└────────┬────────┘
         │
         │ 2. Trigger automático
         ▼
┌─────────────────┐
│sync_invoice_to_ │
│   sale()        │
│  (Función)      │
└────────┬────────┘
         │
         │ 3. Crea/Actualiza Venta
         ▼
┌─────────────────┐
│     sales       │
│    (Tabla)      │
└────────┬────────┘
         │
         │ 4. Se muestra en
         ▼
┌─────────────────┐
│     VENTAS      │
│   (Sección)     │
└─────────────────┘
```

## ✅ Validaciones

- ✅ Campos obligatorios en facturación: guía, transportadora, ciudad, barrio
- ✅ Generación automática de número de factura
- ✅ Cálculo automático de subtotal, IVA y total
- ✅ Prevención de duplicados en la migración de datos
- ✅ Manejo de errores: si falla la venta, no afecta la factura

## 🚀 Para Activar

**Ejecutar en Supabase SQL Editor:**
```sql
-- Archivo: scripts/044_sync_invoices_to_sales.sql
```

Esto agregará:
1. Nuevos campos a `invoices`
2. Campo `invoice_id` a `sales`
3. Trigger de sincronización automática
4. Sincronizará todas las facturas existentes

## 📊 Verificación

Para verificar que todo funciona:

1. ✅ Crear una factura en la sección Facturación
2. ✅ Verificar que aparece automáticamente en Ventas
3. ✅ Actualizar el estado de la factura
4. ✅ Verificar que el estado se actualiza en Ventas
5. ✅ Verificar que todos los campos están mapeados correctamente

## 🔍 Columnas en Ventas

Después de la sincronización, cada venta tendrá:

- **ID**: UUID único
- **Cliente**: Nombre del cliente
- **Fecha**: Fecha de emisión de la factura
- **Productos**: Lista de productos (JSONB)
- **Total**: Monto total
- **Estado**: Estado de la venta (pendiente/pagada/devolucion)
- **Método Pago**: Forma de pago
- **Transportadora**: Nombre de la transportadora
- **Guía**: Número de guía de envío
- **Evidencia**: URL de evidencia (si existe)
- **Vendedor**: Nombre del vendedor
- **Factura**: Número de factura asociada

## 💡 Notas Importantes

- Los cambios en Facturación se reflejan AUTOMÁTICAMENTE en Ventas
- Los cambios en Ventas NO afectan Facturación (unidireccional de Facturación → Ventas)
- El trigger se ejecuta en tiempo real, sin demoras
- No requiere intervención manual del usuario
- Compatible con facturas existentes (se sincronizan en la migración)

