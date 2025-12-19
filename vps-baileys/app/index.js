import express from "express";
import cors from "cors";
import qrcode from "qrcode";
import { Boom } from "@hapi/boom";
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import fs from "fs";

const {
  PORT = 3001,
  API_KEY = "",
  SESSION_NAME = "default",
  STORE_DIR = "./data",
  ORIGIN = "*"
} = process.env;

const app = express();
app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json());

let sock, qrSVG = "", ready = false, starting = false;

async function start() {
  if (starting) return;
  starting = true;
  ready = false;
  qrSVG = "";

  const authPath = `${STORE_DIR}/${SESSION_NAME}`;
  fs.mkdirSync(authPath, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(authPath);

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    syncFullHistory: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (u) => {
    const { connection, lastDisconnect, qr } = u;

    if (qr) {
      qrSVG = await qrcode.toDataURL(qr);
      console.log("📱 QR generado");
    }

    if (connection === "open") {
      ready = true;
      qrSVG = "";
      starting = false;
      console.log("✅ WhatsApp conectado");
    }

    if (connection === "close") {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      console.log("❌ Conexión cerrada, código:", code);

      if (code !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconectando en 2 segundos...");
        setTimeout(start, 2000);
      } else {
        ready = false;
        qrSVG = "";
        starting = false;
        console.log("⚠️  Sesión cerrada, necesita nuevo QR");
      }
    }
  });
}

// Health check
app.get("/health", (_, res) => res.json({ ok: true, ready }));

// Iniciar sesión
app.post("/start", apiGuard, async (_, res) => {
  start();
  res.json({ ok: true });
});

// Obtener QR
app.get("/qr", (_, res) => {
  if (qrSVG) {
    return res.json({ ok: true, qr: qrSVG });
  }

  if (ready) {
    return res.status(404).json({ ok: false, message: "LOGGED_IN" });
  }

  return res.status(404).json({ ok: false, message: "QR_NOT_READY" });
});

// Enviar mensaje de texto
app.post("/sendText", apiGuard, async (req, res) => {
  try {
    const { to, text } = req.body;

    if (!to || !text) {
      return res.status(400).json({ ok: false, error: "Missing 'to' or 'text'" });
    }

    if (!ready) {
      return res.status(503).json({ ok: false, error: "WhatsApp not connected" });
    }

    await sock.sendMessage(`${to}@s.whatsapp.net`, { text });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Middleware de autenticación
function apiGuard(req, res, next) {
  if (!API_KEY) return next();

  if (req.header("x-api-key") === API_KEY) {
    return next();
  }

  res.status(401).json({ ok: false, error: "API_KEY_INVALID" });
}

app.listen(PORT, () => {
  console.log("========================================");
  console.log("  Baileys WhatsApp API");
  console.log(`  Puerto: ${PORT}`);
  console.log(`  API Key: ${API_KEY ? "Configurada ✅" : "No configurada ⚠️"}`);
  console.log("========================================");
  start();
});

