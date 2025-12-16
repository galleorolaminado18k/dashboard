"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    QrCode,
    Link2,
    Save,
    RefreshCw,
    Check,
    AlertCircle,
    Phone,
    MessageSquare,
    Mail,
    Globe,
    Package,
    CreditCard,
    CheckCircle,
    LogOut,
} from "lucide-react"
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
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<string>("")
    const [sessionStatus, setSessionStatus] = useState<
        "disconnected" | "connecting" | "connected"
    >("disconnected")
    const [pollingInterval, setPollingInterval] =
        useState<NodeJS.Timeout | null>(null)
    const [checkingInitialStatus, setCheckingInitialStatus] = useState(true)
    const [connectedPhone, setConnectedPhone] = useState<string>("")

    // Constante para localStorage
    const WHATSAPP_PHONE_KEY = "whatsapp_connected_phone"

    // Función para guardar el número en localStorage
    const saveConnectedPhone = (phone: string) => {
        if (phone) {
            localStorage.setItem(WHATSAPP_PHONE_KEY, phone)
            setConnectedPhone(phone)
        }
    }

    // Función para limpiar el número de localStorage
    const clearConnectedPhone = () => {
        localStorage.removeItem(WHATSAPP_PHONE_KEY)
        setConnectedPhone("")
    }

    // Cargar estado de conexión desde la base de datos al iniciar
    useEffect(() => {
        // Primero cargar el número guardado de localStorage
        const savedPhone = localStorage.getItem(WHATSAPP_PHONE_KEY)
        if (savedPhone) {
            setConnectedPhone(savedPhone)
        }

        loadConfig()
        loadConnectionState()
    }, [])

    // Limpiar interval al desmontar
    useEffect(() => {
        return () => {
            if (pollingInterval) clearInterval(pollingInterval)
        }
    }, [])

    const loadConfig = async () => {
        try {
            const res = await fetch("/api/config/crm")
            if (res.ok) {
                const data = await res.json()
                setConfig(data)
                // Si hay un número guardado en la config y no tenemos uno en localStorage, usarlo
                if (data?.whatsappBusinessPhone && !localStorage.getItem(WHATSAPP_PHONE_KEY)) {
                    saveConnectedPhone(data.whatsappBusinessPhone)
                }
            }
        } catch (err) {
            console.error("Error loading config:", err)
        }
    }

    // ✅ Cargar estado de conexión desde el Gateway en el VPS
    const loadConnectionState = async () => {
        try {
            setCheckingInitialStatus(true)
            console.log("🔍 Consultando estado de conexión al Gateway del VPS...")

            const res = await fetch("/api/whatsapp/connection-state", {
                signal: AbortSignal.timeout(12000)
            })
            const data = await res.json()

            console.log("📥 Respuesta del Gateway:", data)

            if (data?.ok && data?.connected) {
                console.log("✅ Gateway confirma: WhatsApp CONECTADO!")
                setSessionStatus("connected")
                // Si el Gateway devuelve el número, guardarlo
                if (data?.phone) {
                    saveConnectedPhone(data.phone)
                }
            } else if (data?.hasQR) {
                console.log("📱 Hay QR pendiente de escanear")
                setSessionStatus("connecting")
            } else if (data?.gatewayAvailable === false) {
                console.log("⚠️ Gateway no disponible")
                setSessionStatus("disconnected")
            } else {
                console.log("❌ WhatsApp no conectado")
                setSessionStatus("disconnected")
            }
        } catch (err) {
            console.error("Error consultando Gateway:", err)
            setSessionStatus("disconnected")
        } finally {
            setCheckingInitialStatus(false)
        }
    }

    const startWhatsAppSession = async () => {
        try {
            setLoading(true)
            setQrCodeImage("")
            setError("")
            setSessionStatus("connecting")

            console.log("📡 Llamando a /api/whatsapp/wpp/start?forceNew=true...")

            const response = await fetch("/api/whatsapp/wpp/start?forceNew=true", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: config.whatsappBusinessPhone }),
            })

            // 1) Primero validamos que la respuesta HTTP sea OK
            if (!response.ok) {
                const raw = await response.text().catch(() => "")
                console.error(
                    "❌ Error HTTP en /api/whatsapp/wpp/start:",
                    response.status,
                    raw,
                )
                throw new Error(`Error al llamar al gateway (HTTP ${response.status})`)
            }

            // 2) Luego intentamos parsear a JSON de forma segura
            const data = await response.json().catch((e) => {
                console.error("❌ Respuesta no es JSON válido:", e)
                throw new Error("Respuesta inválida del servidor")
            })

            console.log("📥 Respuesta:", data)

            // Aceptamos tanto data.qrcode como data.qr
            const qrImage: string | undefined = data?.qrcode || data?.qr

            if (!data?.ok || !qrImage) {
                const errorMsg = data?.detail || data?.error || "No se pudo obtener QR"
                console.error("❌ Error lógico:", errorMsg)
                throw new Error(errorMsg)
            }

            // ✅ QR obtenido exitosamente
            console.log("✅ QR obtenido!")
            setQrCodeImage(qrImage)
            setSessionStatus("connecting")

            // Guardar sesión para polling
            const sessionName =
                data.session || `galle-${config.whatsappBusinessPhone}`

            // Iniciar polling para verificar cuando se escanee
            startPollingForConnection(sessionName)
        } catch (err: any) {
            console.error("❌ Error:", err)
            setError(err?.message || "Error generando QR")
            setSessionStatus("disconnected")
            setQrCodeImage("")
        } finally {
            setLoading(false)
        }
    }

    const startPollingForConnection = (sessionName: string) => {
        // Limpiar interval anterior si existe
        if (pollingInterval) clearInterval(pollingInterval)

        // Verificar estado cada 3 segundos
        const interval = setInterval(
            () => checkConnectionStatus(sessionName),
            3000,
        )
        setPollingInterval(interval)

        // Timeout de 2 minutos
        setTimeout(() => {
            if (interval) clearInterval(interval)
            if (sessionStatus === "connecting") {
                setError("Tiempo agotado. Reinicia la sesión.")
                setSessionStatus("disconnected")
            }
        }, 120000)
    }

    const checkConnectionStatus = async (sessionName: string) => {
        try {
            console.log("🔄 Verificando estado de conexión...")
            const res = await fetch(
                `/api/whatsapp/wpp/status?session=${encodeURIComponent(sessionName)}`,
            )

            if (!res.ok) {
                const raw = await res.text().catch(() => "")
                console.error(
                    "❌ Error HTTP en /api/whatsapp/wpp/status:",
                    res.status,
                    raw,
                )
                return
            }

            const data = await res.json().catch((e) => {
                console.error("❌ JSON inválido en /status:", e)
                return null
            })

            console.log("📥 Estado:", data)

            // Verificar si está conectado (aceptar ambos nombres de campo)
            if (data?.ok && (data?.isConnected || data?.connected)) {
                // Ya está conectado!
                console.log("✅ WhatsApp conectado!")
                setSessionStatus("connected")
                saveConnectedPhone(config.whatsappBusinessPhone) // Guardar el número conectado en localStorage
                setQrCodeImage("")
                if (pollingInterval) clearInterval(pollingInterval)
            }
        } catch (err) {
            console.error("❌ Error verificando estado:", err)
        }
    }

    const disconnectWhatsApp = async () => {
        try {
            setLoading(true)
            setError("")

            // Usar el mismo endpoint de start con forceNew para hacer logout
            console.log("🔌 Desconectando WhatsApp...")

            // Llamar al endpoint que hace logout
            const res = await fetch("/api/whatsapp/wpp/logout", { method: "POST" })

            if (!res.ok) {
                // Si no existe /logout, intentar con el evolution legacy
                await fetch("/api/whatsapp/evolution", { method: "DELETE" })
            }

            // Limpiar estado local y localStorage
            setSessionStatus("disconnected")
            setQrCodeImage("")
            clearConnectedPhone() // Limpiar número de localStorage
            if (pollingInterval) clearInterval(pollingInterval)
            console.log("✅ WhatsApp desconectado")
        } catch (err) {
            console.error("Error al desconectar:", err)
            // Aún así limpiar el estado local
            setSessionStatus("disconnected")
            setQrCodeImage("")
            clearConnectedPhone()
        } finally {
            setLoading(false)
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
            const res = await fetch("/api/config/crm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            })

            if (!res.ok) throw new Error("Error al guardar")

            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (err) {
            setError("Error al guardar la configuración")
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
                            {/* WhatsApp Business - Diseño Luxury */}
                            <div className="relative rounded-3xl bg-gradient-to-br from-[#f7f3ee] to-white shadow-xl p-8 overflow-hidden">

                                {/* Header */}
                                <div className="flex items-center gap-4 mb-8">
                                    <motion.div
                                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-500 ${
                                            sessionStatus === "connected" ? "bg-green-500" : "bg-green-100"
                                        }`}
                                        animate={sessionStatus === "connected" ? { scale: [1, 1.1, 1] } : {}}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <Phone className={`transition-colors duration-500 ${
                                            sessionStatus === "connected" ? "text-white" : "text-green-600"
                                        }`} size={28} />
                                    </motion.div>
                                    <div>
                                        <h2 className="text-2xl font-semibold">WhatsApp Business</h2>
                                        <p className="text-gray-500">
                                            {sessionStatus === "connected"
                                                ? "Tu cuenta está conectada y lista"
                                                : "Conecta tu número para automatizar conversaciones"
                                            }
                                        </p>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="grid md:grid-cols-2 gap-10 items-center">
                                    {/* Left */}
                                    <div className="space-y-6">
                                        <AnimatePresence mode="wait">
                                            {sessionStatus === "connected" ? (
                                                <motion.div
                                                    key="connected-info"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -20 }}
                                                    className="space-y-6"
                                                >
                                                    {/* Card de estado conectado */}
                                                    <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl">
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative">
                                                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                                                                    <CheckCircle className="w-8 h-8 text-white" />
                                                                </div>
                                                                <motion.div
                                                                    className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white"
                                                                    animate={{ scale: [1, 1.2, 1] }}
                                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <p className="text-xl font-bold text-gray-800">Conectado</p>
                                                                <p className="text-green-600 font-semibold text-lg">
                                                                    +57 {connectedPhone || config.whatsappBusinessPhone}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Botón desconectar */}
                                                    <motion.button
                                                        onClick={disconnectWhatsApp}
                                                        disabled={loading}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        className="w-full flex items-center justify-center gap-3 rounded-xl bg-white border-2 border-red-200 hover:border-red-300 hover:bg-red-50 transition-all text-red-500 hover:text-red-600 py-4 font-medium disabled:opacity-50"
                                                    >
                                                        {loading ? (
                                                            <>
                                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                                                Desconectando...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <LogOut className="w-5 h-5" />
                                                                Cerrar Sesión de WhatsApp
                                                            </>
                                                        )}
                                                    </motion.button>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="connect-form"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -20 }}
                                                    className="space-y-6"
                                                >
                                                    <div>
                                                        <label className="text-sm text-gray-500 font-medium">Número de WhatsApp Business</label>
                                                        <div className="mt-2 flex rounded-xl border bg-white overflow-hidden shadow-sm">
                                                            <span className="px-4 flex items-center text-gray-500 bg-gray-50 border-r">+57</span>
                                                            <input
                                                                className="flex-1 px-4 py-3 outline-none text-lg"
                                                                placeholder="3012345678"
                                                                value={config.whatsappBusinessPhone}
                                                                onChange={(e) => handlePhoneChange(e.target.value)}
                                                                maxLength={10}
                                                            />
                                                        </div>
                                                    </div>

                                                    <motion.button
                                                        onClick={startWhatsAppSession}
                                                        disabled={loading || checkingInitialStatus || !config.whatsappBusinessPhone}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        className="w-full rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-white py-4 font-medium text-lg shadow-lg shadow-green-500/20"
                                                    >
                                                        {loading || checkingInitialStatus ? (
                                                            <span className="flex items-center justify-center gap-2">
                                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                                                {checkingInitialStatus ? "Verificando..." : "Conectando..."}
                                                            </span>
                                                        ) : (
                                                            "Conectar WhatsApp"
                                                        )}
                                                    </motion.button>

                                                    {error && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="p-4 bg-red-50 border border-red-200 rounded-xl"
                                                        >
                                                            <div className="flex items-start gap-2 text-red-700">
                                                                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                                                <p className="text-sm">{error}</p>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Right – Visual */}
                                    <div className="relative h-[320px] flex items-center justify-center">
                                        <AnimatePresence mode="wait">
                                            {sessionStatus === "disconnected" && !qrCodeImage && !loading && (
                                                <motion.div
                                                    key="idle"
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    className="flex flex-col items-center"
                                                >
                                                    <div className="w-56 h-56 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                                                        <QrCode className="w-20 h-20 text-gray-300" />
                                                    </div>
                                                    <p className="text-sm text-gray-400 mt-4 text-center">
                                                        El código QR aparecerá aquí
                                                    </p>
                                                </motion.div>
                                            )}

                                            {(loading || checkingInitialStatus) && !qrCodeImage && sessionStatus !== "connected" && (
                                                <motion.div
                                                    key="loading"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex flex-col items-center"
                                                >
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                                        className="w-24 h-24 rounded-full border-4 border-green-200 border-t-green-600"
                                                    />
                                                    <p className="text-sm text-gray-500 mt-4">
                                                        {checkingInitialStatus ? "Verificando estado..." : "Generando código QR..."}
                                                    </p>
                                                </motion.div>
                                            )}

                                            {sessionStatus === "connecting" && qrCodeImage && (
                                                <motion.div
                                                    key="qr"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className="flex flex-col items-center"
                                                >
                                                    <div className="p-4 bg-white rounded-2xl shadow-xl border-2 border-[#D8BD80]">
                                                        <img src={qrCodeImage} alt="QR WhatsApp" className="w-56 h-56 rounded-lg" />
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-4 text-orange-600">
                                                        <motion.div
                                                            animate={{ rotate: 360 }}
                                                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                        >
                                                            <RefreshCw className="w-4 h-4" />
                                                        </motion.div>
                                                        <span className="text-sm font-medium">Esperando escaneo...</span>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {sessionStatus === "connected" && (
                                                <motion.div
                                                    key="connected"
                                                    initial={{ scale: 0.5, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                                    className="flex flex-col items-center gap-4"
                                                >
                                                    <motion.div
                                                        className="relative"
                                                        animate={{ y: [0, -10, 0] }}
                                                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                                    >
                                                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-2xl shadow-green-500/40">
                                                            <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                                            </svg>
                                                        </div>
                                                        <motion.div
                                                            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center"
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ delay: 0.3, type: "spring" }}
                                                        >
                                                            <CheckCircle className="w-6 h-6 text-green-500" />
                                                        </motion.div>
                                                    </motion.div>
                                                    <motion.p
                                                        className="text-green-600 font-semibold text-lg flex items-center gap-2"
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.4 }}
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                        WhatsApp conectado correctamente
                                                    </motion.p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            {/* Email Notifications */}
                            <Card className="p-6 border border-neutral-200 rounded-2xl">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="p-3 bg-blue-100 rounded-xl">
                                        <Mail className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold mb-1">
                                            Notificaciones por Email
                                        </h3>
                                        <p className="text-sm text-neutral-500 mb-4">
                                            Email para recibir alertas de novedades, ventas y
                                            actualizaciones importantes
                                        </p>
                                        <Input
                                            type="email"
                                            placeholder="notificaciones@tuempresa.com"
                                            value={config.emailNotifications}
                                            onChange={(e) =>
                                                setConfig({
                                                    ...config,
                                                    emailNotifications: e.target.value,
                                                })
                                            }
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
                                            Credenciales para integración con el sistema de envíos de
                                            MiPaquete
                                        </p>
                                        <div className="space-y-4">
                                            <div>
                                                <Label
                                                    htmlFor="mipaquete-apikey"
                                                    className="text-sm font-medium mb-2 block"
                                                >
                                                    API Key
                                                </Label>
                                                <Input
                                                    id="mipaquete-apikey"
                                                    type="text"
                                                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                                    value={config.apiKeyMiPaquete}
                                                    onChange={(e) =>
                                                        setConfig({
                                                            ...config,
                                                            apiKeyMiPaquete: e.target.value,
                                                        })
                                                    }
                                                    className="font-mono text-xs"
                                                />
                                            </div>
                                            <div>
                                                <Label
                                                    htmlFor="mipaquete-session"
                                                    className="text-sm font-medium mb-2 block"
                                                >
                                                    Session Tracker
                                                </Label>
                                                <Input
                                                    id="mipaquete-session"
                                                    type="text"
                                                    placeholder="a0c96ea6-b22d-4fb7-a278-850678d5429c"
                                                    value={config.sessionTrackerMiPaquete}
                                                    onChange={(e) =>
                                                        setConfig({
                                                            ...config,
                                                            sessionTrackerMiPaquete: e.target.value,
                                                        })
                                                    }
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
                                        <h3 className="text-lg font-semibold mb-1">
                                            Supabase Database
                                        </h3>
                                        <p className="text-sm text-neutral-500 mb-4">
                                            Configuración de la base de datos (ya configurado en
                                            variables de entorno)
                                        </p>
                                        <div className="space-y-4">
                                            <div>
                                                <Label
                                                    htmlFor="supabase-url"
                                                    className="text-sm font-medium mb-2 block"
                                                >
                                                    Supabase URL
                                                </Label>
                                                <Input
                                                    id="supabase-url"
                                                    type="url"
                                                    placeholder="https://xxxxx.supabase.co"
                                                    value={config.supabaseUrl}
                                                    onChange={(e) =>
                                                        setConfig({ ...config, supabaseUrl: e.target.value })
                                                    }
                                                    className="font-mono text-xs"
                                                />
                                            </div>
                                            <div>
                                                <Label
                                                    htmlFor="supabase-key"
                                                    className="text-sm font-medium mb-2 block"
                                                >
                                                    Anon Key (público)
                                                </Label>
                                                <Input
                                                    id="supabase-key"
                                                    type="text"
                                                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                                    value={config.supabaseAnonKey}
                                                    onChange={(e) =>
                                                        setConfig({
                                                            ...config,
                                                            supabaseAnonKey: e.target.value,
                                                        })
                                                    }
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
                                            onChange={(e) =>
                                                setConfig({ ...config, webhookUrl: e.target.value })
                                            }
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
                                        <h3 className="text-lg font-semibold mb-1">
                                            Información de la Empresa
                                        </h3>
                                        <p className="text-sm text-neutral-500 mb-4">
                                            Datos básicos que aparecerán en facturas y comunicaciones
                                        </p>
                                        <div className="space-y-4">
                                            <div>
                                                <Label
                                                    htmlFor="company-name"
                                                    className="text-sm font-medium mb-2 block"
                                                >
                                                    Nombre de la Empresa
                                                </Label>
                                                <Input
                                                    id="company-name"
                                                    type="text"
                                                    placeholder="Comercializadora Gale18k"
                                                    value={config.companyName}
                                                    onChange={(e) =>
                                                        setConfig({ ...config, companyName: e.target.value })
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label
                                                    htmlFor="company-logo"
                                                    className="text-sm font-medium mb-2 block"
                                                >
                                                    URL del Logo
                                                </Label>
                                                <Input
                                                    id="company-logo"
                                                    type="url"
                                                    placeholder="https://tudominio.com/logo.png"
                                                    value={config.companyLogo}
                                                    onChange={(e) =>
                                                        setConfig({ ...config, companyLogo: e.target.value })
                                                    }
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
                                    <p className="text-sm font-semibold text-red-900 mb-1">
                                        Error
                                    </p>
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
