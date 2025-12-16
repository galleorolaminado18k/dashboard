#!/bin/bash
# Script para actualizar el gateway BuilderBot en VPS
# Ejecutar como: bash update-gateway.sh

set -e

echo "🛑 Deteniendo gateway anterior..."
pm2 stop builderbot-gateway 2>/dev/null || true
pm2 delete builderbot-gateway 2>/dev/null || true

echo "📁 Preparando directorio..."
mkdir -p /root/whatsapp-gateway
cd /root/whatsapp-gateway

echo "🧹 Limpiando sesiones..."
rm -rf bot_sessions .wwebjs_* auth_info_baileys

echo "📝 Creando index.js..."
cat > index.js << 'ENDOFFILE'
import "dotenv/config"
import { createBot, createProvider, createFlow, addKeyword, EVENTS } from "@builderbot/bot"
import { BaileysProvider } from "@builderbot/provider-baileys"
import express from "express"
import QRCode from "qrcode"
import fs from "fs"
import path from "path"

const PORT = process.env.PORT || 3010
let providerInstance = null, currentQR = null, isConnected = false, connectionError = null, lastUpdate = null, botReady = false

const welcomeFlow = addKeyword(EVENTS.WELCOME).addAction(async (ctx) => console.log(`📩 ${ctx.from}: ${ctx.body}`))

function cleanSessions() {
    ["bot_sessions", "auth_info_baileys"].forEach(dir => {
        const p = path.join(process.cwd(), dir)
        if (fs.existsSync(p)) { fs.rmSync(p, { recursive: true, force: true }); console.log(`🧹 ${dir} limpiado`) }
    })
}

async function initBot(forceNew = false) {
    console.log("🚀 Iniciando BuilderBot...")
    if (forceNew) cleanSessions()

    const provider = createProvider(BaileysProvider, {
        gifPlayback: false,
        usePairingCode: false,
        browser: ["GalleDashboard", "Chrome", "1.0.0"],
    })
    providerInstance = provider

    provider.on("preinit", (args) => {
        console.log("📡 preinit event")
        const sock = args?.sock || args?.socket || args
        if (sock?.ev) {
            sock.ev.on("connection.update", async (update) => {
                console.log("🔄 Baileys connection.update:", JSON.stringify(update))
                if (update.qr) {
                    try { currentQR = await QRCode.toDataURL(update.qr) } catch { currentQR = update.qr }
                    isConnected = false
                    lastUpdate = new Date().toISOString()
                    console.log("✅ QR CAPTURADO!")
                }
                if (update.connection === "open") {
                    console.log("✅ CONECTADO!")
                    isConnected = true; currentQR = null; connectionError = null
                    lastUpdate = new Date().toISOString()
                }
                if (update.connection === "close") {
                    console.log("❌ Desconectado")
                    isConnected = false
                    lastUpdate = new Date().toISOString()
                }
            })
        }
    })

    provider.on("require_action", async (data) => {
        console.log("📱 require_action:", JSON.stringify(data))
        const qr = data?.code || data?.qr
        if (qr) {
            try { currentQR = await QRCode.toDataURL(qr) } catch { currentQR = qr }
            isConnected = false
            lastUpdate = new Date().toISOString()
            console.log("✅ QR de require_action!")
        }
    })

    provider.on("ready", () => {
        console.log("✅ Provider ready!")
        isConnected = true; currentQR = null; connectionError = null
        lastUpdate = new Date().toISOString()
    })

    provider.on("auth_failure", (e) => {
        console.error("❌ Auth failure:", e)
        isConnected = false; connectionError = String(e)
        lastUpdate = new Date().toISOString()
    })

    await createBot({ flow: createFlow([welcomeFlow]), provider, database: { name: "memory" } })
    botReady = true
    console.log("✅ Bot creado")
    await new Promise(r => setTimeout(r, 3000))
    return provider
}

const app = express()
app.use(express.json())
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    res.header("Access-Control-Allow-Headers", "Content-Type")
    if (req.method === "OPTIONS") return res.sendStatus(200)
    next()
})

app.get("/health", (_, res) => res.json({ ok: true, botReady, isConnected, hasQR: !!currentQR }))

app.get("/qr", (_, res) => {
    console.log(`📡 GET /qr - connected:${isConnected} hasQR:${!!currentQR}`)
    if (isConnected) return res.json({ ok: true, isConnected: true, hasQR: false, qr: null, message: "Conectado" })
    if (currentQR) return res.json({ ok: true, isConnected: false, hasQR: true, qr: currentQR, message: "Escanea QR" })
    if (connectionError) return res.json({ ok: false, isConnected: false, hasQR: false, error: connectionError })
    return res.json({ ok: true, isConnected: false, hasQR: false, message: "Esperando QR...", lastUpdate })
})

app.get("/status", (_, res) => res.json({ ok: true, isConnected, hasQR: !!currentQR, botReady, error: connectionError }))

app.post("/restart", async (_, res) => {
    console.log("🔄 Reiniciando...")
    currentQR = null; isConnected = false; connectionError = null; botReady = false
    try {
        await initBot(true)
        await new Promise(r => setTimeout(r, 5000))
        res.json({ ok: true, hasQR: !!currentQR })
    } catch (e) { res.status(500).json({ ok: false, error: String(e) }) }
})

app.post("/send-message", async (req, res) => {
    const { to, text } = req.body
    if (!to || !text) return res.status(400).json({ ok: false, error: "Falta to/text" })
    if (!isConnected) return res.status(503).json({ ok: false, error: "No conectado" })
    try {
        await providerInstance.sendMessage(`${to.replace(/\D/g, "")}@s.whatsapp.net`, text, {})
        res.json({ ok: true })
    } catch (e) { res.status(500).json({ ok: false, error: String(e) }) }
})

app.post("/logout", async (_, res) => {
    try {
        if (providerInstance?.logout) await providerInstance.logout()
        cleanSessions()
        isConnected = false; currentQR = null
        res.json({ ok: true })
    } catch (e) { res.status(500).json({ ok: false, error: String(e) }) }
})

console.log("=".repeat(50))
console.log("🤖 WhatsApp Gateway - BuilderBot v3")
console.log("=".repeat(50))

app.listen(PORT, "0.0.0.0", () => console.log(`🌐 http://0.0.0.0:${PORT}`))
initBot(true).catch(e => console.error("⚠️", e))
ENDOFFILE

echo "📝 Creando package.json..."
cat > package.json << 'EOF'
{
  "name": "whatsapp-gateway",
  "version": "1.0.0",
  "type": "module",
  "scripts": { "start": "node index.js" },
  "dependencies": {
    "@builderbot/bot": "^1.1.93",
    "@builderbot/provider-baileys": "^1.1.93",
    "dotenv": "^16.4.0",
    "express": "^4.19.0",
    "qrcode": "^1.5.4"
  }
}
EOF

echo "PORT=3010" > .env

echo "📦 Instalando dependencias..."
npm install

echo "🚀 Iniciando gateway..."
pm2 start index.js --name builderbot-gateway
pm2 save

echo ""
echo "⏳ Esperando 15 segundos para que inicie..."
sleep 15

echo ""
echo "=== LOGS ==="
pm2 logs builderbot-gateway --lines 20 --nostream

echo ""
echo "=== HEALTH ==="
curl -s http://localhost:3010/health

echo ""
echo "=== QR ==="
curl -s http://localhost:3010/qr | head -c 300

echo ""
echo "✅ Gateway actualizado!"
echo "📱 Configura en Vercel: BAILEYS_GATEWAY_URL = http://31.220.58.83:3010"

