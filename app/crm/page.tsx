"use client"

import type React from "react"
import { useState, useRef, useCallback, useMemo, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Search,
  Phone,
  Video,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Mic,
  MessageSquare,
  ShoppingBag,
  ChevronDown,
  MapPin,
  Mail,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Sparkles,
  Bot,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import useSWR, { mutate } from "swr"

// Importar nuestros sistemas automáticos
import { fetchConversations, fetchMessages, sendMessage, updateConversation, type Conversation, type Message, type ConversationStatus } from "@/lib/crm-fetchers"
import { useEstadoAutomatico } from "@/hooks/use-estado-automatico"
import { obtenerSugerenciasAgente, type EstadoConversacion } from "@/lib/crm-estados-karla"
import PurchaseHistory from "@/components/crm/PurchaseHistory"

// Configuración de estados con colores y contadores
const ESTADOS_CONFIG: Record<ConversationStatus, { label: string; color: string; icon: any }> = {
  "por-contestar": {
    label: "Por Contestar",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    icon: MessageSquare,
  },
  "pendiente-datos": {
    label: "Pendiente Datos",
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    icon: AlertTriangle,
  },
  "por-confirmar": {
    label: "Por Confirmar",
    color: "bg-purple-100 text-purple-700 border-purple-300",
    icon: CheckCircle2,
  },
  "pendiente-guia": {
    label: "Pendiente Guía",
    color: "bg-orange-100 text-orange-700 border-orange-300",
    icon: Clock,
  },
  "pedido-completo": {
    label: "Pedido Completo",
    color: "bg-green-100 text-green-700 border-green-300",
    icon: CheckCircle2,
  },
}

// Canales de comunicación
const CANALES = [
  { id: "whatsapp", label: "WhatsApp", icon: "💬", color: "bg-green-500" },
  { id: "instagram", label: "Instagram", icon: "📷", color: "bg-pink-500" },
  { id: "messenger", label: "Messenger", icon: "💬", color: "bg-blue-500" },
  { id: "web", label: "Web", icon: "🌐", color: "bg-zinc-500" },
  { id: "telefono", label: "Teléfono", icon: "📞", color: "bg-amber-500" },
]

// Componente de alerta de datos faltantes
function AlertasDatosFaltantes({ alertas }: { alertas: string[] }) {
  if (alertas.length === 0) return null

  return (
    <div className="space-y-2 mb-4">
      {alertas.map((alerta, idx) => (
        <Alert key={idx} variant="destructive" className="border-red-300 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-semibold">{alerta}</AlertDescription>
        </Alert>
      ))}
    </div>
  )
}

// Componente de sugerencias del agente AI
function SugerenciasAgente({ sugerencias }: { sugerencias: string[] }) {
  if (sugerencias.length === 0) return null

  return (
    <Card className="mb-4 border-2 border-purple-200 bg-purple-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bot className="h-4 w-4 text-purple-600" />
          <span className="text-purple-700">Sugerencias de IA</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sugerencias.map((sugerencia, idx) => (
          <div key={idx} className="text-sm text-purple-900 flex items-start gap-2">
            <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0 text-purple-600" />
            <span>{sugerencia}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Componente de indicador de estado con transición
function IndicadorEstado({ 
  estadoActual, 
  estadoAnterior,
  actualizando 
}: { 
  estadoActual: EstadoConversacion
  estadoAnterior?: EstadoConversacion
  actualizando: boolean 
}) {
  const config = ESTADOS_CONFIG[estadoActual]
  const Icon = config.icon

  return (
    <div className="flex items-center gap-2 mb-4">
      <Badge className={cn(config.color, "px-3 py-1.5 font-medium border-2")}>
        <Icon className="h-4 w-4 mr-2" />
        {config.label}
      </Badge>
      {actualizando && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
          <span>Actualizando estado...</span>
        </div>
      )}
      {estadoAnterior && estadoAnterior !== estadoActual && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <TrendingUp className="h-4 w-4" />
          <span>Estado avanzado desde: {ESTADOS_CONFIG[estadoAnterior].label}</span>
        </div>
      )}
    </div>
  )
}

// Componente de datos extraídos automáticamente
function DatosExtraidosCliente({ datos }: { datos: any }) {
  if (!datos || Object.keys(datos).length === 0) return null

  return (
    <Card className="mb-4 border-2 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="h-4 w-4 text-blue-600" />
          <span className="text-blue-700">Datos Detectados Automáticamente</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 text-sm">
        {datos.nombre && (
          <div>
            <span className="font-semibold text-blue-900">Nombre:</span>{" "}
            <span className="text-blue-700">{datos.nombre}</span>
          </div>
        )}
        {datos.telefono && (
          <div>
            <span className="font-semibold text-blue-900">Teléfono:</span>{" "}
            <span className="text-blue-700">{datos.telefono}</span>
          </div>
        )}
        {datos.ciudad && (
          <div>
            <span className="font-semibold text-blue-900">Ciudad:</span>{" "}
            <span className="text-blue-700">{datos.ciudad}</span>
          </div>
        )}
        {datos.barrio && (
          <div>
            <span className="font-semibold text-blue-900">Barrio:</span>{" "}
            <span className="text-blue-700 font-bold">✓ {datos.barrio}</span>
          </div>
        )}
        {datos.direccion && (
          <div className="col-span-2">
            <span className="font-semibold text-blue-900">Dirección:</span>{" "}
            <span className="text-blue-700">{datos.direccion}</span>
          </div>
        )}
        {datos.correo && (
          <div>
            <span className="font-semibold text-blue-900">Correo:</span>{" "}
            <span className="text-blue-700">{datos.correo}</span>
          </div>
        )}
        {datos.documento && (
          <div>
            <span className="font-semibold text-blue-900">Documento:</span>{" "}
            <span className="text-blue-700">{datos.documento}</span>
          </div>
        )}
        {datos.metodoPago && (
          <div className="col-span-2">
            <span className="font-semibold text-blue-900">Método de Pago:</span>{" "}
            <Badge className="ml-2" variant="secondary">
              {datos.metodoPago === "anticipado" ? "💳 Transferencia Anticipada" : "📦 Contraentrega"}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function CRMPage() {
  const [filtroEstado, setFiltroEstado] = useState<ConversationStatus | "todas">("todas")
  const [conversacionActiva, setConversacionActiva] = useState<string | null>(null)
  const [mensajeNuevo, setMensajeNuevo] = useState("")
  const [busqueda, setBusqueda] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch de conversaciones con SWR
  const { data: conversaciones, error: errorConversaciones } = useSWR(
    filtroEstado === "todas" ? ["conversaciones"] : ["conversaciones", filtroEstado],
    () => fetchConversations(filtroEstado === "todas" ? undefined : filtroEstado),
    {
      refreshInterval: 5000, // Actualizar cada 5 segundos
      revalidateOnFocus: true,
    }
  )

  // Fetch de mensajes de la conversación activa
  const { data: mensajes, error: errorMensajes } = useSWR(
    conversacionActiva ? ["mensajes", conversacionActiva] : null,
    () => (conversacionActiva ? fetchMessages(conversacionActiva) : null),
    {
      refreshInterval: 2000, // Actualizar cada 2 segundos para mensajes
      revalidateOnFocus: true,
    }
  )

  // Sistema automático de estados
  const {
    estadoActual,
    sugerencias,
    datosExtraidos,
    datosCompletos,
    faltaBarrio,
    alertas,
    actualizando,
    cambiarEstadoManual,
  } = useEstadoAutomatico(conversacionActiva || "", mensajes || [])

  // Conversación seleccionada
  const conversacionSeleccionada = useMemo(() => {
    return conversaciones?.find((c) => c.id === conversacionActiva)
  }, [conversaciones, conversacionActiva])

  // Filtrar conversaciones por búsqueda
  const conversacionesFiltradas = useMemo(() => {
    if (!conversaciones) return []
    if (!busqueda) return conversaciones

    const query = busqueda.toLowerCase()
    return conversaciones.filter(
      (c) =>
        c.client_name?.toLowerCase().includes(query) ||
        c.last_message?.toLowerCase().includes(query) ||
        c.notes?.toLowerCase().includes(query)
    )
  }, [conversaciones, busqueda])

  // Contar conversaciones por estado
  const contadores = useMemo(() => {
    if (!conversaciones) return {}
    const counts: Record<string, number> = { todas: conversaciones.length }
    conversaciones.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1
    })
    return counts
  }, [conversaciones])

  // Enviar mensaje
  const handleEnviarMensaje = useCallback(async () => {
    if (!mensajeNuevo.trim() || !conversacionActiva) return

    try {
      await sendMessage(conversacionActiva, mensajeNuevo, "agent")
      setMensajeNuevo("")
      // Refrescar mensajes y conversaciones
      mutate(["mensajes", conversacionActiva])
      mutate(["conversaciones"])
      mutate(["conversaciones", filtroEstado])
    } catch (error) {
      console.error("Error al enviar mensaje:", error)
    }
  }, [mensajeNuevo, conversacionActiva, filtroEstado])

  // Auto-scroll cuando llegan nuevos mensajes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [mensajes])

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar />

      <div className="flex flex-1 overflow-hidden">
        {/* Panel izquierdo: Lista de conversaciones */}
        <div className="w-[380px] border-r border-zinc-200 flex flex-col bg-white">
          {/* Header con filtros */}
          <div className="p-4 border-b border-zinc-200 bg-gradient-to-r from-amber-50 to-yellow-50">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-zinc-900">CRM Galle</h1>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                {contadores.todas || 0} conversaciones
              </Badge>
            </div>

            {/* Búsqueda */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Buscar por nombre, mensaje..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros de estado */}
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                <Button
                  variant={filtroEstado === "todas" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFiltroEstado("todas")}
                  className="shrink-0"
                >
                  Todas ({contadores.todas || 0})
                </Button>
                {Object.entries(ESTADOS_CONFIG).map(([estado, config]) => {
                  const Icon = config.icon
                  return (
                    <Button
                      key={estado}
                      variant={filtroEstado === estado ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFiltroEstado(estado as ConversationStatus)}
                      className="shrink-0"
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {config.label.split(" ")[0]} ({contadores[estado] || 0})
                    </Button>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Lista de conversaciones */}
          <ScrollArea className="flex-1">
            {errorConversaciones && (
              <div className="p-4 text-center text-red-600">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                Error al cargar conversaciones
              </div>
            )}
            {!conversaciones && !errorConversaciones && (
              <div className="p-4 text-center text-zinc-500">
                <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-2" />
                Cargando conversaciones...
              </div>
            )}
            {conversacionesFiltradas && conversacionesFiltradas.length === 0 && (
              <div className="p-4 text-center text-zinc-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                No hay conversaciones
              </div>
            )}
            {conversacionesFiltradas?.map((conversacion) => {
              const config = ESTADOS_CONFIG[conversacion.status]
              const Icon = config.icon
              const canal = CANALES.find((c) => c.id === conversacion.canal)

              return (
                <button
                  key={conversacion.id}
                  onClick={() => setConversacionActiva(conversacion.id)}
                  className={cn(
                    "w-full p-4 border-b border-zinc-100 hover:bg-zinc-50 transition-colors text-left",
                    conversacionActiva === conversacion.id && "bg-amber-50 border-l-4 border-l-amber-500"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conversacion.avatar_url || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-amber-400 to-yellow-500 text-white">
                          {conversacion.client_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      {canal && (
                        <div className={cn("absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs", canal.color)}>
                          {canal.icon}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-zinc-900 truncate">
                          {conversacion.client_name || "Sin nombre"}
                        </span>
                        <span className="text-xs text-zinc-500 ml-2">
                          {new Date(conversacion.updated_at).toLocaleDateString("es-CO", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>

                      <p className="text-sm text-zinc-600 truncate mb-2">
                        {conversacion.last_message || "Sin mensajes"}
                      </p>

                      <div className="flex items-center justify-between">
                        <Badge className={cn("text-xs", config.color)}>
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                        {conversacion.unread_count > 0 && (
                          <Badge className="bg-red-500 text-white text-xs">
                            {conversacion.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </ScrollArea>
        </div>

        {/* Panel central: Chat */}
        <div className="flex-1 flex flex-col bg-white">
          {!conversacionActiva ? (
            <div className="flex-1 flex items-center justify-center text-zinc-400">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4" />
                <p className="text-lg">Selecciona una conversación para empezar</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header del chat */}
              <div className="p-4 border-b border-zinc-200 bg-gradient-to-r from-amber-50 to-yellow-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversacionSeleccionada?.avatar_url || ""} />
                      <AvatarFallback className="bg-gradient-to-br from-amber-400 to-yellow-500 text-white">
                        {conversacionSeleccionada?.client_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="font-semibold text-zinc-900">
                        {conversacionSeleccionada?.client_name || "Sin nombre"}
                      </h2>
                      <p className="text-sm text-zinc-600">
                        {conversacionSeleccionada?.canal && CANALES.find((c) => c.id === conversacionSeleccionada.canal)?.label}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Video className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Mensajes */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {errorMensajes && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>Error al cargar mensajes</AlertDescription>
                  </Alert>
                )}
                {!mensajes && !errorMensajes && (
                  <div className="text-center text-zinc-500 py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-2" />
                    Cargando mensajes...
                  </div>
                )}
                <div className="space-y-4">
                  {mensajes?.map((mensaje) => (
                    <div
                      key={mensaje.id}
                      className={cn(
                        "flex gap-3",
                        mensaje.sender === "agent" ? "justify-end" : "justify-start"
                      )}
                    >
                      {mensaje.sender === "client" && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={conversacionSeleccionada?.avatar_url || ""} />
                          <AvatarFallback className="bg-zinc-200">
                            {conversacionSeleccionada?.client_name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2",
                          mensaje.sender === "agent"
                            ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white"
                            : "bg-zinc-100 text-zinc-900"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{mensaje.content}</p>
                        <p
                          className={cn(
                            "text-xs mt-1",
                            mensaje.sender === "agent" ? "text-amber-100" : "text-zinc-500"
                          )}
                        >
                          {new Date(mensaje.created_at).toLocaleTimeString("es-CO", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {mensaje.sender === "agent" && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-amber-500 to-yellow-500 text-white">
                            K
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input de mensaje */}
              <div className="p-4 border-t border-zinc-200 bg-white">
                <div className="flex items-end gap-2">
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Smile className="h-5 w-5" />
                  </Button>
                  <Textarea
                    placeholder="Escribe un mensaje..."
                    value={mensajeNuevo}
                    onChange={(e) => setMensajeNuevo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleEnviarMensaje()
                      }
                    }}
                    className="flex-1 min-h-[44px] max-h-[120px] resize-none"
                    rows={1}
                  />
                  <Button
                    onClick={handleEnviarMensaje}
                    disabled={!mensajeNuevo.trim()}
                    className="shrink-0 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Panel derecho: Sistema automático */}
        {conversacionActiva && (
          <div className="w-[400px] border-l border-zinc-200 bg-zinc-50 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Título */}
              <div className="flex items-center gap-2 mb-4">
                <Bot className="h-6 w-6 text-purple-600" />
                <h3 className="text-lg font-bold text-zinc-900">Sistema Automático</h3>
              </div>

              {/* Indicador de estado */}
              <IndicadorEstado
                estadoActual={estadoActual}
                estadoAnterior={conversacionSeleccionada?.status}
                actualizando={actualizando}
              />

              {/* Alertas de datos faltantes */}
              <AlertasDatosFaltantes alertas={alertas} />

              {/* Datos extraídos */}
              <DatosExtraidosCliente datos={datosExtraidos} />

              {/* Sugerencias de IA */}
              <SugerenciasAgente sugerencias={sugerencias} />

              {/* Información del cliente */}
              {conversacionSeleccionada && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Información del Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {conversacionSeleccionada.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-zinc-500" />
                        <span>{conversacionSeleccionada.email}</span>
                      </div>
                    )}
                    {conversacionSeleccionada.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-zinc-500" />
                        <span>{conversacionSeleccionada.phone}</span>
                      </div>
                    )}
                    {conversacionSeleccionada.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-zinc-500" />
                        <span>{conversacionSeleccionada.address}</span>
                      </div>
                    )}
                    {conversacionSeleccionada.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-semibold text-zinc-500 mb-1">Notas:</p>
                        <p className="text-zinc-700">{conversacionSeleccionada.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* 🛒 Historial de Compras - IQ 145 */}
              {conversacionSeleccionada?.client_id && (
                <PurchaseHistory clientId={conversacionSeleccionada.client_id} />
              )}

              {/* Cambio manual de estado */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cambio Manual de Estado</CardTitle>
                  <CardDescription className="text-xs">
                    Solo si es necesario sobrescribir el estado automático
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(ESTADOS_CONFIG).map(([estado, config]) => {
                    const Icon = config.icon
                    return (
                      <Button
                        key={estado}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => cambiarEstadoManual(estado as ConversationStatus)}
                        disabled={estadoActual === estado}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {config.label}
                      </Button>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
