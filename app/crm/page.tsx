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
