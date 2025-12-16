/**
 * API Route: Debug de Supabase Storage
 * Verifica la configuración y permisos del storage
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const BUCKET_NAME = 'whatsapp-media'

export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    config: {
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NO CONFIGURADO',
      hasServiceKey: !!supabaseServiceKey,
      serviceKeyLength: supabaseServiceKey?.length || 0,
      hasAnonKey: !!supabaseAnonKey,
      anonKeyLength: supabaseAnonKey?.length || 0,
    },
    tests: {},
  }

  // Usar la clave disponible
  const keyToUse = supabaseServiceKey || supabaseAnonKey

  if (!supabaseUrl || !keyToUse) {
    results.error = 'Supabase no está configurado correctamente'
    return NextResponse.json(results)
  }

  try {
    const supabase = createClient(supabaseUrl, keyToUse, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Test 1: Listar buckets
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets()
      results.tests.listBuckets = {
        success: !error,
        error: error?.message,
        buckets: buckets?.map(b => ({ name: b.name, public: b.public })),
      }
    } catch (e: any) {
      results.tests.listBuckets = { success: false, error: e.message }
    }

    // Test 2: Verificar bucket específico
    try {
      const { data: files, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', { limit: 5 })

      results.tests.bucketAccess = {
        success: !error,
        error: error?.message,
        fileCount: files?.length || 0,
        recentFiles: files?.slice(0, 3).map(f => f.name),
      }
    } catch (e: any) {
      results.tests.bucketAccess = { success: false, error: e.message }
    }

    // Test 3: Intentar subir un archivo de prueba
    try {
      const testFileName = `test-${Date.now()}.txt`
      const testContent = Buffer.from('test content')

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(testFileName, testContent, {
          contentType: 'text/plain',
          upsert: true,
        })

      if (!error) {
        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(testFileName)

        results.tests.uploadTest = {
          success: true,
          path: data?.path,
          publicUrl: urlData?.publicUrl,
        }

        // Limpiar archivo de prueba
        await supabase.storage.from(BUCKET_NAME).remove([testFileName])
      } else {
        results.tests.uploadTest = {
          success: false,
          error: error.message,
        }
      }
    } catch (e: any) {
      results.tests.uploadTest = { success: false, error: e.message }
    }

  } catch (error: any) {
    results.error = error.message
  }

  return NextResponse.json(results)
}

