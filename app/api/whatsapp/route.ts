import { NextRequest, NextResponse } from "next/server"

// ============================== // EXISTENTE (no se elimina)
const GATEWAY_URL = process.env.BAILEYS_GATEWAY_URL || "http://localhost:3010"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ============================== // ✅ AGREGADO: Supabase (solo server)
// Requiere en Vercel:
// - NEXT_PUBLIC_SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY   (NO la expongas en el cliente)
// ==============================
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null

// ============================== // ✅ AGREGADO: normalización robusta para WhatsApp
// Acepta: "+57 301...", "5730...", "5730...@c.us"
// Devuelve solo dígitos E.164 (sin +, sin espacios)
// ==============================
function normalizeWaE164(raw?: string | null): string | null {
  if (!raw) return null
  const noJid = String(raw).split("@")[0]
  let digits = noJid.replace(/\D/g, "")
  // Colombia: 10 dígitos iniciando en 3 => anteponer 57
  if (digits.length === 10 && digits.startsWith("3")) digits = `57${digits}`
  // evitar doble 57
  if (digits.startsWith("5757")) digits = digits.replace(/^5757/, "57")
  // E.164 típico: 10-15 dígitos
  if (digits.length < 10 || digits.length > 15) return null
  return digits
}

// ============================== // ✅ AGREGADO: Detectar si esta petición es webhook entrante
// Si el body trae "from" y algún contenido, lo tratamos como webhook
// ==============================
function looksLikeInboundWebhook(body: any): boolean {
  if (!body || typeof body !== "object") return false
  // comunes: from, sender, phone, waId, jid
  const hasFrom =
    typeof body.from === "string" ||
    typeof body.wa_id === "string" ||
    typeof body.waId === "string" ||
    typeof body.sender === "string"
  // contenido típico
  const hasContent =
    typeof body.message === "string" ||
    typeof body.text === "string" ||
    typeof body.body === "string" ||
    (body.message && typeof body.message === "object")
  return Boolean(hasFrom && hasContent)
}

// ============================== // ✅ AGREGADO: extraer campos de distintos proveedores
// (WAHA / Baileys gateways / otros)
// ==============================
function extractInbound(body: any) {
  // from / waId
  const rawFrom =
    body.from ||
    body.wa_id ||
    body.waId ||
    body.sender ||
    body?.data?.from ||
    body?.payload?.from
  // nombre
  const name =
    body.name ||
    body.pushName ||
    body?.contact?.name ||
    body?.data?.name ||
    body?.payload?.name ||
    "Desconocido"
  // texto
  const text =
    body.message?.text ||
    body.text ||
    body.body ||
    (typeof body.message === "string" ? body.message : "") ||
    body?.data?.text ||
    body?.payload?.text ||
    ""
  // tipo
  const type =
    body.type ||
    body.message?.type ||
    body?.data?.type ||
    body?.payload?.type ||
    "text"
  // id mensaje (si existe)
  const msgId =
    body.id ||
    body.messageId ||
    body.message?.id ||
    body?.data?.id ||
    body?.payload?.id ||
    null
  // tu número (cuenta conectada) si llega por algún lado
  const rawWaNumber =
    body.wa_number ||
    body.waNumber ||
    body?.account ||
    body?.data?.wa_number ||
    body?.payload?.wa_number ||
    null
  return { rawFrom, rawWaNumber, name, text, type, msgId }
}

// ============================== // ✅ AGREGADO: Handler webhook → UPSERT conversaciones + INSERT mensajes
// NO elimina nada. Solo agrega auto-sync.
// ==============================
async function handleInboundWebhook(req: NextRequest, body: any) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "SUPABASE_NOT_CONFIGURED" },
        { status: 500 }
      )
    }
    const { rawFrom, rawWaNumber, name, text, type, msgId } = extractInbound(body)
    const phone = normalizeWaE164(rawFrom)
    if (!phone) {
      return NextResponse.json(
        { ok: false, error: "INVALID_FROM", rawFrom },
        { status: 400 }
      )
    }
    // wa_number = tu cuenta conectada (si no llega, dejamos el default)
    // OJO: tu DB tiene default '0000000000'. Si NO tienes multi-cuenta, puedes fijarlo a un env.
    const wa_number_env = process.env.WA_NUMBER_E164 || null
    const wa_number =
      normalizeWaE164(rawWaNumber) ||
      normalizeWaE164(wa_number_env) ||
      "0000000000"
    // 1) UPSERT conversación por (wa_number, phone)
    // Tu tabla tiene unique_wa_phone (wa_number, phone) ✅
    const now = new Date().toISOString()
    const upsertConversation = await supabase
      .from("crm_conversations")
      .upsert(
        {
          wa_number,
          phone,
          client_name: String(name || "Desconocido"),
          last_message: String(text || ""),
          timestamp: now,
          canal: "whatsapp",
          updated_at: now,
          // NOTA: unread lo puedes incrementar si quieres (se deja como está)
        },
        { onConflict: "wa_number,phone" }
      )
      .select("id, unread")
      .single()
    if (upsertConversation.error) {
      return NextResponse.json(
        { ok: false, error: "UPSERT_CONVERSATION_FAILED", detail: upsertConversation.error.message },
        { status: 500 }
      )
    }
    const conversationId = upsertConversation.data.id
    // 2) INSERT mensaje inbound
    // (No forzamos unique por msgId porque tu tabla no tiene columna; lo guardamos en metadata)
    const insertMsg = await supabase.from("crm_messages").insert({
      conversation_id: conversationId,
      wa_number,
      sender: "client",
      content: String(text || ""),
      type: ["text", "image", "audio", "video", "document"].includes(String(type))
        ? String(type)
        : "text",
      direction: "inbound",
      timestamp: now,
      read: false,
      metadata: {
        raw: body,
        msgId,
        from: rawFrom,
      },
      created_at: now,
    })
    if (insertMsg.error) {
      return NextResponse.json(
        { ok: false, error: "INSERT_MESSAGE_FAILED", detail: insertMsg.error.message },
        { status: 500 }
      )
    }
    // 3) (Opcional) Incrementar unread (si quieres)
    await supabase
      .from("crm_conversations")
      .update({
        unread: (upsertConversation.data.unread ?? 0) + 1,
        updated_at: now,
        timestamp: now,
        last_message: String(text || ""),
      })
      .eq("id", conversationId)
    return NextResponse.json({ ok: true, conversationId, phone, wa_number }, { status: 200 })
  } catch (err: any) {
    console.error("❌ Webhook Error:", err)
    return NextResponse.json(
      { ok: false, error: "WEBHOOK_ERROR", detail: String(err?.message || err) },
      { status: 500 }
    )
  }
}

// ============================== // EXISTENTE (no se elimina): Start / QR / status
async function handleStart(req: NextRequest) {
  // ...existing code...
}

// ============================== // EXISTENTE: POST y GET (no se elimina)
// ✅ AGREGADO: POST detecta webhook vs start
export async function POST(req: NextRequest) {
  // Intentar leer JSON sin romper el start
  const contentType = req.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    try {
      const body = await req.clone().json()
      if (looksLikeInboundWebhook(body)) {
        return handleInboundWebhook(req, body)
      }
    } catch {
      // si falla parseo, seguimos al start
    }
  }
  return handleStart(req)
}

export async function GET(req: NextRequest) {
  return handleStart(req)
}
// ...existing code...

