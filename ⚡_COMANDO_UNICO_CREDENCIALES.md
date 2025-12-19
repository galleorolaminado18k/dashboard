# ⚡ COMANDO ÚNICO - OBTENER CREDENCIALES WAHA

## 🎯 PROBLEMA RESUELTO

Ya arreglé el código para usar `WAHA_BASE_URL` en lugar de `BAILEYS_BASE_URL`.

---

## 📋 EJECUTAR EN EL VPS (UN SOLO COMANDO)

Copia y pega esto en el VPS:

```bash
curl -o cred.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/mostrar-credenciales-waha.sh && chmod +x cred.sh && ./cred.sh
```

Este comando:
1. ✅ Descarga el script
2. ✅ Le da permisos de ejecución
3. ✅ Lo ejecuta
4. ✅ Muestra las credenciales formateadas

---

## 📝 LO QUE VERÁS

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📋 CREDENCIALES WAHA PARA VERCEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Copiar estas 4 variables a Vercel:

┌─────────────────────────────────────────────────┐
│ Variable 1                                      │
├─────────────────────────────────────────────────┤
│ Name:  WAHA_BASE_URL                           │
│ Value: https://wpp.galle18k.com                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Variable 2                                      │
├─────────────────────────────────────────────────┤
│ Name:  WAHA_API_KEY                            │
│ Value: c951554f59644aa3a1b3af3ad1c0a37c        │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Variable 3 (Opcional)                          │
├─────────────────────────────────────────────────┤
│ Name:  WAHA_DASHBOARD_USERNAME                 │
│ Value: admin                                    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Variable 4 (Opcional)                          │
├─────────────────────────────────────────────────┤
│ Name:  WAHA_DASHBOARD_PASSWORD                 │
│ Value: aa926c4bf0d44bdab34eccb17524760c        │
└─────────────────────────────────────────────────┘
```

---

## ⚙️ AGREGAR A VERCEL

1. Ve a: https://vercel.com/galleorolaminado18ks-projects/dashboard/settings/environment-variables

2. **PRIMERO**: Eliminar variables antiguas (si existen):
   - ❌ `BAILEYS_BASE_URL`
   - ❌ `BAILEYS_API_KEY`
   - ❌ `NEXT_PUBLIC_BAILEYS_BASE_URL`

3. **LUEGO**: Agregar las 4 nuevas variables (copiar Name y Value del script)

4. **FINALMENTE**: Click en **"Redeploy"**

---

## ✅ CHECKLIST DE 5 PASOS

1. ⏳ Ejecutar comando en VPS
2. ⏳ Copiar las credenciales que aparecen
3. ⏳ Ir a Vercel Environment Variables
4. ⏳ Eliminar variables BAILEYS_* antiguas
5. ⏳ Agregar 4 variables WAHA_*
6. ⏳ Redeploy en Vercel
7. ✅ ¡Listo!

---

## 🚀 DESPUÉS DEL REDEPLOY

El error desaparecerá y podrás:

1. ✅ Ir a `/whatsapp-test`
2. ✅ Click en "Conectar WhatsApp"
3. ✅ Ver el código QR
4. ✅ Escanear con WhatsApp
5. ✅ Conectar exitosamente

---

## 📊 RESUMEN DE CAMBIOS

| Antes | Ahora |
|-------|-------|
| ❌ `BAILEYS_BASE_URL` | ✅ `WAHA_BASE_URL` |
| ❌ `BAILEYS_API_KEY` | ✅ `WAHA_API_KEY` |
| ❌ Error en consola | ✅ Funciona correctamente |

---

## 📞 SI HAY PROBLEMAS

### El script no funciona:
```bash
# Alternativa manual
cat /opt/baileys/.env
```

### No aparecen las credenciales:
```bash
# Verificar que el archivo existe
ls -la /opt/baileys/.env

# Ver contenido
cat /opt/baileys/.env
```

### El VPS no responde:
- Verificar conexión SSH
- Verificar que WAHA está corriendo: `docker ps`

---

## 🎯 COMANDO RÁPIDO

Para copiar y pegar en el VPS:

```bash
curl -o cred.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/mostrar-credenciales-waha.sh && chmod +x cred.sh && ./cred.sh
```

**¡Un solo comando y listo!** 🚀

