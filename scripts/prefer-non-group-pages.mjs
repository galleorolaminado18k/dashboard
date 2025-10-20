#!/usr/bin/env node
/**
 * prefer-non-group-pages.mjs
 * Mantiene activas las páginas fuera de route groups cuando hay duplicadas.
 * No elimina archivos; solo renombra `page.tsx` <-> `page.shadow.tsx`.
 */
import fs from 'node:fs'
import path from 'node:path'

const APP_DIR = path.resolve('app')
const VALID_EXT = new Set(['.tsx', '.ts', '.jsx', '.js'])

function exists(p){ try{ fs.accessSync(p); return true } catch { return false } }
function walk(d){ if(!exists(d)) return []; return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]) }
function isPage(f){ const bn=path.basename(f), ext=path.extname(f); return VALID_EXT.has(ext)&&/^page(\.shadow)?\.[tj]sx?$/.test(bn)&&f.includes(`${path.sep}app${path.sep}`) }
function routeFrom(f){ const rel=path.relative(APP_DIR,path.dirname(f)); const parts=rel.split(path.sep).filter(Boolean); const norm=parts.filter(s=>!(s.startsWith('(')&&s.endsWith(')'))).join('/'); return '/'+norm }
function inGroup(f){ const rel=path.relative(APP_DIR,path.dirname(f)); return rel.split(path.sep).some(s=>s.startsWith('(')&&s.endsWith(')')) }
function mv(from,to){ if(from===to||!exists(from)||exists(to)) return false; fs.renameSync(from,to); return true }

const files = walk(APP_DIR).filter(isPage)
if (files.length === 0) { console.log('[prefer-non-group-pages] No hay page.*'); process.exit(0) }

const byRoute = new Map()
for (const f of files){ const r=routeFrom(f); if(!byRoute.has(r)) byRoute.set(r,[]); byRoute.get(r).push(f) }

const acts=[]
const preferGroupRoutes = new Set(["/publicidad"]) // En estas rutas, priorizar layout del grupo (sidebar)
for (const [route,list] of byRoute){ if(list.length<=1) continue
  const nonGroup=list.filter(f=>!inGroup(f))
  const inGrp=list.filter(inGroup)
  if(nonGroup.length===0||inGrp.length===0) continue

  if (preferGroupRoutes.has(route)) {
    // 1) Promover page.shadow.* dentro del grupo a page.*
    for(const f of inGrp){ const ext=path.extname(f), bn=path.basename(f); if(bn.startsWith('page.shadow')){ const t=path.join(path.dirname(f),`page${ext}`); if(mv(f,t)) acts.push(`promote(group): ${f} -> ${t}`) } }
    // 2) Sombrear page.* fuera del grupo
    for(const f of nonGroup){ const ext=path.extname(f), bn=path.basename(f); if(bn.startsWith('page.') && !bn.startsWith('page.shadow')){ const t=path.join(path.dirname(f),`page.shadow${ext}`); if(mv(f,t)) acts.push(`shadow(root): ${f} -> ${t}`) } }
    continue
  }

  // Por defecto: preferir fuera de grupos
  for(const f of nonGroup){ const ext=path.extname(f), bn=path.basename(f); if(bn.startsWith('page.shadow')){ const t=path.join(path.dirname(f),`page${ext}`); if(mv(f,t)) acts.push(`promote: ${f} -> ${t}`) } }

  const willHaveNonGroup = nonGroup.some(f=>/^page(\.shadow)?\./.test(path.basename(f)))
  if(willHaveNonGroup){ for(const f of inGrp){ const ext=path.extname(f), bn=path.basename(f); if(bn.startsWith('page.') && !bn.startsWith('page.shadow')){ const t=path.join(path.dirname(f),`page.shadow${ext}`); if(mv(f,t)) acts.push(`shadow: ${f} -> ${t}`) } } }
}

if(acts.length===0) console.log('[prefer-non-group-pages] OK: nada que cambiar.')
else { console.log('[prefer-non-group-pages] Resultado:'); for(const a of acts) console.log('  • '+a) }

