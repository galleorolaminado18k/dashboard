# ✅ Migración Completada: WAHA → Evolution API

## 🎉 ¿Qué cambió?

- ✅ **Evolution API** reemplaza completamente a WAHA
- ✅ QR **REAL** de WhatsApp Web
- ✅ API más estable y moderna
- ✅ Compatible con Vercel (HTTPS requerido)
- ✅ Documentación más completa

---

## 📂 Archivos Nuevos

### Docker:
- `docker-compose.evolution.yml` - Para desarrollo local
- `docker-compose.evolution-caddy.yml` - Para producción con HTTPS
- `Caddyfile` - Configuración de Caddy (reverse proxy)

### API:
- `app/api/whatsapp/evolution/route.ts` - Nuevo endpoint para Evolution API

### Documentación:
- `MIGRACION_EVOLUTION_API.md` - Guía completa de migración
- `INSTALAR_EVOLUTION_VPS.md` - Instalación rápida en VPS
- `install-evolution-vps.sh` - Script automático de instalación

---

## 📝 Archivos Modificados

- `.env.local` - Ahora usa `EVO_BASE_URL`
- `.env.production.example` - Variable actualizada
- `app/(dashboard)/configuracion/page.tsx` - UI actualizada para Evolution API

---

## 🚀 Próximos Pasos

### 1. **VPS** - Instalar Evolution API

Opción A - Comando único:
```bash
cd ~ && \
docker rm -f waha evolution-api 2>/dev/null || true && \
ufw allow 8080/tcp 2>/dev/null || true && \
mkdir -p ~/evolution && cd ~/evolution && \
docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v $PWD/evolution-data:/evolution/store \
  atendai/evolution-api:latest && \
sleep 10 && \
curl -s http://localhost:8080/health && \
echo "✅ Instalado! IP: $(curl -s ifconfig.me)"
```

Opción B - Con script:
```bash
# En tu VPS
curl -fsSL https://raw.githubusercontent.com/TU_USUARIO/dashboard/main/install-evolution-vps.sh | bash
```

### 2. **Vercel** - Configurar Variable

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Settings → Environment Variables
4. Agrega:
   ```
   EVO_BASE_URL = http://TU_IP:8080
   ```
   O con dominio:
   ```
   EVO_BASE_URL = https://whats.tudominio.com
   ```
5. **Redeploy**

### 3. **Dashboard** - Conectar WhatsApp

1. Abre: `https://tu-dashboard.vercel.app/configuracion`
2. Pestaña: **CRM & WhatsApp**
3. Ingresa tu número de WhatsApp Business
4. Click: **Conectar WhatsApp**
5. Escanea el QR REAL con tu WhatsApp

---

## 🧪 Verificación

### Local:
```bash
# Ver contenedores
docker ps

# Health check
curl http://localhost:8080/health

# Ver logs
docker logs evolution-api -f
```

### VPS:
```bash
# Health check remoto
curl http://TU_IP:8080/health

# Ver logs
ssh user@TU_IP
docker logs evolution-api -f
```

### Vercel:
- Ve a: Deployments → Functions → Logs
- Busca: `[EVOLUTION]` en los logs

---

## 📚 Documentación

Lee la guía completa en: [`MIGRACION_EVOLUTION_API.md`](./MIGRACION_EVOLUTION_API.md)

---

## 🐛 Troubleshooting

### Error: "EVO_UNREACHABLE"
```bash
# Verificar que Evolution esté corriendo
docker ps | grep evolution

# Revisar logs
docker logs evolution-api --tail 50

# Reiniciar
docker restart evolution-api
```

### Error: "CORS" en Vercel
- **Problema**: Vercel (HTTPS) no puede llamar a HTTP
- **Solución**: Usa Caddy para tener HTTPS o despliega en Railway/Render

### Puerto 8080 bloqueado
```bash
ufw allow 8080/tcp
ufw reload
ufw status
```

---

## ✅ Checklist Final

- [ ] Evolution API corriendo en VPS: `docker ps`
- [ ] Health check OK: `curl http://TU_IP:8080/health`
- [ ] Variable `EVO_BASE_URL` configurada en Vercel
- [ ] Dashboard redesplegado
- [ ] WhatsApp conectado exitosamente

---

## 🎯 Resultado Esperado

- ✅ Dashboard en Vercel funcionando
- ✅ Evolution API en VPS respondiendo
- ✅ WhatsApp conectado y recibiendo QR real
- ✅ Sesión persistente (sobrevive reinicios)

---

## 📞 Soporte

- [Evolution API - GitHub](https://github.com/EvolutionAPI/evolution-api)
- [Documentación Official](https://doc.evolution-api.com/)
- Issues: Abre un issue en el repo

---

**¡Migración completada exitosamente!** 🎉

