/**
 * API Route: Upload de archivos para WhatsApp
 * Sube archivos a Supabase Storage y devuelve la URL pública
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BUCKET_NAME = 'whatsapp-media'

export async function POST(request: NextRequest) {
  try {
    // Verificar configuración
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl) {
      console.error('❌ NEXT_PUBLIC_SUPABASE_URL no configurado')
      return NextResponse.json(
        { ok: false, error: 'Supabase URL no configurado.' },
        { status: 500 }
      )
    }

    if (!supabaseKey) {
      console.error('❌ Clave de Supabase no configurada')
      return NextResponse.json(
        { ok: false, error: 'Clave de Supabase no configurada.' },
        { status: 500 }
      )
    }

    // Parsear formulario
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (formError) {
      console.error('❌ Error parseando formData:', formError)
      return NextResponse.json(
        { ok: false, error: 'Error procesando el archivo.' },
        { status: 400 }
      )
    }

    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { ok: false, error: 'No se proporcionó archivo' },
        { status: 400 }
      )
    }

    if (!file.size || file.size === 0) {
      return NextResponse.json(
        { ok: false, error: 'El archivo está vacío' },
        { status: 400 }
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: 'El archivo es muy grande. Máximo 10MB.' },
        { status: 400 }
      )
    }

    console.log('📤 Subiendo archivo:', file.name, file.type, file.size, 'bytes')

    // Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Verificar/crear bucket
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME)

      if (!bucketExists) {
        console.log('📦 Creando bucket:', BUCKET_NAME)
        const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: 50 * 1024 * 1024,
        })
        if (createError) {
          console.error('❌ Error creando bucket:', createError)
          // Continuar de todos modos, puede que ya exista
        }
      }
    } catch (bucketError) {
      console.error('⚠️ Error verificando bucket:', bucketError)
      // Continuar de todos modos
    }

    // Generar nombre único
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(7)
    const extension = file.name.split('.').pop() || 'bin'
    const fileName = `${timestamp}-${randomId}.${extension}`

    // Convertir File a Buffer
    let buffer: Buffer
    try {
      const arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } catch (bufferError) {
      console.error('❌ Error convirtiendo archivo:', bufferError)
      return NextResponse.json(
        { ok: false, error: 'Error procesando el archivo' },
        { status: 500 }
      )
    }

    // Subir archivo
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      })

    if (uploadError) {
      console.error('❌ Error subiendo a Supabase:', uploadError)
      return NextResponse.json(
        { ok: false, error: `Error subiendo archivo: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    if (!urlData?.publicUrl) {
      console.error('❌ No se pudo obtener URL pública')
      return NextResponse.json(
        { ok: false, error: 'Error obteniendo URL del archivo' },
        { status: 500 }
      )
    }

    console.log('✅ Archivo subido:', urlData.publicUrl)

    return NextResponse.json({
      ok: true,
      url: urlData.publicUrl,
      filename: file.name,
      mimetype: file.type,
      size: file.size,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    console.error('❌ Error en upload:', message)
    return NextResponse.json(
      { ok: false, error: `Error interno: ${message}` },
      { status: 500 }
    )
  }
}

