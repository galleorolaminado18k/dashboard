# ✅ MIGRACIÓN COMPLETADA - Evolution API en VPS

## 🎉 Estado: FUNCIONANDO

**Fecha:** 2025-11-09  
**VPS:** 31.220.58.83  
**Puerto:** 8080  
**URL:** http://31.220.58.83:8080

---

## ✅ Servicios Instalados en VPS

### 1. PostgreSQL (Base de Datos)
- **Contenedor:** `evolution-postgres`
- **Puerto interno:** 5432
- **Base de datos:** `evolution`
- **Usuario:** `evolution`
- **Password:** `evolution_pass_2024`
- **Volumen persistente:** `postgres_data`

### 2. Evolution API
- **Contenedor:** `evolution-api`
- **Puerto público:** 8080
- **Versión:** v2.2.3
- **Estado:** ✅ WORKING
- **Respuesta:** "Welcome to the Evolution API, it is working!"

---

## 🔗 URLs y Endpoints

### Principal
```
http://31.220.58.83:8080
```

### Endpoints Evolution API
```bash
# Bienvenida/Status
GET http://31.220.58.83:8080/

# Crear/iniciar sesión
POST http://31.220.58.83:8080/sessions/start

# Obtener QR
GET http://31.220.58.83:8080/sessions/default/qrcode

# Estado de sesión
GET http://31.220.58.83:8080/sessions/default/status

# Manager (UI web)
http://31.220.58.83:8080/manager
```

---

## 📂 Archivos en VPS

### Ubicación
```
/root/evolution/
```

### Contenido
```
/root/evolution/
├── docker-compose.yml          # Configuración de servicios
└── evolution-data/             # Datos persistentes de sesiones
```

---

## 🐳 Comandos Útiles en VPS

### Ver logs
```bash
ssh root@31.220.58.83
docker logs evolution-api -f
docker logs evolution-postgres -f
```

### Estado de contenedores
```bash
ssh root@31.220.58.83 "docker ps"
```

### Reiniciar servicios
```bash
ssh root@31.220.58.83 "cd /root/evolution && docker-compose restart"
```

### Detener servicios
```bash
ssh root@31.220.58.83 "cd /root/evolution && docker-compose down"
```

### Iniciar servicios
```bash
ssh root@31.220.58.83 "cd /root/evolution && docker-compose up -d"
```

---

## ⚙️ Configuración Local

### .env.local
```env
EVO_BASE_URL=http://31.220.58.83:8080
```

### Archivos creados
- ✅ `docker-compose.evolution.yml` - Para desarrollo local
- ✅ `docker-compose.evolution-caddy.yml` - Para HTTPS con Caddy
- ✅ `docker-compose.evolution-vps.yml` - Usado en VPS (con PostgreSQL)
- ✅ `app/api/whatsapp/evolution/route.ts` - Nuevo endpoint API
- ✅ `Caddyfile` - Configuración de reverse proxy
- ✅ Documentación completa en `MIGRACION_EVOLUTION_API.md`

---

## 🚀 Próximos Pasos

### 1. Probar en Dashboard Local

```bash
# Iniciar dashboard
npm run dev

# Abrir navegador
http://localhost:3000/configuracion
```

1. Ve a pestaña **CRM & WhatsApp**
2. Ingresa tu número de WhatsApp Business
3. Click en **Conectar WhatsApp**
4. Escanea el QR con tu teléfono

### 2. Configurar en Vercel

1. Ve a: https://vercel.com (tu proyecto)
2. Settings → Environment Variables
3. Agrega/actualiza:
   ```
   EVO_BASE_URL = http://31.220.58.83:8080
   ```
4. Save
5. Redeploy

### 3. (Opcional) Configurar HTTPS

Si tienes un dominio (ej: `whats.tudominio.com`):

```bash
# 1. Configurar DNS A record
whats.tudominio.com → 31.220.58.83

# 2. En VPS, usar docker-compose con Caddy
ssh root@31.220.58.83
cd /root/evolution
docker-compose down

# Copiar Caddyfile y docker-compose con Caddy
# Luego:
docker-compose up -d

# 3. En Vercel
EVO_BASE_URL=https://whats.tudominio.com
```

---

## ✅ Verificación Final

### VPS
```bash
# Health check
curl http://31.220.58.83:8080/

# Debe responder:
# {"status":200,"message":"Welcome to the Evolution API, it is working!","version":"2.2.3"...}
```

### Contenedores corriendo
```bash
ssh root@31.220.58.83 "docker ps"

# Debe mostrar:
# evolution-api       (running)
# evolution-postgres  (running)
```

### Dashboard local
```bash
# Debe conectar exitosamente
http://localhost:3000/configuracion
```

---

## 🎯 Resumen de Migración

| Antes (WAHA) | Después (Evolution API) |
|--------------|------------------------|
| ❌ Inestable | ✅ Estable v2.2.3 |
| ❌ Sin BD | ✅ PostgreSQL persistente |
| ❌ Puerto 3000 | ✅ Puerto 8080 |
| ❌ API compleja | ✅ API limpia y documentada |
| ❌ QR simulado | ✅ QR real de WhatsApp |

---

## 📊 Logs de Instalación

```
✅ WAHA eliminado del VPS
✅ Evolution API imagen descargada
✅ PostgreSQL 15 instalado
✅ Migraciones de BD ejecutadas exitosamente
✅ Evolution API iniciado en puerto 8080
✅ Health check: OK (200)
✅ Sesiones persistentes configuradas
✅ .env.local actualizado
✅ Cambios commiteados a GitHub
```

---

## 🐛 Troubleshooting

### Evolution API no responde
```bash
ssh root@31.220.58.83
docker logs evolution-api --tail 100
docker restart evolution-api
```

### PostgreSQL no inicia
```bash
ssh root@31.220.58.83
docker logs evolution-postgres
docker-compose down
docker-compose up -d
```

### Puerto bloqueado
```bash
ssh root@31.220.58.83
ufw allow 8080/tcp
ufw reload
```

---

## 📚 Recursos

- [Evolution API - GitHub](https://github.com/EvolutionAPI/evolution-api)
- [Documentación Oficial](https://doc.evolution-api.com/)
- [Manager UI](http://31.220.58.83:8080/manager)

---

## 🎉 ¡Migración Exitosa!

Evolution API está completamente funcional en tu VPS y listo para conectar WhatsApp desde tu dashboard.

**Siguiente paso:** Abre tu dashboard y conecta WhatsApp! 📱✨

