"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Settings,
  Users,
  Globe,
  Building2,
  CreditCard,
  Bell,
  Shield,
  Plug,
  FileText,
  Download,
  Upload,
  Sliders,
  Save,
  RotateCcw,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "@/lib/theme-context"
import { useFiscalYear } from "@/lib/fiscal-year-context"
// import { put } from "@vercel/blob" // Eliminar import de put de @vercel/blob
import { uploadLogo } from "@/app/actions/upload-logo" // y agregar import de uploadLogo

type Role = "admin" | "manager" | "analyst" | "viewer" | "asesor" // Agregado rol "asesor"
type Perm = "read" | "create" | "update" | "delete"
type Module = "ventas" | "pagos" | "gastos" | "cogs" | "clientes" | "geografia" | "config"

type User = {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
  lastAccess: string
}

type RolePerm = {
  role: Role
  module: Module
  perms: Perm[]
}

type Localization = {
  timezone: string
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY"
  timeFormat: "24h" | "12h"
  currency: "COP" | "USD" | "EUR"
  thousandSep: string
  decimalSep: string
  rounding: "peso" | "unidad" | "centena"
}

type PaymentsConfig = {
  requireTransferReceipt: boolean
  transferSubs: {
    bancolombia: boolean
    nequi: boolean
    daviplata: boolean
    davivienda: boolean
    [key: string]: boolean // Permitir entidades personalizadas
  }
  customBanks: string[] // Lista de bancos personalizados
  allowAddExpensesOnClosedMonths: boolean
  lockSalesOnClosedMonths: boolean
}

type Branding = {
  company: string
  nit: string
  address: string
  phone: string
  email: string
  primary: string
  sidebarColor: string // Agregado color de sidebar
  logoUrl?: string
}

type NotificationPref = {
  channel: "email" | "whatsapp" | "inapp"
  event: string
  enabled: boolean
  roleScope: Role[]
}

type Audit = {
  id: string
  at: string
  user: string
  module: Module
  action: string
  ip: string
  summary: string
}

type Integration = {
  provider: string
  keyMasked: string
  enabled: boolean
  isCustom?: boolean
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "Admin Principal",
    email: "admin@galle.com",
    role: "admin",
    active: true,
    lastAccess: "2025-01-16 10:30",
  },
  {
    id: "2",
    name: "María González",
    email: "maria@galle.com",
    role: "manager",
    active: true,
    lastAccess: "2025-01-16 09:15",
  },
  {
    id: "3",
    name: "Carlos Pérez",
    email: "carlos@galle.com",
    role: "analyst",
    active: true,
    lastAccess: "2025-01-15 16:45",
  },
  { id: "4", name: "Ana López", email: "ana@galle.com", role: "viewer", active: false, lastAccess: "2025-01-10 14:20" },
]

const mockRolePerms: RolePerm[] = [
  { role: "admin", module: "ventas", perms: ["read", "create", "update", "delete"] },
  { role: "admin", module: "pagos", perms: ["read", "create", "update", "delete"] },
  { role: "admin", module: "gastos", perms: ["read", "create", "update", "delete"] },
  { role: "admin", module: "cogs", perms: ["read", "create", "update", "delete"] },
  { role: "admin", module: "clientes", perms: ["read", "create", "update", "delete"] },
  { role: "admin", module: "geografia", perms: ["read", "create", "update", "delete"] },
  { role: "admin", module: "config", perms: ["read", "create", "update", "delete"] },
  { role: "manager", module: "ventas", perms: ["read", "create", "update"] },
  { role: "manager", module: "pagos", perms: ["read", "create", "update"] },
  { role: "manager", module: "gastos", perms: ["read", "create"] },
  { role: "manager", module: "clientes", perms: ["read", "create", "update"] },
  { role: "analyst", module: "ventas", perms: ["read"] },
  { role: "analyst", module: "pagos", perms: ["read"] },
  { role: "analyst", module: "clientes", perms: ["read"] },
  { role: "viewer", module: "ventas", perms: ["read"] },
  { role: "asesor", module: "ventas", perms: ["read", "create"] },
  { role: "asesor", module: "clientes", perms: ["read", "create", "update"] },
  { role: "asesor", module: "geografia", perms: ["read"] },
]

const mockAudit: Audit[] = [
  {
    id: "1",
    at: "2025-01-16 10:30:15",
    user: "Admin Principal",
    module: "pagos",
    action: "create",
    ip: "192.168.1.100",
    summary: "Agregó pago ORD-2025-001",
  },
  {
    id: "2",
    at: "2025-01-16 09:15:22",
    user: "María González",
    module: "gastos",
    action: "update",
    ip: "192.168.1.101",
    summary: "Editó gasto de nómina",
  },
  {
    id: "3",
    at: "2025-01-15 16:45:30",
    user: "Carlos Pérez",
    module: "clientes",
    action: "read",
    ip: "192.168.1.102",
    summary: "Consultó lista de clientes",
  },
  {
    id: "4",
    at: "2025-01-15 14:20:10",
    user: "Admin Principal",
    module: "config",
    action: "update",
    ip: "192.168.1.100",
    summary: "Cambió configuración de pagos",
  },
]

const mockIntegrations: Integration[] = [
  { provider: "supabase", keyMasked: "eyJhb...****...xyz", enabled: true },
  { provider: "meta", keyMasked: "EAABw...****...123", enabled: false },
  { provider: "mipaquete", keyMasked: "mp_sk...****...abc", enabled: true },
]

const mockNotifications: NotificationPref[] = [
  { channel: "email", event: "Pago recibido", enabled: true, roleScope: ["admin", "manager"] },
  { channel: "whatsapp", event: "Pago pendiente (MiPaquete)", enabled: true, roleScope: ["admin"] },
  { channel: "inapp", event: "Gasto agregado", enabled: true, roleScope: ["admin", "manager", "analyst"] },
  { channel: "email", event: "Mes cerrado", enabled: true, roleScope: ["admin"] },
  { channel: "inapp", event: "COGS actualizado", enabled: false, roleScope: ["admin", "manager"] },
]

