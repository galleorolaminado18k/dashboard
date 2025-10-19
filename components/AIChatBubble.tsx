"use client"
import { useEffect, useRef, useState } from "react"

async function askGrok(prompt: string) {
  const key = process.env.NEXT_PUBLIC_XAI_API_KEY || process.env.XAI_API_KEY || ""
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "grok-4-fast-reasoning",
      stream: false,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Eres una IA experta en marketing digital, traffiker y community manager (CI 145). Responde con planes accionables, concisos y medibles.",
        },
        { role: "user", content: prompt },
      ],
    }),
  })
  const json = await res.json()
  return json?.choices?.[0]?.message?.content || "Sin respuesta."
}

export default function AIChatBubble({
  open,
  initialPrompt,
  onClose,
}: {
  open: boolean
  initialPrompt?: string
  onClose: () => void
}) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const booted = useRef(false)

  useEffect(() => {
    if (open && initialPrompt && !booted.current) {
      booted.current = true
      ;(async () => {
        setBusy(true)
        const reply = await askGrok(initialPrompt)
        setMessages([{ role: "assistant", content: reply }])
        setBusy(false)
      })()
    }
  }, [open, initialPrompt])

  const send = async () => {
    if (!input.trim()) return
    const q = input.trim()
    setMessages((m) => [...m, { role: "user", content: q }])
    setInput("")
    setBusy(true)
    const reply = await askGrok(q)
    setMessages((m) => [...m, { role: "assistant", content: reply }])
    setBusy(false)
  }

  if (!open) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] overflow-hidden rounded-2xl border bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="text-sm font-semibold">Experto IA</div>
        <button className="text-xs opacity-60 hover:opacity-100" onClick={onClose}>
          Cerrar
        </button>
      </div>
      <div className="max-h-[420px] space-y-3 overflow-y-auto p-3 text-sm">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <div
              className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 ${
                m.role === "user" ? "bg-black text-white" : "bg-neutral-100 text-neutral-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && <div className="text-xs text-neutral-500">Pensando…</div>}
      </div>
      <div className="flex gap-2 border-t p-2">
        <input
          className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none"
          placeholder="Escribe tu mensaje…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button onClick={send} className="rounded-xl bg-black px-3 py-2 text-xs text-white" disabled={busy}>
          Enviar
        </button>
      </div>
    </div>
  )
}
