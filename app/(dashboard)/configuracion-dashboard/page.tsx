"use client"

import { useState } from "react"
import { Save, RefreshCw, Check, AlertCircle, MessageSquare, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ConfiguracionDashboardPage() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const saveConfig = async () => {
    setSaving(true)
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-white text-[#0B0B0C] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-gradient-to-br from-[#D8BD80] to-[#C5AC6E] rounded-2xl">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Configuración del Dashboard</h1>
            <p className="text-neutral-500">Configuración avanzada de integraciones</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 border-2 border-[#D8BD80]/30 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-6 h-6 text-[#12B886]" />
              <h2 className="text-xl font-semibold">WhatsApp Business (WAHA)</h2>
            </div>
            <p className="text-sm text-neutral-500 mb-4">
              Próximamente: Integración avanzada con WhatsApp Business
            </p>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                🚧 En desarrollo - Integración con WAHA para WhatsApp Business real
              </p>
            </div>
          </div>
        </div>

        <div className="fixed bottom-8 right-8">
          <Button
            onClick={saveConfig}
            disabled={saving}
            size="lg"
            className="rounded-full shadow-2xl bg-gradient-to-r from-[#D8BD80] to-[#C5AC6E] hover:from-[#C5AC6E] hover:to-[#D8BD80] text-white font-semibold px-8 py-6"
          >
            {saving ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Guardando...
              </>
            ) : saved ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                ¡Guardado!
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Guardar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

