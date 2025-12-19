// index.js – Gateway simple usando Baileys
const express = require("express")
const qrcode = require("qrcode")
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys")

const PORT = process.env.PORT || 3001

let sock = null
let lastQR = null
let isConnected = false

async function startBaileys() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth")
  const { version } = await fetchLatestBaileysVersion()

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", async (update) => {
    const { qr, connection } = update

    if (qr) {
      // Convertimos el QR a dataURL para mandarlo al frontend
      lastQR = await qrcode.toDataURL(qr)
      isConnected = false
      console.log("🔁 QR ACTUALIZADO")
    }

    if (connection === "open") {
      isConnected = true
      lastQR = null
      console.log("✅ Conectado a WhatsApp")
    }

    if (connection === "close") {
      isConnected = false
      console.log("❌ Conexión cerrada, se puede reintentar luego")
    }
  })
}

// --- Servidor HTTP ---
const app = express()

app.get("/health", (req, res) => {
  res.json({ ok: true })
})

app.get("/qr", (req, res) => {
  if (isConnected) {
    return res.json({ ok: true, isConnected: true, hasQR: false })
  }

  if (!lastQR) {
    return res.status(404).json({
      ok: false,
      error: "NO_QR",
      detail: "Aún no hay QR generado. Revisa la consola del servidor.",
    })
  }

  res.json({
    ok: true,
    isConnected: false,
    hasQR: true,
    qrcode: lastQR,
  })
})

app.get("/status", (req, res) => {
  res.json({
    ok: true,
    isConnected,
    hasQR: !!lastQR,
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Gateway Baileys escuchando en http://localhost:${PORT}`)
  startBaileys().catch((err) =>
    console.error("Error iniciando Baileys:", err),
  )
})
