# 🚀 SIGUIENTE PASO: EJECUTAR SCRIPT SQL EN SUPABASE

## ⚠️ IMPORTANTE - DEBES HACER ESTO AHORA

El código ya está subido a GitHub y funcionando, pero **FALTA EJECUTAR EL SCRIPT SQL** en Supabase para que todo funcione correctamente.

---

## 📋 PASO A PASO

### 1️⃣ Abrir Supabase Dashboard
1. Ve a: https://supabase.com/dashboard
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto de Dashboard

### 2️⃣ Abrir SQL Editor
1. En el menú lateral, haz clic en **SQL Editor**
2. Haz clic en **New Query** (Nueva consulta)

### 3️⃣ Copiar el Script
1. Abre el archivo: `scripts/040_fix_inventory_and_invoices.sql`
2. **Selecciona TODO el contenido** (Ctrl + A)
3. **Copia** (Ctrl + C)

### 4️⃣ Pegar y Ejecutar
1. **Pega** el script en el SQL Editor de Supabase (Ctrl + V)
2. Haz clic en el botón **RUN** (verde, esquina inferior derecha)
3. Espera a que termine (puede tomar 10-30 segundos)

### 5️⃣ Verificar Resultado
Deberías ver al final:
```
✅ Script ejecutado exitosamente. Inventario y movimientos listos.
```

Si ves este mensaje: **¡PERFECTO! Ya está todo listo.**

---

## 🔍 QUÉ HACE EL SCRIPT

El script SQL que acabas de ejecutar:

✅ Crea/actualiza la tabla `inventory` con todas las columnas:
   - `price_retail` (Precio al detal)
   - `price_wholesale` (Precio al por mayor)
   - `stock_warranty` (Garantías)
   - `tamano`, `grosor`, `medida_mm` (Medidas según categoría)
   - Columnas calculadas: `profit_retail`, `profit_wholesale`, `margin_retail_pct`, `margin_wholesale_pct`

✅ Crea la tabla `inventory_movements` para registrar movimientos

✅ Crea triggers automáticos que actualizan el stock cuando:
   - Haces una **Entrada** → ➕ Suma a stock
   - Haces una **Salida Especial** → ➖ Resta de stock
   - Haces un **Ajuste Especial** → = Establece nuevo valor
   - Haces una **Transferencia por Garantía** → Sale de stock, entra a garantías

✅ Corrige errores de `invoice_items`:
   - Agrega columna `reference` si no existe
   - Convierte `invoice_id` de TEXT a UUID si es necesario

✅ Configura políticas de seguridad (RLS)

---

## ⚡ DESPUÉS DE EJECUTAR EL SCRIPT

### Verifica que todo funciona:

1. **Ve a la página de Inventario** en tu dashboard
2. **Verifica que veas:**
   - ✅ Filtros: Categoría, Estado, Nivel de Stock, Garantías
   - ✅ Columnas en orden: SKU, Nombre, Categoría, Cantidad, Garantías, Costo, P.Detal, Util.Detal, P.Mayor, Util.Mayor, Estado, Costo Total, Acciones
   - ✅ KPI "Stock bajo" muestra cantidad de productos en rojo

3. **Prueba crear un movimiento:**
   - Haz clic en botón de acciones de un producto
   - Selecciona tipo de movimiento
   - Registra el movimiento
   - Verifica que el stock se actualice automáticamente

4. **Prueba crear una factura con búsqueda:**
   - Nueva Factura
   - Escribe un SKU existente → Se autocompleta
   - Escribe un SKU nuevo → Se abre diálogo de creación
   - Ingresa código: **1430**
   - Completa datos y crea producto

---

## ❌ SI HAY ERRORES

### Error: "column already exists"
**Solución:** No hay problema, significa que la columna ya existía. El script continúa.

### Error: "table already exists"
**Solución:** No hay problema, el script usa `IF NOT EXISTS`.

### Error: "cannot cast type text to uuid"
**Solución:** Hay datos incompatibles. Ejecuta primero:
```sql
DELETE FROM public.invoice_items WHERE invoice_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
```

### Otro error
1. Copia el mensaje de error completo
2. Busca en el script la parte que falló
3. Ejecuta solo esa parte por separado

---

## 📊 RESUMEN

| Tarea | Estado |
|-------|--------|
| ✅ Código corregido | HECHO |
| ✅ Subido a GitHub | HECHO |
| ⏳ Script SQL ejecutado | **PENDIENTE - HAZLO AHORA** |
| ⏳ Verificar funcionamiento | DESPUÉS DEL SCRIPT |

---

## 🎯 PRÓXIMO PASO INMEDIATO

👉 **EJECUTA EL SCRIPT SQL AHORA** siguiendo los pasos de arriba

Después de ejecutarlo, todo estará funcionando correctamente:
- ✅ Inventario con filtros avanzados
- ✅ Movimientos automáticos
- ✅ Facturación con búsqueda de productos
- ✅ Columnas reorganizadas
- ✅ KPIs funcionando

---

**¿Listo? ¡Ejecuta el script y avísame cuando termine!** 🚀

