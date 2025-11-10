# 🚀 GUÍA: EJECUTAR EN VPS 31.220.58.83

## 📋 PRERREQUISITOS

- VPS: `31.220.58.83`
- Docker instalado
- Acceso SSH al VPS

---

## OPCIÓN 1: SETUP BÁSICO (SIN DOMINIO)

### Paso 1: Conectar al VPS
```bash
ssh root@31.220.58.83
```

### Paso 2: Detener WAHA antiguo (si existe)
```bash
docker rm -f waha
```

### Paso 3: Instalar Evolution API
```bash
docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e AUTHENTICATION_API_KEY= \
  atendai/evolution-api:latest
```

### Paso 4: Verificar que está corriendo
```bash
docker ps | grep evolution
docker logs evolution-api
curl http://localhost:8080/health
```

### Paso 5: Probar desde tu PC
```bash
curl -i http://31.220.58.83:8080/health
curl -i -X POST http://31.220.58.83:8080/sessions/start \
  -H "Content-Type: application/json" \
  -d '{"sessionName":"default","whatsappVersion":"v2"}'
```

### Paso 6: Configurar Vercel
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agregar:
   ```
   EVO_BASE_URL = http://31.220.58.83:8080
   ```
4. Redeploy

---

## OPCIÓN 2: SETUP CON DOMINIO HTTPS (RECOMENDADO)

### ¿Por qué usar dominio HTTPS?
- ✅ Vercel (HTTPS) puede llamar a tu API sin problemas de Mixed Content
- ✅ CORS automático
- ✅ SSL gratis con Caddy
- ✅ Más seguro y profesional

### Paso 1: Conectar al VPS
```bash
ssh root@31.220.58.83
```

### Paso 2: Crear directorio del proyecto
```bash
mkdir -p ~/evolution-https
cd ~/evolution-https
```

### Paso 3: Crear docker-compose.evolution-caddy.yml
```bash
cat > docker-compose.evolution-caddy.yml << 'EOF'
services:
  evolution:
    image: atendai/evolution-api:latest
    container_name: evolution-api
    restart: always
    volumes:
      - ./evolution-data:/evolution/store
    expose:
      - "8080"
    environment:
      - AUTHENTICATION_API_KEY=

  caddy:
    image: caddy:latest
    container_name: caddy-proxy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - evolution

volumes:
  caddy_data:
  caddy_config:
EOF
```

### Paso 4: Crear Caddyfile
```bash
cat > Caddyfile << 'EOF'
# Reemplaza con tu dominio real
whats.tudominio.com {
  reverse_proxy evolution:8080
  
  header {
    Access-Control-Allow-Origin *
    Access-Control-Allow-Methods "GET, POST, DELETE, OPTIONS"
    Access-Control-Allow-Headers "Content-Type, Authorization, apikey"
  }
}
EOF
```

**IMPORTANTE**: Edita el archivo y reemplaza `whats.tudominio.com` con tu dominio real:
```bash
nano Caddyfile
# Cambia: whats.tudominio.com por tu dominio real
# Ejemplo: whats.miempresa.com
# Ctrl+O para guardar, Ctrl+X para salir
```

### Paso 5: Configurar DNS
1. Ve a tu proveedor de dominio (GoDaddy, Namecheap, etc.)
2. Crea un registro A:
   - Tipo: `A`
   - Nombre: `whats` (o el subdominio que quieras)
   - Valor: `31.220.58.83`
   - TTL: `300` o `3600`
3. Espera 5-10 minutos para propagación

### Paso 6: Verificar DNS
```bash
# Desde tu PC o el VPS
dig whats.tudominio.com
# O con nslookup
nslookup whats.tudominio.com
```

### Paso 7: Detener servicios antiguos
```bash
docker rm -f waha evolution-api caddy-proxy 2>/dev/null || true
```

### Paso 8: Levantar servicios
```bash
docker compose -f docker-compose.evolution-caddy.yml up -d
```

### Paso 9: Verificar logs
```bash
docker logs evolution-api
docker logs caddy-proxy
```

### Paso 10: Probar desde tu PC
```bash
curl -i https://whats.tudominio.com/health
curl -i -X POST https://whats.tudominio.com/sessions/start \
  -H "Content-Type: application/json" \
  -d '{"sessionName":"default","whatsappVersion":"v2"}'
```

