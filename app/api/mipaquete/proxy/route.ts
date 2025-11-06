import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy reverso para MiPaquete
 * Esto permite cargar MiPaquete en un iframe dentro del dashboard
 * evadiendo las restricciones X-Frame-Options
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const guia = searchParams.get('guia')

    if (!guia) {
      return NextResponse.json({ error: 'Guía requerida' }, { status: 400 })
    }

    // URL del portal de MiPaquete
    const mipaqueteUrl = `https://centrodenovedades.mipaquete.com/novedades/envios-con-novedad?search=${encodeURIComponent(guia)}`

    console.log('🌐 Proxy request para guía:', guia)

    // Hacer request al portal de MiPaquete
    const response = await fetch(mipaqueteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8',
      }
    })

    if (!response.ok) {
      throw new Error(`MiPaquete responded with ${response.status}`)
    }

    const html = await response.text()

    // Modificar el HTML para inyectar base URL y scripts si es necesario
    const modifiedHtml = html
      .replace(/<head>/i, `<head><base href="https://centrodenovedades.mipaquete.com/">`)

    // Retornar HTML sin las headers que bloquean iframe
    return new NextResponse(modifiedHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // NO incluir X-Frame-Options para permitir iframe
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    })

  } catch (error: any) {
    console.error('❌ Error en proxy MiPaquete:', error)
    return NextResponse.json(
      { error: 'Error al conectar con MiPaquete', details: error.message },
      { status: 500 }
    )
  }
}

