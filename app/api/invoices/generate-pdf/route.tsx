import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { invoiceNumber } = await request.json()

    if (!invoiceNumber) {
      return NextResponse.json({ error: "Número de factura requerido" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Obtener datos de la factura con items
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*, invoice_items(*)")
      .eq("invoice_number", invoiceNumber)
      .single()

    if (invoiceError || !invoice) {
      console.error("[v0] Error obteniendo factura:", invoiceError)
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    // Generar HTML de la factura
    const html = generateInvoiceHTML(invoice)

    // Convertir HTML a PDF usando una librería (por ahora guardamos el HTML)
    // En producción, usarías una librería como puppeteer o jsPDF
    const pdfBlob = new Blob([html], { type: "text/html" })
    const file = new File([pdfBlob], `${invoiceNumber}.html`, {
      type: "text/html",
    })

    // Subir a Vercel Blob
    const blob = await put(`facturas/${invoiceNumber}.html`, file, {
      access: "public",
    })

    // Actualizar la factura con la URL del PDF
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ pdf_url: blob.url })
      .eq("invoice_number", invoiceNumber)

    if (updateError) {
      console.error("[v0] Error actualizando factura con PDF URL:", updateError)
    }

    return NextResponse.json({
      success: true,
      url: blob.url,
      invoiceNumber,
    })
  } catch (error) {
    console.error("[v0] Error generando PDF:", error)
    return NextResponse.json({ error: "Error generando PDF de factura" }, { status: 500 })
  }
}

function generateInvoiceHTML(invoice: any): string {
  const items = invoice.invoice_items || []

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura ${invoice.invoice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
    .logo { font-size: 48px; font-weight: bold; }
    .order-info { text-align: right; }
    .company-info { margin-bottom: 20px; line-height: 1.6; }
    .company-info strong { font-weight: bold; }
    .guarantee { border: 1px solid #000; padding: 10px; margin: 20px 0; font-size: 11px; }
    .client-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .client-field { display: flex; gap: 10px; }
    .client-field strong { min-width: 100px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
    th { background-color: #f0f0f0; font-weight: bold; }
    .totals { margin-top: 20px; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; }
    .totals-row.total { font-weight: bold; font-size: 18px; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
    .footer { margin-top: 40px; }
    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 30px; }
    .signature-line { border-top: 1px solid #000; padding-top: 5px; text-align: center; }
    .legal { font-size: 10px; margin-top: 20px; line-height: 1.4; }
    .social { text-align: center; margin: 20px 0; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">GALLE</div>
    <div class="order-info">
      <div style="font-weight: bold;">ORDEN DE VENTA</div>
      <div>No. ${invoice.invoice_number || ""}</div>
      <div>${new Date(invoice.issue_date).toLocaleDateString("es-CO")}</div>
    </div>
  </div>

  <div class="company-info">
    <div><strong>COMERCIALIZADORA GALLE18K ORO LAMINADO Y ACCESORIOS SAS</strong></div>
    <div><strong>NIT:</strong> 901357041-4 RESPONSABLE DE IVA</div>
    <div>VILLA DEL ROSARIO - NORTE DE SANTANDER</div>
    <div><strong>TELÉFONOS:</strong> LINEA DETAL: 300 5551856 LINEA MAYOR: 304 3676388</div>
  </div>

  <div class="guarantee">
    GARANTÍA 2 AÑOS POR CAMBIO DE COLOR O DEFECTO DE FABRICA. NO APLICA A MODIFICACIONES O DAÑOS A LA PRENDA POR USO
  </div>

  <div class="client-info">
    <div class="client-field"><strong>NOMBRE:</strong> <span>${invoice.client_name || ""}</span></div>
    <div class="client-field"><strong>CELULAR:</strong> <span>${invoice.client_phone || ""}</span></div>
    <div class="client-field"><strong>DIRECCIÓN:</strong> <span>${invoice.client_address || ""}</span></div>
    <div class="client-field"><strong>CÉDULA:</strong> <span>${invoice.client_nit || ""}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>REF</th>
        <th>DESCRIPCIÓN</th>
        <th>UND</th>
        <th>IVA ${invoice.tax_rate || 13}%</th>
        <th>PRECIO BASE</th>
        <th>PRECIO NETO</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map(
          (item: any, index: number) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.description || ""}</td>
          <td>${item.quantity || 0}</td>
          <td>$${(item.unit_price * item.quantity * (invoice.tax_rate / 100) || 0).toLocaleString("es-CO")}</td>
          <td>$${(item.unit_price || 0).toLocaleString("es-CO")}</td>
          <td>$${(item.total || 0).toLocaleString("es-CO")}</td>
        </tr>
      `,
        )
        .join("")}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>FORMA DE PAGO: ${invoice.payment_method || "CONTRA_ENTREGA"}</span>
      <span><strong>SUBTOTAL:</strong> $${(invoice.subtotal || 0).toLocaleString("es-CO")}</span>
    </div>
    <div class="totals-row">
      <span></span>
      <span><strong>IMPUESTOS:</strong> $${(invoice.tax_amount || 0).toLocaleString("es-CO")}</span>
    </div>
    <div class="totals-row total">
      <span></span>
      <span>TOTAL NETO: $${(invoice.total || 0).toLocaleString("es-CO")}</span>
    </div>
  </div>

  <div class="social">
    Síguenos en Instagram @galleorolaminado18k
  </div>

  <div class="signatures">
    <div>
      <div class="signature-line">FIRMA ASESORA</div>
    </div>
    <div>
      <div class="signature-line">FIRMA AUDITOR</div>
    </div>
    <div>
      <div class="signature-line">FIRMA SUPERVISOR</div>
    </div>
  </div>

  <div class="legal">
    <p>SI DESEAS NO APLICAR RETENCIÓN EN LA FUENTE YA QUE SOMOS BENEFICIARIOS SEZE</p>
    <p>APARTIR DEL 1 DE ENERO DEL AÑO 2020</p>
    <p>SI DESEAS APLICAR RETENCIÓN EN LA FUENTE COMUNÍCATE CON TU ASESORA</p>
  </div>
</body>
</html>
  `
}
