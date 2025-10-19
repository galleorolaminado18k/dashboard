"use client"

import type * as React from "react"
import { ThemeProvider } from "@/lib/theme-context"
import { FiscalYearProvider } from "@/lib/fiscal-year-context"

type Props = {
  children: React.ReactNode
}

export default function Providers({ children }: Props) {
  return (
    <ThemeProvider>
      <FiscalYearProvider>{children}</FiscalYearProvider>
    </ThemeProvider>
  )
}
