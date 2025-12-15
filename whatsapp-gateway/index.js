/**
 * WhatsApp Gateway con BuilderBot
 * Basado en: https://builderbot.app/en
 *
 * Este servidor expone endpoints REST para:
 * - Obtener QR code para vincular WhatsApp
 * - Verificar estado de conexión
 * - Enviar mensajes
 */

import "dotenv/config"
import { createBot, createProvider, createFlow, addKeyword, EVENTS } from "@builderbot/bot"
import { BaileysProvider } from "@builderbot/provider-baileys"
import express from "express"
import QRCode from "qrcode"

const PORT = process.env.PORT || 3010

// Estado global del bot
let botInstance = null
let providerInstance = null
let currentQR = null
let isConnected = false
let connectionError = null
let lastUpdate = null

// ============================================
// FLUJOS DEL BOT (mínimos para funcionar)
// ============================================

// Flujo de bienvenida básico
const welcomeFlow = addKeyword(EVENTS.WELCOME)
    .addAction(async (ctx, { flowDynamic }) => {
        console.log(`📩 Mensaje recibido de ${ctx.from}: ${ctx.body}`)
        // No responder automáticamente - solo logging
    })

// ============================================
// INICIALIZACIÓN DEL BOT
// ============================================

async function initBot() {
    try {
        console.log("🚀 Iniciando BuilderBot con Baileys Provider...")

        // Crear provider de Baileys
        const provider = createProvider(BaileysProvider, {
            gifPlayback: false,
            usePairingCode: false, // Usar QR
            browser: ["Dashboard WhatsApp", "Chrome", "1.0.0"],
        })

        // Guardar referencia del provider
        providerInstance = provider

        // Escuchar eventos del provider
        provider.on("require_action", async (ctx) => {
            console.log("📱 Acción requerida:", ctx.instructions)

            if (ctx.title === "qr") {
                // Nuevo QR disponible
                currentQR = ctx.code
                isConnected = false
                lastUpdate = new Date().toISOString()
                console.log("📱 Nuevo QR generado")

                // Generar QR como data URL para el frontend
                try {
                    currentQR = await QRCode.toDataURL(ctx.code)
                } catch (err) {
                    console.error("Error generando QR:", err)
                    currentQR = ctx.code // Fallback al código raw
                }
            }
        })

        provider.on("ready", () => {
            console.log("✅ WhatsApp conectado exitosamente!")
            isConnected = true
            currentQR = null
            connectionError = null
            lastUpdate = new Date().toISOString()
        })

        provider.on("auth_failure", (error) => {
            console.error("❌ Error de autenticación:", error)
            isConnected = false
            connectionError = String(error)
            lastUpdate = new Date().toISOString()
        })

        // Crear el bot
        const { bot, handleCtx, httpServer } = await createBot({
            flow: createFlow([welcomeFlow]),
            provider,
            database: { name: "memory" }, // No usar base de datos
        })

        botInstance = bot

        console.log(`✅ BuilderBot iniciado correctamente`)

        return { provider, bot }

    } catch (error) {
        console.error("❌ Error iniciando BuilderBot:", error)
        connectionError = String(error)
        throw error
    }
}

// ============================================
// SERVIDOR EXPRESS (API REST)
// ============================================

const app = express()
app.use(express.json())

// CORS para permitir requests desde el dashboard
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey")
    if (req.method === "OPTIONS") {
        return res.sendStatus(200)
    }
    next()
})

// Health check
app.get("/health", (req, res) => {
    res.json({
        ok: true,
        service: "builderbot-gateway",
        version: "1.0.0",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    })
})

