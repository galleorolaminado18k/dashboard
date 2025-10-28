# 📦 CAMBIOS EN MÓDULO DE INVENTARIO - TIPOS DE MOVIMIENTO

## ✅ Cambios Implementados

### 🔄 Tipos de Movimiento ANTES → DESPUÉS

| Antes | Después |
|-------|---------|
| Entrada | **Entrada** (sin cambios) |
| Salida | **Salidas Especiales** (con sub-menú) |
| Ajuste | **Ajuste por Conteo de Inventario** (descripción obligatoria) |
| Transferencia | **Transferencia por Garantía** |
| ~~Garantía~~ | ❌ **ELIMINADO** |

---

## 🆕 Nuevas Funcionalidades

### 1. Salidas Especiales (con Sub-menú)

Cuando seleccionas **"Salidas Especiales"**, aparece un nuevo campo obligatorio:

**Tipo de Salida Especial:**
- ✅ Bono
- ✅ Obsequios
- ✅ Canje
- ✅ Puntos Acumulados
- ✅ Otros

**Validaciones:**
- ⚠️ Tipo de salida: **OBLIGATORIO**
- ⚠️ Descripción: **OBLIGATORIA**

**Formato en base de datos:**
```
Notas guardadas: "[Tipo] Descripción del usuario"
Ejemplo: "[Bono] Regalo de cumpleaños para cliente VIP"
```

---

### 2. Ajuste por Conteo de Inventario

**Cambios:**
- Nombre actualizado: "Ajuste" → **"Ajuste por Conteo de Inventario"**
- Descripción: **OBLIGATORIA**

**Validación:**
- ⚠️ Al seleccionar "Ajuste por Conteo de Inventario", el campo de descripción se vuelve obligatorio
- ⚠️ Placeholder: "Descripción del conteo de inventario (obligatorio)..."

---

### 3. Transferencia por Garantía

**Cambios:**
- Nombre actualizado: "Transferencia" → **"Transferencia por Garantía"**
- Comportamiento: **Sin cambios** (mueve de Cantidad → Garantías)

---

### 4. Eliminación de "Garantía"

- ❌ La opción "Garantía" fue **eliminada** del menú desplegable
- ✅ Su funcionalidad se mantiene como **"Transferencia por Garantía"**

---

## 🎨 Interfaz de Usuario - Vista Previa

### Modal de Movimiento - Flujo Actualizado

```
┌────────────────────────────────────────────────────────┐
│  📦 Movimiento — SKU-001                               │
│  Producto: Anillo de Oro 18K                          │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Tipo de Movimiento *                                  │
│  ┌──────────────────────────────────┐                 │
│  │ Salidas Especiales            ▼ │                  │
│  └──────────────────────────────────┘                 │
│   Opciones:                                           │
│   • Entrada                                           │
│   • Salidas Especiales         ← NUEVO NOMBRE        │
│   • Ajuste por Conteo de Inv.  ← NUEVO NOMBRE        │
│   • Transferencia por Garantía ← NUEVO NOMBRE        │
│                                                        │
│  ┌─────────────────────────────────────────┐          │
│  │ ⬇️ APARECE SOLO SI SELECCIONAS          │          │
│  │    "Salidas Especiales"                 │          │
│  │                                         │          │
│  │  Tipo de Salida Especial *              │          │
│  │  ┌──────────────────────────────┐       │          │
│  │  │ Bono                      ▼ │       │          │
│  │  └──────────────────────────────┘       │          │
│  │   • Bono                                │          │
│  │   • Obsequios                           │          │
│  │   • Canje                               │          │
│  │   • Puntos Acumulados                   │          │
│  │   • Otros                               │          │
│  └─────────────────────────────────────────┘          │
│                                                        │
│  Almacén                                              │
│  ┌──────────────────────────────────┐                 │
│  │ Cantidad                      ▼ │                  │
│  └──────────────────────────────────┘                 │
│                                                        │
│  Cantidad *                                           │
│  ┌──────────────────────────────────┐                 │
│  │ 5                                │                 │
│  └──────────────────────────────────┘                 │
│                                                        │
│  Notas * (si es Ajuste o Salida)                     │
│  ┌──────────────────────────────────┐                 │
│  │ Descripción obligatoria...       │                 │
│  │                                  │                 │
│  └──────────────────────────────────┘                 │
│                                                        │
│  Stock Actual:                                        │
│  • Cantidad: 50 unidades                             │
│  • Garantías: 0 unidades                             │
│                                                        │
│      [Cancelar]  [Registrar Movimiento]              │
└────────────────────────────────────────────────────────┘
```

