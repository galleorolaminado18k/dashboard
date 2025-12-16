# 🔧 FIX ENVÍO DE ARCHIVOS Y AUDIO - INSTRUCCIONES

## Problema
El upload a Supabase Storage no funciona, causando "Error de conexión al subir archivo".

## Solución Implementada
Se modificó el sistema para enviar archivos directamente como base64 al gateway, sin depender de Supabase Storage.

---

## PASO 1: Push a GitHub (en tu PC)

Haz doble clic en el archivo:
```
▶️_PUSH_AHORA.bat
```

O ejecuta manualmente en CMD:
```cmd
cd C:\Users\USUARIO\WebstormProjects\dashboard
git add -A
git commit -m "fix: soporte base64 para envio de archivos y audio"
git push
```

---

## PASO 2: Actualizar Gateway en VPS

### Opción A: Script automático
```bash
ssh root@31.220.58.83
cd /root/whatsapp-gateway
curl -sL "https://raw.githubusercontent.com/galleaprobaciones/dashboard/main/whatsapp-gateway/update-gateway.sh" | bash
```

### Opción B: Manual
```bash
ssh root@31.220.58.83
cd /root/whatsapp-gateway
pm2 stop gateway

# Editar el archivo
nano gateway-updated.js

# Buscar el endpoint /send y reemplazar con el nuevo código que soporta mediaData
# (ver sección "Código del Gateway" abajo)

pm2 start gateway-updated.js --name gateway
pm2 logs gateway
```

---

## Código del Gateway (endpoint /send actualizado)

Busca la línea `app.post("/send"` y reemplaza TODO el bloque hasta el siguiente `app.post` o `app.get`:

```javascript
app.post("/send", async (req, res) => {
    const { phone, message, type = "text", mediaUrl, mediaData, mimetype, filename, caption } = req.body;
    if (!phone) return res.status(400).json({ ok: false, error: "Falta phone" });
    if (type === "text" && !message) return res.status(400).json({ ok: false, error: "Falta message" });
    if (type !== "text" && !mediaUrl && !mediaData) return res.status(400).json({ ok: false, error: "Falta mediaUrl o mediaData" });
    if (!isConnected || !sock) return res.status(503).json({ ok: false, error: "No conectado" });

    try {
        let cleanPhone = phone.replace(/\D/g, "");
        if (!cleanPhone.startsWith("57") && cleanPhone.length === 10) {
            cleanPhone = "57" + cleanPhone;
        }
        const jid = cleanPhone + "@s.whatsapp.net";

        let msgContent;
        const captionText = caption || message || "";

        // Preparar la fuente del media (URL o Buffer base64)
        let mediaSource;
        if (mediaData) {
            // mediaData es un data URL: data:mime/type;base64,XXXXX
            const matches = mediaData.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
                mediaSource = Buffer.from(matches[2], 'base64');
                console.log("📦 Media recibido como base64, tamaño:", mediaSource.length, "bytes");
            } else {
                return res.status(400).json({ ok: false, error: "Formato de mediaData inválido" });
            }
        } else {
            mediaSource = { url: mediaUrl };
        }

        switch (type) {
            case "image":
                msgContent = { image: mediaSource, caption: captionText };
                break;
            case "video":
                msgContent = { video: mediaSource, caption: captionText };
                break;
            case "audio":
                msgContent = { audio: mediaSource, mimetype: mimetype || "audio/ogg; codecs=opus", ptt: true };
                break;
            case "document":
                msgContent = { document: mediaSource, mimetype: mimetype || "application/pdf", fileName: filename || "documento" };
                break;
            default:
                msgContent = { text: message };
        }

        await sock.sendMessage(jid, msgContent);
        console.log("📤 Mensaje enviado a", jid, "tipo:", type);
        res.json({ ok: true, message: "Enviado", type });
    } catch (e) {
        console.error("❌ Error enviando mensaje:", e);
        res.status(500).json({ ok: false, error: String(e) });
    }
});
```

También agrega el límite de body al inicio, después de `const app = express();`:
```javascript
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
```

