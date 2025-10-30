# FIX: Campo Email Opcional en Facturas

## Problema
Error al crear factura: "Could not find the 'client_email' column of 'invoices' in the schema cache"

## Causa
La columna `client_email` puede no existir en la tabla `invoices` o el schema cache de Supabase necesita actualizarse.

## Solución Implementada

### 1. Script SQL de Migración (044)
Archivo: `scripts/044_fix_client_email_column.sql`

Este script:
- Verifica si la columna `client_email` existe
- La crea si no existe
- Asegura que sea NULL (opcional)
- Crea un índice para búsquedas eficientes
- Agrega comentario descriptivo

**IMPORTANTE**: Ejecutar este script en el editor SQL de Supabase antes de desplegar los cambios.

### 2. Cambios en el API (`app/api/invoices/route.ts`)
- El campo `client_email` ahora es opcional
- Solo se incluye en la inserción si tiene valor
- Mejor manejo de campos opcionales (NIT, teléfono, dirección, etc.)

### 3. Cambios en el Frontend (`components/create-invoice-dialog.tsx`)
- Label actualizado: "Email (Opcional)"
- Placeholder actualizado: "cliente@email.com (opcional)"
- Visual claro de que el campo no es obligatorio

## Instrucciones de Despliegue

### Paso 1: Ejecutar Script SQL en Supabase
1. Ir a https://supabase.com → Tu proyecto
2. Ir a SQL Editor
3. Copiar y pegar el contenido de `scripts/044_fix_client_email_column.sql`
4. Ejecutar el script
5. Verificar que muestre "Columna client_email ya existe" o "agregada exitosamente"

### Paso 2: Subir Cambios a GitHub
```bash
git add scripts/044_fix_client_email_column.sql
git add app/api/invoices/route.ts
git add components/create-invoice-dialog.tsx
git add docs/FIX_EMAIL_OPCIONAL.md
git commit -m "fix: Hacer campo email opcional en facturas - Agregar script 044 para verificar columna client_email - Actualizar API para manejar campos opcionales correctamente - Agregar indicador visual (Opcional) en el formulario"
git push origin feature/meta-ads-integration-v2
```

### Paso 3: Verificar en Producción
Después del despliegue automático de Vercel:
1. Ir a la sección de Facturación
2. Intentar crear una factura SIN email
3. Verificar que se cree correctamente
4. Intentar crear una factura CON email
5. Verificar que se guarde el email

## Campos Opcionales vs Obligatorios

### Obligatorios ✅
- Nombre del cliente
- Ciudad
- Barrio
- Número de guía
- Transportadora
- Evidencia fotográfica
- Costo de envío
- Al menos 1 producto con precio

### Opcionales ⚪
- Email
- NIT
- Teléfono
- Dirección
- Fecha de vencimiento
- Método de pago
- Notas

## Beneficios
- ✅ No se requiere email para crear factura
- ✅ Mejor experiencia de usuario
- ✅ Menos campos obligatorios = más rápido crear facturas
- ✅ Compatible con clientes que no tienen email
- ✅ Manejo robusto de campos opcionales en el API

## Archivos Modificados
1. `scripts/044_fix_client_email_column.sql` (NUEVO)
2. `app/api/invoices/route.ts`
3. `components/create-invoice-dialog.tsx`
4. `docs/FIX_EMAIL_OPCIONAL.md` (NUEVO)