---

## 📝 Validaciones Implementadas

### Frontend (page.tsx)

```typescript
// Validación para Ajuste por Conteo de Inventario
if (movementForm.movement_type === 'ajuste' && !movementForm.notes.trim()) {
  alert('⚠️ La descripción es obligatoria para Ajuste por Conteo de Inventario')
  return
}

// Validación para Salidas Especiales
if (movementForm.movement_type === 'salida') {
  if (!movementForm.special_exit_type) {
    alert('⚠️ Debes seleccionar el tipo de Salida Especial')
    return
  }
  if (!movementForm.notes.trim()) {
    alert('⚠️ La descripción es obligatoria para Salidas Especiales')
    return
  }
}
```

### Backend (route.ts)

```typescript
// Validar que salidas especiales tengan tipo
if (body.movement_type === 'salida' && !body.special_exit_type) {
  return NextResponse.json({
    ok: false,
    error: 'Las salidas especiales requieren special_exit_type'
  }, { status: 400 })
}

// Validar que ajuste y salidas tengan descripción
if ((body.movement_type === 'ajuste' || body.movement_type === 'salida') && !body.notes) {
  return NextResponse.json({
    ok: false,
    error: 'La descripción es obligatoria para este tipo de movimiento'
  }, { status: 400 })
}
```

---

## 🗄️ Cambios en Base de Datos

### Script SQL: `039_update_movement_types.sql`

**Función actualizada:**
```sql
CREATE OR REPLACE FUNCTION update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- 'transferencia' ahora mueve de cantidad → garantías
  IF NEW.movement_type = 'transferencia' THEN
    UPDATE public.inventory
    SET stock = stock - NEW.quantity,
        stock_warranty = stock_warranty + NEW.quantity
    WHERE id = NEW.inventory_id;
  END IF;
  
  -- ...resto de la lógica
END;
$$ LANGUAGE plpgsql;
```

**Tipos de movimiento válidos:**
- ✅ `entrada`
- ✅ `salida`
- ✅ `ajuste`
- ✅ `transferencia`
- ❌ ~~`garantia`~~ (eliminado)

---

## 📋 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `app/(dashboard)/inventario/page.tsx` | ✅ Actualizado con nuevos nombres y validaciones |
| `app/api/inventory/movements/route.ts` | ✅ Validaciones backend agregadas |
| `scripts/039_update_movement_types.sql` | ✅ Trigger actualizado |

---

## 🧪 Casos de Prueba

### Prueba 1: Salida Especial - Bono

```
1. Ir a Inventario
2. Click en "Movimiento" de un producto
3. Seleccionar "Salidas Especiales"
   ✅ Debe aparecer campo "Tipo de Salida Especial"
4. Seleccionar "Bono"
5. Ingresar cantidad: 5
6. Dejar descripción vacía y enviar
   ❌ Debe mostrar: "La descripción es obligatoria"
7. Ingresar descripción: "Regalo navideño"
8. Enviar
   ✅ Debe guardar con notas: "[Bono] Regalo navideño"
```

### Prueba 2: Ajuste por Conteo de Inventario

```
1. Ir a Inventario
2. Click en "Movimiento"
3. Seleccionar "Ajuste por Conteo de Inventario"
4. Ingresar cantidad: 100
5. Dejar descripción vacía y enviar
   ❌ Debe mostrar: "La descripción es obligatoria"
6. Ingresar descripción: "Conteo mensual - Stock corregido"
7. Enviar
   ✅ Debe actualizar stock directamente a 100
```

