# Scripts para commit & push

Archivos:
- `git-commit-and-push.bat` - Script para Windows (cmd.exe). Uso desde la raíz del repo:
  ```bat
  scripts\git-commit-and-push.bat "mensaje de commit opcional"
  ```

- `git-commit-and-push.ps1` - Script para PowerShell. Uso desde la raíz del repo:
  ```powershell
  .\scripts\git-commit-and-push.ps1 -Message "mensaje de commit"
  ```

Nuevos scripts de diagnóstico WAHA (para VPS / servidores)
- `waha-diagnose.sh` - Script bash para ejecutar en el VPS (Linux). Ejecuta checks: docker ps, logs, health, sessions, start, qr.
  Uso ejemplo (en VPS):
  ```bash
  # hazlo ejecutable la primera vez
  chmod +x scripts/waha-diagnose.sh
  # ejecutar con URL y opcional API key
  ./scripts/waha-diagnose.sh https://wpp.galle18k.com bb841979e8b66e6a0f563235b5df3d9a
  ```

- `waha-diagnose.ps1` - Script PowerShell para ejecutar en Windows (o PowerShell en VPS):
  ```powershell
  .\scripts\waha-diagnose.ps1 -WahaUrl https://wpp.galle18k.com -ApiKey bb841979e8b66e6a0f563235b5df3d9a
  ```

Qué verifican los scripts
- Detectan contenedores Docker con nombres típicos (waha, waha-api, waha-whatsapp) y muestran últimos logs.
- Ejecutan requests a:
  - `GET /health`
  - `GET /api/server/version`
  - `GET /api/sessions`
  - `GET /api/sessions/default`
  - `POST /api/sessions/default/start`
  - `GET /api/sessions/default/auth/qr`
- Añaden headers `X-Api-Key` si pasas `WAHA_API_KEY` para diagnosticar errores 401/403.

Notas y recomendaciones
- Ejecuta estos scripts en el VPS donde corre WAHA para un diagnóstico completo.
- Después de ejecutar, pega la salida aquí y podré analizarla línea por línea y proponer la siguiente acción (p. ej. regenerar API key, ajustar Caddy/Nginx o actualizar WAHA_BASE_URL en Vercel).
- Asegúrate de no publicar la API Key en público — si la pegas aquí, revísala y luego regenera la key en el VPS.

Seguridad
- Estos scripts muestran logs y variables de entorno; trátalos con cuidado en entornos compartidos.
- No subas `.env` con credenciales a GitHub. Usa las variables de entorno en Vercel y tu VPS.
