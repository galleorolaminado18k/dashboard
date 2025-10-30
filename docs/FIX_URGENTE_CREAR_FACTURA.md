# 🚨 FIX URGENTE - ERROR AL CREAR FACTURA

**Fecha:** 2025-10-29  
**Error:** "Could not find the 'client_email' column of 'invoices' in the schema cache"  
**Causa:** Faltan columnas en la tabla `invoices` de Supabase

---

## ❌ EL PROBLEMA

### Error mostrado:
```
❌ Error al crear factura: Could not find the 'client_email' 
column of 'invoices' in the schema cache
```

### Causa raíz:
La tabla `invoices` en Supabase no tiene las columnas que el código está intentando usar:

**Columnas faltantes:**
- ✅ `client_email` (ya existe en el script original)
- ❌ `ciudad` (NO existe)
- ❌ `barrio` (NO existe)  
- ❌ `guia` (NO existe)
- ❌ `transportadora` (NO existe)
- ❌ `vendedor` (NO existe)
- ❌ `evidencia` (NO existe)

---

## ✅ LA SOLUCIÓN

### Paso 1: Ejecutar Script SQL en Supabase

**Archivo:** `scripts/043_add_invoice_shipping_columns.sql`

**Pasos:**
1. Abre Supabase Dashboard
2. Ve a **SQL Editor**
3. Copia el contenido del archivo `043_add_invoice_shipping_columns.sql`
4. Pega en el editor
5. Click **RUN** (o F5)
6. Verifica que dice: "Success. No rows returned"

---

## 📋 QUÉ HACE EL SCRIPT

### Agrega 6 columnas nuevas:

```sql
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS ciudad TEXT,
ADD COLUMN IF NOT EXISTS barrio TEXT,
ADD COLUMN IF NOT EXISTS guia TEXT,
ADD COLUMN IF NOT EXISTS transportadora TEXT,
ADD COLUMN IF NOT EXISTS vendedor TEXT DEFAULT 'Sistema',
ADD COLUMN IF NOT EXISTS evidencia TEXT;
```

### Crea índices para optimizar:
- `idx_invoices_ciudad` - Búsqueda por ciudad
- `idx_invoices_guia` - Búsqueda por guía de envío
- `idx_invoices_transportadora` - Búsqueda por transportadora

### Agrega comentarios documentados:
- Cada columna tiene descripción de su propósito

---

## 🔍 VERIFICACIÓN POST-SCRIPT

### Consulta para verificar:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'invoices'
  AND column_name IN ('ciudad', 'barrio', 'guia', 'transportadora', 'vendedor', 'evidencia')
ORDER BY column_name;
```

### Resultado esperado:
```
barrio          | text | YES
ciudad          | text | YES
evidencia       | text | YES
guia            | text | YES
transportadora  | text | YES
vendedor        | text | YES
```

---

## 🎯 FLUJO COMPLETO DE CREACIÓN DE FACTURA

### 1. Usuario llena el formulario:
- Información del cliente (nombre, NIT, email, teléfono, dirección)
- **Ciudad** ← Nueva columna
- **Barrio** ← Nueva columna
- **Número de Guía** ← Nueva columna
- **Transportadora** ← Nueva columna
- **Vendedor** ← Nueva columna (opcional, default: "Sistema")
- **Evidencia fotográfica** ← Nueva columna (URL)
- Items/Productos
- Costo de envío
- Método de pago

### 2. Sistema valida:
```typescript
if (!formData.ciudad.trim()) {
  alert("⚠️ La ciudad es obligatoria")
  return
}

if (!formData.barrio.trim()) {
  alert("⚠️ El barrio es obligatorio")
  return
}

