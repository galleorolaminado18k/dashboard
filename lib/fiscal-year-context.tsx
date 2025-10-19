"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type FiscalYearContextType = {
  fiscalYear: number
  setFiscalYear: (year: number) => void
}

const FiscalYearContext = createContext<FiscalYearContextType | undefined>(undefined)

export function FiscalYearProvider({ children }: { children: ReactNode }) {
  const [fiscalYear, setFiscalYearState] = useState<number>(2025)

  // Load fiscal year from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("fiscal-year")
    if (stored) {
      setFiscalYearState(Number.parseInt(stored, 10))
    }
  }, [])

  // Save fiscal year to localStorage when it changes
  const setFiscalYear = (year: number) => {
    setFiscalYearState(year)
    localStorage.setItem("fiscal-year", year.toString())
  }

  return <FiscalYearContext.Provider value={{ fiscalYear, setFiscalYear }}>{children}</FiscalYearContext.Provider>
}

export function useFiscalYear() {
  const context = useContext(FiscalYearContext)
  if (context === undefined) {
    throw new Error("useFiscalYear must be used within a FiscalYearProvider")
  }
  return context
}
