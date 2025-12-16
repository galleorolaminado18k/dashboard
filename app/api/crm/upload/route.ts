/**
 * API Route: Upload de archivos para WhatsApp
 * Sube archivos a Supabase Storage y devuelve la URL pública
 * Incluye limpieza automática de archivos antiguos
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Configuración de Supabase con service role para bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const BUCKET_NAME = 'whatsapp-media'
const MAX_FILES = 500 // Máximo de archivos antes de limpiar
const MAX_AGE_DAYS = 7 // Eliminar archivos más antiguos de 7 días

// Función para limpiar archivos antiguos
async function cleanupOldFiles(supabase: any) {
  try {
    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1000, sortBy: { column: 'created_at', order: 'asc' } })

    if (error || !files) {
      console.log('⚠️ No se pudieron listar archivos para limpieza')
      return
    }

    const now = Date.now()
    const maxAgeMs = MAX_AGE_DAYS * 24 * 60 * 60 * 1000
    const filesToDelete: string[] = []

    // Encontrar archivos antiguos
    for (const file of files) {
      if (file.created_at) {
        const fileAge = now - new Date(file.created_at).getTime()
        if (fileAge > maxAgeMs) {
          filesToDelete.push(file.name)
        }
      }
    }

    // Si hay demasiados archivos, eliminar los más antiguos
    if (files.length > MAX_FILES) {
      const excessCount = files.length - MAX_FILES + 50 // Eliminar 50 extra para dar margen
      for (let i = 0; i < excessCount && i < files.length; i++) {
        if (!filesToDelete.includes(files[i].name)) {
          filesToDelete.push(files[i].name)
        }
      }
    }

    // Eliminar archivos
    if (filesToDelete.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(filesToDelete)

      if (deleteError) {
        console.error('❌ Error eliminando archivos:', deleteError)
      } else {
        console.log(`🧹 Limpieza: ${filesToDelete.length} archivos eliminados`)
      }
    }
  } catch (error) {
    console.error('❌ Error en limpieza:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar configuración
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase no configurado')
      return NextResponse.json(
        { ok: false, error: 'Storage no configurado. Contacta al administrador.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { ok: false, error: 'No se proporcionó archivo' },
        { status: 400 }
      )
    }

    // Validar tamaño máximo (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: 'El archivo es muy grande. Máximo 10MB.' },
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

    // Limpiar archivos antiguos en segundo plano (no bloquea la respuesta)
    // @ts-ignore - El tipo es correcto en runtime
    cleanupOldFiles(supabase).catch(err => console.error('Error en limpieza:', err))

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