### Paso 11: Configurar Vercel
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agregar:
   ```
   EVO_BASE_URL = https://whats.tudominio.com
   ```
4. Redeploy

---

## 🔍 VERIFICACIÓN FINAL

### Desde el VPS:
```bash
# Ver contenedores corriendo
docker ps

# Deberías ver:
# - evolution-api (puerto 8080)
# - caddy-proxy (puertos 80, 443) <- solo si usaste OPCIÓN 2

# Ver logs en tiempo real
docker logs -f evolution-api

# Verificar health
curl http://localhost:8080/health
```

### Desde tu PC:
```bash
# OPCIÓN 1 (HTTP):
curl -i http://31.220.58.83:8080/health

# OPCIÓN 2 (HTTPS con dominio):
curl -i https://whats.tudominio.com/health
```

### En el Dashboard:
1. Ve a: `https://tu-dashboard.vercel.app/configuracion`
2. Ingresa número de WhatsApp: `3001234567`
3. Click en "Conectar WhatsApp"
4. ✅ Debe aparecer QR de WhatsApp Web
5. Escanea con tu WhatsApp Business
6. ✅ Estado debe cambiar a "Conectado"

---

## 🐛 TROUBLESHOOTING

### Error: "Connection refused"
```bash
# Verificar que el puerto esté abierto
sudo ufw status
sudo ufw allow 8080/tcp  # Para OPCIÓN 1
sudo ufw allow 80/tcp    # Para OPCIÓN 2
sudo ufw allow 443/tcp   # Para OPCIÓN 2

# O si usas iptables
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
```

### Error: "DNS not resolving" (OPCIÓN 2)
```bash
# Esperar más tiempo (hasta 24h en algunos casos)
# Verificar que el registro A esté correcto
dig whats.tudominio.com @8.8.8.8
```

### Error: Caddy no obtiene certificado SSL
```bash
# Ver logs detallados
docker logs caddy-proxy

# Verificar que el dominio apunte correctamente
curl -I http://whats.tudominio.com

# Reiniciar Caddy
docker restart caddy-proxy
```

### Ver todos los logs
```bash
# Evolution API
docker logs evolution-api --tail 100 -f

# Caddy (si usas OPCIÓN 2)
docker logs caddy-proxy --tail 100 -f
```

---

## 🔄 COMANDOS ÚTILES

### Reiniciar servicios
```bash
cd ~/evolution-https
docker compose -f docker-compose.evolution-caddy.yml restart
```

### Detener servicios
```bash
docker compose -f docker-compose.evolution-caddy.yml down
```

### Ver estado
```bash
docker compose -f docker-compose.evolution-caddy.yml ps
```

### Actualizar Evolution API
```bash
docker compose -f docker-compose.evolution-caddy.yml pull
docker compose -f docker-compose.evolution-caddy.yml up -d
```

### Backup de datos
```bash
tar -czf evolution-backup-$(date +%Y%m%d).tar.gz ~/evolution-https/evolution-data
```

---

## 📊 MONITOREO

### Ver uso de recursos
```bash
docker stats evolution-api caddy-proxy
```

### Ver espacio en disco
```bash
df -h
du -sh ~/evolution-https/evolution-data
```

---

## ✅ CHECKLIST FINAL

- [ ] VPS accesible por SSH
- [ ] Docker instalado y corriendo
- [ ] Evolution API levantado
- [ ] Health check responde OK
- [ ] (Opcional) Dominio apunta al VPS
- [ ] (Opcional) Caddy obtuvo certificado SSL
- [ ] Variable `EVO_BASE_URL` configurada en Vercel
- [ ] Redeploy ejecutado en Vercel
- [ ] QR aparece en el dashboard
- [ ] WhatsApp se conecta correctamente

---

## 🎉 ¡LISTO!

Ahora tienes Evolution API corriendo en tu VPS y conectado a tu dashboard en Vercel.

**Próximos pasos:**
1. Conectar WhatsApp Business
2. Configurar webhooks para mensajes entrantes
3. Automatizar notificaciones
4. Integrar con tu CRM