export default function ConfiguracionPage() {
  const [activeSection, setActiveSection] = useState("general")
  const [hasChanges, setHasChanges] = useState(false)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [showPasswordFields, setShowPasswordFields] = useState<Record<string, boolean>>({})
  const [integrations, setIntegrations] = useState<Integration[]>(mockIntegrations)
  const [showAddIntegrationDialog, setShowAddIntegrationDialog] = useState(false)
  const [newIntegration, setNewIntegration] = useState({
    provider: "",
    key: "",
    enabled: true,
  })

  const { theme, setTheme } = useTheme()
  const { fiscalYear, setFiscalYear } = useFiscalYear()
  const [sidebarTheme, setSidebarThemeState] = useState("onyx-soft-gold")

  const [logoUrl, setLogoUrl] = useState<string>("")
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem("sidebarTheme")
    if (savedTheme) {
      setSidebarThemeState(savedTheme)
    } else {
      localStorage.setItem("sidebarTheme", "onyx-soft-gold")
      setSidebarThemeState("onyx-soft-gold")
    }

    const savedLogo = localStorage.getItem("logoUrl")
    if (savedLogo) {
      setLogoUrl(savedLogo)
    }
  }, [])

  const setSidebarTheme = (theme: string) => {
    setSidebarThemeState(theme)
    localStorage.setItem("sidebarTheme", theme)
    // Disparar evento personalizado para que el Sidebar se actualice
    window.dispatchEvent(new CustomEvent("sidebarThemeChange", { detail: { theme } }))
  }

  const [localization, setLocalization] = useState<Localization>({
    timezone: "America/Bogota",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    currency: "COP",
    thousandSep: ".",
    decimalSep: ",",
    rounding: "peso",
  })

  const [branding, setBranding] = useState<Branding>({
    company: "GALLE Joyería",
    nit: "900.123.456-7",
    address: "Calle 123 #45-67",
    phone: "+57 300 123 4567",
    email: "contacto@galle.com",
    primary: "#C8A96A",
    sidebarColor: "#8B6914", // Mantener para compatibilidad
  })

  const luxuryColors = [
    {
      name: "Onyx & Soft Gold",
      theme: "onyx-soft-gold",
      preview: "#111213",
      description: "Dark gris con dorado suave",
    },
    {
      name: "Charcoal & Pale Brass",
      theme: "charcoal-brass",
      preview: "#16171A",
      description: "Carbón con latón pálido",
    },
    {
      name: "Midnight Navy & Butter Gold",
      theme: "navy-butter",
      preview: "#0D1726",
      description: "Azul medianoche con dorado mantequilla",
    },
    {
      name: "Emerald & Champagne",
      theme: "emerald-champagne",
      preview: "#12201B",
      description: "Esmeralda con champagne",
    },
    {
      name: "Burgundy & Rose-Gold",
      theme: "burgundy-rose",
      preview: "#31161B",
      description: "Borgoña con oro rosa",
    },
    {
      name: "Sapphire & Honey Gold",
      theme: "sapphire-honey",
      preview: "#0E2143",
      description: "Zafiro con dorado miel",
    },
    {
      name: "Amethyst & Mist Platinum",
      theme: "amethyst-platinum",
      preview: "#1E1630",
      description: "Amatista con platino niebla",
    },
    {
      name: "Forest & Soft Gold",
      theme: "forest-gold",
      preview: "#14221A",
      description: "Bosque con dorado suave",
    },
    {
      name: "White-Luxury",
      theme: "white-luxury",
      preview: "#FFFFFF",
      description: "Blanco luxury pastel",
    },
    {
      name: "Ivory & Latte",
      theme: "ivory-latte",
      preview: "#FAFAF6",
      description: "Marfil con latte",
    },
  ]

  const [importDestination, setImportDestination] = useState<string>("")
  const [showDestinationDialog, setShowDestinationDialog] = useState(false)

  const [paymentsConfig, setPaymentsConfig] = useState<PaymentsConfig>({
    requireTransferReceipt: true,
    transferSubs: {
      bancolombia: true,
      nequi: true,
      daviplata: true,
      davivienda: false,
    },
    customBanks: [], // Inicializar lista de bancos personalizados
    allowAddExpensesOnClosedMonths: false,
    lockSalesOnClosedMonths: true,
  })

  const [systemPrefs, setSystemPrefs] = useState({
    theme: "white",
    density: "comoda",
    highContrast: false,
    reduceAnimations: false,
    language: "es",
  })

  const sections = [
    { id: "general", name: "General", icon: Settings },
    { id: "usuarios", name: "Usuarios & Roles", icon: Users },
    { id: "localizacion", name: "Localización", icon: Globe },
    { id: "empresa", name: "Empresa & Branding", icon: Building2 },
    { id: "pagos", name: "Pagos", icon: CreditCard },
    { id: "notificaciones", name: "Notificaciones", icon: Bell },
    { id: "seguridad", name: "Seguridad", icon: Shield },
    { id: "integraciones", name: "Integraciones", icon: Plug },
    { id: "auditoria", name: "Auditoría", icon: FileText },
    { id: "importar", name: "Importar/Exportar", icon: Upload },
    { id: "preferencias", name: "Preferencias", icon: Sliders },
  ]

  const previewNumber = useMemo(() => {
    const num = 1234567.89
    return `${localization.currency} ${num.toLocaleString("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`
  }, [localization])

  const previewDate = useMemo(() => {
    const date = new Date()
    return localization.dateFormat === "DD/MM/YYYY"
      ? `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`
      : `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}/${date.getFullYear()}`
  }, [localization])

  const [showAddBankDialog, setShowAddBankDialog] = useState(false) // Estado para diálogo de agregar banco
  const [newBankName, setNewBankName] = useState("") // Nombre del nuevo banco
  const [excelFile, setExcelFile] = useState<File | null>(null) // Archivo Excel para importar
  const [excelPreview, setExcelPreview] = useState<any[]>([]) // Preview de datos del Excel

  const handleLogoUpload = async (file: File) => {
    try {
      setIsUploadingLogo(true)

      // Crear FormData y agregar el archivo
      const formData = new FormData()
      formData.append("file", file)

      // Llamar a la Server Action
      const result = await uploadLogo(formData)

      if (result.success && result.url) {
        setLogoUrl(result.url)
        localStorage.setItem("logoUrl", result.url)
        // Disparar evento para que el Sidebar se actualice
        window.dispatchEvent(new CustomEvent("logoChange", { detail: { url: result.url } }))
        setHasChanges(true)
      } else {
        console.error("[v0] Error al subir logo:", result.error)
        alert(`Error al subir el logo: ${result.error || "Error desconocido"}`)
      }
    } catch (error) {
      console.error("[v0] Error al subir logo:", error)
      alert("Error al subir el logo. Por favor intenta de nuevo.")
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleRemoveLogo = () => {
    setLogoUrl("")
    localStorage.removeItem("logoUrl")
    window.dispatchEvent(new CustomEvent("logoChange", { detail: { url: "" } }))
    setHasChanges(true)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-4xl font-bold text-gray-900">Configuración</h1>
            <p className="mt-1 text-sm text-gray-600">Administra todos los aspectos del sistema</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RotateCcw className="mr-2 h-4 w-4" />
              Deshacer
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reiniciar
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar de navegación */}
        <aside className="sticky top-0 h-screen w-64 border-r border-gray-200 bg-gray-50 p-4">
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive ? "bg-[#C8A96A] text-white shadow-lg" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {section.name}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Panel principal */}
        <main className="flex-1 p-8">
          <div className="mx-auto max-w-5xl space-y-8">
            {/* A. General */}
            {activeSection === "general" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
              >
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
                  <h2 className="font-serif text-2xl font-bold text-gray-900">General</h2>
                  <p className="mt-1 text-sm text-gray-600">Estado del sistema y reglas de negocio</p>
                  <Separator className="my-6" />

                  <div className="space-y-6">
                    <div>
                      <Label>Año fiscal</Label>
                      <Select
                        value={fiscalYear.toString()}
                        onValueChange={(value) => {
                          setFiscalYear(Number.parseInt(value, 10))
                          setHasChanges(true)
                        }}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 2040 - 2023 + 1 }, (_, i) => 2023 + i).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="mt-2 text-xs text-gray-500">
                        El año seleccionado se aplicará automáticamente en todo el dashboard
                      </p>
                    </div>

                    <div>
                      <Label>Mes en curso</Label>
                      <Select defaultValue="octubre-2025">
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="octubre-2025">Octubre 2025 (Abierto)</SelectItem>
                          <SelectItem value="septiembre-2025">Septiembre 2025 (Cerrado)</SelectItem>
                          <SelectItem value="agosto-2025">Agosto 2025 (Cerrado)</SelectItem>
                          <SelectItem value="julio-2025">Julio 2025 (Cerrado)</SelectItem>
                          <SelectItem value="junio-2025">Junio 2025 (Cerrado)</SelectItem>
                          <SelectItem value="mayo-2025">Mayo 2025 (Cerrado)</SelectItem>
                          <SelectItem value="abril-2025">Abril 2025 (Cerrado)</SelectItem>
                          <SelectItem value="marzo-2025">Marzo 2025 (Cerrado)</SelectItem>
                          <SelectItem value="febrero-2025">Febrero 2025 (Cerrado)</SelectItem>
                          <SelectItem value="enero-2025">Enero 2025 (Cerrado)</SelectItem>
                          <SelectItem value="diciembre-2024">Diciembre 2024 (Cerrado)</SelectItem>
                          <SelectItem value="noviembre-2024">Noviembre 2024 (Cerrado)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Reglas de negocio</h3>

                      <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                        <div>
                          <p className="font-medium text-gray-900">Comprobante obligatorio en Transferencias</p>
                          <p className="text-sm text-gray-600">
                            Requiere adjuntar comprobante al agregar pagos por transferencia
                          </p>
                        </div>
                        <Switch
                          checked={paymentsConfig.requireTransferReceipt}
                          onCheckedChange={(checked) => {
                            setPaymentsConfig({ ...paymentsConfig, requireTransferReceipt: checked })
                            setHasChanges(true)
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                        <div>
                          <p className="font-medium text-gray-900">Permitir gastos en meses cerrados</p>
                          <p className="text-sm text-gray-600">Permite agregar gastos en meses ya cerrados</p>
                        </div>
                        <Switch
                          checked={paymentsConfig.allowAddExpensesOnClosedMonths}
                          onCheckedChange={(checked) => {
                            setPaymentsConfig({ ...paymentsConfig, allowAddExpensesOnClosedMonths: checked })
                            setHasChanges(true)
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                        <div>
                          <p className="font-medium text-gray-900">Bloquear edición de ventas en meses cerrados</p>
                          <p className="text-sm text-gray-600">Impide modificar ventas de meses ya cerrados</p>
                        </div>
                        <Switch
                          checked={paymentsConfig.lockSalesOnClosedMonths}
                          onCheckedChange={(checked) => {
                            setPaymentsConfig({ ...paymentsConfig, lockSalesOnClosedMonths: checked })
                            setHasChanges(true)
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* B. Usuarios & Roles */}
            {activeSection === "usuarios" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
                className="space-y-6"
              >
                {/* Tabla de usuarios */}
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-gray-900">Usuarios</h2>
                      <p className="mt-1 text-sm text-gray-600">Gestiona los usuarios del sistema</p>
                    </div>
                    <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
                      <DialogTrigger asChild>
                        <Button className="bg-[#C8A96A] hover:bg-[#B8996A]">
                          <Plus className="mr-2 h-4 w-4" />
                          Crear Usuario
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="font-serif text-2xl">Crear Usuario</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Nombre completo</Label>
                              <Input className="mt-2" placeholder="Juan Pérez" />
                            </div>
                            <div>
                              <Label>Email</Label>
                              <Input className="mt-2" type="email" placeholder="juan@galle.com" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Rol</Label>
                              <Select defaultValue="viewer">
                                <SelectTrigger className="mt-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="manager">Manager</SelectItem>
                                  <SelectItem value="analyst">Analyst</SelectItem>
                                  <SelectItem value="asesor">Asesor</SelectItem>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Estado</Label>
                              <Select defaultValue="active">
                                <SelectTrigger className="mt-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Activo</SelectItem>
                                  <SelectItem value="inactive">Inactivo</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch id="send-invite" />
                            <Label htmlFor="send-invite">Enviar invitación por email</Label>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                            Cancelar
                          </Button>
                          <Button className="bg-[#C8A96A] hover:bg-[#B8996A]" onClick={() => setShowUserDialog(false)}>
                            Crear Usuario
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Separator className="my-6" />

                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Usuario</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Rol</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Estado</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                            Último acceso
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-600">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {mockUsers.map((user, idx) => (
                          <tr key={user.id} className={idx % 2 === 0 ? "bg-white" : "bg-[#FAFAFC]"}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C8A96A] text-sm font-bold text-white">
                                  {user.name.charAt(0)}
                                </div>
                                <span className="font-medium text-gray-900">{user.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="capitalize">
                                {user.role}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={user.active ? "default" : "secondary"}
                                className={user.active ? "bg-green-100 text-green-700" : ""}
                              >
                                {user.active ? "Activo" : "Bloqueado"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{user.lastAccess}</td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Matriz de permisos */}
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
                  <h2 className="font-serif text-2xl font-bold text-gray-900">Roles & Permisos</h2>
                  <p className="mt-1 text-sm text-gray-600">Matriz de permisos por rol y módulo</p>
                  <Separator className="my-6" />

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Módulo</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Admin</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Manager</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Analyst</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Asesor</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Viewer</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {["ventas", "pagos", "gastos", "cogs", "clientes", "geografia", "config"].map((module) => (
                          <tr key={module}>
                            <td className="px-4 py-3 font-medium capitalize text-gray-900">{module}</td>
                            {["admin", "manager", "analyst", "asesor", "viewer"].map((role) => {
                              const perms =
                                mockRolePerms.find((rp) => rp.role === role && rp.module === module)?.perms || []
                              return (
                                <td key={role} className="px-4 py-3">
                                  <div className="flex justify-center gap-1">
                                    {perms.includes("read") && (
                                      <Badge variant="outline" className="text-xs">
                                        Ver
                                      </Badge>
                                    )}
                                    {perms.includes("create") && (
                                      <Badge variant="outline" className="text-xs">
                                        Crear
                                      </Badge>
                                    )}
                                    {perms.includes("update") && (
                                      <Badge variant="outline" className="text-xs">
                                        Editar
                                      </Badge>
                                    )}
                                    {perms.includes("delete") && (
                                      <Badge variant="outline" className="text-xs text-red-600">
                                        Eliminar
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* C. Localización */}
            {activeSection === "localizacion" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
              >
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
                  <h2 className="font-serif text-2xl font-bold text-gray-900">Localización</h2>
                  <p className="mt-1 text-sm text-gray-600">Configuración de fecha, hora y moneda</p>
                  <Separator className="my-6" />

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label>Zona horaria</Label>
                        <Select
                          value={localization.timezone}
                          onValueChange={(value) => {
                            setLocalization({ ...localization, timezone: value })
                            setHasChanges(true)
                          }}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="America/Bogota">America/Bogota (GMT-5)</SelectItem>
                            <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                            <SelectItem value="Europe/Madrid">Europe/Madrid (GMT+1)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Formato de fecha</Label>
                        <Select
                          value={localization.dateFormat}
                          onValueChange={(value: any) => {
                            setLocalization({ ...localization, dateFormat: value })
                            setHasChanges(true)
                          }}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Formato de hora</Label>
                        <Select
                          value={localization.timeFormat}
                          onValueChange={(value: any) => {
                            setLocalization({ ...localization, timeFormat: value })
                            setHasChanges(true)
                          }}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="24h">24 horas</SelectItem>
                            <SelectItem value="12h">12 horas (AM/PM)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Moneda base</Label>
                        <Select
                          value={localization.currency}
                          onValueChange={(value: any) => {
                            setLocalization({ ...localization, currency: value })
                            setHasChanges(true)
                          }}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="COP">COP (Peso Colombiano)</SelectItem>
                            <SelectItem value="USD">USD (Dólar)</SelectItem>
                            <SelectItem value="EUR">EUR (Euro)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Redondeo</Label>
                        <Select
                          value={localization.rounding}
                          onValueChange={(value: any) => {
                            setLocalization({ ...localization, rounding: value })
                            setHasChanges(true)
                          }}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="peso">A peso</SelectItem>
                            <SelectItem value="unidad">A unidad</SelectItem>
                            <SelectItem value="centena">A centena</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="rounded-xl bg-gray-50 p-4">
                      <h3 className="mb-3 font-semibold text-gray-900">Vista previa</h3>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-600">
                          Número: <span className="font-mono font-semibold text-gray-900">{previewNumber}</span>
                        </p>
                        <p className="text-gray-600">
                          Fecha: <span className="font-mono font-semibold text-gray-900">{previewDate}</span>
                        </p>
                        <p className="text-gray-600">
                          Hora:{" "}
                          <span className="font-mono font-semibold text-gray-900">
                            {localization.timeFormat === "24h" ? "14:30" : "2:30 PM"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* D. Empresa & Branding */}
            {activeSection === "empresa" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
              >
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
                  <h2 className="font-serif text-2xl font-bold text-gray-900">Empresa & Branding</h2>
                  <p className="mt-1 text-sm text-gray-600">Información de la empresa y personalización</p>
                  <Separator className="my-6" />

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label>Nombre legal</Label>
                        <Input
                          className="mt-2"
                          value={branding.company}
                          onChange={(e) => {
                            setBranding({ ...branding, company: e.target.value })
                            setHasChanges(true)
                          }}
                        />
                      </div>
                      <div>
                        <Label>NIT</Label>
                        <Input
                          className="mt-2"
                          value={branding.nit}
                          onChange={(e) => {
                            setBranding({ ...branding, nit: e.target.value })
                            setHasChanges(true)
                          }}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Dirección</Label>
                        <Input
                          className="mt-2"
                          value={branding.address}
                          onChange={(e) => {
                            setBranding({ ...branding, address: e.target.value })
                            setHasChanges(true)
                          }}
                        />
                      </div>
                      <div>
                        <Label>Teléfono</Label>
                        <Input
                          className="mt-2"
                          value={branding.phone}
                          onChange={(e) => {
                            setBranding({ ...branding, phone: e.target.value })
                            setHasChanges(true)
                          }}
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          className="mt-2"
                          type="email"
                          value={branding.email}
                          onChange={(e) => {
                            setBranding({ ...branding, email: e.target.value })
                            setHasChanges(true)
                          }}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="mb-4 font-semibold text-gray-900">Branding</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <Label>Logo</Label>
                          {logoUrl ? (
                            <div className="mt-2 relative">
                              <div className="flex h-32 items-center justify-center rounded-xl border-2 border-gray-300 bg-gray-50 p-4">
                                <img
                                  src={logoUrl || "/placeholder.svg"}
                                  alt="Logo de la empresa"
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>
                              <button
                                onClick={handleRemoveLogo}
                                className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                                aria-label="Eliminar logo"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="mt-2">
                              <input
                                type="file"
                                id="logo-upload"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    handleLogoUpload(file)
                                  }
                                }}
                              />
                              <label
                                htmlFor="logo-upload"
                                className={`flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-[#C8A96A] hover:bg-[#C8A96A]/5 transition-colors ${
                                  isUploadingLogo ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                              >
                                <div className="text-center">
                                  {isUploadingLogo ? (
                                    <>
                                      <RefreshCw className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
                                      <p className="mt-2 text-sm text-gray-600">Subiendo...</p>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                      <p className="mt-2 text-sm text-gray-600">Subir logo</p>
                                      <p className="mt-1 text-xs text-gray-500">PNG, JPG, SVG (máx. 5MB)</p>
                                    </>
                                  )}
                                </div>
                              </label>
                            </div>
                          )}
                        </div>
                        <div>
                          <Label>Color primario</Label>
                          <div className="mt-2 flex gap-2">
                            <Input
                              type="color"
                              value={branding.primary}
                              onChange={(e) => {
                                setBranding({ ...branding, primary: e.target.value })
                                setHasChanges(true)
                              }}
                              className="h-12 w-20"
                            />
                            <Input
                              value={branding.primary}
                              onChange={(e) => {
                                setBranding({ ...branding, primary: e.target.value })
                                setHasChanges(true)
                              }}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div className="col-span-2">
                          <Label>Color de barra lateral</Label>
                          <p className="mt-1 text-xs text-gray-500">
                            El color se aplicará automáticamente a la barra lateral
                          </p>
                          <div className="mt-3 grid grid-cols-5 gap-3">
                            {luxuryColors.map((color) => (
                              <button
                                key={color.theme}
                                onClick={() => {
                                  setSidebarTheme(color.theme)
                                  setHasChanges(true)
                                }}
                                className={`group relative overflow-hidden rounded-xl border-2 transition-all ${
                                  sidebarTheme === color.theme
                                    ? "border-[#C8A96A] shadow-lg"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <div
                                  className="h-24 w-full transition-transform group-hover:scale-105"
                                  style={{ backgroundColor: color.preview }}
                                />
                                <div className="bg-white p-2">
                                  <p className="text-xs font-semibold text-gray-900">{color.name}</p>
                                  <p className="text-[10px] text-gray-500">{color.description}</p>
                                </div>
                                {sidebarTheme === color.theme && (
                                  <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#C8A96A] text-white">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label>Términos y condiciones</Label>
                      <Textarea className="mt-2" rows={4} placeholder="Ingresa los términos y condiciones..." />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* E. Pagos */}
            {activeSection === "pagos" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
              >
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
                  <h2 className="font-serif text-2xl font-bold text-gray-900">Pagos</h2>
                  <p className="mt-1 text-sm text-gray-600">Configuración de métodos y submétodos de pago</p>
                  <Separator className="my-6" />

                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-4 font-semibold text-gray-900">Métodos de pago</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                          <span className="font-medium text-gray-900">Transferencia</span>
                          <Badge className="bg-green-100 text-green-700">Activo</Badge>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                          <span className="font-medium text-gray-900">Efectivo</span>
                          <Badge className="bg-green-100 text-green-700">Activo</Badge>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                          <span className="font-medium text-gray-900">MiPaquete</span>
                          <Badge className="bg-green-100 text-green-700">Activo</Badge>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Submétodos de Transferencia</h3>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-[#C8A96A] text-white">ENFORCED</Badge>
                          <Dialog open={showAddBankDialog} onOpenChange={setShowAddBankDialog}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                                <Plus className="h-4 w-4" />
                                Agregar Entidad
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle className="font-serif text-2xl">Agregar Entidad Bancaria</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <Label>Nombre de la entidad</Label>
                                  <Input
                                    className="mt-2"
                                    placeholder="Ej: BBVA, Scotiabank, etc."
                                    value={newBankName}
                                    onChange={(e) => setNewBankName(e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setShowAddBankDialog(false)
                                    setNewBankName("")
                                  }}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  className="bg-[#C8A96A] hover:bg-[#B8996A]"
                                  onClick={() => {
                                    if (newBankName.trim()) {
                                      const bankKey = newBankName.toLowerCase().replace(/\s+/g, "")
                                      setPaymentsConfig({
                                        ...paymentsConfig,
                                        transferSubs: { ...paymentsConfig.transferSubs, [bankKey]: true },
                                        customBanks: [...paymentsConfig.customBanks, newBankName],
                                      })
                                      setShowAddBankDialog(false)
                                      setNewBankName("")
                                      setHasChanges(true)
                                    }
                                  }}
                                >
                                  Agregar
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                          <span className="font-medium text-gray-900">Bancolombia</span>
                          <Switch
                            checked={paymentsConfig.transferSubs.bancolombia}
                            onCheckedChange={(checked) => {
                              setPaymentsConfig({
                                ...paymentsConfig,
                                transferSubs: { ...paymentsConfig.transferSubs, bancolombia: checked },
                              })
                              setHasChanges(true)
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                          <span className="font-medium text-gray-900">Nequi</span>
                          <Switch
                            checked={paymentsConfig.transferSubs.nequi}
                            onCheckedChange={(checked) => {
                              setPaymentsConfig({
                                ...paymentsConfig,
                                transferSubs: { ...paymentsConfig.transferSubs, nequi: checked },
                              })
                              setHasChanges(true)
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                          <span className="font-medium text-gray-900">Daviplata</span>
                          <Switch
                            checked={paymentsConfig.transferSubs.daviplata}
                            onCheckedChange={(checked) => {
                              setPaymentsConfig({
                                ...paymentsConfig,
                                transferSubs: { ...paymentsConfig.transferSubs, daviplata: checked },
                              })
                              setHasChanges(true)
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                          <span className="font-medium text-gray-900">Davivienda</span>
                          <Switch
                            checked={paymentsConfig.transferSubs.davivienda}
                            onCheckedChange={(checked) => {
                              setPaymentsConfig({
                                ...paymentsConfig,
                                transferSubs: { ...paymentsConfig.transferSubs, davivienda: checked },
                              })
                              setHasChanges(true)
                            }}
                          />
                        </div>
                        {paymentsConfig.customBanks.map((bank) => {
                          const bankKey = bank.toLowerCase().replace(/\s+/g, "")
                          return (
                            <div key={bankKey} className="flex items-center justify-between rounded-xl bg-amber-50 p-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{bank}</span>
                                <Badge variant="outline" className="text-xs">
                                  Personalizada
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={paymentsConfig.transferSubs[bankKey]}
                                  onCheckedChange={(checked) => {
                                    setPaymentsConfig({
                                      ...paymentsConfig,
                                      transferSubs: { ...paymentsConfig.transferSubs, [bankKey]: checked },
                                    })
                                    setHasChanges(true)
                                  }}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newTransferSubs = { ...paymentsConfig.transferSubs }
                                    delete newTransferSubs[bankKey]
                                    setPaymentsConfig({
                                      ...paymentsConfig,
                                      transferSubs: newTransferSubs,
                                      customBanks: paymentsConfig.customBanks.filter((b) => b !== bank),
                                    })
                                    setHasChanges(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="rounded-xl border-2 border-[#C8A96A] bg-[#C8A96A]/5 p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="h-5 w-5 text-[#C8A96A]" />
                        <div>
                          <p className="font-semibold text-gray-900">Comprobante obligatorio</p>
                          <p className="text-sm text-gray-600">
                            Los pagos por transferencia requieren adjuntar comprobante. Esta regla está activa.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* F. Notificaciones */}
            {activeSection === "notificaciones" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
              >
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
                  <h2 className="font-serif text-2xl font-bold text-gray-900">Notificaciones</h2>
                  <p className="mt-1 text-sm text-gray-600">Configuración de canales y eventos</p>
                  <Separator className="my-6" />

                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Evento</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">Email</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                            WhatsApp
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                            In-App
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Roles</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {mockNotifications.map((notif, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-[#FAFAFC]"}>
                            <td className="px-4 py-3 font-medium text-gray-900">{notif.event}</td>
                            <td className="px-4 py-3 text-center">
                              <Switch checked={notif.channel === "email" && notif.enabled} />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Switch checked={notif.channel === "whatsapp" && notif.enabled} />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Switch checked={notif.channel === "inapp" && notif.enabled} />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                {notif.roleScope.map((role) => (
                                  <Badge key={role} variant="outline" className="text-xs capitalize">
                                    {role}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* G. Seguridad */}
            {activeSection === "seguridad" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
              >
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
                  <h2 className="font-serif text-2xl font-bold text-gray-900">Seguridad</h2>
                  <p className="mt-1 text-sm text-gray-600">Configuración de seguridad y acceso</p>
                  <Separator className="my-6" />

                  <div className="space-y-6">
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                      <div>
                        <p className="font-medium text-gray-900">Autenticación de dos factores (2FA)</p>
                        <p className="text-sm text-gray-600">Requiere código adicional al iniciar sesión</p>
                      </div>
                      <Switch />
                    </div>

                    <Separator />

                    <div>
                      <h3 className="mb-4 font-semibold text-gray-900">Política de contraseñas</h3>
                      <div className="space-y-4">
                        <div>
                          <Label>Longitud mínima</Label>
                          <Input className="mt-2" type="number" defaultValue="8" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch id="require-uppercase" defaultChecked />
                          <Label htmlFor="require-uppercase">Requiere mayúsculas</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch id="require-numbers" defaultChecked />
                          <Label htmlFor="require-numbers">Requiere números</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch id="require-special" />
                          <Label htmlFor="require-special">Requiere caracteres especiales</Label>
                        </div>
                        <div>
                          <Label>Vencimiento (días)</Label>
                          <Input className="mt-2" type="number" defaultValue="90" />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="mb-4 font-semibold text-gray-900">Sesiones</h3>
                      <Button variant="outline" className="w-full bg-transparent">
                        Cerrar todas las sesiones activas
                      </Button>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="mb-4 font-semibold text-gray-900">IPs confiables</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">192.168.1.100</Badge>
                        <Badge variant="outline">192.168.1.101</Badge>
                        <Badge variant="outline">10.0.0.50</Badge>
                        <Button variant="outline" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar IP
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* H. Integraciones */}
            {activeSection === "integraciones" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
              >
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-gray-900">Integraciones</h2>
                      <p className="mt-1 text-sm text-gray-600">Servicios externos conectados</p>
                    </div>
                    <Dialog open={showAddIntegrationDialog} onOpenChange={setShowAddIntegrationDialog}>
                      <DialogTrigger asChild>
                        <Button className="bg-[#C8A96A] hover:bg-[#B8996A]">
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar Integración
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="font-serif text-2xl">Agregar Integración</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Nombre del proveedor</Label>
                            <Input
                              className="mt-2"
                              placeholder="Ej: Stripe, PayPal, etc."
                              value={newIntegration.provider}
                              onChange={(e) => setNewIntegration({ ...newIntegration, provider: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>API Key</Label>
                            <Input
                              className="mt-2"
                              type="password"
                              placeholder="Ingresa la API Key"
                              value={newIntegration.key}
                              onChange={(e) => setNewIntegration({ ...newIntegration, key: e.target.value })}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              id="integration-enabled"
                              checked={newIntegration.enabled}
                              onCheckedChange={(checked) => setNewIntegration({ ...newIntegration, enabled: checked })}
                            />
                            <Label htmlFor="integration-enabled">Activar integración</Label>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowAddIntegrationDialog(false)
                              setNewIntegration({ provider: "", key: "", enabled: true })
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            className="bg-[#C8A96A] hover:bg-[#B8996A]"
                            onClick={() => {
                              if (newIntegration.provider && newIntegration.key) {
                                const maskedKey = `${newIntegration.key.substring(0, 5)}...****...${newIntegration.key.substring(newIntegration.key.length - 3)}`
                                setIntegrations([
                                  ...integrations,
                                  {
                                    provider: newIntegration.provider.toLowerCase(),
                                    keyMasked: maskedKey,
                                    enabled: newIntegration.enabled,
                                    isCustom: true,
                                  },
                                ])
                                setShowAddIntegrationDialog(false)
                                setNewIntegration({ provider: "", key: "", enabled: true })
                                setHasChanges(true)
                              }
                            }}
                          >
                            Agregar Integración
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Separator className="my-6" />

                  <div className="space-y-6">
                    {integrations.map((integration, idx) => (
                      <div key={`${integration.provider}-${idx}`} className="rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                              <Plug className="h-6 w-6 text-gray-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold capitalize text-gray-900">{integration.provider}</p>
                                {integration.isCustom && (
                                  <Badge variant="outline" className="text-xs">
                                    Personalizada
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {showPasswordFields[integration.provider] ? integration.keyMasked : "••••••••••••••••"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setShowPasswordFields({
                                  ...showPasswordFields,
                                  [integration.provider]: !showPasswordFields[integration.provider],
                                })
                              }
                            >
                              {showPasswordFields[integration.provider] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            {integration.isCustom && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setIntegrations(integrations.filter((_, i) => i !== idx))
                                  setHasChanges(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                            <Switch
                              checked={integration.enabled}
                              onCheckedChange={(checked) => {
                                const updated = [...integrations]
                                updated[idx].enabled = checked
                                setIntegrations(updated)
                                setHasChanges(true)
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* I. Auditoría */}
            {activeSection === "auditoria" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
              >
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-gray-900">Auditoría</h2>
                      <p className="mt-1 text-sm text-gray-600">Registro de actividad del sistema</p>
                    </div>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar CSV
                    </Button>
                  </div>
                  <Separator className="my-6" />

                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                            Fecha/Hora
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Usuario</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Módulo</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Acción</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">IP</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Resumen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {mockAudit.map((log, idx) => (
                          <tr key={log.id} className={idx % 2 === 0 ? "bg-white" : "bg-[#FAFAFC]"}>
                            <td className="px-4 py-3 text-sm text-gray-600">{log.at}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{log.user}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="capitalize">
                                {log.module}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant="outline"
                                className={
                                  log.action === "create"
                                    ? "bg-green-100 text-green-700"
                                    : log.action === "update"
                                      ? "bg-blue-100 text-blue-700"
                                      : log.action === "delete"
                                        ? "bg-red-100 text-red-700"
                                        : ""
                                }
                              >
                                {log.action}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 font-mono text-sm text-gray-600">{log.ip}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{log.summary}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* J. Importar/Exportar */}
            {activeSection === "importar" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
                className="space-y-6"
              >
                {/* Importar */}
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
                  <h2 className="font-serif text-2xl font-bold text-gray-900">Importar</h2>
                  <p className="mt-1 text-sm text-gray-600">Carga masiva de datos desde Excel</p>
                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <Button variant="outline" className="w-full bg-transparent">
                      <Download className="mr-2 h-4 w-4" />
                      Descargar plantilla Excel
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => setShowDestinationDialog(true)}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Seleccionar destino e importar archivo
                    </Button>

                    <Dialog open={showDestinationDialog} onOpenChange={setShowDestinationDialog}>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="font-serif text-2xl">¿Dónde desea cargar estos datos?</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 py-4">
                          {["Ventas", "Pagos", "Clientes", "Facturación", "Gastos", "Geografía"].map((module) => (
                            <button
                              key={module}
                              onClick={() => {
                                setImportDestination(module)
                              }}
                              className={`flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all ${
                                importDestination === module
                                  ? "border-[#C8A96A] bg-[#C8A96A]/5"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <span className="font-medium text-gray-900">{module}</span>
                              {importDestination === module && (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C8A96A] text-white">
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowDestinationDialog(false)
                              setImportDestination("")
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            className="bg-[#C8A96A] hover:bg-[#B8996A]"
                            disabled={!importDestination}
                            onClick={() => {
                              setShowDestinationDialog(false)
                              document.getElementById("excel-file-input")?.click()
                            }}
                          >
                            Continuar
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <input
                      id="excel-file-input"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file && importDestination) {
                          setExcelFile(file)
                          // Simular preview de datos
                          setExcelPreview([
                            {
                              fecha: "2025-10-15",
                              cliente: "María González",
                              producto: "Anillo de oro",
                              cantidad: 1,
                              precio: 1250000,
                            },
                            {
                              fecha: "2025-10-16",
                              cliente: "Carlos Ramírez",
                              producto: "Collar de plata",
                              cantidad: 2,
                              precio: 800000,
                            },
                          ])
                        }
                      }}
                    />

                    {excelPreview.length > 0 && importDestination && (
                      <div className="rounded-xl border border-gray-200 p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">Vista previa de datos</h3>
                            <p className="text-sm text-gray-600">
                              Destino: <span className="font-semibold text-[#C8A96A]">{importDestination}</span>
                            </p>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-700">
                            {excelPreview.length} facturas detectadas
                          </Badge>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Fecha</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Cliente</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Producto</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Cantidad</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Precio</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {excelPreview.map((row, idx) => (
                                <tr key={idx}>
                                  <td className="px-4 py-2 text-gray-900">{row.fecha}</td>
                                  <td className="px-4 py-2 text-gray-900">{row.cliente}</td>
                                  <td className="px-4 py-2 text-gray-900">{row.producto}</td>
                                  <td className="px-4 py-2 text-gray-900">{row.cantidad}</td>
                                  <td className="px-4 py-2 text-right font-semibold text-gray-900">
                                    ${row.precio.toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setExcelFile(null)
                              setExcelPreview([])
                              setImportDestination("")
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            className="bg-[#C8A96A] hover:bg-[#B8996A]"
                            onClick={() => {
                              alert(`Facturas importadas exitosamente a ${importDestination}`)
                              setExcelFile(null)
                              setExcelPreview([])
                              setImportDestination("")
                            }}
                          >
                            Importar {excelPreview.length} facturas a {importDestination}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Exportar */}
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
                  <h2 className="font-serif text-2xl font-bold text-gray-900">Exportar</h2>
                  <p className="mt-1 text-sm text-gray-600">Descarga datos por módulo</p>
                  <Separator className="my-6" />

                  <div className="grid grid-cols-2 gap-4">
                    {["Ventas", "Pagos", "Gastos", "Clientes", "Geografía", "Configuración"].map((module) => (
                      <Button key={module} variant="outline" className="justify-start bg-transparent">
                        <Download className="mr-2 h-4 w-4" />
                        Exportar {module}
                      </Button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* K. Preferencias del sistema */}
            {activeSection === "preferencias" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
              >
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
                  <h2 className="font-serif text-2xl font-bold text-gray-900">Preferencias del sistema</h2>
                  <p className="mt-1 text-sm text-gray-600">Personalización de la interfaz</p>
                  <Separator className="my-6" />

                  <div className="space-y-6">
                    <div>
                      <Label>Tema</Label>
                      <Select
                        value={theme}
                        onValueChange={(value: any) => {
                          setTheme(value)
                          setHasChanges(true)
                        }}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="white">White (por defecto)</SelectItem>
                          <SelectItem value="black">Black</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Densidad</Label>
                      <Select
                        value={systemPrefs.density}
                        onValueChange={(value) => {
                          setSystemPrefs({ ...systemPrefs, density: value })
                          setHasChanges(true)
                        }}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="comoda">Cómoda</SelectItem>
                          <SelectItem value="compacta">Compacta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="mb-4 font-semibold text-gray-900">Accesibilidad</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                          <span className="font-medium text-gray-900">Alto contraste</span>
                          <Switch
                            checked={systemPrefs.highContrast}
                            onCheckedChange={(checked) => {
                              setSystemPrefs({ ...systemPrefs, highContrast: checked })
                              setHasChanges(true)
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                          <span className="font-medium text-gray-900">Reducir animaciones</span>
                          <Switch
                            checked={systemPrefs.reduceAnimations}
                            onCheckedChange={(checked) => {
                              setSystemPrefs({ ...systemPrefs, reduceAnimations: checked })
                              setHasChanges(true)
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label>Idioma</Label>
                      <Select
                        value={systemPrefs.language}
                        onValueChange={(value) => {
                          setSystemPrefs({ ...systemPrefs, language: value })
                          setHasChanges(true)
                        }}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="en">Inglés</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </main>
      </div>

      {/* Sticky Save Bar */}
      {hasChanges && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-4 shadow-[0_-10px_40px_rgba(0,0,0,.1)]"
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <p className="text-sm text-gray-600">Tienes cambios sin guardar</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setHasChanges(false)}>
                Descartar
              </Button>
              <Button className="bg-[#C8A96A] hover:bg-[#B8996A]" onClick={() => setHasChanges(false)}>
                <Save className="mr-2 h-4 w-4" />
                Guardar cambios
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
