# Cómo ejecutar las pruebas de `devolucion`

Archivos:
- `scripts/test_devolucion.sql`: script que ejecuta tres pruebas automáticas (regla de transición, transición válida, marcar producto como devuelto).

Recomendación: ejecutar en el SQL Editor de Supabase en el proyecto de desarrollo (NO en producción sin respaldo).

Pasos (Supabase SQL editor):
1. Abrir el proyecto en Supabase.
2. Ir a SQL Editor → New query.
3. Pegar el contenido de `scripts/test_devolucion.sql` o subir el archivo.
4. Ejecutar (Run). Verás mensajes NOTICE con el resultado de cada test.

Alternativa (psql local):
1. Instalar psql (Postgres client) si no lo tienes (winget o choco en Windows):
   - winget: `winget install -e --id PostgreSQL.PostgreSQL`
   - choco: `choco install postgresql`
2. Ejecutar:
   ```powershell
   psql "postgresql://<user>:<password>@<host>:<port>/<database>?sslmode=require" -f scripts/test_devolucion.sql
   ```

Caveats:
- El script es defensivo: no creará conversaciones ni purchases de prueba si no existen (salvo que realices inserts manuales antes).
- Si quieres pruebas que creen y limpien datos automáticamente, pídemelo y genero una versión que use tablas temporales.

Si quieres, genero también `scripts/test_devolucion_temp.sql` que crea datos temporales, ejecuta las pruebas y los borra al final.
