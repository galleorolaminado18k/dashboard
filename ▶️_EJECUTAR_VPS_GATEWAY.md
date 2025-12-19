# 🚀 FIX AUDIO - EJECUTAR EN VPS

## El problema es que package.json usa "type": "module"
## Solución: usar extensión .cjs para CommonJS

## En el VPS ejecuta esto:

```bash
cd /root/whatsapp-gateway
pm2 delete gateway 2>/dev/null

# Crear archivo con extensión .cjs
cat > gateway-audio.cjs << 'EOF'
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const QRCode = require("qrcode");
const express = require("express");
const fs = require("fs");

const PORT = process.env.PORT || 3010;
const AUTH_FOLDER = "./auth_info_baileys";
const WEBHOOK_URL = "https://dashboard-galle-git-fea-98639c-galleaprobaciones-9369s-projects.vercel.app/api/webhook-public";

let sock = null;
let currentQR = null;
let isConnected = false;
let connectionError = null;
let lastUpdate = null;
let connectedPhone = null;

function cleanAuth() {
    if (fs.existsSync(AUTH_FOLDER)) {
        fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
        console.log("Auth limpiado");
    }
}

async function sendToWebhook(event, data) {
    if (!WEBHOOK_URL) return;
    try {
        const payload = { event, timestamp: new Date().toISOString(), session: "default", data };
        console.log("Enviando al webhook:", event);
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (response.ok) console.log("Webhook recibido");
    } catch (error) {
        console.error("Error webhook:", error.message);
    }
}

async function connectToWhatsApp(forceNew = false) {
    if (forceNew) cleanAuth();
    console.log("Iniciando conexion WhatsApp...");
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const logger = pino({ level: "silent" });

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger,
        browser: ["Galle Dashboard", "Chrome", "22.0"],
        connectTimeoutMs: 60000,
        qrTimeout: 60000,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;
        console.log("Update:", JSON.stringify({ connection, hasQR: !!qr }));

        if (qr) {
            console.log("QR RECIBIDO!");
            try { currentQR = await QRCode.toDataURL(qr); } catch (e) { currentQR = qr; }
            isConnected = false;
            lastUpdate = new Date().toISOString();
        }

        if (connection === "close") {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log("Conexion cerrada. Status:", statusCode);
            isConnected = false;
            connectedPhone = null;
            lastUpdate = new Date().toISOString();
            sendToWebhook("connection.update", { status: "disconnected", statusCode });
            if (shouldReconnect) {
                console.log("Reconectando en 5 segundos...");
                setTimeout(() => connectToWhatsApp(false), 5000);
            }
        } else if (connection === "open") {
            console.log("CONECTADO A WHATSAPP!");
            isConnected = true;
            currentQR = null;
            connectionError = null;
            lastUpdate = new Date().toISOString();
            try {
                const user = sock.user;
                if (user && user.id) {
                    connectedPhone = user.id.split(":")[0].split("@")[0];
                    console.log("Numero conectado:", connectedPhone);
                }
            } catch(e) {}
            sendToWebhook("connection.update", { status: "connected", phone: connectedPhone });
        }
    });

    sock.ev.on("messages.upsert", async (m) => {
        const messages = m.messages || [];
        for (const msg of messages) {
            if (msg.key.fromMe) continue;
            if (msg.key.remoteJid?.includes("@g.us")) continue;
            const from = msg.key.remoteJid;
            const pushName = msg.pushName || "";
            const text = msg.message?.conversation ||
                        msg.message?.extendedTextMessage?.text ||
                        msg.message?.imageMessage?.caption ||
                        msg.message?.videoMessage?.caption || "";
            const type = msg.message?.imageMessage ? "image" :
                        msg.message?.audioMessage ? "audio" :
                        msg.message?.videoMessage ? "video" :
                        msg.message?.documentMessage ? "document" : "text";
            console.log("Mensaje de", from, ":", text.substring(0, 50));
            sendToWebhook("messages.upsert", {
                message: { key: msg.key, from, pushName, body: text, type, timestamp: msg.messageTimestamp, fromMe: false }
            });
        }
    });

    return sock;
}

function dataUrlToBuffer(dataUrl) {
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return null;
    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    return { buffer, mimeType };
}

async function getMediaBuffer(mediaUrl, expectedMimetype) {
    if (mediaUrl.startsWith('data:')) {
        console.log('Convirtiendo data URL a buffer...');
        const result = dataUrlToBuffer(mediaUrl);
        if (result) {
            console.log('Buffer creado:', result.buffer.length, 'bytes, tipo:', result.mimeType);
            return { buffer: result.buffer, mimetype: result.mimeType };
        }
        throw new Error('Data URL invalido');
    }
    
    console.log('Descargando media desde URL:', mediaUrl.substring(0, 80) + '...');
    const response = await fetch(mediaUrl);
    if (!response.ok) {
        throw new Error('Error descargando: ' + response.status);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || expectedMimetype || 'application/octet-stream';
    console.log('Descargado:', buffer.length, 'bytes, tipo:', contentType);
    return { buffer, mimetype: contentType };
}

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});

app.get("/health", (_, res) => {
    res.json({ ok: true, isConnected, hasQR: !!currentQR, phone: connectedPhone, uptime: process.uptime() });
});

app.get("/qr", (_, res) => {
    if (isConnected) return res.json({ ok: true, isConnected: true, hasQR: false, qr: null, phone: connectedPhone });
    if (currentQR) return res.json({ ok: true, isConnected: false, hasQR: true, qr: currentQR });
    return res.json({ ok: true, isConnected: false, hasQR: false, lastUpdate });
});

app.get("/status", (_, res) => {
    res.json({ ok: true, isConnected, hasQR: !!currentQR, phone: connectedPhone, error: connectionError, lastUpdate });
});

app.post("/restart", async (_, res) => {
    console.log("Reiniciando conexion...");
    try {
        if (sock) { try { sock.end(); } catch(e) {} sock = null; }
        currentQR = null; isConnected = false; connectionError = null;
        await connectToWhatsApp(true);
        let attempts = 0;
        while (!currentQR && attempts < 10) { await new Promise(r => setTimeout(r, 1000)); attempts++; }
        res.json({ ok: true, hasQR: !!currentQR });
    } catch (e) {
        res.status(500).json({ ok: false, error: String(e) });
    }
});

app.post("/send", async (req, res) => {
    const { phone, message, type = "text", mediaUrl, mimetype, filename, caption } = req.body;
    if (!phone) return res.status(400).json({ ok: false, error: "Falta phone" });
    if (type === "text" && !message) return res.status(400).json({ ok: false, error: "Falta message" });
    if (type !== "text" && !mediaUrl) return res.status(400).json({ ok: false, error: "Falta mediaUrl para media" });
    if (!isConnected || !sock) return res.status(503).json({ ok: false, error: "No conectado" });

    try {
        let cleanPhone = phone.replace(/\D/g, "");
        if (!cleanPhone.startsWith("57") && cleanPhone.length === 10) cleanPhone = "57" + cleanPhone;
        const jid = cleanPhone + "@s.whatsapp.net";

        let msgContent;
        const captionText = caption || message || "";

        if (type !== "text") {
            const { buffer, mimetype: detectedMime } = await getMediaBuffer(mediaUrl, mimetype);
            const finalMimetype = mimetype || detectedMime;

            switch (type) {
                case "image":
                    msgContent = { image: buffer, caption: captionText, mimetype: finalMimetype };
                    break;
                case "video":
                    msgContent = { video: buffer, caption: captionText, mimetype: finalMimetype };
                    break;
                case "audio":
                    let audioMime = finalMimetype;
                    if (audioMime && audioMime.includes('webm')) {
                        audioMime = 'audio/ogg; codecs=opus';
                    }
                    msgContent = { audio: buffer, mimetype: audioMime || 'audio/ogg; codecs=opus', ptt: true };
                    break;
                case "document":
                    msgContent = { document: buffer, mimetype: finalMimetype || "application/pdf", fileName: filename || "documento" };
                    break;
                default:
                    msgContent = { text: message };
            }
        } else {
            msgContent = { text: message };
        }

        await sock.sendMessage(jid, msgContent);
        console.log("Mensaje enviado a", jid, "tipo:", type);
        res.json({ ok: true, message: "Enviado", type });
    } catch (e) {
        console.error("Error enviando mensaje:", e);
        res.status(500).json({ ok: false, error: String(e) });
    }
});

app.post("/logout", async (_, res) => {
    try {
        if (sock) { try { await sock.logout(); } catch(e) {} sock = null; }
        cleanAuth();
        isConnected = false; currentQR = null; connectedPhone = null;
        res.json({ ok: true, message: "Sesion cerrada" });
    } catch (e) {
        res.status(500).json({ ok: false, error: String(e) });
    }
});

console.log("==================================================");
console.log("WhatsApp Gateway - Baileys + Soporte Audio");
console.log("Webhook:", WEBHOOK_URL);
console.log("==================================================");

app.listen(PORT, "0.0.0.0", async () => {
    console.log("API en http://0.0.0.0:" + PORT);
    console.log("Conectando a WhatsApp...");
    try {
        await connectToWhatsApp(false);
        console.log("Proceso de conexion iniciado");
    } catch (e) {
        console.error("Error inicial:", e);
        connectionError = String(e);
    }
});
EOF

# Iniciar con .cjs
pm2 start gateway-audio.cjs --name gateway
pm2 save
pm2 logs gateway --lines 30
```

## Verificar
```bash
curl http://localhost:3010/health
```
