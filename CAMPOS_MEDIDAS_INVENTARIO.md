# 📏 CAMPOS DE MEDIDAS EN INVENTARIO

## ✅ Implementación Completada

Se han agregado campos de medidas obligatorios según la categoría del producto.

---

## 📋 Categorías y Campos Obligatorios

### Grupo 1: Tamaño y Grosor
**Categorías:** CADENAS, PULSERAS, TOBILLERAS

**Campos obligatorios:**
- ✅ **Tamaño** (obligatorio)
  - Ejemplo: 45cm, 18 pulgadas, 50cm
- ✅ **Grosor** (obligatorio)
  - Ejemplo: 2mm, 3mm, 5mm

### Grupo 2: Medida en MM
**Categorías:** ARETES, DIJES, MANILLAS, BALINES, ANILLOS, CANDONGAS, HERRAJES

**Campo obligatorio:**
- ✅ **Medida (MM)** (obligatorio)
  - Ejemplo: 5mm, 8mm, 10x15mm, 12mm

---

## 🎨 Interfaz de Usuario

### Formulario de Nuevo Producto

```
┌─────────────────────────────────────────┐
│  🆕 Nuevo Producto                      │
├─────────────────────────────────────────┤
│                                         │
│  SKU: _____________                     │
│  Nombre: __________                     │
│  Categoría: [CADENAS ▼]                 │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 📏 CAMPOS OBLIGATORIOS            │  │
│  │ (Aparecen según categoría)        │  │
│  ├───────────────────────────────────┤  │
│  │ Tamaño *: ___________             │  │
│  │ Grosor *: ___________             │  │
│  └───────────────────────────────────┘  │
│                                         │
│  O bien (si es ARETES, DIJES, etc.):    │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 📏 MEDIDA OBLIGATORIA             │  │
│  ├───────────────────────────────────┤  │
│  │ Medida (MM) *: __________         │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Descripción: __________                │
│  ... resto de campos ...                │
└─────────────────────────────────────────┘
```

### Tabla de Inventario

Nueva columna **"Espec."** (Especificaciones):

```
┌────┬────────┬────────┬─────────┬──────────┐
│SKU │ NOMBRE │  CAT.  │ ESPEC.  │ PRECIOS  │
├────┼────────┼────────┼─────────┼──────────┤
│C-01│ Cadena │CADENAS │ T: 45cm │ $500.000 │
│    │  Oro   │        │ G: 3mm  │          │
├────┼────────┼────────┼─────────┼──────────┤
│A-02│ Arete  │ARETES  │  8mm    │ $150.000 │
│    │ Perla  │        │   🟣    │          │
└────┴────────┴────────┴─────────┴──────────┘

T: Tamaño
G: Grosor
🟣: Medida MM (color morado)
```

---

## 🔧 Validaciones Implementadas

### Frontend (page.tsx)

```typescript
// Validación antes de enviar el formulario
if (['CADENAS', 'PULSERAS', 'TOBILLERAS'].includes(category)) {
  if (!tamano.trim()) {
    alert('⚠️ El campo Tamaño es obligatorio para ' + category)
    return
  }
  if (!grosor.trim()) {
    alert('⚠️ El campo Grosor es obligatorio para ' + category)
    return
  }
}

if (['ARETES', 'DIJES', 'MANILLAS', 'BALINES', 'ANILLOS', 'CANDONGAS', 'HERRAJES'].includes(category)) {
  if (!medida_mm.trim()) {
    alert('⚠️ El campo Medida (MM) es obligatorio para ' + category)
    return
  }
}
```

### Campos Condicionales

Los campos aparecen/desaparecen automáticamente al cambiar la categoría:

- **Seleccionas CADENAS** → Aparecen campos de Tamaño y Grosor
- **Seleccionas ARETES** → Aparece campo de Medida (MM)
- **Cambias de categoría** → Los campos se limpian automáticamente

---

## 📊 Base de Datos

### Script SQL: `040_add_medidas_fields.sql`

**Columnas agregadas:**

```sql
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS tamano TEXT,
ADD COLUMN IF NOT EXISTS grosor TEXT,
ADD COLUMN IF NOT EXISTS medida_mm TEXT;
```

**Documentación de columnas:**

| Campo | Tipo | Nullable | Para Categorías |
|-------|------|----------|-----------------|
| `tamano` | TEXT | Yes | CADENAS, PULSERAS, TOBILLERAS |
| `grosor` | TEXT | Yes | CADENAS, PULSERAS, TOBILLERAS |
| `medida_mm` | TEXT | Yes | ARETES, DIJES, MANILLAS, BALINES, ANILLOS, CANDONGAS, HERRAJES |