// Obtener QR o estado de conexión
app.get("/qr", async (req, res) => {
    try {
        // Si ya está conectado
        if (isConnected) {
            return res.json({
                ok: true,
                isConnected: true,
                hasQR: false,
                qr: null,
                message: "WhatsApp ya está conectado",
                lastUpdate
            })
        }

        // Si hay QR disponible
        if (currentQR) {
            return res.json({
                ok: true,
                isConnected: false,
                hasQR: true,
                qr: currentQR,
                message: "Escanea el código QR con WhatsApp",
                lastUpdate
            })
        }

        // Si hay error
        if (connectionError) {
            return res.json({
                ok: false,
                isConnected: false,
                hasQR: false,
                qr: null,
                error: connectionError,
                message: "Error de conexión",
                lastUpdate
            })
        }

        // Estado inicial - esperando QR
        return res.json({
            ok: true,
            isConnected: false,
            hasQR: false,
            qr: null,
            message: "Esperando generación de QR...",
            lastUpdate
        })

    } catch (error) {
        console.error("Error en /qr:", error)
        res.status(500).json({
            ok: false,
            error: "INTERNAL_ERROR",
            detail: String(error)
        })
    }
})

// Estado de conexión
app.get("/status", (req, res) => {
    res.json({
        ok: true,
        isConnected,
        hasQR: !!currentQR,
        error: connectionError,
        lastUpdate
    })
})

// Enviar mensaje
app.post("/send-message", async (req, res) => {
    try {
        const { to, text, mediaUrl } = req.body

        if (!to || !text) {
            return res.status(400).json({
                ok: false,
                error: "MISSING_PARAMS",
                detail: "Se requiere 'to' y 'text'"
            })
        }

        if (!isConnected || !providerInstance) {
            return res.status(503).json({
                ok: false,
                error: "NOT_CONNECTED",
                detail: "WhatsApp no está conectado"
            })
        }

        // Formatear número (agregar @s.whatsapp.net si no lo tiene)
        let recipient = to.replace(/[^0-9]/g, "")
        if (!recipient.includes("@")) {
            recipient = `${recipient}@s.whatsapp.net`
        }

        // Enviar mensaje usando el provider
        await providerInstance.sendMessage(recipient, text, {})

        console.log(`📤 Mensaje enviado a ${to}: ${text}`)

        res.json({
            ok: true,
            message: "Mensaje enviado",
            to,
            text
        })

    } catch (error) {
        console.error("Error enviando mensaje:", error)
        res.status(500).json({
            ok: false,
            error: "SEND_ERROR",
            detail: String(error)
        })
    }
})

// Desconectar sesión
app.post("/logout", async (req, res) => {
    try {
        if (providerInstance) {
            await providerInstance.logout()
        }

        isConnected = false
        currentQR = null
        connectionError = null
        lastUpdate = new Date().toISOString()

        res.json({
            ok: true,
            message: "Sesión cerrada"
        })

    } catch (error) {
        console.error("Error en logout:", error)
        res.status(500).json({
            ok: false,
            error: "LOGOUT_ERROR",
            detail: String(error)
        })
    }
})

// Reiniciar bot
app.post("/restart", async (req, res) => {
    try {
        console.log("🔄 Reiniciando bot...")

        // Reset estado
        isConnected = false
        currentQR = null
        connectionError = null

        // Reiniciar bot
        await initBot()

        res.json({
            ok: true,
            message: "Bot reiniciado"
        })

    } catch (error) {
        console.error("Error reiniciando:", error)
        res.status(500).json({
            ok: false,
            error: "RESTART_ERROR",
            detail: String(error)
        })
    }
})

// ============================================
// INICIO DEL SERVIDOR
// ============================================

async function main() {
    console.log("=" .repeat(50))
    console.log("🤖 WhatsApp Gateway - BuilderBot")
    console.log("=" .repeat(50))

    // Iniciar Express primero
    app.listen(PORT, () => {
        console.log(`🌐 API REST escuchando en http://localhost:${PORT}`)
        console.log(`   - GET  /health      → Health check`)
        console.log(`   - GET  /qr          → Obtener QR`)
        console.log(`   - GET  /status      → Estado conexión`)
        console.log(`   - POST /send-message → Enviar mensaje`)
        console.log(`   - POST /logout      → Cerrar sesión`)
        console.log(`   - POST /restart     → Reiniciar bot`)
    })

    // Luego iniciar el bot
    try {
        await initBot()
    } catch (error) {
        console.error("⚠️ Bot no iniciado, pero API disponible")
        console.error("   Usa POST /restart para intentar de nuevo")
    }
}

main().catch(console.error)

