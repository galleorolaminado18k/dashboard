import { type NextRequest, NextResponse } from "next/server"

const API_V2_GET = "https://api-v2.mpr.mipaquete.com/getSendingTracking"
const API_V1_POST = "https://api.mpr.mipaquete.com/getSendingTracking"

const APIKEY = process.env.MIPAQUETE_API_KEY!
const SESSION = process.env.MIPAQUETE_SESSION_TRACKER!

function sanitize(code: string) {
  return (code || "").trim().replace(/\s+/g, "").toUpperCase()
}

async function tryV2Get(mpCode: string) {
  const url = `${API_V2_GET}?mpCode=${encodeURIComponent(mpCode)}`
  const r = await fetch(url, {
    method: "GET",
    headers: {
      apikey: APIKEY,
      "session-tracker": SESSION,
    },
  })

  if (!r.ok) {
    const text = await r.text().catch(() => "")
    throw new Error(`v2 GET ${r.status}: ${text}`)
  }

  return r.json()
}

async function tryV1Post(mpCode: string) {
  const r = await fetch(API_V1_POST, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: APIKEY,
      "session-tracker": SESSION,
    },
    body: JSON.stringify({ mpCode }),
  })

  if (!r.ok) {
    const text = await r.text().catch(() => "")
    throw new Error(`v1 POST ${r.status}: ${text}`)
  }

  return r.json()
}

function normalizePayload(json: any) {
  const company = json.deliveryCompanyName || json.deliveryCompanyNameTxt || json.deliveryCompany || "Desconocida"

  const timeline = Array.isArray(json.tracking)
    ? json.tracking.map((t: any) => ({
        status: t.updateState || t.state || "Actualización",
        at: t.date || t.updatedAt || null,
      }))
    : []

  return {
    carrier: company,
    events: timeline,
    raw: json,
  }
}

export async function GET(req: NextRequest) {
  try {
    const code = sanitize(req.nextUrl.searchParams.get("mpCode") || "")
    if (!code) {
      return NextResponse.json({ error: "Falta mpCode" }, { status: 400 })
    }

    console.log("[v0] Consultando tracking para:", code)

    let data: any
    try {
      data = await tryV2Get(code)
      console.log("[v0] Tracking obtenido desde v2 GET")
    } catch (e1) {
      console.log("[v0] v2 GET falló, intentando v1 POST...")
      try {
        data = await tryV1Post(code)
        console.log("[v0] Tracking obtenido desde v1 POST")
      } catch (e2) {
        throw e2
      }
    }

    return NextResponse.json(normalizePayload(data))
  } catch (e: any) {
    console.error("[v0] Error consultando tracking:", e)
    const mpCode = req.nextUrl.searchParams.get("mpCode") || ""
    return NextResponse.json(
      {
        error: e?.message || "Error consultando tracking",
        openExternal: true,
        externalUrl: `https://mipaquete.com/track?mpCode=${encodeURIComponent(mpCode)}`,
      },
      { status: 502 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const { mpCode } = await req.json()
    if (!mpCode || typeof mpCode !== "string") {
      return NextResponse.json({ error: "mpCode requerido" }, { status: 400 })
    }

    const code = sanitize(mpCode)
    console.log("[v0] Consultando tracking para:", code)

    let data: any
    try {
      data = await tryV2Get(code)
      console.log("[v0] Tracking obtenido desde v2 GET")
    } catch (e1) {
      console.log("[v0] v2 GET falló, intentando v1 POST...")
      try {
        data = await tryV1Post(code)
        console.log("[v0] Tracking obtenido desde v1 POST")
      } catch (e2) {
        throw e2
      }
    }

    return NextResponse.json(normalizePayload(data))
  } catch (e: any) {
    console.error("[v0] Error consultando tracking:", e)
    return NextResponse.json(
      {
        error: e?.message || "Error consultando tracking",
        openExternal: true,
      },
      { status: 502 },
    )
  }
}
