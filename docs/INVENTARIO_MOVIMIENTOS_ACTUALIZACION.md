# Actualización de Inventario - Movimientos y Columnas

**Fecha:** 2025-10-28  
**Commit:** a05d5dd  
**Branch:** feature/meta-ads-integration-v2

## Cambios Realizados

### 1. Reorganización de Columnas de Inventario

Las columnas de la tabla de inventario ahora siguen este orden:

1. **SKU** - Código único del producto
2. **Nombre** - Nombre del producto con descripción
3. **Categoría** - Abreviatura de la categoría (CAD, JOY, etc.)
4. **Cantidad** - Stock disponible con indicador visual
5. **Garantía** - Cantidad en garantías
6. **Costo** - Costo del producto
7. **Precio Detal** - Precio al por menor
8. **Utilidad Detal** - Utilidad y % del precio detal
9. **Precio Mayor** - Precio al por mayor
10. **Utilidad Mayor** - Utilidad y % del precio mayorista
11. **Estado** - Estado del producto (Activo/Inactivo)
12. **Costo Total** - Valor total del inventario
13. **Acciones** - Botón de movimientos

### 2. Lógica de Movimientos de Inventario

#### Tipos de Movimiento

| Tipo | Acción | Descripción |
|------|--------|-------------|
| **Entrada** | ➕ Agregar | Agrega unidades a Cantidad o Garantía (según warehouse_type) |
| **Salida** | ➖ Descontar | Descuenta de Cantidad (salidas especiales: bono, obsequios, canje, puntos, otros) |
| **Ajuste por Conteo** | 🔢 Ajustar | Establece el valor absoluto del stock (ejemplo: conteo físico resultó en 50 → se ajusta a 50) |
| **Ajuste Especial** | 🔢 Ajustar | Igual que ajuste por conteo, pero con interfaz rápida (agregar/descontar 1-15 unidades) |
| **Transferencia** | 🔄 Transferir | Sale de Cantidad e ingresa a Garantía |

#### Unificación de Ajustes

- **Ajuste por Conteo** y **Ajuste Especial** ahora funcionan de la misma manera
- Ambos establecen un nuevo valor absoluto de stock
- La diferencia está en la interfaz:
  - **Ajuste por Conteo**: Requiere ingresar el nuevo valor total manualmente
  - **Ajuste Especial**: Permite agregar/descontar 1-15 unidades de forma rápida, calculando el nuevo valor automáticamente

#### Ejemplos Prácticos

**Entrada:**
- Stock actual: 10
- Entrada de 5 unidades
- Stock resultante: **15**

**Salida Especial (Obsequio):**
- Stock actual: 15
- Salida de 2 unidades
- Stock resultante: **13**

**Ajuste por Conteo:**
- Stock actual: 13
- Conteo físico: 12 unidades
- Se ajusta a: **12**

**Ajuste Especial (Descontar 3):**
- Stock actual: 12
- Acción: Descontar 3
- Cálculo: 12 - 3 = 9
- Se ajusta a: **9**

**Ajuste Especial (Agregar 5):**
- Stock actual: 9
- Acción: Agregar 5
- Cálculo: 9 + 5 = 14
- Se ajusta a: **14**

**Transferencia por Garantía:**
- Stock Cantidad: 14
- Stock Garantía: 2
- Transferir 1 unidad
- Stock Cantidad: **13** | Stock Garantía: **3**

### 3. Archivos Modificados

#### Base de Datos
- **`scripts/043_fix_inventory_movements_logic.sql`** (NUEVO)
  - Actualiza el trigger `update_inventory_stock()`
  - Unifica lógica de ajuste y ajuste_especial
  - Corrige lógica de transferencia por garantía
  - Usa `GREATEST(0, stock - quantity)` para evitar negativos

#### API
- **`app/api/inventory/movements/route.ts`**
  - Convierte `ajuste_especial` a `ajuste` internamente
  - Calcula el nuevo stock absoluto para ajustes especiales
  - Mantiene las notas descriptivas con el tipo de acción

#### Frontend
- **`app/(dashboard)/inventario/page.tsx`**
  - Reorganiza columnas de la tabla
  - Actualiza lógica de submit para calcular nuevo stock en ajustes especiales
  - Mejora el preview mostrando el stock resultante
  - Agrega descripciones claras en cada tipo de movimiento

### 4. Migración SQL

Para aplicar los cambios en la base de datos, ejecutar en Supabase SQL Editor:

```sql
-- Ver archivo: scripts/043_fix_inventory_movements_logic.sql
```

### 5. Reglas de Negocio

✅ **Entrada** → Siempre agrega a Cantidad (o Garantía si se selecciona)  
✅ **Salidas Especiales** → Siempre descuentan de Cantidad  
✅ **Ajuste** → Establece valor absoluto (ej: si hay 10 y ajustas a 7, queda 7)  
✅ **Transferencia** → Sale de Cantidad, entra a Garantía  
✅ **No se permiten stocks negativos** → Se usa `GREATEST(0, valor)` en el trigger

## Verificación

Para verificar que todo funciona correctamente:

1. ✅ Las columnas aparecen en el orden correcto
2. ✅ Entrada agrega unidades
3. ✅ Salida descuenta unidades
4. ✅ Ajuste establece valor absoluto
5. ✅ Ajuste Especial calcula y establece valor absoluto
6. ✅ Transferencia mueve de Cantidad a Garantía
7. ✅ No hay stocks negativos

## Auto-Push a GitHub

Los cambios se subieron automáticamente a GitHub según la regla configurada.

**Commit:** `feat(inventory): reorganizar columnas y corregir lógica de movimientos`  
**Rama:** `feature/meta-ads-integration-v2`

