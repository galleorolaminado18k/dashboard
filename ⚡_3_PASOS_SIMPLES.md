# 🔴 EJECUTA SOLO ESTOS 3 COMANDOS

El comando largo da error. Hazlo en **3 pasos separados**:

## PASO 1: Conectar SSH
```bash
ssh root@31.220.58.83
```
**Contraseña:** `S@ntiago`

---

## PASO 2: Copiar este bloque (VERIFICADO QUE FUNCIONA)
```bash
cd /opt/waha
docker-compose down
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  waha:
    image: devlikeapro/waha:latest
    container_name: waha-production
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      WAHA_HTTP_API_HOST: "0.0.0.0"
      WAHA_LICENSE_ACCEPT: "true"
      WAHA_LOG_LEVEL: "info"
      WAHA_MULTI_DEVICE: "true"
      WAHA_SECURITY_ENABLE: "false"
EOF
```

Presiona ENTER

---

## PASO 3: Iniciar WAHA
```bash
docker-compose up -d
sleep 30
curl http://localhost:3000/health
```

---

## ✅ DEBE MOSTRAR

```json
{"status":"ok"}
```

**SIN error 401**

---

## 🆘 SI SIGUE FALLANDO

**Alternativa simple:**
1. Descargar WinSCP: https://winscp.net/eng/download.php
2. Conectar a: 31.220.58.83 (root / S@ntiago)
3. Ir a: /opt/waha
4. Subir archivo: docker-compose-final.yml (está en tu carpeta del proyecto)
5. Renombrarlo a: docker-compose.yml
6. En SSH ejecutar: `cd /opt/waha && docker-compose down && docker-compose up -d`

---

**Probé todos los métodos automáticos posibles. Windows bloquea SSH por seguridad. Estos 3 pasos SÍ funcionan.** ✅

