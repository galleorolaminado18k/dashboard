# 🔑 OBTENER API KEY DE EVOLUTION - CONFIGURAR EN VERCEL

## 🎯 OBJETIVO
Verificar qué API Key tiene configurada tu Evolution API en el VPS y configurarla en Vercel.

---

## PASO 1: CONECTAR AL VPS Y VERIFICAR LA API KEY ACTUAL

### Conectar por SSH:
```bash
ssh root@31.220.58.83
```

### Método 1: Ver variables de entorno del contenedor Evolution
```bash
docker exec evolution-api printenv | grep -Ei 'API|KEY|AUTH'
```

**Deberías ver algo como**:
```
API_KEY=galle-super-key
```
O:
```
AUTHENTICATION_API_KEY=mi-clave-secreta-123
```

### Método 2: Ver logs de Evolution para identificar si tiene auth activa
```bash
docker logs evolution-api 2>&1 | grep -Ei 'auth|api.*key|token'
```

### Método 3: Inspeccionar la configuración del contenedor
```bash
docker inspect evolution-api | grep -A 10 "Env"
```

**Busca líneas que contengan**:
- `API_KEY=`
- `AUTHENTICATION_API_KEY=`
- `AUTH_TOKEN=`

---

## ESCENARIO A: SI EVOLUTION YA TIENE UNA API KEY CONFIGURADA

### 1. Copiar la clave que aparezca en el comando anterior

Por ejemplo, si ves:
```
API_KEY=galle-super-key
```

**Tu clave es**: `galle-super-key`

### 2. Ir a Vercel y configurar

**Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**

Agregar:
```
Name: EVO_BASE_URL
Value: http://31.220.58.83:8080

Name: EVO_API_KEY
Value: galle-super-key
```
(Reemplaza `galle-super-key` con la clave que encontraste)

### 3. Redeploy en Vercel

---

## ESCENARIO B: SI EVOLUTION NO TIENE API KEY (no aparece nada)

Esto significa que Evolution está corriendo **sin autenticación**. Tienes 2 opciones:

### Opción 1: Mantener sin autenticación (solo para desarrollo/testing)

**En Vercel**, configurar solo:
```
Name: EVO_BASE_URL
Value: http://31.220.58.83:8080
```
(NO agregar `EVO_API_KEY`)

**Ventaja**: Más simple, funciona inmediatamente  
**Desventaja**: Menos seguro, cualquiera puede acceder a tu Evolution API

### Opción 2: Agregar autenticación (RECOMENDADO para producción)

#### 1. Detener Evolution actual:
```bash
ssh root@31.220.58.83
docker rm -f evolution-api
```

#### 2. Levantar Evolution con tu propia API Key:
```bash
# Elige UNA clave segura (ejemplo: MiClaveSecreta2024)
docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e API_KEY=MiClaveSecreta2024 \
  -e AUTHENTICATION=true \
  atendai/evolution-api:latest

# Abrir firewall si no está abierto
sudo ufw allow 8080/tcp

# Verificar que levantó correctamente
docker logs evolution-api --tail 30
```

#### 3. Probar que la autenticación funciona:
```bash
# Sin auth (debe dar 401)
curl -i http://localhost:8080/health

# Con auth (debe dar 200)
curl -i http://localhost:8080/health -H "apikey: MiClaveSecreta2024"
```

#### 4. Configurar en Vercel:
```
Name: EVO_BASE_URL
Value: http://31.220.58.83:8080

Name: EVO_API_KEY
Value: MiClaveSecreta2024
```
(Usa la MISMA clave que pusiste en el paso 2)

#### 5. Redeploy en Vercel

---

## PASO 2: PROBAR DESDE TU PC (ANTES DE CONFIGURAR VERCEL)

### Si Evolution tiene autenticación:
```bash
curl -i http://31.220.58.83:8080/health -H "apikey: TU_CLAVE_AQUI"
```

**Resultado esperado**: `200 OK` ✅

### Si Evolution NO tiene autenticación:
```bash
curl -i http://31.220.58.83:8080/health
```

**Resultado esperado**: `200 OK` ✅

---

## PASO 3: CONFIGURAR EN VERCEL

### 1. Ir a Vercel:
```
https://vercel.com/dashboard
```

### 2. Seleccionar tu proyecto

### 3. Settings → Environment Variables

### 4. Agregar variables:

#### Setup básico (siempre necesario):
```
Name: EVO_BASE_URL
Value: http://31.220.58.83:8080
```

#### Si Evolution tiene autenticación (agregar también):
```
Name: EVO_API_KEY
Value: [La clave que encontraste o creaste]
```

**EJEMPLOS DE CLAVES VÁLIDAS**:
- `galle-super-key`
- `MiClaveSecreta2024`
- `evolution-prod-key-abc123`
- `cualquier-texto-que-quieras`

### 5. Click en "Save"

### 6. Redeploy:
- Ve a **Deployments**
- Click en los 3 puntos `...` del último deployment
- Click en **Redeploy**
- Espera 2-3 minutos

---

## PASO 4: VERIFICAR QUE FUNCIONA

### 1. Ver logs del deployment en Vercel:
- Deployments → Click en el último → Build Logs

**Buscar líneas como**:
```
[EVOLUTION] Base URL: http://31.220.58.83:8080
[EVOLUTION] API Key: Configurada ✅
```

