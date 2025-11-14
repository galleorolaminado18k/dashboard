# ⚡ PASO 4 - CONFIGURAR PROXY CADDY

## 📋 Ejecutar en el VPS

### 1. Verificar configuración actual de Caddy

```bash
cat /opt/baileys/Caddyfile
```

### 2. Actualizar Caddyfile con configuración correcta

```bash
cat > /opt/baileys/Caddyfile << 'EOF'
wpp.galle18k.com {
  reverse_proxy waha-api:3000 {
    header_up X-Api-Key {>X-Api-Key}
    header_up Host {upstream_hostport}
  }
  encode gzip zstd
}
EOF
```

### 3. Reiniciar Caddy para aplicar cambios

```bash
cd /opt/baileys
docker-compose restart caddy
```

### 4. Verificar que Caddy se reinició correctamente

```bash
docker logs caddy --tail 20
```

Deberías ver algo como:
```
... INFO Caddy serving
... INFO tls got certificate
```

---

## 🔍 Explicación

La configuración `header_up X-Api-Key {>X-Api-Key}` asegura que Caddy reenvía el header `X-Api-Key` del cliente hacia WAHA sin modificarlo ni eliminarlo.

---

## ✅ Después de reiniciar Caddy

El proxy ya no bloqueará el header `X-Api-Key` y WAHA lo recibirá correctamente.

