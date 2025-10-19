import { NextResponse } from "next/server"

// Fallback por si no existe la variable (usa el que nos diste)
const FALLBACK_XAI = "7d9ef5c7-deca-4fcb-b06c-353f98ff9f0a"

export async function POST(req: Request) {
  const { prompt } = await req.json()
  const apiKey = process.env.XAI_API_KEY || FALLBACK_XAI

  try {
    const r = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-beta",
        stream: false,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "Eres un experto en marketing digital, traffiker y community manager con CI 145. Responde en español, muy específico y accionable.",
          },
          { role: "user", content: prompt },
        ],
      }),
    })

    const j = await r.json()
    const text = j?.choices?.[0]?.message?.content || ""
    return NextResponse.json({
      text: `<pre style="white-space:pre-wrap">${text}</pre>`,
    })
  } catch (e) {
    return NextResponse.json({
      text: "<b>Error IA:</b> No fue posible generar el plan en este momento.",
    })
  }
}
