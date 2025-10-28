# 🚀 Auto-Push a GitHub - Configuración Completa

## ✅ Scripts Creados

Se han creado múltiples scripts para automatizar la subida de cambios a GitHub:

### 📁 Archivos Creados:

1. **`scripts/auto-commit.ps1`** - Script de PowerShell
2. **`scripts/auto-commit.bat`** - Script de CMD
3. **`.git/hooks/post-commit`** - Git Hook automático
4. **Scripts npm** en `package.json`

---

## 🎯 Opciones de Uso

### Opción 1: Comando NPM (Recomendado)

Ejecuta en cualquier momento para subir todos los cambios:

```bash
pnpm run git:auto
```

O la versión corta:

```bash
pnpm run git:push
```

### Opción 2: Script de PowerShell

Doble click en el archivo o ejecutar:

```powershell
.\scripts\auto-commit.ps1
```

### Opción 3: Script BAT (CMD)

Doble click en:

```
scripts\auto-commit.bat
```

### Opción 4: Git Hook Automático (Avanzado)

**Para activar push automático después de CADA commit:**

1. Ir a la carpeta:
   ```
   .git\hooks\
   ```

2. Renombrar archivo:
   ```
   post-commit.sample → post-commit
   ```

3. Darle permisos de ejecución (si estás en Git Bash):
   ```bash
   chmod +x .git/hooks/post-commit
   ```

**Resultado**: Cada vez que hagas `git commit`, se subirá automáticamente a GitHub.

---

## 🔧 Configuración Automática del Hook

Para activar el hook automáticamente, ejecuta:

```bash
# PowerShell
Copy-Item .git\hooks\post-commit.sample .git\hooks\post-commit -Force

# Git Bash
cp .git/hooks/post-commit.sample .git/hooks/post-commit
chmod +x .git/hooks/post-commit
```

---

## 📋 Flujo de Trabajo Recomendado

### Sin Hook Automático:

```bash
# 1. Hacer cambios en el código
# 2. Cuando quieras subir todo:
pnpm run git:auto
```

### Con Hook Automático:

```bash
# 1. Hacer cambios en el código
# 2. Hacer commit normalmente:
git add .
git commit -m "Tu mensaje"
# 3. ¡Se sube automáticamente a GitHub! 🚀
```

---

## ✅ Verificación

Para verificar que el hook está activo:

```bash
# Ver archivos en la carpeta hooks
dir .git\hooks\

# Debe existir un archivo llamado "post-commit" (sin extensión)
```

---

## 🎨 Lo Que Hace Cada Script

### `auto-commit.ps1` / `auto-commit.bat`:

```
1. Detecta si hay cambios
2. Hace `git add .`
3. Crea commit con timestamp: "Auto-commit: Actualización automática - 2025-10-27 14:30:00"
4. Hace `git push origin <rama-actual>`
5. Muestra mensaje de éxito
```

### `post-commit` hook:

```
1. Se ejecuta DESPUÉS de cada `git commit`
2. Detecta la rama actual
3. Hace `git push origin <rama-actual>`
4. Muestra mensaje de éxito/error
```

### Scripts npm:

```bash
pnpm run git:auto   # Ejecuta el script de PowerShell
pnpm run git:push   # Versión simple con comandos inline
```

---

## 🚨 Notas Importantes

### ⚠️ Cuidado con el Hook Automático

**El hook `post-commit` subirá CADA commit automáticamente.**

- ✅ Ventaja: No te olvidas de hacer push
- ⚠️ Desventaja: No puedes hacer commits locales sin subirlos

**Recomendación**: 
- Si trabajas solo: **Activa el hook**
- Si trabajas en equipo: **Usa los scripts manuales** (`pnpm run git:auto`)

### 🔐 Autenticación

Asegúrate de tener configurada la autenticación de GitHub:

```bash
# Verificar configuración
git config --list | grep user

# Si usas HTTPS, configura credenciales:
git config --global credential.helper manager-core

# Si usas SSH, verifica tu clave:
ssh -T git@github.com
```

### 🌿 Ramas

Los scripts detectan automáticamente la rama actual y suben a esa rama:

```bash
# Si estás en: feature/meta-ads-integration-v2
# Se subirá a: origin/feature/meta-ads-integration-v2
```

---

## 🎯 Ejemplo de Uso Completo

### Flujo Manual (Sin Hook):

```bash
# 1. Trabajas en tu código...
# 2. Guardas cambios en VSCode
# 3. Ejecutas:
pnpm run git:auto

# Salida:
# 🔍 Verificando cambios en el repositorio...
# 📝 Cambios detectados. Procesando...
# ✅ Archivos agregados al staging area
# ✅ Commit creado: Auto-commit: Actualización automática - 2025-10-27 14:30:00
# 🚀 Cambios subidos a GitHub en la rama: feature/meta-ads-integration-v2
# ✨ ¡Todo sincronizado exitosamente!
```

### Flujo Automático (Con Hook):

```bash
# 1. Trabajas en tu código...
# 2. Haces commit:
git add .
git commit -m "feat: nueva funcionalidad"

# Salida:
# [feature/meta-ads-integration-v2 a1b2c3d] feat: nueva funcionalidad
# 🚀 Auto-push habilitado. Subiendo cambios a GitHub...
# ✅ Cambios subidos exitosamente a GitHub en la rama: feature/meta-ads-integration-v2
```

---

## 🛠️ Desactivar Auto-Push

Si quieres desactivar el hook automático:

```bash
# Renombrar el archivo
ren .git\hooks\post-commit .git\hooks\post-commit.disabled

# O eliminar
del .git\hooks\post-commit
```

---

## ✅ Estado Actual

**Configuración aplicada**:
- ✅ Scripts creados en `scripts/`
- ✅ Hook de ejemplo creado en `.git/hooks/`
- ✅ Comandos npm agregados a `package.json`

**Para activar hook automático**:
- ⚠️ Renombrar `post-commit.sample` → `post-commit`

**Comando rápido recomendado**:
```bash
pnpm run git:auto
```

---

## 📚 Resumen de Comandos

| Comando | Descripción |
|---------|-------------|
| `pnpm run git:auto` | Subir todo automáticamente (PowerShell) |
| `pnpm run git:push` | Subir todo (versión simple) |
| `.\scripts\auto-commit.ps1` | Ejecutar script de PowerShell directamente |
| `.\scripts\auto-commit.bat` | Ejecutar script BAT directamente |

---

¡Ahora tus cambios se pueden subir automáticamente a GitHub con un solo comando! 🚀

