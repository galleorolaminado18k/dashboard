# ⚡ Instalación Rápida - Evolution API en VPS

## 🚀 Comando Único (Copy-Paste en tu VPS)

```bash
cd ~ && \
curl -fsSL https://raw.githubusercontent.com/EvolutionAPI/evolution-api/main/Docker/docker-compose.yaml -o docker-compose.yml 2>/dev/null || true && \
docker rm -f waha evolution-api 2>/dev/null || true && \
ufw allow 8080/tcp 2>/dev/null || true && \
mkdir -p ~/evolution && cd ~/evolution && \
docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v $PWD/evolution-data:/evolution/store \
  atendai/evolution-api:latest && \
sleep 10 && \
echo "🧪 Verificando..." && \
curl -s http://localhost:8080/health && \
echo "" && \
echo "✅ Instalado! IP: $(curl -s ifconfig.me)" && \
echo "📝 Configura en Vercel → EVO_BASE_URL=http://$(curl -s ifconfig.me):8080"
```

---

## 📋 ¿Qué hace este comando?

1. ✅ Detiene WAHA antiguo (si existe)
2. ✅ Abre puerto 8080 en firewall
3. ✅ Instala Evolution API con Docker
4. ✅ Verifica que funcione
5. ✅ Te da la URL para configurar en Vercel

---

## 🔐 HTTPS con Dominio (Opcional)

Si tienes un dominio (ej: `whats.tudominio.com`):

### 1. Configurar DNS:
- Tipo: `A`
- Nombre: `whats`
- Valor: `TU_IP_VPS`
- TTL: `3600`

### 2. Descargar archivos de configuración:

```bash
cd ~/evolution

# Descargar docker-compose con Caddy
curl -fsSL https://raw.githubusercontent.com/TU_USUARIO/dashboard/main/docker-compose.evolution-caddy.yml -o docker-compose.yml

# Descargar Caddyfile
curl -fsSL https://raw.githubusercontent.com/TU_USUARIO/dashboard/main/Caddyfile -o Caddyfile

# Editar con tu dominio
nano Caddyfile
# Reemplaza: whats.tudominio.com → tu dominio real

# Iniciar
docker compose up -d

# Verificar
curl https://whats.tudominio.com/health
```

### 3. Configurar en Vercel:
```env
EVO_BASE_URL=https://whats.tudominio.com
```

---

## 🧪 Verificar Instalación

```bash
# Ver logs
docker logs evolution-api -f

# Health check
curl http://localhost:8080/health
# Debe responder: {"status":"ok"}

# Ver contenedores corriendo
docker ps
```

---

## 🐛 Troubleshooting

### Evolution no inicia:
```bash
docker logs evolution-api --tail 50
docker restart evolution-api
```

### Puerto bloqueado:
```bash
ufw status
ufw allow 8080/tcp
ufw reload
```

### Ver procesos en puerto 8080:
```bash
netstat -tulpn | grep 8080
# O
lsof -i :8080
```

---

## 📱 Conectar WhatsApp desde Dashboard

1. Ve a: `https://tu-dashboard.vercel.app/configuracion`
2. Pestaña: **CRM & WhatsApp**
3. Ingresa tu número (sin +57)
4. Click: **Conectar WhatsApp**
5. Escanea el QR con WhatsApp Business

---

## 🔄 Comandos Útiles

```bash
# Ver logs en vivo
docker logs evolution-api -f

# Reiniciar
docker restart evolution-api

# Detener
docker stop evolution-api

# Eliminar (con datos)
docker rm -f evolution-api
rm -rf ~/evolution/evolution-data

# Ver estado
docker ps | grep evolution

# Health check remoto
curl http://TU_IP:8080/health
```

---

## 📚 Recursos

- [Evolution API - GitHub](https://github.com/EvolutionAPI/evolution-api)
- [Documentación Oficial](https://doc.evolution-api.com/)

---

## ✅ Checklist

- [ ] Evolution API corriendo: `docker ps`
- [ ] Health check OK: `curl http://localhost:8080/health`
- [ ] Variable `EVO_BASE_URL` configurada en Vercel
- [ ] Dashboard redesplegado en Vercel
- [ ] WhatsApp conectado desde `/configuracion`

---

**¿Todo listo?** 🎉 Ahora puedes conectar WhatsApp desde tu dashboard!

