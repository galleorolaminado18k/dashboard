# ✅ EVOLUTION API FUNCIONANDO - CONFIGURAR VERCEL AHORA

## 🎉 ÉXITO EN EL VPS

```
=== PRUEBA SIN AUTH ===
HTTP/1.1 401 Unauthorized  ✅ Correcto

=== PRUEBA CON AUTH ===
HTTP/1.1 200 OK  ✅ Correcto
Content-Length: 2
[]
```

**Evolution API está funcionando perfectamente** ✅

---

## ⚡ AHORA: CONFIGURAR VERCEL (PASO A PASO)

### PASO 1: Ir a Vercel Dashboard

1. Abre: https://vercel.com/dashboard
2. Click en tu proyecto (dashboard)

### PASO 2: Configurar Variables de Entorno

1. Click en **"Settings"** (arriba)
2. Click en **"Environment Variables"** (menú izquierdo)
3. Busca si existe `EVO_BASE_URL`:
   - **Si existe**: Click en los 3 puntos → **Edit** → Cambiar valor
   - **Si NO existe**: Click **"Add New"**

#### Variable 1: EVO_BASE_URL

```
Name: EVO_BASE_URL
Value: http://31.220.58.83:8080
Environment: Production, Preview, Development (marcar las 3)
```

Click **"Save"**

#### Variable 2: EVO_API_KEY

```
Name: EVO_API_KEY
Value: galle-whatsapp-key-2025
Environment: Production, Preview, Development (marcar las 3)
```

Click **"Save"**

### PASO 3: Redeploy (OBLIGATORIO)

1. Click en **"Deployments"** (arriba)
2. Busca el deployment más reciente (debe decir "Ready")
3. Click en los **3 puntos** (`...`) a la derecha
4. Click **"Redeploy"**
5. En el modal que aparece, click **"Redeploy"** nuevamente
6. Espera 2-3 minutos hasta que diga **"Ready"** ✅

---

## 🧪 PASO 4: PROBAR EN TU APP

1. Ve a: https://dashboard-galle-git-fea-98639c-galleaprobaciones-9369s-projects.vercel.app/configuracion

2. **O** si tienes dominio personalizado, ve a: `https://tu-dominio.com/configuracion`

3. En la página:
   - Ingresa el número: `3012439596`
   - Click **"Conectar WhatsApp"**

4. **Resultado esperado**:
   - ✅ Spinner "Generando código QR..."
   - ✅ QR aparece en 2-5 segundos
   - ✅ Puedes escanear con WhatsApp
   - ✅ **NO** hay error `EVO_TIMEOUT`
   - ✅ **NO** hay error `EVO_HTTP_400`
   - ✅ **NO** hay error `permission error`

---

## 📋 SI APARECE ERROR EN VERCEL

### Ver Function Logs:

1. **Deployments** → Click en el último deployment (Ready)
2. Click en **"Function Logs"** (pestaña arriba)
3. Ve a `/configuracion` y click "Conectar WhatsApp"
4. Busca en los logs:

**Logs correctos** (deberías ver):
```
[EVOLUTION] 🚀 Iniciando sesión de WhatsApp...
[EVOLUTION] 🌐 Base URL: http://31.220.58.83:8080
[EVOLUTION] 🔑 API Key configurada: Sí
[EVOLUTION] 🔄 Iniciando sesión...
[EVOLUTION] ✅ Sesión iniciada
[EVOLUTION] 📷 Obteniendo QR code...
[EVOLUTION] ✅ QR obtenido exitosamente!
```

**Si ves errores**:
- `EVO_UNREACHABLE` → Verifica firewall en VPS: `ufw allow 8080/tcp`
- `EVO_HTTP_401` → Las variables no están configuradas o no se aplicaron
- `EVO_HTTP_404` → Redeploy no se completó correctamente

---

## 🔥 ABRIR FIREWALL (SI NO LO HICISTE)

En el VPS ejecuta:

```bash
ufw allow 8080/tcp
ufw reload
ufw status | grep 8080
```

Debería mostrar: `8080/tcp ALLOW Anywhere`

---

## ✅ CHECKLIST FINAL

- [x] Evolution API corriendo en VPS (puerto 8080)
- [x] Pruebas con curl responden 200 OK con auth
- [x] Código actualizado en GitHub
- [ ] **Variables configuradas en Vercel** ← **HACER AHORA**
- [ ] **Redeploy ejecutado en Vercel** ← **HACER AHORA**
- [ ] **Probar en `/configuracion`** ← **DESPUÉS DEL REDEPLOY**
- [ ] QR aparece correctamente
- [ ] WhatsApp conecta exitosamente

---

## 🎯 RESUMEN DE LO QUE TIENES QUE HACER

1. ✅ VPS: Evolution funcionando (YA ESTÁ LISTO)
2. ⏳ Vercel: Configurar variables (HAZLO AHORA)
3. ⏳ Vercel: Redeploy (HAZLO DESPUÉS)
4. ⏳ App: Probar en `/configuracion` (DESPUÉS DEL REDEPLOY)

---

## 📊 VARIABLES EXACTAS PARA COPIAR Y PEGAR

```
Variable 1:
Name: EVO_BASE_URL
Value: http://31.220.58.83:8080

Variable 2:
Name: EVO_API_KEY
Value: galle-whatsapp-key-2025
```

---

**🚀 VE A VERCEL AHORA Y CONFIGURA LAS VARIABLES!**

**Después del redeploy, prueba en `/configuracion` y el QR aparecerá** ✅

