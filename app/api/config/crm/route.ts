import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    // Obtener la configuración guardada
    const { data, error } = await supabase
      .from('crm_config')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // Si no existe configuración, retornar valores por defecto
    if (!data) {
      return NextResponse.json({
        whatsappBusinessPhone: "",
        whatsappQRCode: "",
        apiKeyMiPaquete: "",
        sessionTrackerMiPaquete: "",
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        supabaseAnonKey: "", // No exponer la key completa
        emailNotifications: "",
        webhookUrl: "",
        companyName: "Comercializadora Gale18k",
        companyLogo: "",
      })
    }

    return NextResponse.json(data.config)
  } catch (error: any) {
    console.error('Error loading CRM config:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json()

    // Guardar o actualizar la configuración
    const { data, error } = await supabase
      .from('crm_config')
      .upsert({
        id: 1, // ID fijo para tener una sola configuración
        config,
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error saving CRM config:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

