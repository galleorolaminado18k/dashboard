# 🔍 DEBUGGING AUTOCOMPLETADO DE NOMBRE - INSTRUCCIONES

**Fecha:** 2025-10-29  
**Problema:** El nombre NO se autocompleta después de escribir SKU

---

## ✅ MEJORAS IMPLEMENTADAS

### 1. Logs Extensivos de Debug

**Ahora verás en consola (F12):**

```
============================================================
[SKU Search] 🔍 INICIANDO BÚSQUEDA
[SKU Search] Referencia ingresada: 04-100
[SKU Search] Productos en memoria: 150
[SKU Search] Primeros SKUs disponibles: ["04-100", "04-101", "04-102", ...]
[SKU Search] Referencia normalizada: "04-100"
[SKU Search] ✅ MATCH ENCONTRADO: "04-100" === "04-100"
[SKU Search] 🎉 PRODUCTO ENCONTRADO:
  - SKU: 04-100
  - Nombre: Balines #4MM DORADOS
  - Precio Detal: 155000
  - Precio Mayor: 0
  - Precio seleccionado: 155000
[SKU Search] ✅ Campos actualizados en el DOM
============================================================
```

### 2. Recarga Automática de Productos

Si `inventoryProducts.length === 0`:
```
[SKU Search] ⚠️ NO HAY PRODUCTOS - RECARGANDO...
// Llama a fetchInventoryProducts()
[SKU Search] Productos después de recargar: 150
```

### 3. Indicador Visual

Cuando se autocompleta correctamente:
- ✅ **Fondo verde claro** en campo nombre
- ✅ **Borde verde** (`border-green-400`)
- ✅ **Icono de check verde** (✓) a la derecha

```
┌───────────────────────────────────────────┐
│ NOMBRE DEL PRODUCTO *                     │
│ [Balines #4MM DORADOS              ] ✓   │ ← Fondo verde
│  ^^^^^ Verde ^^^^^                        │
└───────────────────────────────────────────┘
```

### 4. Forzar Actualización del DOM

```typescript
setTimeout(() => {
  handleItemChange(index, "description", product.name)
  handleItemChange(index, "unit_price", precio)
  console.log("[SKU Search] ✅ Campos actualizados en el DOM")
}, 100)
```

El `setTimeout` asegura que React renderiza los cambios.

---

## 🐛 CÓMO DEBUGGEAR

### Paso 1: Abrir Consola

1. Presiona **F12**
2. Ve a pestaña **Console**
3. Limpia consola (icono 🚫 o Ctrl+L)

### Paso 2: Escribir SKU

1. En campo REF/SKU escribe: `04-100`
2. Presiona **Enter**

### Paso 3: Ver Logs

Deberías ver:
```
============================================================
[SKU Search] 🔍 INICIANDO BÚSQUEDA
...
```

### Paso 4: Interpretar Resultados

#### ✅ CASO 1: Producto Encontrado

```
[SKU Search] ✅ MATCH ENCONTRADO: "04-100" === "04-100"
[SKU Search] 🎉 PRODUCTO ENCONTRADO:
  - SKU: 04-100
  - Nombre: Balines #4MM DORADOS
  - Precio Detal: 155000
  - Precio Mayor: 0
  - Precio seleccionado: 155000
[SKU Search] ✅ Campos actualizados en el DOM
```

**Qué hacer:**
- El campo nombre debe tener el valor
- El campo precio debe tener el valor
- Debe verse fondo verde + check ✓

**Si no se ve el nombre:**
- Toma captura de consola
- Revisa el DOM con inspector (F12 → Elements)
- Busca el input con class `bg-green-50`

---

#### ❌ CASO 2: Productos Vacíos

```
[SKU Search] Productos en memoria: 0
[SKU Search] ⚠️ NO HAY PRODUCTOS - RECARGANDO...
[SKU Search] Productos después de recargar: 0
```

