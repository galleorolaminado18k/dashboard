export const num = (v: unknown, def = 0) => {
  const n = Number(v as any)
  return Number.isFinite(n) ? n : def
}

export const fmtMoney = (v: unknown, currency = "COP", locale = "es-CO") => {
  return num(v).toLocaleString(locale, { style: "currency", currency })
}

export const fmtNum = (v: unknown, locale = "es-CO") => {
  return num(v).toLocaleString(locale)
}

export const fmtDate = (v?: string | number | Date, locale = "es-CO") => {
  if (!v) return "—"
  const d = new Date(v as any)
  return isNaN(d.getTime()) ? "—" : d.toLocaleString(locale)
}

export default { num, fmtMoney, fmtNum, fmtDate }
