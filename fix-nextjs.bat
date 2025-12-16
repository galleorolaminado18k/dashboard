@echo off
cd /d C:\Users\USUARIO\WebstormProjects\dashboard

echo === Eliminando lockfile viejo ===
del pnpm-lock.yaml 2>nul

echo === Instalando dependencias con Next.js actualizado ===
call pnpm install --no-frozen-lockfile

echo === Agregando cambios a git ===
git add -A

echo === Haciendo commit ===
git commit -m "fix: Regenerar lockfile con Next.js 15.3.4+ para CVE-2025-66478"

echo === Subiendo a GitHub ===
git push origin feature/meta-ads-integration-v2

echo === Completado ===
pause