**Problema:** La API `/api/inventory` no devuelve productos.

**Solución:**
1. Verifica en Supabase Dashboard → Table Editor → `inventory`
2. Debe haber productos con SKU
3. Ejecuta manualmente en consola:
```javascript
fetch('/api/inventory')
  .then(r => r.json())
  .then(d => console.log('API Response:', d))
```

---

#### ❌ CASO 3: SKU No Existe

```
[SKU Search] ❌ PRODUCTO NO ENCONTRADO
[SKU Search] Todos los SKUs disponibles:
  - 04-101
  - 04-102
  - 04-103
  ...
```

**Problema:** El SKU que escribiste NO está en la base de datos.

**Solución:**
1. Revisa la lista de SKUs disponibles en la consola
2. Usa uno de esos SKUs para probar
3. O crea el producto con ese SKU

---

#### ❌ CASO 4: SKU con Formato Diferente

```
[SKU Search] Referencia normalizada: "04-100"
[SKU Search] Primeros SKUs disponibles: ["04100", "4-100", ...]
```

**Problema:** El SKU en DB tiene formato diferente (sin guión, con espacio, etc.)

**Solución:**
- Usa el formato exacto que aparece en "SKUs disponibles"
- O corrige el SKU en la base de datos

---

## 🔧 TESTING MANUAL

### Test 1: SKU Existente

```bash
1. Abre "Nueva Factura"
2. F12 → Console
3. REF/SKU: escribe "04-100"
4. Enter
5. Verifica logs
6. Verifica campo nombre tiene valor
7. Verifica fondo verde + check ✓
```

**Resultado esperado:**
- ✅ Logs muestran "PRODUCTO ENCONTRADO"
- ✅ Campo nombre autocompletado
- ✅ Campo precio autocompletado
- ✅ Fondo verde visible
- ✅ Check ✓ visible

---

### Test 2: SKU No Existente

```bash
1. REF/SKU: escribe "NO-EXISTE"
2. Enter
3. Verifica logs
4. Verifica diálogo "Crear Producto"
```

**Resultado esperado:**
- ✅ Logs muestran "PRODUCTO NO ENCONTRADO"
- ✅ Logs muestran lista de SKUs disponibles
- ✅ Se abre diálogo "Crear Nuevo Producto"
- ✅ SKU pre-llenado con "NO-EXISTE"

---

### Test 3: Primera Vez (Productos Vacíos)

```bash
1. Primera carga del modal
2. REF/SKU: escribe "04-100"
3. Enter
4. Verifica logs
```

**Resultado esperado:**
- ✅ Logs: "Productos en memoria: 0"
- ✅ Logs: "RECARGANDO..."
- ✅ Logs: "Productos después de recargar: X"
- ✅ Luego busca y encuentra producto

---

## 📊 EJEMPLO COMPLETO DE LOGS

```javascript
============================================================
[SKU Search] 🔍 INICIANDO BÚSQUEDA
[SKU Search] Referencia ingresada: 04-100
[SKU Search] Productos en memoria: 150

[SKU Search] Primeros SKUs disponibles: 
  ["04-100", "04-101", "04-102", "04-103", "04-104"]

[SKU Search] Referencia normalizada: "04-100"

[SKU Search] ✅ MATCH ENCONTRADO: "04-100" === "04-100"

[SKU Search] 🎉 PRODUCTO ENCONTRADO:
  - SKU: 04-100
  - Nombre: Balines #4MM DORADOS
  - Precio Detal: 155000
  - Precio Mayor: 0
  - Precio seleccionado: 155000

[SKU Search] ✅ Campos actualizados en el DOM
============================================================
```

---

## 🎯 CHECKLIST DE VERIFICACIÓN

Cuando escribes SKU y presionas Enter:

