"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "white" | "black" | "auto"

type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("white")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem("dashboard-theme") as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    localStorage.setItem("dashboard-theme", theme)

    // Aplicar el tema al documento
    const root = document.documentElement
    root.setAttribute("data-theme", theme)

    // Si es auto, detectar preferencia del sistema
    if (theme === "auto") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      root.setAttribute("data-theme", isDark ? "black" : "white")
    }
  }, [theme, mounted])

  if (!mounted) {
    return <>{children}</>
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
