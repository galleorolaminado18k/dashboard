/**
 * Utilidades para manejar códigos de seguridad
 */

export interface SecurityCodes {
  replaceEvidence: string
  addProductsToInvoice: string
}

const DEFAULT_CODES: SecurityCodes = {
  replaceEvidence: "1430",
  addProductsToInvoice: "1430",
}

const STORAGE_KEY = "securityCodes"

/**
 * Obtiene los códigos de seguridad guardados
 */
export function getSecurityCodes(): SecurityCodes {
  if (typeof window === "undefined") {
    return DEFAULT_CODES
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return { ...DEFAULT_CODES, ...JSON.parse(saved) }
    }
  } catch (error) {
    console.error("Error loading security codes:", error)
  }

  return DEFAULT_CODES
}

/**
 * Guarda los códigos de seguridad
 */
export function saveSecurityCodes(codes: SecurityCodes): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes))
  } catch (error) {
    console.error("Error saving security codes:", error)
  }
}

/**
 * Valida un código de seguridad
 */
export function validateSecurityCode(
  type: keyof SecurityCodes,
  code: string
): boolean {
  const codes = getSecurityCodes()
  return codes[type] === code
}

