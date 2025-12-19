# ⚡ INSTALACIÓN RÁPIDA EN TU VPS

## 🎯 TU VPS
**IP:** 31.220.58.83  
**Usuario:** root  
**Contraseña:** S@ntiago

---

## 🚀 EJECUTAR AHORA (3 COMANDOS)

### **1. Conectar por SSH**
```bash
ssh root@31.220.58.83
```
**Contraseña:** `S@ntiago`

### **2. Descargar e instalar WAHA**
```bash
curl -o install.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/scripts/install-waha-vps.sh && chmod +x install.sh && ./install.sh
```

### **3. Esperar 5 minutos** ⏳
El script instalará automáticamente:
- ✅ Docker
- ✅ WAHA
- ✅ Firewall

---

## ✅ DESPUÉS DE LA INSTALACIÓN

### **Obtener URL de WAHA:**
```
La URL será: http://31.220.58.83:3000
```

### **Configurar en Vercel:**
```
1. https://vercel.com/dashboard
2. Tu proyecto → Settings → Environment Variables
3. Add New:
   Name: WAHA_BASE_URL
   Value: http://31.220.58.83:3000
4. Save
```

### **Probar:**
```
https://dashboard-galle.vercel.app/configuracion
→ Conectar WhatsApp
→ ✅ QR aparece
→ Escanear
→ ✅ FUNCIONA 24/7
```

---

## 🔧 COMANDOS ÚTILES

```bash
# Ver logs de WAHA
docker logs -f waha-production

# Reiniciar WAHA
docker restart waha-production

# Ver estado
docker ps

# Test health
curl http://localhost:3000/health
```

---

## 📞 SI ALGO FALLA

Ver guía completa: `GUIA_VPS_INSTALACION.md`

---

**Tiempo total:** 5-10 minutos  
**Resultado:** WAHA 24/7 activo en tu VPS  
**Costo adicional:** $0 (ya tienes el VPS)

