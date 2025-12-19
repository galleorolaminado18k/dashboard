import express from "express";

export function createGateway({ sock }) {
  const app = express();
  app.use(express.json({ limit: "15mb" }));

  function normalizeToJid(value) {
    if (!value) return null;
    const s = String(value).trim();
    if (s.includes("@")) return s; // @lid o @s.whatsapp.net tal cual
    const digits = s.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) return null;
    return `${digits}@s.whatsapp.net`;
  }

  app.post("/send", async (req, res) => {
    try {
      const { phone, to, message, type = "text", mediaUrl, mimetype, filename, caption } = req.body || {};

      const jid = normalizeToJid(phone || to);
      if (!jid) return res.status(400).json({ ok: false, error: "Falta phone" });

      if (type === "text") {
        if (!message) return res.status(400).json({ ok: false, error: "Falta message" });
        await sock.sendMessage(jid, { text: message });
        return res.json({ ok: true });
      }

      // medios por URL (image/video/audio/document)
      if (!mediaUrl) return res.status(400).json({ ok: false, error: "Falta mediaUrl" });

      const common = { caption: caption || "" };
      if (type === "image") await sock.sendMessage(jid, { image: { url: mediaUrl }, ...common });
      else if (type === "video") await sock.sendMessage(jid, { video: { url: mediaUrl }, ...common });
      else if (type === "audio") await sock.sendMessage(jid, { audio: { url: mediaUrl }, mimetype: mimetype || "audio/ogg; codecs=opus" });
      else if (type === "document") await sock.sendMessage(jid, { document: { url: mediaUrl }, fileName: filename || "archivo", mimetype: mimetype || "application/octet-stream", ...common });
      else return res.status(400).json({ ok: false, error: "Tipo no soportado" });

      return res.json({ ok: true });
    } catch (e) {
      console.error("❌ Gateway send error:", e);
      return res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  return app;
}
