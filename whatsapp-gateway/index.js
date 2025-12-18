/**
 * WhatsApp Gateway con BuilderBot
 * Basado en: https://builderbot.app/en/providers/baileys
 */

import "dotenv/config"
import { createBot, createProvider, createFlow, addKeyword, EVENTS } from "@builderbot/bot"
import { BaileysProvider } from "@builderbot/provider-baileys"
import express from "express"
import QRCode from "qrcode"
import fs from "fs"
import path from "path"

const PORT = process.env.PORT || 3010

// Estado global
let providerInstance = null
let currentQR = null
let isConnected = false
let connectionError = null
let lastUpdate = null
let botReady = false

// URL del webhook para enviar mensajes al dashboard
const WEBHOOK_URL = process.env.WEBHOOK_URL || "https://dashboard-galle-git-fea-98639c-galleaprobaciones-9369s-projects.vercel.app/api/whatsapp/webhook"

// Función para enviar mensajes al webhook
async function sendToWebhook(messageData) {
    try {
        console.log(`📤 Enviando al webhook:`, WEBHOOK_URL)
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(messageData)
        })
        const result = await response.json()
        console.log(`✅ Webhook respondió:`, result)
    } catch (error) {
        console.error(`❌ Error enviando al webhook:`, error.message)
    }
}

// Flujo mínimo requerido - AHORA CON WEBHOOK
const welcomeFlow = addKeyword(EVENTS.WELCOME)
    .addAction(async (ctx, { flowDynamic }) => {
        console.log(`📩 Mensaje de ${ctx.from}: ${ctx.body}`)

        // Enviar al webhook del dashboard
        await sendToWebhook({
            event: "message",
            session: "default",
            payload: {
                message: {
                    from: ctx.from,
                    body: ctx.body,
                    pushName: ctx.pushName || ctx.name || "Usuario",
                    type: "text",
                    timestamp: Date.now(),
                    fromMe: false
                }
            }
        })
    })

// Función para limpiar sesiones anteriores
function cleanSessions() {
    const sessionsPath = path.join(process.cwd(), "bot_sessions")
    if (fs.existsSync(sessionsPath)) {
        fs.rmSync(sessionsPath, { recursive: true, force: true })
        console.log("🧹 Sesiones anteriores limpiadas")
    }
}

// Inicializar el bot
async function initBot(forceNew = false) {
    try {
        console.log("🚀 Iniciando BuilderBot con Baileys...")

        // Limpiar sesiones si se fuerza nuevo QR
        if (forceNew) {
            cleanSessions()
        }

        // Crear provider con configuración específica para QR
        const provider = createProvider(BaileysProvider, {
            gifPlayback: false,
            usePairingCode: false,
            browser: ["GalleDashboard", "Chrome", "1.0.0"],
            // Importante: no usar sesión persistente para forzar QR
            experimentalStore: false,
            timeRelease: 10000,
        })

        providerInstance = provider

        // El provider de Baileys emite eventos específicos
        // Documentación: https://builderbot.app/en/providers/baileys

        // Evento cuando se genera QR
        provider.on("require_action", async (data) => {
            console.log("📱 require_action recibido:", JSON.stringify(data))
            if (data?.title === "qr" || data?.instructions?.includes("qr")) {
                const qrCode = data.code || data.qr
                if (qrCode) {
                    try {
                        currentQR = await QRCode.toDataURL(qrCode)
                        console.log("✅ QR generado como dataURL")
                    } catch (e) {
                        currentQR = qrCode
                        console.log("⚠️ QR guardado como string raw")
                    }
                    isConnected = false
                    lastUpdate = new Date().toISOString()
                }
            }
        })

        // Evento alternativo de Baileys para QR
        provider.on("connection.update", (update) => {
            console.log("🔄 connection.update:", JSON.stringify(update))
            if (update?.qr) {
                QRCode.toDataURL(update.qr).then(dataUrl => {
                    currentQR = dataUrl
                    isConnected = false
                    lastUpdate = new Date().toISOString()
                    console.log("✅ QR obtenido de connection.update")
                }).catch(e => {
                    currentQR = update.qr
                    console.log("⚠️ QR raw de connection.update")
                })
            }
            if (update?.connection === "open") {
                console.log("✅ Conexión establecida!")
                isConnected = true
                currentQR = null
                connectionError = null
                lastUpdate = new Date().toISOString()
            }
            if (update?.connection === "close") {
                console.log("❌ Conexión cerrada")
                isConnected = false
                lastUpdate = new Date().toISOString()
            }
        })

        // Evento ready
        provider.on("ready", () => {
            console.log("✅ Provider ready - WhatsApp conectado!")
            isConnected = true
            currentQR = null
            connectionError = null
            lastUpdate = new Date().toISOString()
        })

        // Evento auth_failure
        provider.on("auth_failure", (error) => {
            console.error("❌ Auth failure:", error)
            isConnected = false
            connectionError = String(error)
            lastUpdate = new Date().toISOString()
        })

        // Crear el bot
        await createBot({
            flow: createFlow([welcomeFlow]),
            provider,
            database: { name: "memory" },
        })

        botReady = true
        console.log("✅ Bot creado exitosamente")

        // Dar tiempo para que se genere el QR
        await new Promise(r => setTimeout(r, 2000))

        return provider

    } catch (error) {
        console.error("❌ Error iniciando bot:", error)
        connectionError = String(error)
        throw error
    }
}

