"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import NovedadModal from "../entregas/components/NovedadModal"
import { AlertTriangle } from "lucide-react"

export default function TestNovedadPage() {
  const [modalOpen, setModalOpen] = useState(false)

  // Datos de prueba con la novedad real
  const envioTest = {
    envioId: "ENV-2025-10-001",
    factura: "000021",
    cliente: "GREYCY SALAMANCA",
    ciudad: "turbaco bolivar",
    direccion: "Bonanza vista manzana 9 lote 20",
    telefono: "3135948790",
    guia: "58048080554",
    transportadora: "Coordinadora",
    mipaqueteStatus: "Usuario cancela pedido",
    productos: [
      {
        descripcion: "Balines #4MM DORADOS",
        cantidad: 1,
        precio: 155000,
        total: 155000
      }
    ],
    subtotal: 130252,
    envioMonto: 24628,
    total: 179628
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">🧪 Página de Prueba - Modal de Novedad</h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Prueba el Modal de Novedad</h2>
          <p className="text-neutral-600 mb-6">
            Esta es una página de prueba para verificar que el modal funciona correctamente.
            Haz clic en el botón de abajo para abrir el modal con los datos reales del envío con novedad.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900">Simulación de Novedad</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Envío: ENV-2025-10-001 • Factura: 000021
                </p>
                <p className="text-sm text-yellow-700">
                  Estado: Usuario cancela pedido
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 h-12
            border-2 border-red-600 text-white bg-red-600 hover:bg-red-700
            shadow-lg shadow-red-500/50 transition-all font-bold text-base
            hover:scale-105 animate-pulse"
          >
            <AlertTriangle className="w-5 h-5" />
            ⚠️ Solucionar novedad
          </Button>

          <div className="mt-6 p-4 bg-neutral-100 rounded-lg">
            <h3 className="font-semibold mb-2">Datos que verás en el modal:</h3>
            <ul className="text-sm space-y-1 text-neutral-700">
              <li>✅ Cliente: GREYCY SALAMANCA</li>
              <li>✅ Teléfono: 3135948790</li>
              <li>✅ Dirección: Bonanza vista manzana 9 lote 20</li>
              <li>✅ Producto: Balines #4MM DORADOS</li>
              <li>✅ Total: $179.628</li>
              <li>✅ Botón WhatsApp funcional</li>
            </ul>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">ℹ️ Información</h2>
          <p className="text-blue-700 text-sm">
            Si este modal funciona aquí, significa que TODO el código está correcto.
            El problema está en que Vercel no está mostrando la columna "Acciones" en la tabla de entregas.
          </p>
          <p className="text-blue-700 text-sm mt-2">
            <strong>URL de esta página de prueba:</strong> <code>/test-novedad</code>
          </p>
        </div>
      </div>

      {/* Modal de Novedad */}
      <NovedadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        envio={envioTest}
      />
    </div>
  )
}

