import 'dotenv/config'
import express from 'express'
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import QRCode from 'qrcode'
import { Boom } from '@hapi/boom'

const PORT = process.env.PORT || 3001

let sock = null
let lastQR = null
let isConnected = false

async function startSock () {
  const { state, saveCreds } = await useMultiFileAuthState('./baileys_auth')

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ['Galle Dashboard', 'Chrome', '1.0.0'],
    markOnlineOnConnect: false
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      lastQR = await QRCode.toDataURL(qr)
      isConnected = false
      console.log('📲 Nuevo QR generado')
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
        console.log('🔁 Conexión cerrada, reconectando...')
        setTimeout(startSock, 2000)
      } else {
        console.log('🚫 Sesión cerrada (loggedOut). Borra ./baileys_auth y reinicia para escanear de nuevo.')
      }
    }
  })

  sock.ev.on('messages.upsert', (m) => {
    console.log('📩 Mensaje recibido:', JSON.stringify(m))
  })
}

async function main () {
  await startSock()

  const app = express()
  app.use(express.json())

  app.get('/qr', (req, res) => {
    res.json({ hasQR: !!lastQR, isConnected, qr: lastQR })
  })

  app.get('/status', (req, res) => {
    res.json({ isConnected })
  })

  app.post('/send-message', async (req, res) => {
    try {
      const { to, text } = req.body
      if (!to || !text) return res.status(400).json({ error: '`to` y `text` son obligatorios' })
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

main().catch(e => console.error('❌ Error crítico:', e))

