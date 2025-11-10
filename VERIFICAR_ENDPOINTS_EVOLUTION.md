# 🧪 VERIFICACIÓN EVOLUTION API - Endpoints Correctos

Según la documentación de Evolution API v2.x, los endpoints correctos son:

## ✅ Endpoints Principales

### 1. Health Check
```
GET /
```

### 2. Crear/Iniciar Instancia
```
POST /instance/create
Body: {
  "instanceName": "default",
  "token": "optional-token",
  "qrcode": true
}
```

### 3. Conectar con QR
```
POST /instance/connect/{instanceName}
```

### 4. Obtener QR
```
GET /instance/qr/{instanceName}
```

### 5. Estado de la Instancia
```
GET /instance/connectionState/{instanceName}
```

### 6. Eliminar Instancia
```
DELETE /instance/delete/{instanceName}
```

---

## 🔧 Actualización Necesaria

Nuestro código actual usa endpoints que parecen ser de una versión anterior:
- ❌ `/sessions/start` 
- ❌ `/sessions/default/qrcode`
- ❌ `/sessions/default/status`

Necesitamos actualizar a:
- ✅ `/instance/create`
- ✅ `/instance/qr/default`
- ✅ `/instance/connectionState/default`

---

## 📝 Tests desde PowerShell

### Test 1: Health Check
```powershell
Invoke-RestMethod -Uri "http://31.220.58.83:8080/" -Method Get
```

### Test 2: Crear Instancia
```powershell
$body = @{
    instanceName = "default"
    qrcode = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://31.220.58.83:8080/instance/create" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

### Test 3: Obtener QR
```powershell
Invoke-RestMethod -Uri "http://31.220.58.83:8080/instance/qr/default" -Method Get
```

### Test 4: Estado
```powershell
Invoke-RestMethod -Uri "http://31.220.58.83:8080/instance/connectionState/default" -Method Get
```

---

## 🎯 Próxima Acción

1. Probar estos endpoints desde PowerShell
2. Si funcionan, actualizar el código del API route
3. Redeploy a Vercel
4. Probar desde dashboard

---

**Nota:** La documentación puede variar según la versión de Evolution API instalada.
Para ver la documentación exacta, visita: http://31.220.58.83:8080/manager

