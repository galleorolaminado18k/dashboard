import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('dashboard_config')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (!data) {
      return NextResponse.json({
        wahaEnabled: false,
        wahaApiKey: "",
        wahaUrl: "http://localhost:3000",
        apiKeyMiPaquete: "",
        sessionTrackerMiPaquete: "",
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        supabaseAnonKey: "",
        emailNotifications: "",
        webhookUrl: "",
        companyName: "Comercializadora Gale18k",
        companyLogo: "",
      })
    }

    return NextResponse.json(data.config)
  } catch (error: any) {
    console.error('Error loading dashboard config:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json()

    const { data, error } = await supabase
      .from('dashboard_config')
      .upsert({
        id: 1,
        config,
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error saving dashboard config:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