// ============================================
// API REST
// ============================================
const app = express()
app.use(express.json())

// CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")
    if (req.method === "OPTIONS") return res.sendStatus(200)
    next()
})

// Health check
app.get("/health", (req, res) => {
    res.json({
        ok: true,
        service: "builderbot-gateway",
        botReady,
        isConnected,
        hasQR: !!currentQR,
        uptime: process.uptime()
    })
})

// Obtener QR
app.get("/qr", (req, res) => {
    console.log(`📡 GET /qr - isConnected: ${isConnected}, hasQR: ${!!currentQR}`)

    if (isConnected) {
        return res.json({
            ok: true,
            isConnected: true,
            hasQR: false,
            qr: null,
            message: "WhatsApp ya está conectado"
        })
    }

    if (currentQR) {
        return res.json({
            ok: true,
            isConnected: false,
            hasQR: true,
            qr: currentQR,
            message: "Escanea el código QR"
        })
    }

    if (connectionError) {
        return res.json({
            ok: false,
            isConnected: false,
            hasQR: false,
            qr: null,
            error: connectionError,
            message: "Error de conexión"
        })
    }

    return res.json({
        ok: true,
        isConnected: false,
        hasQR: false,
        qr: null,
        message: "Esperando generación de QR...",
        lastUpdate
    })
})

// Estado
app.get("/status", (req, res) => {
    res.json({
        ok: true,
        isConnected,
        hasQR: !!currentQR,
        botReady,
        error: connectionError,
        lastUpdate
    })
})

// Reiniciar bot (forzar nuevo QR)
app.post("/restart", async (req, res) => {
    try {
        console.log("🔄 Reiniciando bot...")
        currentQR = null
        isConnected = false
        connectionError = null
        botReady = false

        // Limpiar y reiniciar
        await initBot(true)

        // Esperar un poco más para el QR
        await new Promise(r => setTimeout(r, 5000))

        res.json({
            ok: true,
            message: "Bot reiniciado",
            hasQR: !!currentQR
        })
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: String(error)
        })
    }
})

// Enviar mensaje
app.post("/send-message", async (req, res) => {
    const { to, text } = req.body
    if (!to || !text) {
        return res.status(400).json({ ok: false, error: "Falta to o text" })
    }
    if (!isConnected || !providerInstance) {
        return res.status(503).json({ ok: false, error: "No conectado" })
    }

    try {
        const recipient = `${to.replace(/\D/g, "")}@s.whatsapp.net`
        await providerInstance.sendMessage(recipient, text, {})
        res.json({ ok: true, message: "Enviado" })
    } catch (error) {
        res.status(500).json({ ok: false, error: String(error) })
    }
})

// Logout
app.post("/logout", async (req, res) => {
    try {
        if (providerInstance?.logout) {
            await providerInstance.logout()
        }
        cleanSessions()
        isConnected = false
        currentQR = null
        res.json({ ok: true, message: "Sesión cerrada" })
    } catch (error) {
        res.status(500).json({ ok: false, error: String(error) })
    }
})

// ============================================
// INICIO
// ============================================
async function main() {
    console.log("=".repeat(50))
    console.log("🤖 WhatsApp Gateway - BuilderBot v2")
    console.log("=".repeat(50))

    // Iniciar servidor Express primero
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`🌐 API corriendo en http://0.0.0.0:${PORT}`)
        console.log(`   GET  /health`)
        console.log(`   GET  /qr`)
        console.log(`   GET  /status`)
        console.log(`   POST /restart`)
        console.log(`   POST /send-message`)
        console.log(`   POST /logout`)
    })

    // Luego iniciar el bot
    try {
        await initBot(true) // Forzar nuevo QR al inicio
    } catch (error) {
        console.error("⚠️ Bot no iniciado, usa POST /restart")
    }
}

main().catch(console.error)
