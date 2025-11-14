# ⚡ PASO 2 - CONFIGURAR VERCEL

## 🔗 Ir a Vercel Environment Variables

https://vercel.com/galleorolaminado18ks-projects/dashboard/settings/environment-variables

---

## ⚙️ Agregar/Actualizar estas 2 variables

### Variable 1:
```
Name:  WAHA_BASE_URL
Value: https://wpp.galle18k.com
```

### Variable 2:
```
Name:  WAHA_API_KEY
Value: (el valor del PASO 1)
```

**⚠️ IMPORTANTE:**
- Asegúrate que `WAHA_API_KEY` tenga el **mismo valor** que en el VPS
- Guarda en **"All Environments"** (Production, Preview, Development)
- Si ya existen, elimínalas y créalas de nuevo

---

## 🔄 Después de guardar

Click en **"Redeploy"** para aplicar los cambios.

---

## ❌ Eliminar variables antiguas (si existen)

- `BAILEYS_BASE_URL`
- `BAILEYS_API_KEY`
- `NEXT_PUBLIC_BAILEYS_BASE_URL`

Estas ya no se usan.

