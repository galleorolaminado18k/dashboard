# Sistema de Códigos de Seguridad

## Descripción

Se ha implementado un sistema de códigos de seguridad para proteger acciones sensibles en el dashboard. Los códigos son configurables desde la sección de Configuración > Seguridad.

## Características

### Acciones Protegidas

1. **Reemplazar Evidencia en Ventas**
   - Ubicación: `/ventas` (Dashboard de Ventas)
   - Acción: Al hacer clic en el botón de "Reemplazar evidencia" (icono Upload)
   - Código predeterminado: `1430`

2. **Agregar Productos Directamente en Facturas**
   - Ubicación: Diálogo de creación de factura
   - Acción: Al intentar crear un producto que no existe en el inventario desde el formulario de facturación
   - Código predeterminado: `1430`

## Configuración

### Cambiar Códigos de Seguridad

1. Ir a **Configuración** en el sidebar
2. Seleccionar la sección **Seguridad**
3. Buscar la sección "Códigos de Seguridad"
4. Modificar los códigos según sea necesario:
   - **Código para Reemplazar Evidencia**: Protege el reemplazo de fotos de evidencia en ventas
   - **Código para Agregar Productos en Factura**: Protege la creación rápida de productos desde facturación
5. Hacer clic en **"Guardar Códigos de Seguridad"**
6. Los códigos se guardan en `localStorage` del navegador

### Valores Predeterminados

Si no se han configurado códigos personalizados, se utilizan los valores predeterminados:
- `replaceEvidence`: `"1430"`
- `addProductsToInvoice`: `"1430"`

## Flujo de Uso

### Reemplazar Evidencia en Ventas

1. Usuario hace clic en el botón "Reemplazar evidencia" (Upload) en una venta
2. Se muestra un modal solicitando el código de seguridad
3. Usuario ingresa el código y presiona "Confirmar" o Enter
4. Si el código es correcto:
   - Se cierra el modal
   - Se abre el selector de archivos
   - Usuario selecciona la nueva imagen
5. Si el código es incorrecto:
   - Se muestra un mensaje de error
   - Se limpia el campo del código
   - El modal permanece abierto

### Agregar Productos en Factura

1. Usuario está creando una factura
2. Ingresa una referencia (SKU) que no existe en el inventario
3. Se muestra un diálogo para crear el producto
4. Usuario llena los datos del producto
5. Ingresa el código de autorización en el campo correspondiente
6. Al hacer clic en "Crear Producto":
   - Si el código es correcto: Se crea el producto y se agrega a la factura
   - Si el código es incorrecto: Se muestra mensaje de error y no se crea el producto

## Implementación Técnica

### Archivos Modificados

1. **`lib/security-codes.ts`** (NUEVO)
   - Utilidad centralizada para manejar códigos de seguridad
   - Funciones: `getSecurityCodes()`, `saveSecurityCodes()`, `validateSecurityCode()`

2. **`app/(dashboard)/configuracion/page.tsx`**
   - Agregada sección de "Códigos de Seguridad" en la tab de Seguridad
   - Campos de input tipo password para cada código
   - Botón para guardar cambios

3. **`app/(dashboard)/ventas/page.tsx`**
   - Agregado modal de código de seguridad
   - Función `validateCodeAndUpload()` para validar antes de abrir selector de archivos
   - Estado `showCodeDialog` y `securityCode`

4. **`components/create-invoice-dialog.tsx`**
   - Modificada función `handleCreateProduct()` para validar código configurado
   - Usa `validateSecurityCode("addProductsToInvoice", authCode)`

### Almacenamiento

Los códigos se almacenan en `localStorage` con la clave `"securityCodes"`:

```json
{
  "replaceEvidence": "1430",
  "addProductsToInvoice": "1430"
}
```

### API de la Utilidad

```typescript
import { getSecurityCodes, saveSecurityCodes, validateSecurityCode } from "@/lib/security-codes"

// Obtener códigos actuales
const codes = getSecurityCodes()

// Guardar nuevos códigos
saveSecurityCodes({
  replaceEvidence: "1234",
  addProductsToInvoice: "5678"
})

// Validar un código
const isValid = validateSecurityCode("replaceEvidence", "1430")
```

## Consideraciones de Seguridad

1. **Almacenamiento Local**: Los códigos se guardan en `localStorage`, lo cual es apropiado para un entorno de usuario único o confiable.

2. **No es Encriptación**: Los códigos son visibles en el almacenamiento local del navegador. Para seguridad empresarial, se recomienda implementar autenticación backend.

3. **Por Usuario**: Los códigos son específicos del navegador/dispositivo del usuario.

4. **Recomendaciones**:
   - Usar códigos de 4+ dígitos
   - Cambiar códigos periódicamente
   - No compartir códigos con usuarios no autorizados
   - Considerar implementar autenticación backend para producción

## Extensibilidad

Para agregar nuevos códigos de seguridad:

1. Agregar la nueva clave en la interfaz `SecurityCodes` en `lib/security-codes.ts`
2. Actualizar `DEFAULT_CODES` con el valor predeterminado
3. Agregar campo en la UI de configuración (`app/(dashboard)/configuracion/page.tsx`)
4. Usar `validateSecurityCode("nuevaClave", codigo)` donde se necesite la validación

Ejemplo:

```typescript
// En lib/security-codes.ts
export interface SecurityCodes {
  replaceEvidence: string
  addProductsToInvoice: string
  deleteInvoice: string // NUEVO
}

const DEFAULT_CODES: SecurityCodes = {
  replaceEvidence: "1430",
  addProductsToInvoice: "1430",
  deleteInvoice: "9999" // NUEVO
}
```

