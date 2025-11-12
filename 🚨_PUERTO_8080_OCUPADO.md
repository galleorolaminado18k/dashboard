# 🚨 SOLUCIÓN URGENTE - Puerto 8080 Ocupado

## ❌ ERROR IDENTIFICADO

```
Error response from daemon: failed to bind host port for 0.0.0.0:8080:172.17.0.2:8080/tcp: 
address already in use
```

**Causa**: El puerto 8080 ya está siendo usado por otro contenedor o proceso.

---

## ✅ SOLUCIÓN INMEDIATA (COPIAR Y PEGAR EN EL VPS)

### OPCIÓN 1: Comando único (más rápido) ⭐

```bash
# Detener TODOS los contenedores y liberar puerto 8080
docker ps -q | xargs -r docker stop && docker ps -aq | xargs -r docker rm && fuser -k 8080/tcp 2>/dev/null || true && sleep 3 && docker run -d --name evolution --restart unless-stopped -p 8080:8080 -v ~/evolution-data:/evolution/store -e SERVER_PORT=8080 -e SERVER_HOST=0.0.0.0 -e API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb -e AUTHENTICATION_API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb -e DATABASE_ENABLED=false atendai/evolution-api:latest && sleep 20 && docker logs evolution --tail 30 && curl -i http://127.0.0.1:8080/health
```

### OPCIÓN 2: Paso a paso (más control)

```bash
# 1. Ver qué está usando el puerto 8080
echo "=== Procesos en puerto 8080 ==="
netstat -tulpn | grep :8080
docker ps

# 2. Detener TODOS los contenedores
echo "=== Deteniendo contenedores ==="
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# 3. Matar cualquier proceso en puerto 8080
echo "=== Liberando puerto 8080 ==="
fuser -k 8080/tcp 2>/dev/null || true
sleep 3

# 4. Verificar que el puerto esté libre
echo "=== Verificando puerto ==="
netstat -tulpn | grep :8080 && echo "❌ Puerto aún ocupado" || echo "✅ Puerto libre"

# 5. Levantar Evolution
echo "=== Levantando Evolution ==="
docker run -d --name evolution --restart unless-stopped \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e SERVER_PORT=8080 \
  -e SERVER_HOST=0.0.0.0 \
  -e API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb \
  -e AUTHENTICATION_API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb \
  -e DATABASE_ENABLED=false \
  atendai/evolution-api:latest

# 6. Configurar firewall
ufw allow 8080/tcp
ufw reload

# 7. Esperar y verificar
sleep 25
docker ps
docker logs evolution --tail 30

# 8. Probar
curl -i http://127.0.0.1:8080/health
curl -i http://31.220.58.83:8080/health
```

---

## 🔍 DIAGNÓSTICO RÁPIDO

Si quieres ver qué está usando el puerto antes de detenerlo:

```bash
# Ver procesos en puerto 8080
netstat -tulpn | grep :8080

# Ver contenedores corriendo
docker ps

# Ver TODOS los contenedores (incluso detenidos)
docker ps -a
```

Posibles causas:
- ✅ Contenedor `evolution-postgres` corriendo
- ✅ Contenedor `evolution-api` anterior
- ✅ Contenedor `caddy` mal configurado
- ✅ Proceso de Node.js/Java en puerto 8080

---

## 📋 RESULTADO ESPERADO

Después de ejecutar los comandos:

```bash
✅ Puerto 8080 liberado
✅ Evolution corriendo en docker ps
✅ curl http://127.0.0.1:8080/health → 200 OK
✅ curl http://31.220.58.83:8080/health → 200 OK
```

**Si curl responde 200 OK**, entonces:

1. Ve a Vercel
2. Verifica variables:
   - `EVO_BASE_URL = http://31.220.58.83:8080`
   - `EVO_API_KEY = 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb`
3. Redeploy
4. Prueba en `/configuracion`

---

## 🐛 SI SIGUE FALLANDO

### El puerto sigue ocupado después de detener contenedores:

```bash
# Matar proceso manualmente
fuser -k 8080/tcp

# O identificar el PID y matarlo
lsof -ti:8080 | xargs kill -9

# Verificar
netstat -tulpn | grep :8080
```

### Evolution no levanta:

```bash
# Ver logs completos
docker logs evolution

# Ver logs en tiempo real
docker logs -f evolution

# Reiniciar Evolution
docker restart evolution
```

---

## 💡 PREVENCIÓN FUTURA

Para evitar este problema:

```bash
# Antes de levantar Evolution, siempre detén todo:
docker stop $(docker ps -q) 2>/dev/null || true

# O solo detén contenedores específicos:
docker stop evolution evolution-api evolution-postgres caddy waha
docker rm evolution evolution-api evolution-postgres caddy waha
```

---

## 🎯 COMANDOS ÚTILES

```bash
# Ver qué contenedores están corriendo
docker ps

# Ver TODOS los contenedores
docker ps -a

# Detener TODOS los contenedores
docker stop $(docker ps -q)

# Eliminar TODOS los contenedores
docker rm $(docker ps -aq)

# Ver qué usa el puerto 8080
netstat -tulpn | grep :8080

# Liberar puerto 8080
fuser -k 8080/tcp

# Ver logs de Evolution
docker logs evolution

# Reiniciar Evolution
docker restart evolution
```

---

## ✅ CHECKLIST RÁPIDO

- [ ] Ejecuté comando para detener todos los contenedores
- [ ] Liberé el puerto 8080 con `fuser -k 8080/tcp`
- [ ] Levanté Evolution con `docker run`
- [ ] `docker ps` muestra Evolution corriendo
- [ ] `curl http://127.0.0.1:8080/health` responde 200 OK
- [ ] `curl http://31.220.58.83:8080/health` responde 200 OK
- [ ] Configuré variables en Vercel
- [ ] Hice Redeploy en Vercel
- [ ] Probé en `/configuracion` y apareció el QR

---

**🚀 EJECUTA LA OPCIÓN 1 (comando único) EN EL VPS AHORA!**

**Es el más rápido y hace todo automáticamente** ⚡

