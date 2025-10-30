# Subir Cambios Script 043 a GitHub

## Archivos modificados:
1. `scripts/043_add_invoice_shipping_columns.sql` - Script de migración nuevo
2. `AutoPush.ps1` - Script actualizado para incluir el archivo SQL

## Comandos para ejecutar manualmente:

```bash
# 1. Agregar archivos al staging
git add scripts/043_add_invoice_shipping_columns.sql
git add AutoPush.ps1

# 2. Ver el estado
git status

# 3. Crear commit
git commit -m "feat: Agregar script de migración 043 para columnas de envío en facturas

- Agregar campos de ubicación (ciudad, barrio)
- Agregar campos de envío (guia, transportadora, vendedor)
- Agregar campo de evidencia fotográfica
- Incluir índices para mejorar búsquedas
- Actualizar AutoPush.ps1 con nuevos archivos"

# 4. Subir a GitHub
git push origin feature/meta-ads-integration-v2

# 5. Verificar
git log --oneline -1
```

## Alternativa: Usar el script batch

Simplemente ejecuta:
```
SUBIR_GITHUB.bat
```

## Contenido del Script 043

El script agrega las siguientes columnas a la tabla `invoices`:

### Columnas de Ubicación:
- `ciudad` (TEXT) - Ciudad de entrega del pedido
- `barrio` (TEXT) - Barrio de entrega del pedido

### Columnas de Envío:
- `guia` (TEXT) - Número de guía de envío
- `transportadora` (TEXT) - Empresa transportadora
- `vendedor` (TEXT) - Vendedor que procesó la factura (default: 'Sistema')

### Columna de Evidencia:
- `evidencia` (TEXT) - URL de la evidencia fotográfica de entrega

### Índices Creados:
- `idx_invoices_ciudad` - Para búsquedas por ciudad
- `idx_invoices_guia` - Para búsquedas por guía
- `idx_invoices_transportadora` - Para búsquedas por transportadora

## Nota:
Este script debe ejecutarse en el editor SQL de Supabase, NO programáticamente.

