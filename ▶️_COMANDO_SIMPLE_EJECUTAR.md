# 🚨 COMANDO SIMPLE Y DIRECTO

## ⚡ EJECUTA ESTE COMANDO EN EL VPS

Este es el comando más simple posible, sin variables de base de datos:

```bash
docker stop evolution 2>/dev/null && docker rm evolution 2>/dev/null && docker run -d --name evolution --restart unless-stopped -p 8080:8080 -v ~/evolution-data:/evolution/store -e SERVER_URL=http://localhost:8080 -e AUTHENTICATION_API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb atendai/evolution-api:latest && sleep 30 && echo "=== LOGS ===" && docker logs evolution --tail 50 && echo "" && echo "=== PRUEBA ===" && curl -i http://127.0.0.1:8080/health
```

## 📋 QUÉ HACE:

1. Detiene Evolution (si existe)
2. Elimina Evolution (si existe)
3. Levanta Evolution con **configuración mínima**:
   - Solo `SERVER_URL` y `AUTHENTICATION_API_KEY`
   - Sin variables de base de datos (causa de los errores)
4. Espera 30 segundos
5. Muestra logs
6. Prueba health check

## ✅ RESULTADO ESPERADO:

```
=== PRUEBA ===
HTTP/1.1 200 OK
```

---

## 🔍 SI SIGUE FALLANDO, EJECUTA EL DIAGNÓSTICO:

```bash
bash diagnostico-completo.sh
```

O manualmente:

```bash
# Ver contenedores
docker ps -a

# Ver qué usa el puerto 8080
netstat -tulpn | grep 8080

# Ver logs completos de Evolution
docker logs evolution

# Detener TODO y limpiar
docker stop $(docker ps -q) && docker rm $(docker ps -aq)
```

---

## 📝 COPIA Y PEGA EL RESULTADO COMPLETO

Cuando ejecutes el comando, **copia TODO el output** (desde donde empiezas hasta el final) y pégalo aquí para que pueda ver exactamente qué está pasando.

Específicamente necesito ver:
- ✅ Los logs de Evolution
- ✅ La respuesta de curl
- ✅ Cualquier error que aparezca

---

**🚀 EJECUTA EL COMANDO SIMPLE ARRIBA Y PEGA EL RESULTADO COMPLETO AQUÍ**

