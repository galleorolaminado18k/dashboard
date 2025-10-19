# Configuración del Dashboard de Ventas

## Paso 1: Configurar Variables de Entorno

1. Copia el archivo `.env.local.example` a `.env.local`:
   \`\`\`bash
   cp .env.local.example .env.local
   \`\`\`

2. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)

3. En tu proyecto, ve a **Settings** → **API**

4. Copia los siguientes valores a tu archivo `.env.local`:
   - **URL**: Copia el valor de "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon key**: Copia el valor de "anon public" → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Paso 2: Crear las Tablas en Supabase

1. En el dashboard de v0, ve a la sección **Scripts** en el panel izquierdo

2. Ejecuta el script `001_create_sales_tables.sql` haciendo clic en el botón de ejecutar

3. Esto creará las tablas necesarias:
   - `sales` - Tabla principal de ventas
   - `return_tracking` - Tabla para tracking de devoluciones

## Paso 3: Reiniciar el Servidor

Después de configurar las variables de entorno, reinicia tu servidor de desarrollo para que los cambios surtan efecto.

## Verificación

Una vez configurado correctamente, deberías ver:
- Las tarjetas de estadísticas con valores numéricos (no "NaN")
- La tabla de ventas cargando correctamente
- Sin errores de conexión en la consola

## Solución de Problemas

### Error "Server Error - fetch to supabase.co failed"

**Causa**: Variables de entorno no configuradas o incorrectas

**Solución**:
1. Verifica que el archivo `.env.local` existe en la raíz del proyecto
2. Confirma que las variables tienen los valores correctos de tu proyecto Supabase
3. Reinicia el servidor de desarrollo

### Error "NaN" en las estadísticas

**Causa**: La base de datos no tiene tablas o no hay datos

**Solución**:
1. Ejecuta el script SQL `001_create_sales_tables.sql`
2. Verifica que las tablas se crearon correctamente en Supabase
3. Opcionalmente, agrega datos de prueba

### La base de datos no responde (Error 521)

**Causa**: El proyecto de Supabase está pausado o tiene problemas

**Solución**:
1. Ve a tu dashboard de Supabase
2. Verifica que el proyecto esté activo (no pausado)
3. Si está pausado, reactívalo
4. Los proyectos gratuitos se pausan después de 1 semana de inactividad
