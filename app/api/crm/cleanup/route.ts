/**
 * API Route: Limpieza manual del storage de WhatsApp
 * GET /api/crm/cleanup - Ver estadísticas del storage
 * POST /api/crm/cleanup - Ejecutar limpieza manual
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const BUCKET_NAME = 'whatsapp-media'
const MAX_AGE_DAYS = 7

// GET: Ver estadísticas del storage
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } })

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    const totalFiles = files?.length || 0
    const now = Date.now()
    const maxAgeMs = MAX_AGE_DAYS * 24 * 60 * 60 * 1000

    let oldFilesCount = 0
    let totalSize = 0

    for (const file of files || []) {
      if (file.metadata?.size) {
        totalSize += file.metadata.size
      }
      if (file.created_at) {
        const fileAge = now - new Date(file.created_at).getTime()
        if (fileAge > maxAgeMs) {
          oldFilesCount++
        }
      }
    }

    return NextResponse.json({
      ok: true,
      stats: {
        totalFiles,
        oldFilesCount,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        maxAgeDays: MAX_AGE_DAYS,
        bucket: BUCKET_NAME,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

// POST: Ejecutar limpieza manual
export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1000, sortBy: { column: 'created_at', order: 'asc' } })

    if (error || !files) {
      return NextResponse.json({ ok: false, error: 'No se pudieron listar archivos' }, { status: 500 })
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

    // Eliminar archivos
    let deletedCount = 0
    if (filesToDelete.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(filesToDelete)

      if (!deleteError) {
        deletedCount = filesToDelete.length
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Limpieza completada`,
      deleted: deletedCount,
      remaining: files.length - deletedCount,
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

