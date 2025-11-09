# 🔐 GUÍA COMPLETA: WAHA SEGURO CON API KEY

## ✅ COMPLETADO - Configuración Segura de WAHA

Esta guía implementa la seguridad recomendada por la documentación oficial de WAHA.

---

## 📋 PASO 1: Generar API Key Segura ✅

### Ejecutado:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\generate-waha-apikey.ps1
```

### Resultado:
- ✅ API Key generada: `d8c776b78aee40d4b9bf75c633d175c8`
- ✅ Hash SHA-512: `sha512:402d5e20c143748ded38e13e72c543b200bd75615944ba033b44e1d718eb920128f14b6dd886c6440d9513ffb1dd530dbc426f46f29c26cc2c23aaf3f6fc50ec`
- ✅ Archivos guardados en: `waha-config/` (ignorados por Git)

### ¿Qué se hizo?
1. Generó UUID aleatorio (API key)
2. Calculó hash SHA-512 del UUID
3. Guardó ambos en archivos separados
4. Actualizó `.env.local` automáticamente

---

## 📋 PASO 2: Configurar Docker con API Key ✅

### Archivo actualizado: `docker-compose.waha.yml`

```yaml
services:
  waha:
    image: devlikeapro/waha:latest
    environment:
      - WAHA_API_KEY=sha512:402d5e20c143748ded38e13e72c543b200bd75615944ba033b44e1d718eb920128f14b6dd886c6440d9513ffb1dd530dbc426f46f29c26cc2c23aaf3f6fc50ec
```

### ⚠️ IMPORTANTE:
- Docker usa el **HASH** (`sha512:...`)
- Nunca uses la clave en texto en docker-compose

---

## 📋 PASO 3: Iniciar WAHA con Seguridad

### Comando:
```bash
docker-compose -f docker-compose.waha.yml up -d
```

### Verificar que esté corriendo:
```bash
docker ps
```

### Verificar salud con autenticación:
```bash
curl -H "X-Api-Key: d8c776b78aee40d4b9bf75c633d175c8" http://localhost:3000/api/health
```

**Resultado esperado:** `{"status":"ok"}`

### Sin API Key (debe fallar):
```bash
curl http://localhost:3000/api/health
```

**Resultado esperado:** `401 Unauthorized`

---

## 📋 PASO 4: Configuración Local (.env.local) ✅

Archivo: `.env.local` (ya actualizado automáticamente)

```bash
# API Key en TEXTO (NO el hash)
WAHA_API_KEY=d8c776b78aee40d4b9bf75c633d175c8

WAHA_BASE_URL=http://127.0.0.1:3000
```

---

## 📋 PASO 5: Probar Localmente

### 1. Iniciar todo:
```bash
# Terminal 1: WAHA
docker-compose -f docker-compose.waha.yml up -d

# Terminal 2: Dashboard
npm run dev
```

### 2. Abrir navegador:
```
http://localhost:3000/configuracion
```

### 3. Click "Conectar WhatsApp"

**Resultado esperado:**
- ✅ Se conecta con WAHA usando la API key
- ✅ Muestra QR de WhatsApp Web
- ✅ Puedes escanear con tu teléfono

---

## 📋 PASO 6: Configurar Vercel (Producción)

### Variables de entorno en Vercel:

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Settings → Environment Variables
4. Agrega:

```bash
WAHA_BASE_URL=https://waha.tudominio.com
WAHA_API_KEY=d8c776b78aee40d4b9bf75c633d175c8
```

⚠️ **En Vercel usa la CLAVE EN TEXTO**, NO el hash

---

## 📋 PASO 7: Desplegar WAHA en VPS (Producción)

### Opción A: VPS con Docker + Caddy (HTTPS)

#### 1. Crear `docker-compose.yml` en VPS:

```yaml
version: '3.8'

services:
  waha:
    image: devlikeapro/waha:latest
    restart: always
    environment:
      - WAHA_HTTP_API_HOST=0.0.0.0
      - WAHA_MULTI_DEVICE=true
      - WAHA_API_KEY=sha512:402d5e20c143748ded38e13e72c543b200bd75615944ba033b44e1d718eb920128f14b6dd886c6440d9513ffb1dd530dbc426f46f29c26cc2c23aaf3f6fc50ec
    volumes:
      - ./waha-data:/app/data
    expose:
      - "3000"

  caddy:
    image: caddy:latest
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on:
      - waha

volumes:
  caddy_data:
```

#### 2. Crear `Caddyfile`:

```
waha.tudominio.com {
    reverse_proxy waha:3000
}
```

#### 3. Iniciar:

```bash
docker-compose up -d
```

### Opción B: Railway (Más fácil)

1. Ve a: https://railway.app
2. "Deploy from GitHub repo"
3. Busca: `devlikeapro/waha`
4. Configura variable: `WAHA_API_KEY=sha512:...`
5. Railway te dará URL: `https://waha-production.up.railway.app`

