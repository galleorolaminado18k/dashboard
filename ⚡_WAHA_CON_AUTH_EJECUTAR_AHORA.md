# ⚡ INSTALAR WAHA CON AUTENTICACIÓN - EJECUTAR AHORA

## 🎯 SOLUCIÓN AL ERROR 401

El error 401 ocurría porque WAHA requiere autenticación por defecto. El nuevo script genera credenciales automáticamente y las guarda en un archivo `.env`.

---

## 📋 EJECUTAR EN EL VPS (SSH)

Copia y pega este comando completo:

```bash
curl -o waha.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/instalar-waha.sh && chmod +x waha.sh && ./waha.sh
```

---

## ✅ QUÉ ESPERAR

1. **Paso 1/5**: Detiene Baileys
2. **Paso 2/5**: Genera credenciales aleatorias
   - **IMPORTANTE**: Copia las credenciales que se muestran aquí
3. **Paso 3/5**: Crea docker-compose.yml
4. **Paso 4/5**: Actualiza Caddyfile
5. **Paso 5/5**: Inicia WAHA
6. Espera 60 segundos
7. Verifica con autenticación → Debe responder **200 OK**

---

## 📝 CREDENCIALES GENERADAS

El script mostrará algo como:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CREDENCIALES IMPORTANTES - COPIAR AHORA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WAHA_API_KEY=abc123def456...
WAHA_DASHBOARD_USERNAME=admin
WAHA_DASHBOARD_PASSWORD=xyz789...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**¡COPIAR Y GUARDAR ESTAS CREDENCIALES!**

---

## 🔧 DESPUÉS DE LA INSTALACIÓN

### 1. Guardar credenciales en Vercel

Ve a: https://vercel.com/galleorolaminado18ks-projects/dashboard/settings/environment-variables

Agrega estas variables:

```
WAHA_API_KEY=<el valor generado>
WAHA_DASHBOARD_USERNAME=admin
WAHA_DASHBOARD_PASSWORD=<el valor generado>
```

### 2. Ver credenciales en el VPS

Si necesitas ver las credenciales después:

```bash
cat /opt/baileys/.env
```

### 3. Probar la API manualmente

```bash
# Obtener API_KEY del archivo
API_KEY=$(grep WAHA_API_KEY /opt/baileys/.env | cut -d'=' -f2)

# Probar endpoint de salud
curl -H "X-Api-Key: $API_KEY" http://127.0.0.1:3001/api/health

# Probar desde fuera (HTTPS)
curl -H "X-Api-Key: $API_KEY" https://wpp.galle18k.com/api/health
```

---

## 🌐 ACCESO AL DASHBOARD WAHA

- **URL**: https://wpp.galle18k.com/dashboard
- **Usuario**: admin
- **Password**: (el generado en la instalación)

---

## 🔍 VERIFICAR ESTADO

```bash
# Ver contenedores
docker ps

# Ver logs
docker logs waha-api -f

# Ver archivo .env
cat /opt/baileys/.env
```

---

## ❌ SI SIGUE CON ERROR 401

1. Verificar que el archivo .env existe:
   ```bash
   ls -la /opt/baileys/.env
   ```

2. Ver contenido del .env:
   ```bash
   cat /opt/baileys/.env
   ```

3. Reiniciar WAHA:
   ```bash
   cd /opt/baileys
   docker-compose restart waha
   ```

4. Probar con la API KEY correcta:
   ```bash
   API_KEY=$(grep WAHA_API_KEY /opt/baileys/.env | cut -d'=' -f2)
   curl -H "X-Api-Key: $API_KEY" http://127.0.0.1:3001/api/health
   ```

---

## 📊 DIFERENCIAS CON BAILEYS

### Endpoints WAHA vs Baileys

| Baileys | WAHA |
|---------|------|
| POST /sessions/start | POST /api/sessions/default/start |
| GET /sessions/status | GET /api/sessions/default/status |
| POST /messages/send | POST /api/sendText |

### Headers requeridos

Todas las peticiones a WAHA deben incluir:

```
X-Api-Key: <tu-api-key>
```

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Ejecutar script en VPS
2. 📋 Copiar credenciales generadas
3. ⚙️ Agregar credenciales a Vercel
4. 🔄 Redeploy del dashboard
5. 📝 Actualizar código para usar endpoints de WAHA

---

## 📞 SOPORTE

Si hay algún problema, compartir:

```bash
docker logs waha-api --tail 50
```

