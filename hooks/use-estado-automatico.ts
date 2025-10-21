// =====================================================
// Hook: useEstadoAutomatico
// =====================================================
// Hook para gestionar automáticamente los estados de conversación

import { useEffect, useState } from 'react'
import { 
  analizarEstadoConversacion, 
  debeActualizarEstado,
  extraerDatosCliente,
  obtenerSugerenciasAgente,
  type EstadoConversacion 
} from '@/lib/crm-estados-karla'
import { updateConversation } from '@/lib/crm-fetchers'
import type { Message } from '@/lib/crm-fetchers'

interface UseEstadoAutomaticoProps {
  conversationId: string
  estadoActual: EstadoConversacion
  mensajes: Message[]
  onEstadoCambiado?: (nuevoEstado: EstadoConversacion) => void
}

export function useEstadoAutomatico({
  conversationId,
  estadoActual,
  mensajes,
  onEstadoCambiado
}: UseEstadoAutomaticoProps) {
  
  const [actualizando, setActualizando] = useState(false)
  const [sugerencias, setSugerencias] = useState<string[]>([])
  const [datosExtraidos, setDatosExtraidos] = useState<ReturnType<typeof extraerDatosCliente> | null>(null)
  
  // Analizar mensajes cuando cambien
  useEffect(() => {
    if (mensajes.length === 0) return
    
    const mensajesFormateados = mensajes.map(m => ({
      sender: m.sender,
      content: m.content
    }))
    
    // Extraer datos del cliente automáticamente
    const datos = extraerDatosCliente(mensajesFormateados)
    setDatosExtraidos(datos)
    
    // Verificar si debe actualizarse el estado
    const { debeActualizar, nuevoEstado } = debeActualizarEstado(estadoActual, mensajesFormateados)
    
    if (debeActualizar) {
      actualizarEstadoConversacion(nuevoEstado)
    }
    
    // Actualizar sugerencias según el estado actual
    const nuevasSugerencias = obtenerSugerenciasAgente(estadoActual)
    setSugerencias(nuevasSugerencias)
    
  }, [mensajes, estadoActual])
  
  // Función para actualizar el estado en la base de datos
  const actualizarEstadoConversacion = async (nuevoEstado: EstadoConversacion) => {
    if (actualizando) return
    
    setActualizando(true)
    try {
      const resultado = await updateConversation(conversationId, {
        status: nuevoEstado
      })
      
      if (resultado && onEstadoCambiado) {
        onEstadoCambiado(nuevoEstado)
      }
    } catch (error) {
      console.error('Error actualizando estado:', error)
    } finally {
      setActualizando(false)
    }
  }
  
  // Función manual para cambiar estado (override)
  const cambiarEstadoManual = async (nuevoEstado: EstadoConversacion) => {
    await actualizarEstadoConversacion(nuevoEstado)
  }
  
  // Verificar si el cliente proporcionó todos los datos
  const datosCompletos = datosExtraidos?.datosCompletos || false
  
  // Verificar si falta el barrio (CRÍTICO según Karla)
  const faltaBarrio = datosExtraidos && !datosExtraidos.barrio
  
  // Alertas para el agente
  const alertas: string[] = []
  if (faltaBarrio && datosExtraidos) {
    alertas.push('⚠️ CRÍTICO: Falta el BARRIO para calcular envío')
  }
  if (datosExtraidos && !datosExtraidos.metodoPago) {
    alertas.push('💳 Falta método de pago (Anticipado/Contraentrega)')
  }
  if (datosExtraidos && !datosExtraidos.correo) {
    alertas.push('📧 Falta correo electrónico')
  }
  
  return {
    estadoActual,
    sugerencias,
    datosExtraidos,
    datosCompletos,
    faltaBarrio,
    alertas,
    actualizando,
    cambiarEstadoManual
  }
}

// Hook para monitorear todas las conversaciones y actualizar estados
export function useMonitorEstados() {
  const [procesando, setProcesando] = useState(false)
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null)
  
  const procesarConversaciones = async (conversaciones: any[]) => {
    if (procesando) return
    
    setProcesando(true)
    try {
      for (const conv of conversaciones) {
        // Aquí podrías implementar lógica para procesar
        // múltiples conversaciones en batch
      }
      setUltimaActualizacion(new Date())
    } catch (error) {
      console.error('Error procesando conversaciones:', error)
    } finally {
      setProcesando(false)
    }
  }
  
  return {
    procesarConversaciones,
    procesando,
    ultimaActualizacion
  }
}