---

## 📁 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `app/(dashboard)/inventario/page.tsx` | ✅ Formulario con campos condicionales<br>✅ Validaciones frontend<br>✅ Columna "Espec." en tabla |
| `app/api/inventory/create/route.ts` | ✅ Guardar campos de medidas en DB |
| `scripts/040_add_medidas_fields.sql` | ✅ Crear columnas en base de datos |

---

## 🧪 Casos de Prueba

### Prueba 1: Crear Cadena

```
1. Click en "Nuevo producto"
2. Categoría: CADENAS
3. Verificar que aparezcan campos:
   ✅ Tamaño *
   ✅ Grosor *
4. NO llenar Tamaño
5. Click en "Crear"
   ❌ Debe mostrar: "⚠️ El campo Tamaño es obligatorio para CADENAS"
6. Llenar:
   - Tamaño: 45cm
   - Grosor: 3mm
7. Click en "Crear"
   ✅ Debe guardar exitosamente
8. En tabla, columna "Espec." debe mostrar:
   T: 45cm
   G: 3mm
```

### Prueba 2: Crear Aretes

```
1. Click en "Nuevo producto"
2. Categoría: ARETES
3. Verificar que aparezca campo:
   ✅ Medida (MM) *
4. NO llenar Medida (MM)
5. Click en "Crear"
   ❌ Debe mostrar: "⚠️ El campo Medida (MM) es obligatorio para ARETES"
6. Llenar:
   - Medida (MM): 8mm
7. Click en "Crear"
   ✅ Debe guardar exitosamente
8. En tabla, columna "Espec." debe mostrar:
   8mm (en color morado)
```

### Prueba 3: Cambio de Categoría

```
1. Click en "Nuevo producto"
2. Categoría: CADENAS
3. Llenar:
   - Tamaño: 50cm
   - Grosor: 4mm
4. Cambiar categoría a: ARETES
5. Verificar que:
   ✅ Campos de Tamaño y Grosor desaparecen
   ✅ Aparece campo de Medida (MM)
   ✅ Los valores previos se limpian
```

---

## 🎨 Estilos Visuales

### Campos de Tamaño/Grosor (CADENAS, PULSERAS, TOBILLERAS)

- **Fondo:** Azul claro (`bg-blue-50`)
- **Borde:** Azul (`border-blue-200`)
- **Label:** Azul oscuro (`text-blue-900`)

### Campo de Medida MM (ARETES, etc.)

- **Fondo:** Morado claro (`bg-purple-50`)
- **Borde:** Morado (`border-purple-200`)
- **Label:** Morado oscuro (`text-purple-900`)

### En la Tabla

- **Tamaño/Grosor:** Texto gris oscuro
- **Medida MM:** Texto morado (`text-purple-700`)

---

## 🚀 Pasos para Activar

### 1. Ejecutar SQL en Supabase

```
1. Ir a: https://supabase.com/dashboard
2. SQL Editor → New query
3. Copiar: scripts/040_add_medidas_fields.sql
4. Ejecutar ▶️
```

### 2. Verificar

```
http://localhost:3000/inventario
→ Click en "Nuevo producto"
→ Seleccionar CADENAS
→ Deben aparecer campos de Tamaño y Grosor
```

---

## 📋 Lista de Categorías Completas

1. ✅ **CADENAS** → Tamaño + Grosor
2. ✅ **ARETES** → Medida MM
3. ✅ **DIJES** → Medida MM
4. ✅ **PULSERAS** → Tamaño + Grosor
5. ✅ **TOBILLERAS** → Tamaño + Grosor
6. ✅ **MANILLAS** → Medida MM
7. ✅ **BALINES** → Medida MM
8. ✅ **ANILLOS** → Medida MM
9. ✅ **CANDONGAS** → Medida MM
10. ✅ **HERRAJES** → Medida MM

---

## ✅ Resumen

```
┌─────────────────────────────────────────┐
│  📏 CAMPOS DE MEDIDAS                   │
├─────────────────────────────────────────┤
│                                         │
│  Formulario:         ✅ COMPLETO        │
│  Validaciones:       ✅ ACTIVAS         │
│  Tabla:              ✅ CON COLUMNA     │
│  Backend:            ✅ ACTUALIZADO     │
│  SQL:                ⚠️ PENDIENTE       │
│                                         │
│  Categorías:         10 configuradas    │
│  Campos obligatorios: Según categoría   │
│                                         │
└─────────────────────────────────────────┘
```

---

**Fecha:** 27 de octubre de 2025
**Estado:** ✅ Código completo, SQL pendiente de ejecutar

