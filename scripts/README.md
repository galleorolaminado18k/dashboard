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

Notas:
- Ambos scripts hacen `git add -A`, `git commit -m` y `git push origin <branch actual>`.
- Asegúrate de tener configurado `git` y credenciales (SSH agent o credenciales HTTPS) antes de usar.
- No incluyas secrets ni keys en los mensajes. Si necesitas añadir un secret a Vercel/GitHub Actions, hazlo desde su UI de configuración.

Seguridad:
- No automatizar push de secretos. Si quieres un flujo CI/CD, configura los secrets en la plataforma (Vercel/GitHub Actions) y evita ponerlos en archivos del repo.