### Prueba 3: Transferencia por Garantía

```
1. Ir a Inventario
2. Click en "Movimiento"
3. Seleccionar "Transferencia por Garantía"
4. Almacén debe estar DESHABILITADO (automático)
5. Ingresar cantidad: 10
6. Enviar
   ✅ Stock Cantidad: -10
   ✅ Stock Garantías: +10
```

### Prueba 4: Validación de Tipo en Salidas

```
1. Ir a Inventario
2. Click en "Movimiento"
3. Seleccionar "Salidas Especiales"
4. NO seleccionar tipo de salida
5. Ingresar descripción: "Test"
6. Enviar
   ❌ Debe mostrar: "Debes seleccionar el tipo de Salida Especial"
```

---

## 🚀 Pasos para Activar

### 1. Ejecutar SQL en Supabase

```bash
# Ir a: https://supabase.com/dashboard → SQL Editor
# Ejecutar: scripts/039_update_movement_types.sql
```

### 2. Verificar Código

```bash
# Código ya actualizado:
✅ app/(dashboard)/inventario/page.tsx
✅ app/api/inventory/movements/route.ts
```

### 3. Probar en Navegador

```
http://localhost:3000/inventario
```

---

## 📊 Estado de Campo "special_exit_type"

### Estructura en Frontend

```typescript
const [movementForm, setMovementForm] = useState({
  movement_type: 'entrada',
  warehouse_type: 'cantidad',
  quantity: 1,
  notes: '',
  special_exit_type: '' // NUEVO CAMPO
})
```

### Valores Posibles

```typescript
type SpecialExitType = 
  | 'bono'
  | 'obsequios'
  | 'canje'
  | 'puntos_acumulados'
  | 'otros'
  | ''
```

### Cómo se Guarda en Base de Datos

El campo `special_exit_type` NO se guarda directamente en la tabla. En su lugar:

1. Se valida en el backend
2. Se formatea en las notas como: `[Tipo] Descripción`
3. Se guarda en el campo `notes` de `inventory_movements`

**Ejemplo:**
```
Input:
  movement_type: 'salida'
  special_exit_type: 'bono'
  notes: 'Regalo de cumpleaños'

Output en DB:
  notes: '[Bono] Regalo de cumpleaños'
```

---

## ✅ Checklist de Implementación

- [x] Renombrar "Transferencia" → "Transferencia por Garantía"
- [x] Eliminar opción "Garantía"
- [x] Renombrar "Ajuste" → "Ajuste por Conteo de Inventario"
- [x] Hacer descripción obligatoria en Ajuste
- [x] Renombrar "Salida" → "Salidas Especiales"
- [x] Agregar sub-menú de tipos de salida
- [x] Hacer tipo de salida obligatorio
- [x] Hacer descripción obligatoria en Salidas Especiales
- [x] Validaciones frontend
- [x] Validaciones backend
- [x] Actualizar trigger SQL
- [x] Formatear notas con tipo de salida
- [ ] **Ejecutar SQL en Supabase** ← PENDIENTE
- [ ] Probar cada tipo de movimiento

---

## 🎯 Resumen Visual de Cambios

```
ANTES:
┌──────────────────┐
│ Entrada          │
│ Salida           │
│ Ajuste           │
│ Transferencia    │
│ Garantía         │
└──────────────────┘

DESPUÉS:
┌────────────────────────────────────┐
│ Entrada                            │
│ Salidas Especiales ━━━━┐           │
│   ├─ Bono              │ NUEVO     │
│   ├─ Obsequios         │ SUB-MENÚ  │
│   ├─ Canje             │           │
│   ├─ Puntos Acumulados │           │
│   └─ Otros             │           │
│ Ajuste por Conteo de Inv. (*)      │
│ Transferencia por Garantía         │
└────────────────────────────────────┘
(*) = Descripción obligatoria
```

---

**Fecha de implementación**: 27 de octubre de 2025
**Archivos afectados**: 3 (page.tsx, route.ts, SQL)
**Estado**: ✅ Código completo, SQL pendiente de ejecutar

