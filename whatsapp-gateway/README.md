# WhatsApp Gateway (BuilderBot)

Microservicio basado en @builderbot/bot con provider Baileys para exponer QR y estado al dashboard.

## Características

- ✅ Basado en BuilderBot (librería profesional para WhatsApp bots)
- ✅ Provider Baileys integrado
- ✅ API REST simple para dashboard
- ✅ Gestión automática de sesiones
- ✅ Reconexión automática

## Requisitos

- Node.js 18+
- npm o pnpm

## Instalación (en VPS o local)

```bash
cd whatsapp-gateway
npm install
cp .env.example .env # editar si hace falta
npm start
```

## Uso en producción (pm2)

```bash
npm install -g pm2
pm2 start index.js --name builderbot-gateway
pm2 save
pm2 startup
```

## Endpoints API

- `GET /health` → { ok, service }
- `GET /qr` → { ok, isConnected, hasQR, qr }
- `GET /status` → { ok, isConnected, hasQR }
- `POST /send-message` { to, text } → { ok }

## Variables de entorno

```env
PORT=3010  # Puerto del servidor (default: 3010)
```

## Autenticación

BuilderBot/Baileys guarda las credenciales automáticamente en la carpeta `./bot_sessions/` (creada por el provider).

## Integración con Dashboard

En tu proyecto dashboard crea/edita `.env.local`:

```env
BAILEYS_GATEWAY_URL=http://localhost:3010
```

O en Vercel (producción):

```env
BAILEYS_GATEWAY_URL=http://IP_VPS:3010
```

## Despliegue con Nginx (opcional)

Si quieres exponer en puerto 80/443, usa el archivo `deploy/setup-wa-gateway.sh`:

```bash
chmod +x deploy/setup-wa-gateway.sh
sudo ./deploy/setup-wa-gateway.sh
```

## Notas

- BuilderBot es más estable y tiene mejor soporte que Baileys directo
- La carpeta `bot_sessions/` contiene las credenciales (hacer backup)
- Para resetear: `rm -rf bot_sessions/` y reiniciar el servicio
- BuilderBot incluye manejo automático de reconexiones

## Documentación

- [BuilderBot Docs](https://builderbot.app/en)
- [Provider Baileys](https://builderbot.app/en/providers/baileys)