if (!formData.guia.trim()) {
  alert("⚠️ El número de guía es obligatorio")
  return
}
```

### 3. Sistema sube evidencia:
```typescript
// POST /api/upload/evidencia
const { url: evidenciaUrl } = await uploadResponse.json()
```

### 4. Sistema crea factura:
```typescript
// POST /api/invoices
await supabase.from("invoices").insert({
  invoice_number: invoiceNumber,
  client_name: body.client_name,
  client_email: body.client_email,  // ← Debe existir
  ciudad: body.ciudad,               // ← Nueva
  barrio: body.barrio,               // ← Nueva
  guia: body.guia,                   // ← Nueva
  transportadora: body.transportadora, // ← Nueva
  vendedor: body.vendedor,           // ← Nueva
  evidencia: body.evidencia,         // ← Nueva
  // ... más campos
})
```

### 5. Sistema crea items:
```typescript
await supabase.from("invoice_items").insert(items)
```

### 6. Factura aparece en tabla de facturación

### 7. Si venta tiene sale_id, se vincula a ventas

---

## 🐛 ERRORES COMUNES Y SOLUCIONES

### Error 1: "column does not exist"
**Causa:** No ejecutaste el script SQL  
**Solución:** Ejecuta `043_add_invoice_shipping_columns.sql`

### Error 2: "violates not-null constraint"
**Causa:** Falta validación en frontend  
**Solución:** Ya está implementada (ver validaciones arriba)

### Error 3: "new row violates row-level security"
**Causa:** RLS muy restrictivo  
**Solución:** Ejecuta script `042_create_storage_evidencias.sql` para políticas públicas

### Error 4: "Could not find column in schema cache"
**Causa:** Schema cache desactualizado  
**Solución:**
1. Ejecuta el script SQL
2. En Supabase: Settings → Database → **Restart Database**
3. O espera 5-10 minutos para que se actualice automáticamente

---

## 📊 ESTRUCTURA FINAL DE LA TABLA

### Tabla `invoices` después del script:

```
invoice_number       | TEXT (PK)
client_name          | TEXT NOT NULL
client_nit           | TEXT
client_email         | TEXT
client_phone         | TEXT
client_address       | TEXT
ciudad               | TEXT              ← NUEVA
barrio               | TEXT              ← NUEVA
guia                 | TEXT              ← NUEVA
transportadora       | TEXT              ← NUEVA
vendedor             | TEXT              ← NUEVA
evidencia            | TEXT              ← NUEVA
issue_date           | TIMESTAMPTZ
due_date             | TIMESTAMPTZ
subtotal             | NUMERIC(12,2)
tax_rate             | NUMERIC(5,2)
tax_amount           | NUMERIC(12,2)
total                | NUMERIC(12,2)
status               | TEXT
payment_method       | TEXT
payment_date         | TIMESTAMPTZ
notes                | TEXT
created_at           | TIMESTAMPTZ
updated_at           | TIMESTAMPTZ
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Después de ejecutar el script:

- [ ] Script ejecutado sin errores
- [ ] 6 columnas nuevas creadas
- [ ] 3 índices creados
- [ ] Comentarios agregados
- [ ] Consulta de verificación ejecutada
- [ ] Resultado muestra 6 filas
- [ ] **Reiniciar Supabase Database** (opcional pero recomendado)
- [ ] Refrescar aplicación (Ctrl + Shift + R)
- [ ] Probar crear factura
- [ ] Factura se crea sin errores
- [ ] Factura aparece en tabla
- [ ] Datos se guardan correctamente

---

## 🚀 DESPUÉS DE EJECUTAR EL SCRIPT

### 1. Verificar en Supabase:
```sql
-- Ver estructura completa
SELECT * FROM information_schema.columns
WHERE table_name = 'invoices'
ORDER BY ordinal_position;

-- Ver datos de prueba
SELECT invoice_number, ciudad, barrio, guia, transportadora
FROM invoices
LIMIT 5;
```

### 2. Probar creación de factura:
1. Refresca la aplicación
2. Click "Nueva Factura"
3. Llena todos los campos (incluyendo ciudad, barrio, guía)
4. Selecciona evidencia fotográfica
5. Agrega costo de envío
6. Click "Crear Factura"
7. **Debe decir:** "✅ Factura creada exitosamente"
8. **Debe aparecer** en la tabla de facturas

### 3. Verificar datos guardados:
```sql
-- Ver última factura creada
SELECT *
FROM invoices
ORDER BY created_at DESC
LIMIT 1;

-- Ver items de la última factura
SELECT ii.*
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.invoice_number
ORDER BY i.created_at DESC
LIMIT 10;
```

---

## 📝 RESUMEN EJECUTIVO

### El problema:
- ❌ Código intenta insertar en columnas que NO existen
- ❌ Error: "column does not exist" o "schema cache"

### La solución:
- ✅ Ejecutar script SQL que agrega 6 columnas
- ✅ Reiniciar cache de Supabase (opcional)

### El resultado:
- ✅ Facturas se crean correctamente
- ✅ Datos de envío guardados
- ✅ Evidencias guardadas
- ✅ Facturas aparecen en tabla
- ✅ Vinculación con ventas funciona

---

## ⚠️ IMPORTANTE

### **DEBES EJECUTAR EL SCRIPT SQL ANTES DE CREAR FACTURAS**

Sin ejecutar el script:
- ❌ Error al crear factura
- ❌ Datos NO se guardan
- ❌ Factura NO aparece en tabla

Después de ejecutar el script:
- ✅ Factura se crea correctamente
- ✅ Datos se guardan
- ✅ Factura aparece en tabla

---

## 🆘 SI SIGUE SIN FUNCIONAR

1. **Captura el error completo** (texto en el alert)
2. **Abre consola** (F12)
3. **Revisa logs** (busca `[v0]` o `[Factura]`)
4. **Ejecuta verificación:**
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'invoices'
  AND column_name IN ('ciudad', 'barrio', 'guia');
```

5. **Si devuelve 0 filas:**
   - El script NO se ejecutó
   - Ejecuta el script de nuevo

6. **Si devuelve 3 filas:**
   - El script SÍ se ejecutó
   - El problema es otro (envíame el error completo)

---

**EJECUTA EL SCRIPT SQL AHORA** 📋

**Archivo:** `scripts/043_add_invoice_shipping_columns.sql`

**Ubicación:** Supabase Dashboard → SQL Editor → RUN

