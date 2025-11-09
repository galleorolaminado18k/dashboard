"use client"

import { useState, useEffect } from "react"
import { QrCode, Link2, Save, RefreshCw, Check, AlertCircle, Phone, MessageSquare, Mail, Globe, Package, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CRMConfig {
  whatsappBusinessPhone: string
  whatsappQRCode: string
  apiKeyMiPaquete: string
  sessionTrackerMiPaquete: string
  supabaseUrl: string
  supabaseAnonKey: string
  emailNotifications: string
  webhookUrl: string
  companyName: string
  companyLogo: string
}

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<CRMConfig>({
    whatsappBusinessPhone: "",
    whatsappQRCode: "",
    apiKeyMiPaquete: "",
    sessionTrackerMiPaquete: "",
    supabaseUrl: "",
    supabaseAnonKey: "",
    emailNotifications: "",
    webhookUrl: "",
    companyName: "",
    companyLogo: "",
  })

  const [qrCodeImage, setQrCodeImage] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string>("")
  const [sessionStatus, setSessionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // Cargar configuración guardada
  useEffect(() => {
    loadConfig()
    checkSessionStatus()
  }, [])

  // Limpiar interval al desmontar
  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval)
    }
  }, [pollingInterval])

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/config/crm')
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
      }
    } catch (err) {
      console.error('Error loading config:', err)
    }
  }

  const checkSessionStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/evolution')
      if (res.ok) {
        const data = await res.json()
        if (data.ok && data.session) {
          if (data.session.connected) {
            setSessionStatus('connected')
          } else if (data.session.needsQR) {
            setSessionStatus('connecting')
            startPollingQR()
          }
        }
      }
    } catch (err) {
      console.error('Error checking session:', err)
    }
  }

  const startWhatsAppSession = async () => {
    console.log('🚀 Iniciando sesión de WhatsApp con Evolution API...')
    setSessionStatus('connecting')
    setError("")
    setQrCodeImage("")

    try {
      console.log('📡 Llamando a /api/whatsapp/evolution (Start → QR)...')

      const response = await fetch('/api/whatsapp/evolution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      console.log('📥 Respuesta completa:', data)

      if (!response.ok || !data.ok) {
        console.error('❌ Error:', data.error, data.detail)
        setError(data.detail || data.error || 'Error conectando con Evolution API')
        setSessionStatus('disconnected')
        return
      }

      // QR obtenido exitosamente
      console.log('✅ QR obtenido exitosamente de Evolution API')
      setQrCodeImage(data.qr) // Evolution retorna data:image/png;base64,...
      setSessionStatus('connecting')

      // Iniciar polling para verificar cuando se escanee
      startPollingStatus()

    } catch (err: any) {
      console.error('❌ Error de red:', err)
      setError(`Error de red: ${err.message || 'No se pudo conectar con Evolution API'}`)
      setSessionStatus('disconnected')
    }
  }

  const startPollingStatus = () => {
    // Limpiar interval anterior si existe
    if (pollingInterval) clearInterval(pollingInterval)

    // Verificar estado cada 3 segundos
    const interval = setInterval(checkConnectionStatus, 3000)
    setPollingInterval(interval)

    // Timeout de 2 minutos
    setTimeout(() => {
      if (interval) clearInterval(interval)
      if (sessionStatus === 'connecting') {
        setError('Tiempo agotado. Reinicia la sesión.')
        setSessionStatus('disconnected')
      }
    }, 120000)
  }

  const checkConnectionStatus = async () => {
    try {
      console.log('🔄 Verificando estado de conexión...')
      const res = await fetch('/api/whatsapp/evolution')
      const data = await res.json()

      console.log('📥 Estado:', data)

      if (data.ok && data.session) {
        if (data.session.connected) {
          // Ya está conectado!
          console.log('✅ WhatsApp conectado!')
          setSessionStatus('connected')
          setQrCodeImage("")
          if (pollingInterval) clearInterval(pollingInterval)
        }
      }
    } catch (err) {
      console.error('❌ Error verificando estado:', err)
    }
  }

  const fetchQRCode = async () => {
    try {
      console.log('🔄 Obteniendo QR de Evolution API...')
      const res = await fetch('/api/whatsapp/evolution', { method: 'POST' })
      const data = await res.json()

      console.log('📥 Respuesta QR:', data)

      if (data.ok && data.qr) {
        console.log('✅ QR recibido!')
        setQrCodeImage(data.qr)
      } else {
        console.log('⏳ QR no disponible aún:', data.error || 'esperando...')
      }
    } catch (err) {
      console.error('❌ Error obteniendo QR:', err)
    }
  }

  const disconnectWhatsApp = async () => {
    try {
      await fetch('/api/whatsapp/evolution', { method: 'DELETE' })
      setSessionStatus('disconnected')
      setQrCodeImage("")
      if (pollingInterval) clearInterval(pollingInterval)
    } catch (err) {
      setError('Error al desconectar')
    }
  }

  const handlePhoneChange = (phone: string) => {
    setConfig({ ...config, whatsappBusinessPhone: phone })
  }

  const saveConfig = async () => {
    setSaving(true)
    setError("")
    setSaved(false)

    try {
      const res = await fetch('/api/config/crm', {
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

  return (
    <div className="min-h-screen bg-white text-[#0B0B0C]">
      {/* Header */}
      <section className="px-6 lg:px-10 pt-10 pb-6 border-b border-neutral-100">
        <div>
          <h1 className="text-[32px] md:text-[40px] font-semibold tracking-tight leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#111] via-[#111] to-[rgba(216,189,128,0.8)]">
              CONFIGURACIÓN
            </span>
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Configura tu cuenta y servicios básicos
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="px-6 lg:px-10 py-8">
        <Tabs defaultValue="crm" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl mb-8">
            <TabsTrigger value="crm">
              <MessageSquare className="w-4 h-4 mr-2" />
              CRM & WhatsApp
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

          {/* Tab 1: CRM & WhatsApp */}
          <TabsContent value="crm">
            <div className="grid gap-6 max-w-5xl">
              {/* WhatsApp Business */}
              <Card className="p-6 border-2 border-[#D8BD80]/30 rounded-2xl">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-[#12B886]/10 rounded-xl">
                    <Phone className="w-6 h-6 text-[#12B886]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">WhatsApp Business</h3>
                    <p className="text-sm text-neutral-500">
                      Vincula tu número de WhatsApp Business para recibir notificaciones y comunicarte con clientes
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="whatsapp-phone" className="text-sm font-medium mb-2 block">
                        Número de WhatsApp Business
                      </Label>
                      <div className="flex gap-2">
                        <span className="inline-flex items-center px-3 rounded-lg bg-neutral-100 border border-neutral-200 text-sm">
                          +57
                        </span>
                        <Input
                          id="whatsapp-phone"
                          type="tel"
                          placeholder="3001234567"
                          value={config.whatsappBusinessPhone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          className="flex-1"
                          maxLength={10}
                        />
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        Ingresa tu número de WhatsApp Business sin el código de país
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div className="text-xs text-blue-800">
                          <p className="font-semibold mb-1">🚀 Requisitos para Conectar WhatsApp:</p>
                          <div className="space-y-2">
                            <div>
                              <p className="font-semibold text-[11px] mb-1">📍 Desarrollo Local:</p>
                              <ol className="list-decimal list-inside space-y-1 ml-2">
                                <li>Docker corriendo: <code className="bg-blue-100 px-1 rounded text-[10px]">docker compose -f docker-compose.evolution.yml up -d</code></li>
                                <li>Verifica: <code className="bg-blue-100 px-1 rounded text-[10px]">curl http://localhost:8080/health</code></li>
                                <li>Ingresa tu número de WhatsApp Business</li>
                                <li>Click en "Conectar WhatsApp"</li>
                                <li>Escanea el QR REAL de WhatsApp Web</li>
                              </ol>
                            </div>
                            <div>
                              <p className="font-semibold text-[11px] mb-1">☁️ Producción (Vercel):</p>
                              <ol className="list-decimal list-inside space-y-1 ml-2">
                                <li>Despliega Evolution API en VPS/Railway/DigitalOcean</li>
                                <li>Con dominio (Caddy): <code className="bg-blue-100 px-1 rounded text-[10px]">docker compose -f docker-compose.evolution-caddy.yml up -d</code></li>
                                <li>O solo IP: <code className="bg-blue-100 px-1 rounded text-[10px]">docker run -d -p 8080:8080 atendai/evolution-api</code></li>
                                <li>Configura variable <code className="bg-blue-100 px-1 rounded text-[10px]">EVO_BASE_URL</code> en Vercel</li>
                                <li>Guía: <a href="https://github.com/EvolutionAPI/evolution-api" target="_blank" className="underline">github.com/EvolutionAPI/evolution-api</a></li>
                              </ol>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botón de Conectar */}
                    {sessionStatus === 'disconnected' && config.whatsappBusinessPhone && (
                      <Button
                        onClick={startWhatsAppSession}
                        className="w-full bg-[#12B886] hover:bg-[#0F9D72] text-white"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Conectar WhatsApp
                      </Button>
                    )}

                    {sessionStatus === 'connected' && (
                      <div className="space-y-3">
                        <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
                          <div className="flex items-center gap-2 text-green-800">
                            <Check className="w-5 h-5" />
                            <span className="text-sm font-semibold">✅ WhatsApp Conectado</span>
                          </div>
                        </div>
                        <Button
                          onClick={disconnectWhatsApp}
                          variant="outline"
                          className="w-full border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Desconectar WhatsApp
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    {sessionStatus === 'connecting' && qrCodeImage ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-white border-2 border-[#D8BD80] rounded-2xl shadow-lg">
                          <img src={qrCodeImage} alt="QR WhatsApp Web REAL" className="w-64 h-64" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-neutral-700 mb-1">
                            Escanea con WhatsApp Business
                          </p>
                          <p className="text-xs text-neutral-500">
                            QR REAL de WhatsApp Web
                          </p>
                          <div className="flex items-center justify-center gap-2 mt-2 text-orange-600">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span className="text-xs">Esperando escaneo...</span>
                          </div>
                        </div>
                      </div>
                    ) : sessionStatus === 'connected' ? (
                      <div className="flex flex-col items-center justify-center h-64 text-green-600">
                        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-4">
                          <Check className="w-12 h-12" />
                        </div>
                        <p className="text-lg font-semibold">WhatsApp Conectado</p>
                        <p className="text-sm text-neutral-500 mt-2">+57 {config.whatsappBusinessPhone}</p>
                      </div>
                    ) : sessionStatus === 'connecting' && !qrCodeImage ? (
                      <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
                        <RefreshCw className="w-16 h-16 mb-4 animate-spin" />
                        <p className="text-sm">Generando código QR...</p>
                        <p className="text-xs mt-2">Esto puede tardar unos segundos</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
                        <QrCode className="w-16 h-16 mb-4" />
                        <p className="text-sm text-center">Ingresa un número y click en<br/>"Conectar WhatsApp"</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Email Notifications */}
              <Card className="p-6 border border-neutral-200 rounded-2xl">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">Notificaciones por Email</h3>
                    <p className="text-sm text-neutral-500 mb-4">
                      Email para recibir alertas de novedades, ventas y actualizaciones importantes
                    </p>
                    <Input
                      type="email"
                      placeholder="notificaciones@tuempresa.com"
                      value={config.emailNotifications}
                      onChange={(e) => setConfig({ ...config, emailNotifications: e.target.value })}
                      className="max-w-md"
                    />
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
                      Credenciales para integración con el sistema de envíos de MiPaquete
                    </p>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="mipaquete-apikey" className="text-sm font-medium mb-2 block">
                          API Key
                        </Label>
                        <Input
                          id="mipaquete-apikey"
                          type="text"
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          value={config.apiKeyMiPaquete}
                          onChange={(e) => setConfig({ ...config, apiKeyMiPaquete: e.target.value })}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mipaquete-session" className="text-sm font-medium mb-2 block">
                          Session Tracker
                        </Label>
                        <Input
                          id="mipaquete-session"
                          type="text"
                          placeholder="a0c96ea6-b22d-4fb7-a278-850678d5429c"
                          value={config.sessionTrackerMiPaquete}
                          onChange={(e) => setConfig({ ...config, sessionTrackerMiPaquete: e.target.value })}
                          className="font-mono text-xs"
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
                      Configuración de la base de datos (ya configurado en variables de entorno)
                    </p>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="supabase-url" className="text-sm font-medium mb-2 block">
                          Supabase URL
                        </Label>
                        <Input
                          id="supabase-url"
                          type="url"
                          placeholder="https://xxxxx.supabase.co"
                          value={config.supabaseUrl}
                          onChange={(e) => setConfig({ ...config, supabaseUrl: e.target.value })}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="supabase-key" className="text-sm font-medium mb-2 block">
                          Anon Key (público)
                        </Label>
                        <Input
                          id="supabase-key"
                          type="text"
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          value={config.supabaseAnonKey}
                          onChange={(e) => setConfig({ ...config, supabaseAnonKey: e.target.value })}
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Webhooks */}
              <Card className="p-6 border border-neutral-200 rounded-2xl">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Link2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">Webhooks</h3>
                    <p className="text-sm text-neutral-500 mb-4">
                      URL para recibir notificaciones de eventos externos
                    </p>
                    <Input
                      type="url"
                      placeholder="https://tudominio.com/api/webhooks"
                      value={config.webhookUrl}
                      onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
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
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <Globe className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">Información de la Empresa</h3>
                    <p className="text-sm text-neutral-500 mb-4">
                      Datos básicos que aparecerán en facturas y comunicaciones
                    </p>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="company-name" className="text-sm font-medium mb-2 block">
                          Nombre de la Empresa
                        </Label>
                        <Input
                          id="company-name"
                          type="text"
                          placeholder="Comercializadora Gale18k"
                          value={config.companyName}
                          onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="company-logo" className="text-sm font-medium mb-2 block">
                          URL del Logo
                        </Label>
                        <Input
                          id="company-logo"
                          type="url"
                          placeholder="https://tudominio.com/logo.png"
                          value={config.companyLogo}
                          onChange={(e) => setConfig({ ...config, companyLogo: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Botón Guardar Flotante */}
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
          <div className="fixed bottom-24 right-8 z-50 max-w-md">
            <div className="p-4 bg-red-100 border-2 border-red-400 rounded-xl shadow-2xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900 mb-1">Error</p>
                  <p className="text-xs text-red-800">{error}</p>
                </div>
                <button
                  onClick={() => setError("")}
                  className="text-red-600 hover:text-red-800 flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

