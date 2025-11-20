import 'dotenv/config'
import express from 'express'
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import QRCode from 'qrcode'
import { Boom } from '@hapi/boom'

const PORT = process.env.PORT || 3001

// Estado en memoria que usará tu dashboard
let sock = null        // instancia de Baileys
let lastQR = null      // último QR generado (data:image/png;base64,...)
let isConnected = false

// 1. Función que crea / reconecta el socket
async function startSock () {
  try {
    // useMultiFileAuthState guarda las credenciales en ./baileys_auth
    const { state, saveCreds } = await useMultiFileAuthState('./baileys_auth')

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['Galle Dashboard', 'Chrome', '1.0.0'],
      markOnlineOnConnect: false
    })

    // Guardar credenciales cuando cambien
    sock.ev.on('creds.update', saveCreds)

    // Manejar actualización de conexión: qr, open, close, etc.
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      // QR: convertir a dataURL para enviar al frontend
      if (qr) {
        try {
          lastQR = await QRCode.toDataURL(qr)
        } catch (e) {
          console.error('Error generando dataURL del QR:', e)
          lastQR = null
        }
        isConnected = false
        console.log('📲 Nuevo QR generado, espera que el frontend lo muestre')
      }

      if (connection === 'open') {
        isConnected = true
        lastQR = null
        console.log('✅ WhatsApp conectado')
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error instanceof Boom)
          ? lastDisconnect.error.output.statusCode
          : null
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut
        isConnected = false
        lastQR = null

        if (shouldReconnect) {
          console.log('🔁 Conexión cerrada, intentando reconectar...')
          setTimeout(startSock, 2000)
        } else {
          console.log('🚫 Sesión cerrada definitivamente (loggedOut). Borra ./baileys_auth para volver a escanear.')
        }
      }
    })

    // Logging opcional de mensajes entrantes
    sock.ev.on('messages.upsert', (m) => {
      console.log('📩 Mensaje recibido:', JSON.stringify(m, null, 2))
    })

    console.log('🟢 startSock inicializado')
  } catch (err) {
    console.error('❌ Error en startSock:', err)
    // Intentar reconectar tras un pequeño delay
    setTimeout(() => startSock().catch(console.error), 3000)
  }
}

// 2. Función principal: arranca socket + API HTTP
async function main () {
  await startSock()

  const app = express()
  app.use(express.json())

  // Endpoint para que el dashboard obtenga el QR
  app.get('/qr', (req, res) => {
    res.json({ hasQR: !!lastQR, isConnected, qr: lastQR })
  })

  // Endpoint para consultar estado
  app.get('/status', (req, res) => {
    res.json({ isConnected })
  })

  // Enviar mensajes desde el dashboard
  app.post('/send-message', async (req, res) => {
    try {
      const { to, text } = req.body
      if (!to || !text) {
        return res.status(400).json({ error: '`to` y `text` son obligatorios' })
      }

      const jid = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`
      await sock.sendMessage(jid, { text })
      res.json({ ok: true })
    } catch (err) {
      console.error('❌ Error enviando mensaje:', err)
      res.status(500).json({ error: 'Error enviando mensaje' })
    }
  })

  app.listen(PORT, () => console.log(`🚀 API WhatsApp escuchando en http://0.0.0.0:${PORT}`))
}

main().catch((e) => {
  console.error('❌ Error crítico:', e)
})
