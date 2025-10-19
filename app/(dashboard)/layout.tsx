"use client"

import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { ThemeProvider } from "@/lib/theme-context"
import { FiscalYearProvider } from "@/lib/fiscal-year-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <FiscalYearProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </FiscalYearProvider>
    </ThemeProvider>
  )
}
