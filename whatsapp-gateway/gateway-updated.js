const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const QRCode = require("qrcode");
const express = require("express");
const fs = require("fs");

const PORT = process.env.PORT || 3010;
const AUTH_FOLDER = "./auth_info_baileys";

// 🔥 URL del webhook de tu Dashboard
const WEBHOOK_URL = "https://dashboard-galle-git-fea-98639c-galleaprobaciones-9369s-projects.vercel.app/api/whatsapp/webhook";

let sock = null;
let currentQR = null;
let isConnected = false;
let connectionError = null;
let lastUpdate = null;
let connectedPhone = null;

// 🔥 Almacenar chats para historial
let chatsCache = [];

function cleanAuth() {
    if (fs.existsSync(AUTH_FOLDER)) {
        fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
        console.log("🧹 Auth limpiado");
    }
}

// 🔥 Función para enviar eventos al webhook
async function sendToWebhook(event, data) {
    if (!WEBHOOK_URL) return;

    try {
        const payload = {
            event: event,
            timestamp: new Date().toISOString(),
            session: "default",
            data: data
        };

        console.log("📤 Enviando al webhook:", event);

        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log("✅ Webhook recibido correctamente");
        } else {
            console.log("⚠️ Webhook respondió con:", response.status);
        }
    } catch (error) {
        console.error("❌ Error enviando al webhook:", error.message);
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

        console.log("🔄 Update:", JSON.stringify({ connection, hasQR: !!qr, lastDisconnect: !!lastDisconnect }));

        if (qr) {
            console.log("📱 QR RECIBIDO!");
            try {
                currentQR = await QRCode.toDataURL(qr);
                console.log("✅ QR convertido a base64");
            } catch (e) {
                console.error("❌ Error convirtiendo QR:", e);
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

            // 🔥 Cargar chats al conectar
            loadChats();
        }
    });

    // 🔥 Escuchar cambios en chats
    sock.ev.on("chats.set", ({ chats }) => {
        console.log("📚 Chats cargados:", chats.length);
        chatsCache = chats.map(c => ({
            id: c.id,
            name: c.name || c.pushName || "",
            unreadCount: c.unreadCount || 0,
            lastMsg: c.lastMessage?.message?.conversation || ""
        }));
    });

    sock.ev.on("chats.upsert", (chats) => {
        for (const chat of chats) {
            const idx = chatsCache.findIndex(c => c.id === chat.id);
            const chatData = {
                id: chat.id,
                name: chat.name || chat.pushName || "",
                unreadCount: chat.unreadCount || 0,
                lastMsg: chat.lastMessage?.message?.conversation || ""
            };
            if (idx >= 0) {
                chatsCache[idx] = chatData;
            } else {
                chatsCache.push(chatData);
            }
        }
    });

    // 🔥 Escuchar mensajes entrantes
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
                        msg.message?.videoMessage?.caption ||
                        "";
            const type = msg.message?.imageMessage ? "image" :
                        msg.message?.audioMessage ? "audio" :
                        msg.message?.videoMessage ? "video" :
                        msg.message?.documentMessage ? "document" : "text";

            console.log("📩 Mensaje de", from, ":", text.substring(0, 50));

            sendToWebhook("messages.upsert", {
                message: {
                    key: msg.key,
                    from: from,
                    pushName: pushName,
                    body: text,
                    type: type,
                    timestamp: msg.messageTimestamp,
                    fromMe: false
                }
            });
        }
    });

    return sock;
}

// 🔥 Cargar chats existentes
async function loadChats() {
    try {
        if (!sock || !isConnected) return;

        // Baileys carga los chats automáticamente
        // pero podemos forzar la carga
        const store = sock.store;
        if (store && store.chats) {
            chatsCache = Object.values(store.chats).map(c => ({
                id: c.id,
                name: c.name || "",
                unreadCount: c.unreadCount || 0,
            }));
            console.log("📚 Chats en cache:", chatsCache.length);
        }
    } catch (e) {
        console.error("Error cargando chats:", e.message);
    }
}

// API REST
const app = express();
app.use(express.json());
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
    if (isConnected) {
        return res.json({ ok: true, isConnected: true, hasQR: false, qr: null, phone: connectedPhone });
    }
    if (currentQR) {
        return res.json({ ok: true, isConnected: false, hasQR: true, qr: currentQR });
    }
    return res.json({ ok: true, isConnected: false, hasQR: false, lastUpdate });
});

app.get("/status", (_, res) => {
    res.json({ ok: true, isConnected, hasQR: !!currentQR, phone: connectedPhone, error: connectionError, lastUpdate });
});

// 🔥 NUEVO: Endpoint para obtener chats
app.get("/chats", async (_, res) => {
    try {
        if (!isConnected) {
            return res.json({ ok: false, error: "No conectado", chats: [] });
        }

        // Devolver chats del cache
        const chats = chatsCache.filter(c => !c.id.includes("@g.us"));

        res.json({
            ok: true,
            chats: chats,
            count: chats.length
        });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message, chats: [] });
    }
});

// 🔥 NUEVO: Endpoint para obtener mensajes de un chat
app.get("/messages/:jid", async (req, res) => {
    try {
        if (!isConnected || !sock) {
            return res.status(503).json({ ok: false, error: "No conectado" });
        }

        const jid = req.params.jid;
        // Baileys no tiene un método directo para obtener mensajes históricos
        // Los mensajes se obtienen a través del evento messages.upsert

        res.json({
            ok: true,
            message: "Use el webhook para recibir mensajes en tiempo real",
            jid
        });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

app.post("/restart", async (_, res) => {
    console.log("🔄 Reiniciando conexión...");
    try {
        if (sock) {
            try { sock.end(); } catch(e) {}
            sock = null;
        }
        currentQR = null;
        isConnected = false;
        connectionError = null;
        chatsCache = [];

        await connectToWhatsApp(true);

        let attempts = 0;
        while (!currentQR && attempts < 10) {
            await new Promise(r => setTimeout(r, 1000));
            attempts++;
        }

        res.json({ ok: true, hasQR: !!currentQR });
    } catch (e) {
        res.status(500).json({ ok: false, error: String(e) });
    }
});

app.post("/send", async (req, res) => {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ ok: false, error: "Falta phone o message" });
    if (!isConnected || !sock) return res.status(503).json({ ok: false, error: "No conectado" });

    try {
        let cleanPhone = phone.replace(/\D/g, "");
        if (!cleanPhone.startsWith("57") && cleanPhone.length === 10) {
            cleanPhone = "57" + cleanPhone;
        }
        const jid = cleanPhone + "@s.whatsapp.net";
        await sock.sendMessage(jid, { text: message });
        console.log("📤 Mensaje enviado a", jid);
        res.json({ ok: true, message: "Enviado" });
    } catch (e) {
        res.status(500).json({ ok: false, error: String(e) });
    }
});

app.post("/logout", async (_, res) => {
    try {
        if (sock) {
            try { await sock.logout(); } catch(e) {}
            sock = null;
        }
        cleanAuth();
        isConnected = false;
        currentQR = null;
        connectedPhone = null;
        chatsCache = [];
        res.json({ ok: true, message: "Sesión cerrada" });
    } catch (e) {
        res.status(500).json({ ok: false, error: String(e) });
    }
});

// Inicio
console.log("=".repeat(50));
console.log("🤖 WhatsApp Gateway - Baileys v6.6.0");
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

