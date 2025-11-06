        <div className="fixed bottom-8 right-8 z-50">
          <Button
            onClick={saveConfig}
            disabled={saving}
            size="lg"
            className="rounded-full shadow-2xl bg-gradient-to-r from-[#D8BD80] to-[#C5AC6E] hover:from-[#C5AC6E] hover:to-[#D8BD80] text-white font-semibold px-8 py-6 text-base"
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
                Guardar Configuración
              </>
            )}
          </Button>
        </div>

        {/* Mensajes de Error */}
        {error && (
          <div className="fixed bottom-24 right-8 z-50 p-4 bg-red-100 border border-red-300 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { QrCode, Link2, Save, RefreshCw, Check, AlertCircle, Phone, MessageSquare, Mail, Globe, Package, CreditCard, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface DashboardConfig {
  // WAHA WhatsApp
  wahaEnabled: boolean
  wahaApiKey: string
  wahaUrl: string

  // MiPaquete
  apiKeyMiPaquete: string
  sessionTrackerMiPaquete: string

  // Supabase
  supabaseUrl: string
  supabaseAnonKey: string

  // Notificaciones
  emailNotifications: string
  webhookUrl: string

  // Empresa
  companyName: string
  companyLogo: string
}

export default function ConfiguracionDashboardPage() {
  const [config, setConfig] = useState<DashboardConfig>({
    wahaEnabled: false,
    wahaApiKey: "",
    wahaUrl: "http://localhost:3000",
    apiKeyMiPaquete: "",
    sessionTrackerMiPaquete: "",
    supabaseUrl: "",
    supabaseAnonKey: "",
    emailNotifications: "",
    webhookUrl: "",
    companyName: "Comercializadora Gale18k",
    companyLogo: "",
  })

  // WAHA Estado
  const [wahaStatus, setWahaStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [wahaQR, setWahaQR] = useState<string>("")
  const [polling, setPolling] = useState(false)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string>("")

  // Cargar configuración guardada
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/config/dashboard')
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
      }
    } catch (err) {
      console.error('Error loading config:', err)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    setError("")
    setSaved(false)

    try {
      const res = await fetch('/api/config/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (!res.ok) throw new Error('Error al guardar')

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError('Error al guardar la configuración')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // ========== WAHA FUNCTIONS ==========

  const startWahaSession = async () => {
    setWahaStatus('connecting')
    try {
      const res = await fetch('/api/whatsapp/session', { method: 'POST' })
      const data = await res.json()

      if (data.ok) {
        startPollingQR()
      } else {
        setError('Error al iniciar sesión de WhatsApp')
        setWahaStatus('error')
      }
    } catch (err) {
      setError('Error al conectar con WAHA')
      setWahaStatus('error')
    }
  }

  const startPollingQR = () => {
    setPolling(true)
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/whatsapp/qr')
        const data = await res.json()

        if (data.ok && data.qr) {
          setWahaQR(`data:image/png;base64,${data.qr}`)
          setWahaStatus('connecting')
        } else if (data.status === 'WORKING') {
          setWahaStatus('connected')
          setPolling(false)
          clearInterval(interval)
        }
      } catch (err) {
        console.error('Error polling QR:', err)
      }
    }, 5000)

    // Cleanup después de 2 minutos
    setTimeout(() => {
      setPolling(false)
      clearInterval(interval)
    }, 120000)
  }

  const disconnectWaha = async () => {
    try {
      await fetch('/api/whatsapp/session', { method: 'DELETE' })
      setWahaStatus('disconnected')
      setWahaQR("")
    } catch (err) {
      setError('Error al desconectar WhatsApp')
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#0B0B0C]">
      {/* Header */}
      <section className="px-6 lg:px-10 pt-10 pb-6 border-b border-neutral-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-[#D8BD80] to-[#C5AC6E] rounded-2xl">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-[32px] md:text-[40px] font-semibold tracking-tight leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#111] via-[#111] to-[rgba(216,189,128,0.8)]">
                CONFIGURACIÓN DEL DASHBOARD
              </span>
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Configuración avanzada de integraciones y servicios externos
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="px-6 lg:px-10 py-8">
        <Tabs defaultValue="whatsapp" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl mb-8">
            <TabsTrigger value="whatsapp">
              <MessageSquare className="w-4 h-4 mr-2" />
              WhatsApp WAHA
            </TabsTrigger>
            <TabsTrigger value="integraciones">
              <Link2 className="w-4 h-4 mr-2" />
              Integraciones
            </TabsTrigger>
            <TabsTrigger value="empresa">
              <Globe className="w-4 h-4 mr-2" />
              Datos Empresa
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: WhatsApp WAHA */}
          <TabsContent value="whatsapp">
            <div className="grid gap-6 max-w-5xl">
              {/* WAHA Configuration */}
              <Card className="p-6 border-2 border-[#D8BD80]/30 rounded-2xl">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-[#12B886]/10 rounded-xl">
                    <MessageSquare className="w-6 h-6 text-[#12B886]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">WhatsApp Business Avanzado (WAHA)</h3>
                      <Badge variant={config.wahaEnabled ? "default" : "secondary"}>
                        {config.wahaEnabled ? "Habilitado" : "Deshabilitado"}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-500 mb-4">
                      Integración real de WhatsApp Web con envío y recepción automatizada de mensajes
                    </p>

                    <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Requisitos:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Docker instalado y corriendo</li>
                          <li>Puerto 3000 disponible</li>
                          <li>Ejecutar: <code className="bg-blue-100 px-2 py-0.5 rounded">docker-compose -f docker-compose.waha.yml up -d</code></li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="waha-enabled"
                          checked={config.wahaEnabled}
                          onChange={(e) => setConfig({ ...config, wahaEnabled: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="waha-enabled" className="cursor-pointer">
                          Habilitar integración WAHA
                        </Label>
                      </div>

                      {config.wahaEnabled && (
                        <>
                          <div>
                            <Label htmlFor="waha-url">URL de WAHA</Label>
                            <Input
                              id="waha-url"
                              type="url"
                              placeholder="http://localhost:3000"
                              value={config.wahaUrl}
                              onChange={(e) => setConfig({ ...config, wahaUrl: e.target.value })}
                              className="mt-2"
                            />
                          </div>

                          <div>
                            <Label htmlFor="waha-apikey">API Key de WAHA</Label>
                            <Input
                              id="waha-apikey"
                              type="password"
                              placeholder="tu-api-key-secreta"
                              value={config.wahaApiKey}
                              onChange={(e) => setConfig({ ...config, wahaApiKey: e.target.value })}
                              className="mt-2 font-mono text-xs"
                            />
                          </div>

                          <div className="border-t border-neutral-200 pt-4 mt-4">
                            <h4 className="font-semibold mb-4">Estado de Conexión</h4>

                            <div className="grid md:grid-cols-2 gap-6">
                              <div>
                                <div className="mb-4">
                                  {wahaStatus === 'disconnected' && (
                                    <div className="flex items-center gap-2 text-neutral-500">
                                      <div className="w-3 h-3 rounded-full bg-neutral-400"></div>
                                      <span className="text-sm">Desconectado</span>
                                    </div>
                                  )}
                                  {wahaStatus === 'connecting' && (
                                    <div className="flex items-center gap-2 text-orange-600">
                                      <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div>
                                      <span className="text-sm">Conectando... Escanea el QR</span>
                                    </div>
                                  )}
                                  {wahaStatus === 'connected' && (
                                    <div className="flex items-center gap-2 text-green-600">
                                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                      <span className="text-sm font-semibold">✅ Conectado</span>
                                    </div>
                                  )}
                                  {wahaStatus === 'error' && (
                                    <div className="flex items-center gap-2 text-red-600">
                                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                      <span className="text-sm">Error de conexión</span>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  {wahaStatus === 'disconnected' && (
                                    <Button
                                      onClick={startWahaSession}
                                      className="w-full bg-[#12B886] hover:bg-[#0F9D72]"
                                    >
                                      <MessageSquare className="w-4 h-4 mr-2" />
                                      Conectar WhatsApp
                                    </Button>
                                  )}
                                  {wahaStatus === 'connected' && (
                                    <Button
                                      onClick={disconnectWaha}
                                      variant="destructive"
                                      className="w-full"
                                    >
                                      Desconectar
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-center">
                                {wahaQR ? (
                                  <div className="space-y-3">
                                    <div className="p-4 bg-white border-2 border-[#D8BD80] rounded-2xl shadow-lg">
                                      <img src={wahaQR} alt="QR WhatsApp WAHA" className="w-64 h-64" />
                                    </div>
                                    <p className="text-xs text-center text-neutral-500">
                                      Escanea con WhatsApp Business
                                    </p>
                                  </div>
                                ) : wahaStatus === 'connecting' ? (
                                  <div className="flex flex-col items-center gap-3">
                                    <RefreshCw className="w-12 h-12 text-neutral-400 animate-spin" />
                                    <p className="text-sm text-neutral-500">Generando código QR...</p>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center text-neutral-400">
                                    <QrCode className="w-16 h-16 mb-3" />
                                    <p className="text-sm">Click en "Conectar" para generar QR</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 2: Integraciones */}
          <TabsContent value="integraciones">
            <div className="grid gap-6 max-w-5xl">
              {/* MiPaquete */}
              <Card className="p-6 border border-neutral-200 rounded-2xl">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Package className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">MiPaquete API</h3>
                    <p className="text-sm text-neutral-500 mb-4">
                      Credenciales para integración con el sistema de envíos
                    </p>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="mipaquete-apikey">API Key</Label>
                        <Input
                          id="mipaquete-apikey"
                          type="text"
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          value={config.apiKeyMiPaquete}
                          onChange={(e) => setConfig({ ...config, apiKeyMiPaquete: e.target.value })}
                          className="font-mono text-xs mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mipaquete-session">Session Tracker</Label>
                        <Input
                          id="mipaquete-session"
                          type="text"
                          placeholder="a0c96ea6-b22d-4fb7-a278-850678d5429c"
                          value={config.sessionTrackerMiPaquete}
                          onChange={(e) => setConfig({ ...config, sessionTrackerMiPaquete: e.target.value })}
                          className="font-mono text-xs mt-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Supabase */}
              <Card className="p-6 border border-neutral-200 rounded-2xl">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <CreditCard className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">Supabase Database</h3>
                    <p className="text-sm text-neutral-500 mb-4">
                      Configuración de la base de datos
                    </p>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="supabase-url">Supabase URL</Label>
                        <Input
                          id="supabase-url"
                          type="url"
                          placeholder="https://xxxxx.supabase.co"
                          value={config.supabaseUrl}
                          onChange={(e) => setConfig({ ...config, supabaseUrl: e.target.value })}
                          className="font-mono text-xs mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="supabase-key">Anon Key (público)</Label>
                        <Input
                          id="supabase-key"
                          type="password"
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          value={config.supabaseAnonKey}
                          onChange={(e) => setConfig({ ...config, supabaseAnonKey: e.target.value })}
                          className="font-mono text-xs mt-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Email & Webhooks */}
              <Card className="p-6 border border-neutral-200 rounded-2xl">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email de Notificaciones</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="notificaciones@tuempresa.com"
                      value={config.emailNotifications}
                      onChange={(e) => setConfig({ ...config, emailNotifications: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhook">Webhook URL</Label>
                    <Input
                      id="webhook"
                      type="url"
                      placeholder="https://tudominio.com/api/webhooks"
                      value={config.webhookUrl}
                      onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 3: Datos Empresa */}
          <TabsContent value="empresa">
            <div className="grid gap-6 max-w-5xl">
              <Card className="p-6 border border-neutral-200 rounded-2xl">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="company-name">Nombre de la Empresa</Label>
                    <Input
                      id="company-name"
                      type="text"
                      placeholder="Comercializadora Gale18k"
                      value={config.companyName}
                      onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-logo">URL del Logo</Label>
                    <Input
                      id="company-logo"
                      type="url"
                      placeholder="https://tudominio.com/logo.png"
                      value={config.companyLogo}
                      onChange={(e) => setConfig({ ...config, companyLogo: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Botón Guardar Flotante */}

