# Configuración del Dashboard de Ventas

## Problema Actual

La aplicación muestra el error: **"Could not find the table 'public.sales' in the schema cache"**

Esto significa que las tablas de la base de datos no han sido creadas todavía.

## Solución: Crear las Tablas en Supabase

### Opción 1: Usando el SQL Editor de Supabase (Recomendado)

1. **Abre tu proyecto en Supabase Dashboard**
   - Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecciona tu proyecto

2. **Abre el SQL Editor**
   - En el menú lateral, haz clic en "SQL Editor"
   - Haz clic en "New query"

3. **Copia y pega el script SQL**
   - Abre el archivo `scripts/001_create_sales_tables.sql` en este proyecto
   - Copia todo su contenido
   - Pégalo en el editor SQL de Supabase

4. **Ejecuta el script**
   - Haz clic en el botón "Run" o presiona `Ctrl+Enter` (Windows/Linux) o `Cmd+Enter` (Mac)
   - Deberías ver un mensaje de éxito

5. **Verifica las tablas**
   - Ve a "Table Editor" en el menú lateral
   - Deberías ver las tablas `sales` y `return_tracking`

6. **Recarga la aplicación**
   - Vuelve a v0 y recarga la página de ventas
   - Los errores deberían desaparecer

### Opción 2: Usando Supabase CLI (Avanzado)

Si tienes Supabase CLI instalado:

\`\`\`bash
supabase db execute --file scripts/001_create_sales_tables.sql
\`\`\`

## Verificar Variables de Entorno

Asegúrate de que las siguientes variables estén configuradas en la sección **Vars** del sidebar:

- `NEXT_PUBLIC_SUPABASE_URL` - URL de tu proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clave anónima de Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Clave de servicio (para operaciones del servidor)

Estas variables deberían estar configuradas automáticamente si conectaste Supabase desde v0.

## Estructura de las Tablas

### Tabla `sales`
Almacena todas las ventas con información de:
- Cliente (nombre, teléfono, email)
- Productos (JSONB)
- Pago (método, total)
- Envío (transportadora, guía, código MiPaquete)
- Estado y devoluciones

### Tabla `return_tracking`
Rastrea el estado de las devoluciones usando códigos de MiPaquete.

## Próximos Pasos

Una vez creadas las tablas:

1. La página de ventas cargará correctamente
2. Podrás agregar ventas manualmente o importarlas
3. Las estadísticas se calcularán automáticamente
4. Podrás filtrar y exportar datos

## ¿Necesitas Ayuda?

Si sigues teniendo problemas:
- Verifica que las variables de entorno estén correctas
- Revisa los logs de Supabase para errores específicos
- Asegúrate de que tu plan de Supabase permita crear tablas
\`\`\`

\`\`\`typescriptreact file="" isHidden
