# ⚡ EJECUTA ESTO AHORA EN EL VPS

## 🎯 PROBLEMA: Puerto 8080 ocupado

## ✅ SOLUCIÓN: Un solo comando (COPIAR Y PEGAR)

```bash
docker ps -q | xargs -r docker stop && docker ps -aq | xargs -r docker rm && fuser -k 8080/tcp 2>/dev/null || true && sleep 3 && docker run -d --name evolution --restart unless-stopped -p 8080:8080 -v ~/evolution-data:/evolution/store -e SERVER_PORT=8080 -e SERVER_HOST=0.0.0.0 -e API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb -e AUTHENTICATION_API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb -e DATABASE_ENABLED=false atendai/evolution-api:latest && sleep 20 && docker logs evolution --tail 30 && curl -i http://127.0.0.1:8080/health
```

## 📋 QUÉ HACE ESTE COMANDO:

1. ✅ Detiene TODOS los contenedores
2. ✅ Elimina TODOS los contenedores
3. ✅ Mata cualquier proceso en puerto 8080
4. ✅ Espera 3 segundos
5. ✅ Levanta Evolution con configuración correcta
6. ✅ Espera 20 segundos
7. ✅ Muestra logs
8. ✅ Prueba health check

## ✅ RESULTADO ESPERADO:

```
HTTP/1.1 200 OK
```

## 📋 DESPUÉS:

1. Si curl responde **200 OK**, ve a Vercel
2. Verifica variables:
   - `EVO_BASE_URL = http://31.220.58.83:8080`
   - `EVO_API_KEY = 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb`
3. **Redeploy**
4. Prueba en `/configuracion`

---

**🚀 Cambios subidos a GitHub: commit `5679036`**

**📁 Archivos disponibles:**
- `🚨_PUERTO_8080_OCUPADO.md` - Guía completa con opciones
- `fix-port-8080.sh` - Script bash automatizado

**⚡ EJECUTA EL COMANDO EN EL VPS AHORA!**

