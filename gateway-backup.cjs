// gateway.cjs - pegar completo en /root/whatsapp-gateway/gateway.cjs
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
let chatsCache = [];

function cleanAuth() {
    if (fs.existsSync(AUTH_FOLDER)) {
        fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
        console.log("🧹 Auth limpiado");
    }
}

async function sendToWebhook(event, data) {
    if (!WEBHOOK_URL) return;
    try {
        const payload = { event, timestamp: new Date().toISOString(), session: "default", data };
        console.log("📤 Enviando al webhook:", event);
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (response.ok) console.log("✅ Webhook recibido");
    } catch (error) {
        console.error("❌ Error webhook:", error.message);
    }
}

async function connectToWhatsApp(forceNew = false) {
    if (forceNew) cleanAuth();
    console.log("📱 Iniciando conexión WhatsApp...");

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
        console.log("🔄 Update:", JSON.stringify({ connection, hasQR: !!qr }));

        if (qr) {
            console.log("📱 QR RECIBIDO!");
            try {
                currentQR = await QRCode.toDataURL(qr);
            } catch (e) {
                currentQR = qr;
            }
            isConnected = false;
            lastUpdate = new Date().toISOString();
        }

        if (connection === "close") {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log("❌ Conexión cerrada. Status:", statusCode);
            isConnected = false;
            connectedPhone = null;
            lastUpdate = new Date().toISOString();
            sendToWebhook("connection.update", { status: "disconnected", statusCode });
            if (shouldReconnect) {
                console.log("🔄 Reconectando en 5 segundos...");
                setTimeout(() => connectToWhatsApp(false), 5000);
            }
        } else if (connection === "open") {
            console.log("✅ CONECTADO A WHATSAPP!");
            isConnected = true;
            currentQR = null;
            connectionError = null;
            lastUpdate = new Date().toISOString();
            try {
                const user = sock.user;
                if (user && user.id) {
                    connectedPhone = user.id.split(":")[0].split("@")[0];
                    console.log("📱 Número conectado:", connectedPhone);
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

            // ⚠️ FILTRO CRÍTICO: Ignorar actualizaciones de estado y broadcasts
            if (msg.key.remoteJid === 'status@broadcast' || msg.key.remoteJid?.includes('@broadcast')) {
                console.log('🔕 Ignorando actualización de estado/broadcast');
                continue;
            }

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
            console.log("📩 Mensaje de", from, ":", (String(text) || "").substring(0, 50));
            sendToWebhook("messages.upsert", {
                message: { key: msg.key, from, pushName, body: text, type, timestamp: msg.messageTimestamp, fromMe: false }
            });
        }
    });

    return sock;
}

// Función robusta para convertir data URL a Buffer
function dataUrlToBuffer(dataUrl) {
    try {
        if (typeof dataUrl !== 'string') return null;
        const base64Marker = ';base64,';
        const idx = dataUrl.indexOf(base64Marker);
        if (idx === -1) {
            console.log('⚠️ dataUrlToBuffer: no se encontró ";base64," en el Data URL');
            try { fs.writeFileSync('/tmp/failed_dataurl_start.txt', String(dataUrl).substring(0, 2000)); } catch(e) {}
            return null;
        }

        const mimeSection = dataUrl.substring(5, idx); // después de 'data:'
        let mimeType = 'application/octet-stream';
        if (mimeSection && mimeSection.length > 0) {
            mimeType = mimeSection.split(';')[0] || mimeType;
        }

        const base64Data = dataUrl.substring(idx + base64Marker.length);
        const cleanedBase64 = base64Data.replace(/\s+/g, '');

        if (cleanedBase64.length < 10) {
            console.log('⚠️ dataUrlToBuffer: base64 demasiado corto');
            try { fs.writeFileSync('/tmp/failed_dataurl_start.txt', String(dataUrl).substring(0, 2000)); } catch(e) {}
            return null;
        }

        const buffer = Buffer.from(cleanedBase64, 'base64');
        if (!buffer || buffer.length === 0) {
            console.log('⚠️ dataUrlToBuffer: Buffer creado vacío');
            try { fs.writeFileSync('/tmp/failed_dataurl_start.txt', String(dataUrl).substring(0, 2000)); } catch(e) {}
            return null;
        }

        return { buffer, mimeType };
    } catch (err) {
        console.error('❌ dataUrlToBuffer: excepción parsing Data URL:', err && err.message ? err.message : err);
        try { fs.writeFileSync('/tmp/failed_dataurl_start.txt', String(dataUrl).substring(0, 2000)); } catch(e) {}
        return null;
    }
}

