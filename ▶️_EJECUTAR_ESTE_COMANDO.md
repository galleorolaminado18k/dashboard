# ⚡ COMANDO CORREGIDO - EJECUTAR AHORA

## ✅ Comando corregido con `docker-compose` (CON GUIÓN)

**EJECUTA ESTE COMANDO EN EL VPS**:

```bash
cd ~ && docker-compose -f docker-compose.evolution.yml up -d && sleep 40 && echo "=== CONTENEDORES ===" && docker ps && echo "" && echo "=== LOGS EVOLUTION ===" && docker logs evolution --tail 30 && echo "" && echo "=== PRUEBA ===" && curl -i http://127.0.0.1:8080/health
```

## 📋 QUÉ HACE:

1. Va al directorio home
2. Levanta los servicios con `docker-compose` (CON GUIÓN)
3. Espera 40 segundos
4. Muestra contenedores corriendo
5. Muestra logs de Evolution
6. Prueba health check

## ✅ RESULTADO ESPERADO:

```
=== CONTENEDORES ===
NAME                  STATUS         PORTS
evolution             Up 35 seconds  0.0.0.0:8080->8080/tcp
evolution-postgres    Up 40 seconds  5432/tcp

=== LOGS EVOLUTION ===
[LOG] - Server started on port 8080
[LOG] - Database connected

=== PRUEBA ===
HTTP/1.1 200 OK
content-type: application/json

{"status":"ok"}
```

**Si ves `200 OK`** → ✅ **¡PROBLEMA RESUELTO!**

---

## 📋 DESPUÉS DEL 200 OK:

```bash
# Probar IP pública
curl -i http://31.220.58.83:8080/health

# Abrir firewall
ufw allow 8080/tcp
ufw reload
```

**Luego**:
1. Vercel → Variables → Configurar
2. Redeploy
3. Probar en `/configuracion`

---

**🚀 EJECUTA EL COMANDO ARRIBA Y PEGA EL RESULTADO AQUÍ!**

