/**
 * API Route: Upload de archivos a Cloudinary para WhatsApp
 * Sube archivos a Cloudinary y devuelve la URL pública
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Configuración de Cloudinary
const CLOUDINARY_CLOUD_NAME = 'dusyyg1dd'
const CLOUDINARY_API_KEY = '791156185862577'
const CLOUDINARY_API_SECRET = 'kU6UoxWyFnUvS3PVqM0OgbtIxIg'
const CLOUDINARY_UPLOAD_PRESET = 'galleorolaminadosubida'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ ok: false, error: 'No se proporcionó archivo' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: 'Archivo muy grande. Máximo 10MB.' }, { status: 400 })
    }

    console.log('📤 Subiendo a Cloudinary:', file.name, file.type, file.size, 'bytes')

    // Convertir archivo a base64 para Cloudinary
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`

    // Determinar tipo de recurso
    let resourceType = 'raw'
    if (file.type.startsWith('image/')) resourceType = 'image'
    else if (file.type.startsWith('video/') || file.type.startsWith('audio/')) resourceType = 'video'

    // Subir a Cloudinary usando su API REST directamente
    const cloudinaryFormData = new FormData()
    cloudinaryFormData.append('file', dataUri)
    cloudinaryFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    cloudinaryFormData.append('folder', 'whatsapp-media')

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      body: cloudinaryFormData,
    })

    const result = await uploadRes.json()

    if (result.error) {
      console.error('❌ Error Cloudinary:', result.error)
      return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 })
    }

    console.log('✅ Subido a Cloudinary:', result.secure_url)

    return NextResponse.json({
      ok: true,
      url: result.secure_url,
      filename: file.name,
      mimetype: file.type,
      size: file.size,
      cloudinary_id: result.public_id,
    })

  } catch (error: any) {
    console.error('❌ Error en Cloudinary upload:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Error subiendo archivo' },
      { status: 500 }
    )
  }
}

