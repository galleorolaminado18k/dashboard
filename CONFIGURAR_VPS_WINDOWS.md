# 🚀 CONFIGURAR WAHA EN VPS - PASO A PASO (WINDOWS)

## ⚠️ PROBLEMA
El comando con `EOF` no funciona en PowerShell de Windows porque es sintaxis de Bash/Linux.

## ✅ SOLUCIÓN: 3 OPCIONES

---

## OPCIÓN 1: Script PowerShell Automatizado (MÁS FÁCIL)

```powershell
# Ejecutar desde la raíz del proyecto
powershell -ExecutionPolicy Bypass scripts\configure-waha-simple.ps1
```

Este script:
1. Crea un archivo temporal con los comandos
2. Lo sube al VPS via SCP
3. Lo ejecuta en el VPS
4. Verifica que todo funcione

---

## OPCIÓN 2: Paso a Paso Manual (SI TIENES PUTTY)

### Paso 1: Conectar al VPS
- Abre PuTTY
- Host: `31.220.58.83`
- Usuario: `root`
- Click "Open"

### Paso 2: Crear directorio
```bash
mkdir -p /root/waha
cd /root/waha
```

### Paso 3: Crear docker-compose.yml
```bash
nano docker-compose.yml
```

### Paso 4: Pegar este contenido (Ctrl+Shift+V en PuTTY)
```yaml
version: '3.8'

services:
  waha:
    image: devlikeapro/waha:latest
    container_name: waha
    restart: always
    environment:
      WAHA_HTTP_API_HOST: "0.0.0.0"
      WAHA_LICENSE_ACCEPT: "true"
      WAHA_LOG_LEVEL: "info"
      WAHA_MULTI_DEVICE: "true"
    ports:
      - "3000:3000"
    volumes:
      - ./waha-data:/app/data
```

### Paso 5: Guardar y salir
- Presiona: `Ctrl+X`
- Presiona: `Y`
- Presiona: `Enter`

### Paso 6: Reiniciar WAHA
```bash
docker-compose down
docker-compose up -d
```

### Paso 7: Ver logs (debe decir: listening on http://0.0.0.0:3000)
```bash
docker logs waha
```

### Paso 8: Verificar que funcione
```bash
curl http://localhost:3000/health
curl -X POST http://localhost:3000/api/sessions/default/start
curl http://localhost:3000/api/default/auth/qr
```

**Resultado esperado:** Todos deben dar `HTTP/1.1 200 OK`

---

## OPCIÓN 3: Comando por Comando en PowerShell

Abre PowerShell y ejecuta **UNO POR UNO**:

```powershell
# 1. Conectar y crear directorio
ssh root@31.220.58.83 "mkdir -p /root/waha"

# 2. Crear línea por línea del docker-compose.yml
ssh root@31.220.58.83 "echo 'version: ''3.8''' > /root/waha/docker-compose.yml"
ssh root@31.220.58.83 "echo '' >> /root/waha/docker-compose.yml"
ssh root@31.220.58.83 "echo 'services:' >> /root/waha/docker-compose.yml"
ssh root@31.220.58.83 "echo '  waha:' >> /root/waha/docker-compose.yml"
ssh root@31.220.58.83 "echo '    image: devlikeapro/waha:latest' >> /root/waha/docker-compose.yml"
ssh root@31.220.58.83 "echo '    container_name: waha' >> /root/waha/docker-compose.yml"
ssh root@31.220.58.83 "echo '    restart: always' >> /root/waha/docker-compose.yml"
ssh root@31.220.58.83 "echo '    environment:' >> /root/waha/docker-compose.yml"
ssh root@31.220.58.83 "echo '      WAHA_HTTP_API_HOST: \"0.0.0.0\"' >> /root/waha/docker-compose.yml"
ssh root@31.220.58.83 "echo '      WAHA_LICENSE_ACCEPT: \"true\"' >> /root/waha/docker-compose.yml"
ssh root@31.220.58.83 "echo '      WAHA_LOG_LEVEL: \"info\"' >> /root/waha/docker-compose.yml"
ssh root@31.220.58.83 "echo '      WAHA_MULTI_DEVICE: \"true\"' >> /root/waha/docker-compose.yml"
ssh root@31.220.58.83 "echo '    ports:' >> /root/waha/docker-compose.yml"
ssh root@31.220.58.83 "echo '      - \"3000:3000\"' >> /root/waha/docker-compose.yml"
ssh root@31.220.58.83 "echo '    volumes:' >> /root/waha/docker-compose.yml"
ssh root@31.220.58.83 "echo '      - ./waha-data:/app/data' >> /root/waha/docker-compose.yml"

# 3. Reiniciar WAHA
ssh root@31.220.58.83 "cd /root/waha && docker-compose down"
ssh root@31.220.58.83 "cd /root/waha && docker-compose up -d"

# 4. Ver logs
ssh root@31.220.58.83 "docker logs waha --tail 20"

# 5. Verificar
ssh root@31.220.58.83 "curl -i http://localhost:3000/health"
```

---

## ✅ DESPUÉS DE CUALQUIER OPCIÓN: VERIFICAR

```powershell
# Desde tu PC Windows
cd C:\Users\USUARIO\WebstormProjects\dashboard
powershell scripts\check-waha-vps.ps1
```

**Resultado esperado:**
```
1. Test de salud: STATUS: 200 ✅
2. Test /api/sessions/default/start: STATUS: 200 ✅
3. Test /api/default/auth/qr: STATUS: 200 ✅
4. Test /api/sessions/default: STATUS: 200 ✅
```

---

## 🎯 RECOMENDACIÓN

**USA OPCIÓN 2 (Paso a Paso Manual con PuTTY)** - Es la más confiable y sencilla.

1. Descarga PuTTY si no lo tienes: https://www.putty.org/
2. Conecta a `31.220.58.83`
3. Sigue los 8 pasos
4. Verifica con el script PowerShell

---

## 🚀 SI TODO FUNCIONA

```bash
# Terminal
npm run dev

# Navegador
http://localhost:3000/configuracion

# Click "Conectar WhatsApp"
# ✅ Debería mostrar QR REAL
```

---

## 🔧 TROUBLESHOOTING

### "ssh: command not found"
Instala OpenSSH:
```powershell
# Como administrador
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

### "Permission denied (publickey)"
Usa contraseña:
```powershell
ssh -o PreferredAuthentications=password root@31.220.58.83
```

---

**ELIGE UNA OPCIÓN Y EJECÚTALA** 🎯