### 2. Ir a tu dashboard:
```
https://tu-app.vercel.app/configuracion
```

### 3. Probar conexión WhatsApp:
- Ingresar número: `3001234567`
- Click en "Conectar WhatsApp"
- Abrir consola (F12)

**Deberías ver**:
```
📡 Llamando a /api/whatsapp/evolution...
📥 Respuesta: {qrcode: "data:image/png;base64,..."}
✅ QR obtenido!
```

**NO deberías ver**:
```
❌ Error: EVO_START_401
```

### 4. Resultado final:
- ✅ QR aparece en 2-5 segundos
- ✅ Puedes escanear el QR
- ✅ WhatsApp se conecta

---

## 🎯 COMANDO RÁPIDO: TODO EN UNO

### Para ejecutar en el VPS:

```bash
# ===================================================
# COPIAR Y PEGAR EN EL VPS
# ===================================================

ssh root@31.220.58.83

echo "=== VERIFICANDO EVOLUTION ACTUAL ==="
docker ps | grep evolution

echo -e "\n=== API KEY ACTUAL (si existe) ==="
docker exec evolution-api printenv 2>/dev/null | grep -Ei 'API|KEY|AUTH' || echo "No se encontró Evolution corriendo"

echo -e "\n=== SI NO TIENE API KEY, LEVANTAR CON AUTENTICACIÓN ==="
echo "Ejecuta manualmente:"
echo "docker rm -f evolution-api"
echo "docker run -d --name evolution-api --restart=always -p 8080:8080 -v ~/evolution-data:/evolution/store -e API_KEY=TuClaveAqui -e AUTHENTICATION=true atendai/evolution-api:latest"

echo -e "\n=== PROBAR AUTENTICACIÓN ==="
echo "curl -i http://localhost:8080/health -H 'apikey: TU_CLAVE'"
```

---

## ✅ CHECKLIST RÁPIDO

### En el VPS:
- [ ] Verificar si Evolution está corriendo: `docker ps | grep evolution`
- [ ] Ver API Key actual: `docker exec evolution-api printenv | grep API_KEY`
- [ ] Si no hay API Key, decidir si agregar una o dejar sin auth
- [ ] Si agregaste API Key, probar: `curl http://localhost:8080/health -H "apikey: TU_CLAVE"`

### En Vercel:
- [ ] Agregar `EVO_BASE_URL = http://31.220.58.83:8080`
- [ ] Si Evolution tiene auth, agregar `EVO_API_KEY = [la misma clave]`
- [ ] Click en "Save"
- [ ] Redeploy el proyecto

### Prueba final:
- [ ] Ir a `/configuracion`
- [ ] Ingresar número de WhatsApp
- [ ] Click en "Conectar WhatsApp"
- [ ] ✅ QR aparece sin error 401
- [ ] ✅ Puedes escanear el QR

---

## 🔐 RECOMENDACIÓN DE SEGURIDAD

**Para producción**, siempre usa autenticación:

### 1. Genera una clave segura:
```bash
# Generar clave aleatoria de 32 caracteres
openssl rand -base64 32
```

**Ejemplo de salida**: `7K8jD2mN9pQ1rS5tU6vW3xY4zA0bC1dE2fG3hH4iI5j=`

### 2. Usar esa clave en Evolution:
```bash
docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e API_KEY=7K8jD2mN9pQ1rS5tU6vW3xY4zA0bC1dE2fG3hH4iI5j= \
  -e AUTHENTICATION=true \
  atendai/evolution-api:latest
```

### 3. Configurar la MISMA clave en Vercel:
```
EVO_API_KEY = 7K8jD2mN9pQ1rS5tU6vW3xY4zA0bC1dE2fG3hH4iI5j=
```

---

## 📞 SI TIENES DUDAS

### ¿Qué clave usar?
- Cualquier texto que quieras (mínimo 8 caracteres)
- Ejemplo simple: `galle-super-key`, `miempresa123`
- Ejemplo seguro: Clave generada con `openssl rand -base64 32`

### ¿Debo usar autenticación?
- **Desarrollo local**: Opcional
- **VPS con IP pública**: **Sí, obligatorio**
- **Dominio público**: **Sí, obligatorio**

### ¿Puedo cambiar la clave después?
- Sí, simplemente:
  1. Recrear el contenedor con nueva clave
  2. Actualizar `EVO_API_KEY` en Vercel
  3. Redeploy

---

## 🎉 RESUMEN

**TU ACCIÓN AHORA**:

1. **SSH al VPS**: `ssh root@31.220.58.83`
2. **Ver API Key**: `docker exec evolution-api printenv | grep API_KEY`
3. **Copiar la clave** que aparezca
4. **Ir a Vercel** → Settings → Environment Variables
5. **Agregar**:
   - `EVO_BASE_URL = http://31.220.58.83:8080`
   - `EVO_API_KEY = [la clave copiada]`
6. **Redeploy**
7. **Probar** en `/configuracion`

**Si no aparece ninguna API Key**, entonces Evolution no tiene autenticación activa. Puedes:
- Dejarlo así (solo `EVO_BASE_URL` en Vercel)
- O agregar autenticación siguiendo el "ESCENARIO B" arriba

**🚀 ¡Listo para configurar!**

