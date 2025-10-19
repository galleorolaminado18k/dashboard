# Vercel Route Collision Fix (Bundle)

Este paquete incluye:
- `package.json` con `"postinstall": "node scripts/next-fix-route-collisions.mjs"`
- `scripts/next-fix-route-collisions.mjs` que corrige colisiones de rutas en Next.js sin borrar nada.

## Uso
1. Copia el contenido de esta carpeta **en la raíz de tu proyecto** (donde está tu `package.json`).
2. Si ya tenías un `package.json`, fusiona el bloque `"scripts"` agregando el `postinstall`.
3. Despliega en Vercel como siempre.

El script:
- Busca `app/**/page.*` (ts, tsx, js, jsx)
- Calcula la ruta normalizada (ignora segmentos como `(dashboard)`).
- Si hay duplicados para el mismo path, renombra los `page.*` que chocan a `page.shadow.*`.
- Nunca elimina archivos y es reversible.
