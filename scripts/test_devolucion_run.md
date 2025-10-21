# Cómo ejecutar los tests de devolución (temporal y permanentes)

Recomendación: Ejecuta estos scripts en el SQL Editor de Supabase en un proyecto de desarrollo.

Archivos:
- `scripts/test_devolucion.sql` - pruebas defensivas que usan datos existentes (no crean nada nuevo).
- `scripts/test_devolucion_temp.sql` - crea una conversación temporal y la limpia; útil si no tienes datos de prueba.

Ejecutar (Supabase SQL Editor):
1. Abre tu proyecto en Supabase → SQL Editor.
2. Selecciona `scripts/test_devolucion_temp.sql` y ejecútalo (Run). Lee los mensajes NOTICE.
3. Luego ejecuta `scripts/test_devolucion.sql` para pruebas sobre datos reales.

Si prefieres usar `psql` local, asegúrate de tener `psql` en PATH y ejecuta:

```powershell
psql "postgresql://<user>:<password>@<host>:<port>/<database>?sslmode=require" -f scripts/test_devolucion_temp.sql
psql "postgresql://<user>:<password>@<host>:<port>/<database>?sslmode=require" -f scripts/test_devolucion.sql
```

Notas de limpieza:
- `test_devolucion_temp.sql` intenta borrar la conversación que crea; sin embargo, revisa manualmente la tabla `conversations` si deseas confirmar.