---

## 📋 PASO 8: Verificar Seguridad

### ✅ Con API Key (debe funcionar):
```bash
curl -H "X-Api-Key: d8c776b78aee40d4b9bf75c633d175c8" https://waha.tudominio.com/api/sessions
```

### ❌ Sin API Key (debe fallar con 401):
```bash
curl https://waha.tudominio.com/api/sessions
```

### ✅ Health check:
```bash
curl -H "X-Api-Key: d8c776b78aee40d4b9bf75c633d175c8" https://waha.tudominio.com/api/health
```

---

## 🔒 Seguridad Implementada

### ✅ Protecciones activas:

1. **API Key obligatoria**: Sin ella, WAHA rechaza todas las peticiones
2. **Hash SHA-512**: Docker nunca ve la clave en texto
3. **HTTPS**: Caddy configura SSL automáticamente
4. **Archivos ignorados**: `.gitignore` protege `waha-config/` y `waha-data/`
5. **Variables seguras**: `.env.local` no se sube a GitHub

### ⚠️ Recomendaciones adicionales:

1. **Firewall**: Permite solo IPs de Vercel y tu IP
2. **CORS restrictivo**: Si expones API pública
3. **Desactiva Swagger**: Si no lo usas en producción
4. **Monitorea logs**: Revisa accesos no autorizados

---

## 📊 Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────┐
│  Cliente (Dashboard)                                    │
│  - Lee: WAHA_API_KEY=d8c776b78aee40d4b9bf75c633d175c8  │
│  - Envía: X-Api-Key: d8c776b78aee40d4b9bf75c633d175c8  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  WAHA (Docker)                                          │
│  - Lee: WAHA_API_KEY=sha512:402d5e20c143...            │
│  - Recibe: X-Api-Key: d8c776b78aee40d4b9bf75c633d175c8 │
│  - Calcula: sha512(d8c776b78aee40d4b9bf75c633d175c8)   │
│  - Compara: ¿Hash coincide? → ✅ Permite / ❌ Rechaza  │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Completo

### 1. Local (desarrollo):
```bash
# WAHA
docker-compose -f docker-compose.waha.yml up -d

# Dashboard
npm run dev

# Navegador
http://localhost:3000/configuracion
```

### 2. Producción (Vercel):
```bash
# Después de configurar WAHA en VPS
https://tu-dashboard.vercel.app/configuracion
```

---

## 🐛 Troubleshooting

### Error: `WAHA_API_KEY_MISSING`
**Solución**: Ejecuta `powershell scripts\generate-waha-apikey.ps1`

### Error: `401 Unauthorized`
**Causa**: API key incorrecta
**Solución**: Verifica que la clave en `.env.local` coincida con la generada

### Error: `WAHA_AUTH_FAILED`
**Causa**: Hash en docker no coincide con la clave enviada
**Solución**: 
1. Verifica docker-compose tiene el hash correcto
2. Verifica .env.local tiene la clave en texto

### Error: `WAHA_UNREACHABLE`
**Causa**: WAHA no está corriendo
**Solución**: `docker-compose up -d` y verifica con `docker ps`

---

## ✅ Checklist de Seguridad

- [x] API Key generada con UUID
- [x] Hash SHA-512 calculado
- [x] docker-compose.yml usa el hash
- [x] .env.local usa la clave en texto
- [x] .gitignore protege waha-config/
- [x] Código valida API key antes de enviar requests
- [x] Mensajes de error claros en el frontend
- [x] HTTPS configurado (con Caddy en producción)
- [ ] **PENDIENTE**: Firewall/IP whitelist en VPS
- [ ] **PENDIENTE**: Desplegar WAHA en VPS/Railway para Vercel

---

## 📚 Referencias

- [WAHA Security Docs](https://waha.devlike.pro/docs/how-to/security/)
- [WAHA API Authentication](https://waha.devlike.pro/docs/how-to/security/#api-key)
- [Deployment Guide](https://waha.devlike.pro/docs/how-to/deploy/)

---

## 🎯 Estado Actual

| Item | Estado |
|------|--------|
| Script generador de API key | ✅ Creado |
| API key generada | ✅ d8c776b78aee40d4b9bf75c633d175c8 |
| Hash SHA-512 generado | ✅ sha512:402d5e... |
| docker-compose actualizado | ✅ Con hash |
| .env.local actualizado | ✅ Con clave en texto |
| .gitignore protegido | ✅ waha-config/ ignorado |
| API routes validando API key | ✅ Obligatoria |
| Frontend con mensajes mejorados | ✅ Errores claros |
| Listo para testing local | ✅ SI |
| Listo para Vercel | ⏳ Requiere WAHA en VPS |

---

**🎉 CONFIGURACIÓN SEGURA COMPLETADA**

Todo listo para:
1. ✅ Desarrollo local seguro
2. ⏳ Producción (después de desplegar WAHA en VPS)

