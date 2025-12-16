#!/bin/bash
# Script v5 - Baileys con versión específica que funciona
set -e

echo "🛑 Deteniendo servicios..."
pm2 delete wa-gateway 2>/dev/null || true
pm2 delete builderbot-gateway 2>/dev/null || true

mkdir -p /root/whatsapp-gateway
cd /root/whatsapp-gateway

echo "🧹 Limpiando todo..."
rm -rf node_modules bot_sessions auth_info_baileys package-lock.json .npm

echo "📝 Creando package.json..."
cat > package.json << 'EOF'
{
  "name": "wa-gateway",
  "version": "2.0.0",
  "type": "module",
  "scripts": { "start": "node index.js" },
  "dependencies": {
    "@whiskeysockets/baileys": "6.6.0",
    "@hapi/boom": "^10.0.1",
    "qrcode": "^1.5.3",
    "express": "^4.18.2",
    "pino": "^8.16.0"
  }
}
EOF

echo "📝 Creando index.js..."
cat > index.js << 'ENDOFFILE'
import pkg from "@whiskeysockets/baileys";
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = pkg;
import Boom from "@hapi/boom";
import express from "express";
import QRCode from "qrcode";
import pino from "pino";
import fs from "fs";

const PORT = process.env.PORT || 3010;
const AUTH_FOLDER = "./auth_info_baileys";

let sock = null;
let currentQR = null;
let isConnected = false;
let connectionError = null;
let lastUpdate = null;

function cleanAuth() {
    if (fs.existsSync(AUTH_FOLDER)) {
        fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
        console.log("🧹 Auth limpiado");
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
            console.log("📱 ¡QR RECIBIDO!");
            console.log("📱 QR raw (primeros 50 chars):", qr.substring(0, 50));
            try {
                currentQR = await QRCode.toDataURL(qr);
                console.log("✅ QR convertido a base64 dataURL");
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
            console.log("❌ Conexión cerrada. Status:", statusCode, "Reconectar:", shouldReconnect);
            isConnected = false;
            lastUpdate = new Date().toISOString();

            if (shouldReconnect) {
                console.log("🔄 Reconectando en 5 segundos...");
                setTimeout(() => connectToWhatsApp(false), 5000);
            }
        } else if (connection === "open") {
            console.log("✅ ¡CONECTADO A WHATSAPP!");
            isConnected = true;
            currentQR = null;
            connectionError = null;
            lastUpdate = new Date().toISOString();
        }
    });

    sock.ev.on("messages.upsert", (m) => {
        if (m.messages[0] && !m.messages[0].key.fromMe) {
            const msg = m.messages[0];
            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "[media]";
            console.log(`📩 Mensaje de ${msg.key.remoteJid}: ${text}`);
        }
    });

    return sock;
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
    res.json({ ok: true, isConnected, hasQR: !!currentQR, uptime: process.uptime() });
});

app.get("/qr", (_, res) => {
    console.log(`📡 GET /qr - connected:${isConnected} hasQR:${!!currentQR}`);

    if (isConnected) {
        return res.json({ ok: true, isConnected: true, hasQR: false, qr: null, message: "WhatsApp conectado" });
    }
    if (currentQR) {
        return res.json({ ok: true, isConnected: false, hasQR: true, qr: currentQR, message: "Escanea el QR" });
    }
    if (connectionError) {
        return res.json({ ok: false, isConnected: false, hasQR: false, error: connectionError });
    }
    return res.json({ ok: true, isConnected: false, hasQR: false, message: "Esperando QR...", lastUpdate });
});

app.get("/status", (_, res) => {
    res.json({ ok: true, isConnected, hasQR: !!currentQR, error: connectionError, lastUpdate });
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

        await connectToWhatsApp(true);

        // Esperar para el QR
        let attempts = 0;
        while (!currentQR && attempts < 10) {
            await new Promise(r => setTimeout(r, 1000));
            attempts++;
        }

        res.json({ ok: true, hasQR: !!currentQR, message: currentQR ? "QR generado" : "Esperando QR..." });
    } catch (e) {
        console.error("❌ Error en restart:", e);
        res.status(500).json({ ok: false, error: String(e) });
    }
});

app.post("/send-message", async (req, res) => {
    const { to, text } = req.body;
    if (!to || !text) return res.status(400).json({ ok: false, error: "Falta to o text" });
    if (!isConnected || !sock) return res.status(503).json({ ok: false, error: "No conectado" });

    try {
        const jid = `${to.replace(/\D/g, "")}@s.whatsapp.net`;
        await sock.sendMessage(jid, { text });
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
        res.json({ ok: true, message: "Sesión cerrada" });
    } catch (e) {
        res.status(500).json({ ok: false, error: String(e) });
    }
});

// Inicio
console.log("=".repeat(50));
console.log("🤖 WhatsApp Gateway - Baileys v6.6.0");
console.log("=".repeat(50));

app.listen(PORT, "0.0.0.0", async () => {
    console.log(`🌐 API en http://0.0.0.0:${PORT}`);
    console.log("🚀 Conectando a WhatsApp...");

    try {
        await connectToWhatsApp(true);
        console.log("✅ Proceso de conexión iniciado");
    } catch (e) {
        console.error("❌ Error inicial:", e);
        connectionError = String(e);
    }
});
ENDOFFILE

echo "📦 Instalando dependencias (puede tomar 1-2 minutos)..."
npm install --legacy-peer-deps 2>&1

echo ""
echo "🚀 Iniciando gateway..."
pm2 start index.js --name wa-gateway --watch
pm2 save

echo ""
echo "⏳ Esperando 15 segundos para que genere el QR..."
sleep 15

echo ""
echo "=== LOGS ==="
pm2 logs wa-gateway --lines 30 --nostream

echo ""
echo "=== HEALTH ==="
curl -s http://localhost:3010/health

echo ""
echo "=== QR ==="
curl -s http://localhost:3010/qr | head -c 300

echo ""
echo ""
echo "✅ Gateway listo!"
echo "📱 En Vercel configura: BAILEYS_GATEWAY_URL = http://31.220.58.83:3010"

