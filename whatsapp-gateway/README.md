# Whatsapp Gateway (Baileys)

Microservicio minimal basado en @whiskeysockets/baileys para exponer QR y estado a un dashboard.

Requisitos: Node 18+, Docker (opcional)

Instalación (en VPS):

```bash
cd whatsapp-gateway
npm install
cp .env.example .env # editar si hace falta
npm start
```

Uso en producción (pm2):

```bash
npm install -g pm2
pm2 start index.js --name whatsapp-gateway
pm2 save
```

Endpoints:
- GET /qr -> { hasQR, isConnected, qr }
- GET /status -> { isConnected }
- POST /send-message { to, text }

Autenticación: el servicio usa `useMultiFileAuthState('./baileys_auth')` para guardar credenciales localmente en la carpeta `baileys_auth`.

Si quieres que lo despliegue en el VPS, dime la IP/SSH y lo preparo (scripting). No subas .env con claves públicamente.

