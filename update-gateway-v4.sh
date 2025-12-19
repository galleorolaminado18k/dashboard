#!/bin/bash
# Script v4 - Usa @whiskeysockets/baileys directamente
set -e

echo "🛑 Deteniendo servicios..."
pm2 delete builderbot-gateway 2>/dev/null || true
pm2 delete wa-gateway 2>/dev/null || true

mkdir -p /root/whatsapp-gateway
cd /root/whatsapp-gateway

echo "🧹 Limpiando..."
rm -rf node_modules bot_sessions auth_info_baileys package-lock.json

echo "📝 Creando package.json con Baileys directo..."
cat > package.json << 'EOF'
{
  "name": "wa-gateway",
  "version": "2.0.0",
  "type": "module",
  "scripts": { "start": "node index.js" },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.7.16",
    "qrcode": "^1.5.4",
    "express": "^4.21.0",
    "pino": "^9.5.0"
  }
}
EOF

echo "📝 Creando index.js con Baileys puro..."
cat > index.js << 'ENDOFFILE'
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys"
import { Boom } from "@hapi/boom"
import express from "express"
import QRCode from "qrcode"
import pino from "pino"
import fs from "fs"

const PORT = process.env.PORT || 3010
const AUTH_FOLDER = "./auth_info_baileys"

let sock = null
let currentQR = null
let isConnected = false
let connectionError = null
let lastUpdate = null

// Limpiar auth para forzar nuevo QR
function cleanAuth() {
    if (fs.existsSync(AUTH_FOLDER)) {
        fs.rmSync(AUTH_FOLDER, { recursive: true, force: true })
        console.log("🧹 Auth limpiado")
    }
}

async function connectToWhatsApp(forceNew = false) {
    if (forceNew) cleanAuth()

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER)

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: "warn" }),
        browser: ["Galle Dashboard", "Chrome", "1.0.0"],
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update

        console.log("🔄 connection.update:", JSON.stringify({ connection, hasQR: !!qr }))

        if (qr) {
            console.log("📱 QR Code recibido!")
            try {
                currentQR = await QRCode.toDataURL(qr)
                console.log("✅ QR convertido a dataURL")
            } catch (e) {
                currentQR = qr
                console.log("⚠️ Usando QR raw")
            }
            isConnected = false
            lastUpdate = new Date().toISOString()
        }

        if (connection === "close") {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log("❌ Conexión cerrada. Reconectar:", shouldReconnect)
            isConnected = false
            lastUpdate = new Date().toISOString()

            if (shouldReconnect) {
                setTimeout(() => connectToWhatsApp(false), 3000)
            }
        } else if (connection === "open") {
            console.log("✅ ¡Conectado a WhatsApp!")
            isConnected = true
            currentQR = null
            connectionError = null
            lastUpdate = new Date().toISOString()
        }
    })

    sock.ev.on("messages.upsert", (m) => {
        if (m.messages[0]?.key?.fromMe === false) {
            const msg = m.messages[0]
            console.log(`📩 Mensaje de ${msg.key.remoteJid}: ${msg.message?.conversation || "[media]"}`)
        }
    })

    return sock
}

// API REST
const app = express()
app.use(express.json())
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    res.header("Access-Control-Allow-Headers", "Content-Type")
    if (req.method === "OPTIONS") return res.sendStatus(200)
    next()
})

app.get("/health", (_, res) => {
    res.json({ ok: true, isConnected, hasQR: !!currentQR, uptime: process.uptime() })
})

app.get("/qr", (_, res) => {
    console.log(`📡 GET /qr - connected:${isConnected} hasQR:${!!currentQR}`)

    if (isConnected) {
        return res.json({ ok: true, isConnected: true, hasQR: false, qr: null, message: "WhatsApp conectado" })
    }
    if (currentQR) {
        return res.json({ ok: true, isConnected: false, hasQR: true, qr: currentQR, message: "Escanea el QR" })
    }
    if (connectionError) {
        return res.json({ ok: false, isConnected: false, hasQR: false, error: connectionError })
    }
    return res.json({ ok: true, isConnected: false, hasQR: false, message: "Esperando QR...", lastUpdate })
})

app.get("/status", (_, res) => {
    res.json({ ok: true, isConnected, hasQR: !!currentQR, error: connectionError, lastUpdate })
})

app.post("/restart", async (_, res) => {
    console.log("🔄 Reiniciando...")
    try {
        if (sock) {
            sock.end()
            sock = null
        }
        currentQR = null
        isConnected = false
        connectionError = null

        await connectToWhatsApp(true)

        // Esperar un poco para el QR
        await new Promise(r => setTimeout(r, 5000))

        res.json({ ok: true, hasQR: !!currentQR, message: "Reiniciado" })
    } catch (e) {
        res.status(500).json({ ok: false, error: String(e) })
    }
})

app.post("/send-message", async (req, res) => {
    const { to, text } = req.body
    if (!to || !text) return res.status(400).json({ ok: false, error: "Falta to o text" })
    if (!isConnected || !sock) return res.status(503).json({ ok: false, error: "No conectado" })

    try {
        const jid = `${to.replace(/\D/g, "")}@s.whatsapp.net`
        await sock.sendMessage(jid, { text })
        res.json({ ok: true, message: "Enviado" })
    } catch (e) {
        res.status(500).json({ ok: false, error: String(e) })
    }
})

app.post("/logout", async (_, res) => {
    try {
        if (sock) {
            await sock.logout()
            sock = null
        }
        cleanAuth()
        isConnected = false
        currentQR = null
        res.json({ ok: true, message: "Sesión cerrada" })
    } catch (e) {
        res.status(500).json({ ok: false, error: String(e) })
    }
})

// Inicio
console.log("=".repeat(50))
console.log("🤖 WhatsApp Gateway - Baileys Direct v2")
console.log("=".repeat(50))

app.listen(PORT, "0.0.0.0", async () => {
    console.log(`🌐 API en http://0.0.0.0:${PORT}`)
    console.log("🚀 Iniciando conexión WhatsApp...")

    try {
        await connectToWhatsApp(true)
    } catch (e) {
        console.error("❌ Error inicial:", e)
    }
})
ENDOFFILE

echo "📦 Instalando dependencias..."
npm install

echo "🚀 Iniciando gateway..."
pm2 start index.js --name wa-gateway
pm2 save

echo ""
echo "⏳ Esperando 10 segundos..."
sleep 10

echo ""
echo "=== LOGS ==="
pm2 logs wa-gateway --lines 25 --nostream

echo ""
echo "=== PRUEBA QR ==="
curl -s http://localhost:3010/qr | head -c 500

echo ""
echo ""
echo "✅ Gateway listo!"
echo "📱 Vercel: BAILEYS_GATEWAY_URL = http://31.220.58.83:3010"

