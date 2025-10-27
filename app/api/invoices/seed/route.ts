import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

/**
 * POST /api/invoices/seed
 * Crea facturas de ejemplo para pruebas
 */
export async function POST() {
  const supabase = createClient()

  try {
    console.log("[Seed Invoices] Iniciando creación de facturas de ejemplo...")

    // Facturas de ejemplo basadas en la imagen
    const facturas = [
      {
        invoice_number: "FAC-2025-001",
        client_name: "Distribuidora El Sol S.A.S",
        client_nit: "900123456-7",
        client_phone: "3001234567",
        client_address: "Calle 123 #45-67",
        city: "Bogotá",
        issue_date: "2025-10-14",
        due_date: "2025-11-14",
        subtotal: 2500000,
        tax_amount: 475000,
        total: 2975000,
        status: "Pagado",
        payment_method: "Transferencia",
        mipaquete_code: "MP-SB048078309",
        carrier: "Servientrega",
        products: [
          { name: "Producto A", quantity: 10, price: 250000 }
        ]
      },
      {
        invoice_number: "FAC-2025-002",
        client_name: "Comercializadora Norte Ltda",
        client_nit: "800987654-3",
        client_phone: "3009876543",
        client_address: "Carrera 50 #25-30",
        city: "Medellín",
        issue_date: "2025-10-17",
        due_date: "2025-11-17",
        subtotal: 1800000,
        tax_amount: 342000,
        total: 2142000,
        status: "Pendiente Pago",
        payment_method: "Efectivo",
        mipaquete_code: "MP-SB048078310",
        carrier: "Coordinadora",
        products: [
          { name: "Producto B", quantity: 5, price: 360000 }
        ]
      },
      {
        invoice_number: "FAC-2025-003",
        client_name: "Supermercado La Economía",
        client_nit: "890765432-1",
        client_phone: "3201234567",
        client_address: "Avenida 6 #15-20",
        city: "Cali",
        issue_date: "2025-10-19",
        due_date: "2025-11-19",
        subtotal: 3200000,
        tax_amount: 608000,
        total: 3808000,
        status: "Entregado",
        payment_method: "Credito",
        mipaquete_code: "MP-SB048078311",
        carrier: "Deprisa",
        products: [
          { name: "Producto C", quantity: 20, price: 160000 }
        ]
      },
      {
        invoice_number: "FAC-2025-004",
        client_name: "Almacenes Unidos S.A",
        client_nit: "900555444-9",
        client_phone: "3159876543",
        client_address: "Transversal 30 #40-50",
        city: "Barranquilla",
        issue_date: "2025-10-21",
        due_date: "2025-11-21",
        subtotal: 4500000,
        tax_amount: 855000,
        total: 5355000,
        status: "Pagado",
        payment_method: "Transferencia",
        mipaquete_code: "MP-SB048078312",
        carrier: "Servientrega",
        products: [
          { name: "Producto D", quantity: 15, price: 300000 }
        ]
      },
      {
        invoice_number: "FAC-2025-005",
        client_name: "Tiendas Express Colombia",
        client_nit: "890333222-5",
        client_phone: "3187654321",
        client_address: "Diagonal 45 #20-15",
        city: "Cartagena",
        issue_date: "2025-10-24",
        due_date: "2025-11-24",
        subtotal: 1500000,
        tax_amount: 285000,
        total: 1785000,
        status: "Pendiente Pago",
        payment_method: "Efectivo",
        mipaquete_code: "MP-SB048078313",
        carrier: "Coordinadora",
        products: [
          { name: "Producto E", quantity: 8, price: 187500 }
        ]
      }
    ]

    // Insertar facturas
    const { data, error } = await supabase
      .from('invoices')
      .insert(facturas)
      .select()

    if (error) {
      console.error("[Seed Invoices] Error:", error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    console.log(`[Seed Invoices] ✓ Creadas ${data.length} facturas de ejemplo`)

    return NextResponse.json({
      ok: true,
      message: `Se crearon ${data.length} facturas de ejemplo`,
      facturas: data
    })

  } catch (error: any) {
    console.error("[Seed Invoices] Error:", error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

