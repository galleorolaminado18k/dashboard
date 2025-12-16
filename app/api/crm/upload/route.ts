/**
 * API Route: Upload de archivos para WhatsApp
 * Sube archivos a Supabase Storage y devuelve la URL pública
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Configuración de Supabase con service role para bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const BUCKET_NAME = 'whatsapp-media'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { ok: false, error: 'No se proporcionó archivo' },
        { status: 400 }
      )
    }

    console.log('📤 Subiendo archivo:', file.name, file.type, file.size)

    // Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Generar nombre único
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(7)
    const extension = file.name.split('.').pop() || 'bin'
    const fileName = `${timestamp}-${randomId}.${extension}`

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Verificar si el bucket existe, si no crearlo
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)

    if (!bucketExists) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB
      })
      console.log('✅ Bucket creado:', BUCKET_NAME)
    }

    // Subir archivo
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (error) {
      console.error('❌ Error subiendo a Supabase:', error)
      return NextResponse.json(
        { ok: false, error: `Error de storage: ${error.message}` },
        { status: 500 }
      )
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    console.log('✅ Archivo subido:', urlData.publicUrl)

    return NextResponse.json({
      ok: true,
      url: urlData.publicUrl,
      filename: file.name,
      mimetype: file.type,
      size: file.size,
    })
  } catch (error: any) {
    console.error('❌ Error en upload:', error)
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    )
  }
}

