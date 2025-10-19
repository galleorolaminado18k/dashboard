#!/usr/bin/env node
/**
 * next-fix-route-collisions.mjs
 *
 * Corrige colisiones de rutas en Next.js (App Router) causadas por
 * páginas duplicadas que resuelven al mismo path, por ejemplo:
 *  - app/(dashboard)/ventas/page.tsx
 *  - app/ventas/page.tsx
 *
 * Estrategia:
 *  - Escanea la carpeta `app/` buscando archivos `page.*` (ts, tsx, js, jsx).
 *  - Calcula la ruta "normalizada" (ignora segmentos de grupo: (foo)).
 *  - Si hay más de un `page.*` para la misma ruta, se prioriza el que está dentro
 *    de un route group (e.g. `(dashboard)`) y se renombra el duplicado raíz
 *    a `page.shadow.<ext>` para evitar la colisión.
 *  - No elimina nada. Es reversible.
 *
 * Seguro para CI: Si no existen colisiones no hace nada; si ya se
 * resolvieron anteriormente, detecta los `.shadow.` y no cambia nada.
 */
import fs from 'node:fs';
import path from 'node:path';

const APP_DIR = path.resolve('app');
const VALID_EXT = new Set(['.tsx', '.ts', '.jsx', '.js']);

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function walk(dir) {
  const out = [];
  if (!exists(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function isPageFile(file) {
  const bn = path.basename(file);
  const ext = path.extname(file);
  if (!VALID_EXT.has(ext)) return false;
  if (!/^page(\.shadow)?\.[tj]sx?$/.test(bn)) return false;
  // Ignorar API y non-app
  return file.includes(`${path.sep}app${path.sep}`);
}

// Normaliza el path público removiendo los grupos (segmentos entre paréntesis)
function routeFromFile(file) {
  // app/.../segment/page.tsx  ->  /segment
  const rel = path.relative(APP_DIR, path.dirname(file)); // sin "page.ext"
  const parts = rel.split(path.sep).filter(Boolean);
  const normalized = parts
    .filter(seg => !(seg.startsWith('(') && seg.endsWith(')'))) // quita groups
    .map(seg => seg) // futuro: manejar [id], [...slug], etc. si fuera necesario
    .join('/');
  return '/' + normalized; // / para raíz
}

function isInsideGroup(file) {
  const rel = path.relative(APP_DIR, path.dirname(file));
  return rel.split(path.sep).some(seg => seg.startsWith('(') && seg.endsWith(')'));
}

function main() {
  if (!exists(APP_DIR)) {
    console.log('[next-fix-route-collisions] No se encontró carpeta "app/". Nada que hacer.');
    return;
  }

  const files = walk(APP_DIR).filter(isPageFile);
  if (files.length === 0) {
    console.log('[next-fix-route-collisions] No se encontraron archivos page.*. Nada que hacer.');
    return;
  }

  // Agrupar por ruta pública
  const byRoute = new Map();
  for (const f of files) {
    const route = routeFromFile(f);
    if (!byRoute.has(route)) byRoute.set(route, []);
    byRoute.get(route).push(f);
  }

  const actions = [];
  for (const [route, list] of byRoute.entries()) {
    // Ignorar si solo hay uno
    if (list.length <= 1) continue;

    // Filtrar los que ya son .shadow.
    const nonShadow = list.filter(f => !path.basename(f).startsWith('page.shadow.'));
    if (nonShadow.length <= 1) continue; // ya resuelto

    // Preferir el que esté dentro de grupo
    const withGroup = nonShadow.filter(isInsideGroup);
    const withoutGroup = nonShadow.filter(f => !isInsideGroup(f));

    if (withGroup.length >= 1 && withoutGroup.length >= 1) {
      // Renombrar los "sin grupo" a page.shadow.ext
      for (const f of withoutGroup) {
        const dir = path.dirname(f);
        const ext = path.extname(f);
        const shadow = path.join(dir, `page.shadow${ext}`);
        if (!exists(shadow)) {
          fs.renameSync(f, shadow);
          actions.push(`rename: ${f} -> ${shadow}`);
        }
      }
    } else if (nonShadow.length > 1) {
      // Varios duplicados sin grupos; conservar el primero y sombreados los demás
      const [keep, ...rest] = nonShadow;
      for (const f of rest) {
        const dir = path.dirname(f);
        const ext = path.extname(f);
        const shadow = path.join(dir, `page.shadow${ext}`);
        if (!exists(shadow)) {
          fs.renameSync(f, shadow);
          actions.push(`rename: ${f} -> ${shadow}`);
        }
      }
    }
  }

  if (actions.length === 0) {
    console.log('[next-fix-route-collisions] OK: no se detectaron colisiones o ya están resueltas.');
  } else {
    console.log('[next-fix-route-collisions] Resultado:');
    for (const a of actions) console.log('  • ' + a);
    console.log('  (No se eliminó nada. Es reversible).');
  }
}

try {
  main();
} catch (err) {
  console.error('[next-fix-route-collisions] ERROR:', err?.message || err);
  // no botar el build: si algo falla, no impedir la instalación
  process.exit(0);
}
