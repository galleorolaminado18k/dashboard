# 🚀 GUÍA PASO A PASO - CONECTAR WAHA

## ⏱️ TIEMPO ESTIMADO: 5 MINUTOS

---

## 📍 PASO 1: OBTENER CREDENCIALES DEL VPS

### Comando a ejecutar:

```bash
cat /opt/baileys/.env
```

### Lo que verás:

```env
WAHA_API_KEY=c951554f59644aa3a1b3af3ad1c0a37c
WAHA_DASHBOARD_USERNAME=admin
WAHA_DASHBOARD_PASSWORD=aa926c4bf0d44bdab34eccb17524760c
WHATSAPP_SWAGGER_USERNAME=admin
WHATSAPP_SWAGGER_PASSWORD=aa926c4bf0d44bdab34eccb17524760c
```

### 📋 COPIAR ESTAS 3 LÍNEAS:
1. `WAHA_API_KEY=...`
2. `WAHA_DASHBOARD_USERNAME=...`
3. `WAHA_DASHBOARD_PASSWORD=...`

---

## 📍 PASO 2: AGREGAR EN VERCEL

### 2.1 Ir a Environment Variables

🔗 https://vercel.com/galleorolaminado18ks-projects/dashboard/settings/environment-variables

### 2.2 Agregar 4 variables (una por una):

#### Variable 1:
```
Name:  WAHA_BASE_URL
Value: https://wpp.galle18k.com
```

#### Variable 2:
```
Name:  WAHA_API_KEY
Value: c951554f59644aa3a1b3af3ad1c0a37c
```
*(Usar el valor de tu .env)*

#### Variable 3:
```
Name:  WAHA_DASHBOARD_USERNAME
Value: admin
```

#### Variable 4:
```
Name:  WAHA_DASHBOARD_PASSWORD
Value: aa926c4bf0d44bdab34eccb17524760c
```
*(Usar el valor de tu .env)*

### 2.3 Redeploy

Click en **"Deployments"** → Click en el último deployment → Click en **"Redeploy"**

⏱️ Espera 2-3 minutos a que termine el deploy

---

## 📍 PASO 3: PROBAR LA CONEXIÓN

### 3.1 Ir a la página de prueba

Una vez que termine el redeploy:

🔗 https://dashboard-galleorolaminado18ks-projects.vercel.app/whatsapp-test

### 3.2 Hacer click en "Conectar WhatsApp"

Verás:
- ⏳ Loading por 1-2 segundos
- 📱 Un código QR grande

### 3.3 Escanear el QR con WhatsApp

1. Abre WhatsApp en tu teléfono
2. Ve a **Configuración** → **Dispositivos vinculados**
3. Click en **"Vincular un dispositivo"**
4. Escanea el QR que aparece en la pantalla

### 3.4 Verificar conexión

Después de escanear:
- ✅ El mensaje cambia a "WhatsApp conectado correctamente"
- ✅ El QR desaparece
- ✅ Aparece un indicador verde

---

## 📍 PASO 4: PROBAR ENDPOINTS DIRECTAMENTE (OPCIONAL)

Si quieres verificar que todo funciona desde el VPS:

```bash
curl -o test.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/test-waha-directo.sh && chmod +x test.sh && ./test.sh
```

Deberías ver 6 tests pasando con **200 OK**.

---

## ✅ CHECKLIST RÁPIDO

- [ ] 1️⃣ Ejecutar `cat /opt/baileys/.env` en VPS
- [ ] 2️⃣ Copiar las 3 credenciales
- [ ] 3️⃣ Ir a Vercel Environment Variables
- [ ] 4️⃣ Agregar `WAHA_BASE_URL`
- [ ] 5️⃣ Agregar `WAHA_API_KEY`
- [ ] 6️⃣ Agregar `WAHA_DASHBOARD_USERNAME`
- [ ] 7️⃣ Agregar `WAHA_DASHBOARD_PASSWORD`
- [ ] 8️⃣ Hacer Redeploy en Vercel
- [ ] 9️⃣ Ir a `/whatsapp-test`
- [ ] 🔟 Escanear QR con WhatsApp
- [ ] 🎉 ¡Conectado!

---

## ❓ TROUBLESHOOTING

### Si no aparece el QR:

1. Abrir DevTools (F12) → Console
2. Buscar errores en rojo
3. Si ves `401`: Las credenciales no coinciden
4. Si ves `404`: WAHA_BASE_URL incorrecta
5. Si ves `500`: Ver logs en Vercel

### Si el QR expira:

- Click en "Conectar WhatsApp" de nuevo
- Se genera un nuevo QR

### Si no se conecta después de escanear:

- Wait 5-10 segundos (auto-verifica cada 5s)
- O click en "Verificar Estado"

---

## 📞 COMANDOS ÚTILES

### Ver credenciales:
```bash
cat /opt/baileys/.env
```

### Ver logs de WAHA:
```bash
docker logs waha-api -f
```

### Test rápido de health:
```bash
curl https://wpp.galle18k.com/health
```

---

## 🎯 RESULTADO ESPERADO

Al final deberías poder:

1. ✅ Ver el QR en `/whatsapp-test`
2. ✅ Escanear con WhatsApp
3. ✅ Ver mensaje de "conectado"
4. ✅ Enviar mensajes desde el dashboard

---

**¡LISTO PARA USAR! 🚀**

