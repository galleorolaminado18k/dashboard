# 🚨 COMANDO DEFINITIVO - Evolution con SQLite

## ⚡ EJECUTA ESTE COMANDO EN EL VPS

**Comando actualizado con SQLite** (base de datos local, no requiere servidor):

```bash
docker stop evolution 2>/dev/null && docker rm evolution 2>/dev/null && docker run -d --name evolution --restart unless-stopped -p 8080:8080 -v ~/evolution-data:/evolution/store -e SERVER_URL=http://localhost:8080 -e AUTHENTICATION_API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb -e DATABASE_ENABLED=true -e DATABASE_PROVIDER=sqlite -e DATABASE_CONNECTION_CLIENT_NAME=evolution -e DATABASE_SAVE_DATA_INSTANCE=true -e DATABASE_SAVE_DATA_NEW_MESSAGE=false -e DATABASE_SAVE_DATA_MESSAGE_UPDATE=false -e DATABASE_SAVE_DATA_CONTACTS=false -e DATABASE_SAVE_DATA_CHATS=false atendai/evolution-api:latest && sleep 30 && echo "=== LOGS ===" && docker logs evolution --tail 50 && echo "" && echo "=== PRUEBA ===" && curl -i http://127.0.0.1:8080/health
```

## 📋 POR QUÉ ESTE COMANDO FUNCIONA:

**Problema anterior**: Evolution SIEMPRE requiere base de datos, no se puede deshabilitar.

**Solución**: Usar **SQLite** (base de datos en archivo local):
- ✅ `DATABASE_PROVIDER=sqlite` - SQLite local (no requiere servidor)
- ✅ No requiere PostgreSQL/MySQL
- ✅ Guarda datos en archivo local
- ✅ Configuración mínima

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

