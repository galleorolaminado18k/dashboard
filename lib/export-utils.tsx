export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert("No hay datos para exportar")
    return
  }

  // Obtener headers
  const headers = Object.keys(data[0])

  // Crear filas CSV
  const csvRows = [
    headers.join(","), // Header row
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          // Escapar valores que contengan comas o comillas
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        .join(","),
    ),
  ]

  // Crear blob y descargar
  const csvContent = csvRows.join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportToExcel(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert("No hay datos para exportar")
    return
  }

  // Crear tabla HTML
  const headers = Object.keys(data[0])
  let html = "<table><thead><tr>"

  headers.forEach((header) => {
    html += `<th>${header}</th>`
  })

  html += "</tr></thead><tbody>"

  data.forEach((row) => {
    html += "<tr>"
    headers.forEach((header) => {
      html += `<td>${row[header] || ""}</td>`
    })
    html += "</tr>"
  })

  html += "</tbody></table>"

  // Crear blob y descargar
  const blob = new Blob([html], { type: "application/vnd.ms-excel" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.xls`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
