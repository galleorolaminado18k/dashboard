#!/bin/bash
# ================================================================
# SCRIPT PARA DESPLEGAR BUILDERBOT GATEWAY EN VPS
# Ejecutar en: root@31.220.58.83
# ================================================================

set -e

echo "================================================"
echo "🤖 Desplegando WhatsApp Gateway - BuilderBot"
echo "================================================"

# 1) Crear directorio
mkdir -p /root/whatsapp-gateway
cd /root/whatsapp-gateway

# 2) Crear package.json
cat > package.json << 'PACKAGEJSON'
{
  "name": "whatsapp-gateway",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@builderbot/bot": "^1.1.93",
    "@builderbot/provider-baileys": "^1.1.93",
    "dotenv": "^16.4.0",
    "express": "^4.19.0",
    "qrcode": "^1.5.4"
  }
}
PACKAGEJSON

# 3) Crear index.js (Gateway principal)
cat > index.js << 'INDEXJS'
import "dotenv/config"
import { createBot, createProvider, createFlow, addKeyword, EVENTS } from "@builderbot/bot"
import { BaileysProvider } from "@builderbot/provider-baileys"
import express from "express"
import QRCode from "qrcode"

const PORT = process.env.PORT || 3010

let providerInstance = null
let currentQR = null
let isConnected = false
let connectionError = null
let lastUpdate = null

const welcomeFlow = addKeyword(EVENTS.WELCOME)
    .addAction(async (ctx) => {
        console.log(`📩 Mensaje de ${ctx.from}: ${ctx.body}`)
    })

async function initBot() {
    try {
        console.log("🚀 Iniciando BuilderBot con Baileys...")

        const provider = createProvider(BaileysProvider, {
            gifPlayback: false,
            usePairingCode: false,
            browser: ["Dashboard WhatsApp", "Chrome", "1.0.0"],
        })

        providerInstance = provider

        provider.on("require_action", async (ctx) => {
            if (ctx.title === "qr") {
                currentQR = ctx.code
                isConnected = false
                lastUpdate = new Date().toISOString()
                console.log("📱 Nuevo QR generado")
                try {
                    currentQR = await QRCode.toDataURL(ctx.code)
                } catch (err) {
                    currentQR = ctx.code
                }
            }
        })

        provider.on("ready", () => {
            console.log("✅ WhatsApp conectado!")
            isConnected = true
            currentQR = null
            connectionError = null
            lastUpdate = new Date().toISOString()
        })

        provider.on("auth_failure", (error) => {
            console.error("❌ Auth error:", error)
            isConnected = false
            connectionError = String(error)
            lastUpdate = new Date().toISOString()
        })

        await createBot({
            flow: createFlow([welcomeFlow]),
            provider,
            database: { name: "memory" },
        })

        console.log("✅ BuilderBot iniciado")
        return { provider }
    } catch (error) {
        console.error("❌ Error:", error)
        connectionError = String(error)
        throw error
    }
}

const app = express()
app.use(express.json())

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")
    if (req.method === "OPTIONS") return res.sendStatus(200)
    next()
})

app.get("/health", (req, res) => {
    res.json({ ok: true, service: "builderbot-gateway", uptime: process.uptime() })
})

app.get("/qr", async (req, res) => {
    if (isConnected) {
        return res.json({ ok: true, isConnected: true, hasQR: false, qr: null, message: "WhatsApp conectado" })
    }
    if (currentQR) {
        return res.json({ ok: true, isConnected: false, hasQR: true, qr: currentQR, message: "Escanea el QR" })
    }
    if (connectionError) {
        return res.json({ ok: false, isConnected: false, hasQR: false, error: connectionError })
    }
    return res.json({ ok: true, isConnected: false, hasQR: false, message: "Esperando QR..." })
})

app.get("/status", (req, res) => {
    res.json({ ok: true, isConnected, hasQR: !!currentQR, error: connectionError, lastUpdate })
})

app.post("/send-message", async (req, res) => {
    const { to, text } = req.body
    if (!to || !text) return res.status(400).json({ ok: false, error: "Falta to o text" })
    if (!isConnected || !providerInstance) return res.status(503).json({ ok: false, error: "No conectado" })

    try {
        let recipient = to.replace(/[^0-9]/g, "")
        if (!recipient.includes("@")) recipient = `${recipient}@s.whatsapp.net`
        await providerInstance.sendMessage(recipient, text, {})
        res.json({ ok: true, message: "Enviado", to, text })
    } catch (error) {
        res.status(500).json({ ok: false, error: String(error) })
    }
})

app.post("/logout", async (req, res) => {
    try {
        if (providerInstance) await providerInstance.logout()
        isConnected = false
        currentQR = null
        res.json({ ok: true, message: "Sesión cerrada" })
    } catch (error) {
        res.status(500).json({ ok: false, error: String(error) })
    }
})

app.post("/restart", async (req, res) => {
    try {
        isConnected = false
        currentQR = null
        connectionError = null
        await initBot()
        res.json({ ok: true, message: "Bot reiniciado" })
    } catch (error) {
        res.status(500).json({ ok: false, error: String(error) })
    }
})

async function main() {
    console.log("=".repeat(50))
    console.log("🤖 WhatsApp Gateway - BuilderBot")
    console.log("=".repeat(50))

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`🌐 API en http://0.0.0.0:${PORT}`)
        console.log(`   GET  /health`)
        console.log(`   GET  /qr`)
        console.log(`   GET  /status`)
        console.log(`   POST /send-message`)
    })

    try {
        await initBot()
    } catch (error) {
        console.error("⚠️ Bot no iniciado, usa POST /restart")
    }
}

main().catch(console.error)
INDEXJS

# 4) Crear .env
cat > .env << 'ENVFILE'
PORT=3010
ENVFILE

# 5) Instalar Node.js si no existe
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# 6) Instalar PM2 si no existe
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    npm install -g pm2
fi

# 7) Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# 8) Abrir firewall
echo "🔥 Abriendo puerto 3010..."
ufw allow 3010/tcp 2>/dev/null || true

# 9) Detener proceso anterior si existe
pm2 delete builderbot-gateway 2>/dev/null || true

# 10) Iniciar con PM2
echo "🚀 Iniciando gateway..."
pm2 start index.js --name builderbot-gateway
pm2 save
pm2 startup 2>/dev/null || true

echo ""
echo "================================================"
echo "✅ Gateway desplegado exitosamente!"
echo "================================================"
echo ""
echo "📊 Estado:"
pm2 status
echo ""
echo "🌐 Endpoints:"
echo "   http://31.220.58.83:3010/health"
echo "   http://31.220.58.83:3010/qr"
echo "   http://31.220.58.83:3010/status"
echo ""
echo "📱 Configura en Vercel:"
echo "   BAILEYS_GATEWAY_URL = http://31.220.58.83:3010"
echo ""
echo "📝 Comandos útiles:"
echo "   pm2 logs builderbot-gateway"
echo "   pm2 restart builderbot-gateway"
echo ""