// Función para obtener media como buffer (soporta URLs y data URLs)
async function getMediaBuffer(mediaUrl, expectedMimetype) {
    if (typeof mediaUrl !== 'string') throw new Error('mediaUrl inválido');

    // Si es un data URL (base64), convertir a buffer
    if (mediaUrl.startsWith('data:')) {
        console.log('📦 Convirtiendo data URL a buffer...');
        const result = dataUrlToBuffer(mediaUrl);
        if (result) {
            console.log('✅ Buffer creado:', result.buffer.length, 'bytes, tipo:', result.mimeType);
            return { buffer: result.buffer, mimetype: result.mimeType };
        }
        try {
            fs.writeFileSync('/tmp/failed_dataurl_start.txt', String(mediaUrl).substring(0, 2000));
            console.log('🔍 Data URL problemático volcado a /tmp/failed_dataurl_start.txt');
        } catch (e) {
            console.log('⚠️ No se pudo escribir /tmp/failed_dataurl_start.txt:', e && e.message);
        }
        throw new Error('Data URL inválido');
    }

    // Si es una URL normal, descargar
    console.log('📥 Descargando media desde URL:', mediaUrl.substring(0, 80) + '...');
    const response = await fetch(mediaUrl);
    if (!response.ok) {
        throw new Error('Error descargando: ' + response.status);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || expectedMimetype || 'application/octet-stream';
    console.log('✅ Descargado:', buffer.length, 'bytes, tipo:', contentType);
    return { buffer, mimetype: contentType };
}

// API REST
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
    console.log("🔄 Reiniciando conexión...");
    try {
        if (sock) { try { sock.end(); } catch(e) {} sock = null; }
        currentQR = null; isConnected = false; connectionError = null; chatsCache = [];
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
                    let audioMime = finalMimetype || "";
                    if (audioMime.includes('webm')) {
                        audioMime = 'audio/ogg; codecs=opus';
                    }
                    msgContent = { audio: buffer, mimetype: audioMime, ptt: true };
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
        console.log("📤 Mensaje enviado a", jid, "tipo:", type);
        res.json({ ok: true, message: "Enviado", type });
    } catch (e) {
        console.error("❌ Error enviando mensaje:", e);
        res.status(500).json({ ok: false, error: String(e) });
    }
});

app.post("/logout", async (_, res) => {
    try {
        if (sock) { try { await sock.logout(); } catch(e) {} sock = null; }
        cleanAuth();
        isConnected = false; currentQR = null; connectedPhone = null; chatsCache = [];
        res.json({ ok: true, message: "Sesión cerrada" });
    } catch (e) {
        res.status(500).json({ ok: false, error: String(e) });
    }
});

// Inicio
console.log("=".repeat(50));
console.log("🤖 WhatsApp Gateway - Baileys + Soporte Audio");
console.log("📡 Webhook:", WEBHOOK_URL);
console.log("=".repeat(50));

app.listen(PORT, "0.0.0.0", async () => {
    console.log("🌐 API en http://0.0.0.0:" + PORT);
    console.log("🚀 Conectando a WhatsApp...");
    try {
        await connectToWhatsApp(false);
        console.log("✅ Proceso de conexión iniciado");
    } catch (e) {
        console.error("❌ Error inicial:", e);
        connectionError = String(e);
    }
});
