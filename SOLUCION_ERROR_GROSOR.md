# 🚨 ERROR: COLUMNA 'grosor' NO EXISTE

## ❌ Error Actual:
```
Error: Could not find the 'grosor' column of 'inventory' in the schema cache
```

## 🔍 Causa:
Las columnas de medidas (`tamano`, `grosor`, `medida_mm`) **NO EXISTEN** en la base de datos.

---

## ✅ SOLUCIÓN INMEDIATA (5 minutos)

### Paso 1: Abrir Supabase
1. Ve a: **https://supabase.com/dashboard**
2. Inicia sesión
3. Selecciona tu proyecto del dashboard

### Paso 2: Abrir SQL Editor
1. En el menú lateral izquierdo, click en **"SQL Editor"**
2. Click en **"New query"** (botón verde arriba a la derecha)

### Paso 3: Ejecutar el SQL
1. **Copia TODO el contenido** del archivo: `EJECUTAR_ESTE_SQL_AHORA.sql`
2. **Pégalo** en el editor SQL de Supabase
3. Click en **"RUN"** (o presiona `Ctrl+Enter`)

### Paso 4: Verificar
Debes ver este resultado:
```
column_name | data_type | is_nullable
-----------+-----------+-------------
grosor      | text      | YES
medida_mm   | text      | YES
tamano      | text      | YES
```

✅ Si ves 3 filas, **¡funcionó!**

---

## 📋 SQL a Ejecutar:

```sql
-- Agregar columnas de medidas
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS tamano TEXT,
ADD COLUMN IF NOT EXISTS grosor TEXT,
ADD COLUMN IF NOT EXISTS medida_mm TEXT;

-- Verificar
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'inventory'
  AND table_schema = 'public'
  AND column_name IN ('tamano', 'grosor', 'medida_mm')
ORDER BY column_name;
```

---

## 🧪 Después de Ejecutar el SQL:

1. **Vuelve a tu aplicación:** `http://localhost:3000/inventario`
2. **Recarga la página** (F5)
3. Click en **"Nuevo producto"**
4. Selecciona categoría **CADENAS**
5. Debes ver los campos:
   - ✅ Tamaño *
   - ✅ Grosor *
6. Llena el formulario completo
7. Click en **"Crear producto"**
8. ✅ **Debe guardarse SIN ERRORES**

---

## 🎯 Resumen Visual:

```
┌─────────────────────────────────────────────┐
│  1. Ir a Supabase Dashboard                │
│     https://supabase.com/dashboard         │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  2. Click en "SQL Editor"                  │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  3. Click en "New query"                   │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  4. Pegar el SQL de:                       │
│     EJECUTAR_ESTE_SQL_AHORA.sql            │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  5. Click en "RUN" ▶️                      │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  6. Ver resultado: 3 filas ✅              │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  7. Volver a la app y probar ✅            │
└─────────────────────────────────────────────┘
```

---

## ⏰ Tiempo Estimado: **5 minutos**

---

## ❓ Si Tienes Problemas:

### Error: "relation 'inventory' does not exist"
- **Solución:** La tabla `inventory` no existe. Ejecuta primero los scripts anteriores.

### Error: "permission denied"
- **Solución:** Asegúrate de estar usando el usuario correcto en Supabase.

### No ves el botón "RUN"
- **Solución:** Estás en el lugar equivocado. Ve a **SQL Editor**, NO a "Table Editor".

---

## 📁 Archivos Relacionados:

- `EJECUTAR_ESTE_SQL_AHORA.sql` ← **EJECUTAR ESTE**
- `scripts/040_add_medidas_fields.sql` (mismo contenido)

---

**¡Ejecuta el SQL ahora y el error desaparecerá!** 🚀

