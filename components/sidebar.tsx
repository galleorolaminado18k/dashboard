"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ShoppingCart,
  FileText,
  Package,
  TrendingUp,
  Map,
  Settings,
  Megaphone,
  BoxesIcon,
  ChevronLeft,
} from "lucide-react"
import { useState, useEffect } from "react"

type Item = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const nav: Item[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "CRM", href: "/crm", icon: Users },
  { label: "Publicidad", href: "/anuncios", icon: Megaphone },
  { label: "Ventas", href: "/ventas", icon: ShoppingCart },
  { label: "Facturación", href: "/facturacion", icon: FileText },
  { label: "Entregas", href: "/entregas", icon: Package },
  { label: "Pagos", href: "/pagos", icon: CreditCard },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Inventario", href: "/inventario", icon: BoxesIcon },
  { label: "Ventas Totales", href: "/ventastotales", icon: TrendingUp },
  { label: "Geografía", href: "/geografia", icon: Map },
  { label: "Configuración", href: "/configuracion", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarTheme, setSidebarTheme] = useState("onyx-soft-gold")
  const [logoUrl, setLogoUrl] = useState<string>("")

  useEffect(() => {
    const savedTheme = localStorage.getItem("sidebarTheme")
    if (savedTheme) {
      setSidebarTheme(savedTheme)
      document.documentElement.setAttribute("data-sidebar-theme", savedTheme)
    } else {
      localStorage.setItem("sidebarTheme", "onyx-soft-gold")
      setSidebarTheme("onyx-soft-gold")
      document.documentElement.setAttribute("data-sidebar-theme", "onyx-soft-gold")
    }

    const savedLogo = localStorage.getItem("logoUrl")
    if (savedLogo) {
      setLogoUrl(savedLogo)
    }

    const handleThemeChange = (e: CustomEvent) => {
      setSidebarTheme((e as any).detail.theme)
      document.documentElement.setAttribute("data-sidebar-theme", (e as any).detail.theme)
    }

    const handleLogoChange = (e: CustomEvent) => {
      setLogoUrl((e as any).detail.url)
    }

    window.addEventListener("sidebarThemeChange" as any, handleThemeChange)
    window.addEventListener("logoChange" as any, handleLogoChange)
    return () => {
      window.removeEventListener("sidebarThemeChange" as any, handleThemeChange)
      window.removeEventListener("logoChange" as any, handleLogoChange)
    }
  }, [])

  return (
    <aside
      className={[
        "h-screen sticky top-0 z-40",
        "text-[#F4F1EA]",
        "shadow-[0_20px_60px_rgba(0,0,0,.45)]",
        collapsed ? "w-[88px]" : "w-[220px]",
        "transition-[width] duration-200 ease-in-out",
      ].join(" ")}
      style={{
        backgroundColor: "var(--sidebar-bg)",
        color: "var(--sidebar-text)",
      }}
    >
      <div className="px-4 pt-5 pb-3">
        <Link
          href="/"
          className={[
            "flex items-center justify-center",
            "rounded-2xl border border-[#2A2A2C]/60",
            "bg-gradient-to-b from-[#111112] to-[#0B0B0C]",
            "px-4 py-4",
          ].join(" ")}
        >
          {logoUrl ? (
            <img
              src={logoUrl || "/placeholder.svg"}
              alt="Logo"
              className={`object-contain ${collapsed ? "h-8 w-8" : "h-10 max-w-full"}`}
            />
          ) : (
            <>
              {!collapsed && (
                <span
                  className="text-3xl font-bold tracking-wider bg-gradient-to-r from-[#C8A96A] to-[#8B6914] bg-clip-text text-transparent"
                  aria-label="GALLE"
                >
                  GALLE
                </span>
              )}
              {collapsed && (
                <span
                  className="text-2xl font-bold bg-gradient-to-r from-[#C8A96A] to-[#8B6914] bg-clip-text text-transparent"
                  aria-label="G"
                >
                  G
                </span>
              )}
            </>
          )}
        </Link>

        <button
          onClick={() => setCollapsed((v) => !v)}
          className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
          aria-label={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
        >
          <ChevronLeft className={`h-4 w-4 ${collapsed ? "rotate-180" : ""}`} />
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>

      <div className="px-3 pb-2">
        {!collapsed && <p className="px-2 pb-1 text-xs uppercase tracking-wide text-[#C8A96A]">Navegación</p>}
        <nav className="space-y-[2px]">
          {nav.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "group flex items-center gap-2 rounded-2xl px-3 py-2 outline-none",
                  "transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#C8A96A]/60",
                  active
                    ? "bg-[#C8A96A]/15 text-white shadow-[0_8px_24px_rgba(200,169,106,.15)] border border-[#C8A96A]/30"
                    : "text-zinc-300 hover:bg-white/5",
                ].join(" ")}
              >
                <Icon
                  className={[
                    "h-5 w-5 flex-shrink-0",
                    active ? "text-[#C8A96A]" : "text-zinc-400 group-hover:text-[#C8A96A]",
                  ].join(" ")}
                />
                {!collapsed && <span className="truncate">{label}</span>}
                {active && !collapsed && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-[#C8A96A]/90 shadow-[0_0_0_2px_rgba(200,169,106,.25)]" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3">
        <div
          className={["flex items-center gap-3 rounded-2xl border border-white/10", "bg-white/5 px-3 py-2"].join(" ")}
        >
          <div
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-black font-semibold flex-shrink-0"
            style={{ backgroundColor: "var(--sidebar-accent)" }}
          >
            U
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">Usuario</p>
              <p className="truncate text-xs text-zinc-400">Sistema de Gestión</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
