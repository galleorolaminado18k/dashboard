"use client"

import type * as React from "react"
import { ThemeProvider } from "next-themes"
import { FiscalYearProvider } from "@/lib/fiscal-year-context"

type Props = {
  children: React.ReactNode
}

export default function Providers({ children }: Props) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <FiscalYearProvider>{children}</FiscalYearProvider>
    </ThemeProvider>
  )
}
