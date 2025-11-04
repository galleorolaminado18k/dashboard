# 🔍 DIAGNÓSTICO: SKU NO APARECE EN FACTURA

## 🎯 Problema

El SKU "04-100" no aparece en la factura 000021 aunque el script se ejecutó correctamente.

## 📊 Causas Posibles

### 1. El campo `reference` en `invoice_items` está NULL
El script actualiza correctamente, pero necesitamos verificar:
- ¿Se guardó el UPDATE?
- ¿El navegador tiene caché?

### 2. La venta original no tiene SKU
Si la venta en la tabla `sales` no tiene el SKU en el campo `products` (JSONB), entonces:
- Al crear la factura, no se copia el SKU
- Necesitamos actualizar manualmente

### 3. Problema de sincronización
Las facturas pueden estar cacheadas en el frontend o backend.

## ✅ SOLUCIÓN COMPLETA

He creado un nuevo script más completo: **`051b_verificar_sku_venta_factura.sql`**

### Este script hace:

1. ✅ **Verifica** la estructura de `sales`
2. ✅ **Muestra** la venta 000021 completa
3. ✅ **Verifica** la factura 000021
4. ✅ **Lista** todos los `invoice_items`
5. ✅ **Actualiza** el SKU a "04-100"
6. ✅ **Confirma** el resultado

## 📋 EJECUTA ESTE SCRIPT PASO A PASO

### Paso 1: Abre Supabase SQL Editor
https://supabase.com/dashboard

### Paso 2: Copia el script
```
scripts/051b_verificar_sku_venta_factura.sql
```

### Paso 3: Ejecuta TODO el script

### Paso 4: Verifica los resultados

Deberías ver en los resultados:

```sql
-- Resultado del PASO 6:
invoice_number | sku    | description           
000021         | 04-100 | Balines #4MM DORADOS  
```

## 🔄 Después de Ejecutar

### 1. Refresca el caché del navegador
- Presiona `Ctrl + Shift + R` (Windows)
- O `Cmd + Shift + R` (Mac)

### 2. Recarga la página de facturación
- Ve a la página de facturación
- Busca la factura 000021
- Abre el modal de vista

### 3. Verifica que aparezca el SKU
Debería mostrar:
```
┌────────┬──────────────────────┬──────┬─────┬──────────┐
│ SKU    │ DESCRIPCIÓN          │ CANT │ IVA │ TOTAL    │
├────────┼──────────────────────┼──────┼─────┼──────────┤
│ 04-100 │ Balines #4MM DORADOS │  1   │ 19% │ $155.000 │
└────────┴──────────────────────┴──────┴─────┴──────────┘
```

## 🚨 Si AÚN no aparece

### Verifica en Supabase directamente:

Ejecuta esta query simple:
```sql
SELECT reference, description
FROM invoice_items
WHERE description LIKE '%Balines%';
```

Si muestra `reference = '04-100'` pero no se ve en el frontend:
- **Problema de caché del navegador**
- **Limpia el caché completamente**

Si muestra `reference = NULL`:
- **El UPDATE no se ejecutó correctamente**
- **Ejecuta el script 051b de nuevo**

## 📁 Archivos Creados

1. ✅ **Script original:** `051_agregar_sku_factura_000021.sql`
2. ✅ **Script diagnóstico:** `051b_verificar_sku_venta_factura.sql` (NUEVO)
3. ✅ **Este documento:** Guía de diagnóstico

## 🎯 Próximos Pasos

1. **Ejecuta** el script `051b_verificar_sku_venta_factura.sql`
2. **Verifica** los resultados en Supabase
3. **Limpia caché** del navegador
4. **Recarga** la página de facturación
5. **Abre** la factura 000021

Si después de esto el SKU no aparece, **copia y pega los resultados del PASO 6** del script para que pueda ver qué está pasando.

---

**Fecha:** 2025-11-03  
**Scripts:** 051 y 051b  
**Estado:** ⏳ ESPERANDO EJECUCIÓN Y VERIFICACIÓN

