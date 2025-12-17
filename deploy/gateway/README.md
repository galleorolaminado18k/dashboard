Guía rápida: desplegar el gateway en un VPS y mantenerlo siempre activo

Opciones soportadas:
- Docker (recomendado)
- PM2 en VPS (alternativa)

Requisitos del VPS: node 20+, docker o npm/pnpm, 1GB RAM mínimo.

Docker (rápido):
1) Construir la imagen (desde la carpeta raiz del repo):

```bat
cd C:\Users\USUARIO\WebstormProjects\dashboard\deploy\gateway
docker build -t dashboard-gateway:latest .
```

2) Ejecutar el contenedor en background con reinicio automático:

```bat
docker run -d --name dashboard-gateway --restart always -p 3010:3010 dashboard-gateway:latest
```

PM2 (si no quieres Docker):
1) Copiar `gateway-audio-fix.cjs` al VPS y subir `pm2-gateway.json`.
2) Instala Node y PM2 en el VPS:

```bat
# en bash (Linux VPS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

3) Iniciar con PM2 y habilitar arranque al reiniciar:

```bat
pm2 start pm2-gateway.json
pm2 save
pm2 startup
```

Notas de seguridad y buena práctica:
- No guardes claves privadas en el repo. Usa variables de entorno para credenciales (Cloudinary, Supabase, MiPaquete).
- Para alta disponibilidad real, considera usar un servicio gestionado (DigitalOcean App Platform, AWS ECS, Fly, Vercel serverless + webhook relay) y balanceador.
- El contenedor está configurado para reiniciarse siempre con Docker (--restart always) y PM2 tiene `pm2 startup` + `pm2 save`.

