#!/usr/bin/env node
/**
 * prefer-non-group-pages.mjs
 *
 * Objetivo: Mantener activas las páginas ubicadas fuera de route groups
 * (no envueltas en '(grupo)') cuando existan duplicados.
 *
 * No elimina nada. Solo RENOMBRA entre `page.tsx` <-> `page.shadow.tsx`
 * para que Next use la versión preferida. Es idempotente y seguro.
 */
import fs from 'node:fs'
import path from 'node:path'

const APP_DIR = path.resolve('app')
const VALID_EXT = new Set(['.tsx', '.ts', '.jsx', '.js'])

function exists(p) {
  try {
    fs.accessSync(p)
    return true
  } catch {
    return false
  }
}

function walk(dir) {
  const out = []
  if (!exists(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

function isPageFile(file) {
  const bn = path.basename(file)
  const ext = path.extname(file)
  if (!VALID_EXT.has(ext)) return false
  if (!/^page(\.shadow)?\.[tj]sx?$/.test(bn)) return false
  return file.includes(`${path.sep}app${path.sep}`)
}

function routeFromFile(file) {
  const rel = path.relative(APP_DIR, path.dirname(file))
  const parts = rel.split(path.sep).filter(Boolean)
  const normalized = parts
    .filter((seg) => !(seg.startsWith('(') && seg.endsWith(')')))
    .join('/')
  return '/' + normalized
}

function isInsideGroup(file) {
  const rel = path.relative(APP_DIR, path.dirname(file))
  return rel.split(path.sep).some((seg) => seg.startsWith('(') && seg.endsWith(')'))
}

function renameSafe(from, to) {
  if (from === to) return false
  if (!exists(from)) return false
  if (exists(to)) return false
  fs.renameSync(from, to)
  return true
}

function main() {
  const files = walk(APP_DIR).filter(isPageFile)
  if (files.length === 0) {
    console.log('[prefer-non-group-pages] No hay page.*. Nada que hacer.')
    return
  }

  const byRoute = new Map()
  for (const f of files) {
    const route = routeFromFile(f)
    if (!byRoute.has(route)) byRoute.set(route, [])
    byRoute.get(route).push(f)
  }

  const actions = []

  for (const [route, list] of byRoute.entries()) {
    if (list.length <= 1) continue

    // Encontrar candidatos dentro y fuera de grupos
    const nonGroup = list.filter((f) => !isInsideGroup(f))
    const inGroup = list.filter((f) => isInsideGroup(f))

    if (nonGroup.length === 0 || inGroup.length === 0) continue

    // Preferimos la versión fuera de grupos como page.ext
    // 1) Si nonGroup tiene page.shadow.* => promover a page.*
    for (const f of nonGroup) {
      const dir = path.dirname(f)
      const ext = path.extname(f)
      const base = path.basename(f)
      if (base.startsWith('page.shadow')) {
        const target = path.join(dir, `page${ext}`)
        if (renameSafe(f, target)) actions.push(`promote: ${f} -> ${target}`)
      }
    }

    // 2) Si inGroup tiene page.* y existe (o existirá tras promover) nonGroup page.* => sombrear el inGroup
    const willHaveNonGroupPage =
      nonGroup.some((f) => path.basename(f).startsWith('page.')) ||
      nonGroup.some((f) => path.basename(f).startsWith('page.shadow'))

    if (willHaveNonGroupPage) {
      for (const f of inGroup) {
        const dir = path.dirname(f)
        const ext = path.extname(f)
        const base = path.basename(f)
        if (base.startsWith('page.') && !base.startsWith('page.shadow')) {
          const target = path.join(dir, `page.shadow${ext}`)
          if (renameSafe(f, target)) actions.push(`shadow: ${f} -> ${target}`)
        }
      }
    }
  }

  if (actions.length === 0) {
    console.log('[prefer-non-group-pages] OK: nada que cambiar.')
  } else {
    console.log('[prefer-non-group-pages] Resultado:')
    for (const a of actions) console.log('  • ' + a)
  }
}

try {
  main()
} catch (err) {
  console.error('[prefer-non-group-pages] ERROR:', err?.message || err)
  process.exit(0)
}