- [ ] Aparecen logs en consola con líneas `====`
- [ ] Se muestra "INICIANDO BÚSQUEDA"
- [ ] Se muestra cantidad de productos
- [ ] Se muestra lista de primeros SKUs
- [ ] Si encuentra: muestra "PRODUCTO ENCONTRADO"
- [ ] Si encuentra: muestra nombre y precio
- [ ] Si encuentra: muestra "Campos actualizados"
- [ ] Campo nombre se llena automáticamente
- [ ] Campo precio se llena automáticamente
- [ ] Campo nombre tiene fondo verde
- [ ] Campo nombre tiene check ✓ verde

---

## ❓ PREGUNTAS FRECUENTES

### ¿Por qué no se autocompleta?

**Posibles causas:**
1. No hay productos en `inventory` (revisar Supabase)
2. API `/api/inventory` no funciona
3. SKU no existe o tiene formato diferente
4. JavaScript deshabilitado
5. Error en la consola

**Diagnóstico:**
1. Abre F12 → Console
2. Escribe SKU → Enter
3. Lee los logs
4. Envía captura de logs

### ¿Cómo veo si hay productos?

```javascript
// En consola (F12)
fetch('/api/inventory')
  .then(r => r.json())
  .then(data => {
    console.log('Total productos:', data.products.length)
    console.log('Primeros 10:', data.products.slice(0, 10))
  })
```

### ¿Qué hago si sigue sin funcionar?

1. **Captura de consola completa** (con logs de búsqueda)
2. **Captura del modal** (mostrando campos)
3. **SKU exacto** que estás probando
4. **Respuesta de API** (ejecutar fetch manual arriba)

---

## 🎨 INDICADOR VISUAL

### Antes de Autocompletar:

```
┌───────────────────────────────────┐
│ NOMBRE DEL PRODUCTO *             │
│ [Ej: Cadena de Oro 18K        ]  │
│  ^^^^^ Blanco ^^^^^               │
└───────────────────────────────────┘
```

### Después de Autocompletar:

```
┌───────────────────────────────────┐
│ NOMBRE DEL PRODUCTO *             │
│ [Balines #4MM DORADOS         ] ✓│
│  ^^^^^ VERDE CLARO ^^^^^          │
│  Border verde                     │
└───────────────────────────────────┘
```

**Clases CSS aplicadas:**
- `bg-green-50` (fondo verde claro)
- `border-green-400` (borde verde)
- SVG check verde en la derecha

---

## 🚀 PRÓXIMOS PASOS

1. **Refresca página:** Ctrl + Shift + R
2. **Abre consola:** F12
3. **Prueba con SKU real:** (ejemplo: `04-100`)
4. **Lee los logs**
5. **Verifica indicador visual**
6. **Si falla:** Envía captura de logs

---

## 📦 CAMBIOS TÉCNICOS

### Mejoras en `handleReferenceBlurOrEnter`:

1. ✅ Función ahora es `async`
2. ✅ Recarga productos si está vacío
3. ✅ Logs extensivos con `=`.repeat(60)
4. ✅ Muestra primeros 5 SKUs
5. ✅ Muestra TODOS los SKUs si no encuentra
6. ✅ `setTimeout` para forzar actualización
7. ✅ Logs de cada paso del proceso

### Indicador Visual en Campo Nombre:

```typescript
className={`
  text-sm h-12 border-2 
  ${item.description && item.unit_price > 0 
    ? 'bg-green-50 border-green-400'  // ← Verde cuando tiene valor
    : ''
  }
`}
```

```typescript
{item.description && item.unit_price > 0 && (
  <div className="absolute right-2 top-3.5 text-green-600">
    <svg className="w-5 h-5">  // ← Check verde
      <path d="M5 13l4 4L19 7" />
    </svg>
  </div>
)}
```

---

**LOGS COMPLETOS Y INDICADOR VISUAL IMPLEMENTADOS** ✅

**REFRESCA Y PRUEBA CON CONSOLA ABIERTA** 🔍

