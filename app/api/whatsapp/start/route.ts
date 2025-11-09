import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const WAHA = process.env.WAHA_BASE_URL || process.env.WAHA_URL || 'http://127.0.0.1:3000'
const WAHA_API_KEY = process.env.WAHA_API_KEY // OBLIGATORIO - generado con scripts/generate-waha-apikey.ps1

console.log('[START] Usando WAHA:', WAHA)
console.log('[START] API Key configurada:', WAHA_API_KEY ? 'SI (obligatoria para seguridad)' : 'NO - ERROR')

// Helper CORS
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 204,
    headers: corsHeaders()
  })
}

/**
 * POST /api/whatsapp/start
 * Iniciar sesión de WhatsApp en WAHA
 */
export async function POST() {
  try {
    console.log('[START] Iniciando sesión en WAHA:', WAHA)
    console.log('[START] Entorno:', process.env.VERCEL ? 'Vercel' : 'Local')

    if (!WAHA || WAHA === '') {
      throw new Error('ENV_WAHA_BASE_URL_MISSING')
    }

    // Validar API Key (OBLIGATORIA según configuración segura de WAHA)
    if (!WAHA_API_KEY) {
      return NextResponse.json({
        ok: false,
        error: 'WAHA_API_KEY_MISSING',
        detail: 'API Key no configurada. WAHA requiere autenticación para seguridad.',
        solution: 'Ejecuta: powershell scripts/generate-waha-apikey.ps1\nLuego configura WAHA_API_KEY en .env.local',
      }, {
        status: 500,
        headers: corsHeaders()
      })
    }

    // Detectar si estamos en Vercel/producción sin WAHA configurado
    const isLocalhost = WAHA.includes('127.0.0.1') || WAHA.includes('localhost')
    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production'

    if (isLocalhost && isProduction) {
      return NextResponse.json({
        ok: false,
        error: 'WAHA_NOT_CONFIGURED_PRODUCTION',
        detail: '🚨 WAHA no está configurado para producción. Estás en Vercel intentando conectar a localhost (127.0.0.1:3000) que no existe.',
        solution: 'Opciones:\n1. Desarrollo Local: Ejecuta "docker-compose -f docker-compose.waha.yml up -d" y abre http://localhost:3000\n2. Producción: Despliega WAHA en VPS/Railway y configura WAHA_BASE_URL en Vercel',
        guide: 'https://waha.devlike.pro/docs/how-to/deploy/',
        currentUrl: WAHA,
      }, {
        status: 503,
        headers: corsHeaders()
      })
    }

    // Verificar disponibilidad de WAHA primero
    console.log('[START] Verificando disponibilidad de WAHA...')
    try {
      const healthCheck = await fetch(`${WAHA}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 segundos timeout
      })

      if (!healthCheck.ok) {
        console.error('[START] WAHA no responde correctamente')
        return NextResponse.json({
          ok: false,
          error: 'WAHA_UNAVAILABLE',
          detail: `WAHA no está disponible en ${WAHA}. El servidor respondió con status ${healthCheck.status}.`,
          solution: isLocalhost
            ? 'Ejecuta: docker-compose -f docker-compose.waha.yml up -d'
            : 'Verifica que WAHA esté corriendo en tu servidor',
        }, {
          status: 503,
          headers: corsHeaders()
        })
      }
      console.log('[START] ✅ WAHA está disponible')
    } catch (healthError: any) {
      console.error('[START] Error conectando con WAHA:', healthError.message)
      return NextResponse.json({
        ok: false,
        error: 'WAHA_UNREACHABLE',
        detail: `No se puede conectar con WAHA en ${WAHA}. Error: ${healthError.message}`,
        solution: isLocalhost
          ? '1. Ejecuta: docker-compose -f docker-compose.waha.yml up -d\n2. Verifica con: docker ps | findstr waha'
          : '1. Verifica que WAHA_BASE_URL sea correcta\n2. Verifica que WAHA esté corriendo\n3. Verifica el firewall/CORS',
        wahaUrl: WAHA,
      }, {
        status: 503,
        headers: corsHeaders()
      })
    }

    // Iniciar sesión en WAHA
    // Intentar /start primero, si falla con 404 intentar /create
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    // Agregar API key si está configurada
    if (WAHA_API_KEY) {
      headers['X-Api-Key'] = WAHA_API_KEY
      console.log('[START] Usando autenticación con API Key')
    } else {
      console.log('[START] Sin autenticación (modo por defecto de WAHA)')
    }

    const sessionConfig = {
      name: 'default',
      config: {
        proxy: null,
        webhooks: [],
      }
    }

    // Intentar START
    let response = await fetch(`${WAHA}/api/sessions/default/start`, {
      method: 'POST',
      headers,
      body: JSON.stringify(sessionConfig)
    })

    console.log('[START] Status de /start:', response.status)

    // Si 404, intentar CREATE
    if (!response.ok && response.status === 404) {
      console.log('[START] /start no disponible, intentando /create')
      response = await fetch(`${WAHA}/api/sessions/default`, {
        method: 'POST',
        headers,
        body: JSON.stringify(sessionConfig)
      })
      console.log('[START] Status de /create:', response.status)
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[START] Error iniciando sesión:', response.status, errorText)

      // Si ya está iniciada (409), es OK
      if (response.status === 409) {
        return NextResponse.json({
          ok: true,
          message: 'Sesión ya iniciada',
          alreadyStarted: true,
        }, {
          headers: corsHeaders()
        })
      }

      // Error 401 - problema de autenticación
      if (response.status === 401) {
        return NextResponse.json({
          ok: false,
          error: 'WAHA_AUTH_FAILED',
          detail: 'WAHA rechazó la API key. La clave enviada NO coincide con el hash configurado en WAHA.',
          wahaUrl: WAHA,
          suggestion: 'Verifica que:\n1. WAHA tenga configurado: WAHA_API_KEY=sha512:402d5e20c143...\n2. Tu .env.local tenga: WAHA_API_KEY=d8c776b78aee40d4b9bf75c633d175c8\n3. Reinicia WAHA: docker-compose down && docker-compose up -d',
        }, {
          status: 401,
          headers: corsHeaders()
        })
      }

      // Error 403 - problema de autenticación
      if (response.status === 403) {
        return NextResponse.json({
          ok: false,
          error: 'WAHA_AUTH_FAILED',
          detail: 'Error de autenticación con WAHA. La API key no es válida.',
          wahaUrl: WAHA,
          suggestion: 'Si estás en Vercel, asegúrate de que WAHA_BASE_URL apunte a una URL pública HTTPS y que WAHA_API_KEY sea correcta.',
        }, {
          status: 403,
          headers: corsHeaders()
        })
      }

      return NextResponse.json({
        ok: false,
        error: `WAHA_START_${response.status}`,
        detail: errorText,
      }, {
        status: response.status,
        headers: corsHeaders()
      })
    }

    const data = await response.json()
    console.log('[START] Sesión iniciada:', data)

    return NextResponse.json({
      ok: true,
      message: 'Sesión iniciada correctamente',
      data,
    }, {
      headers: corsHeaders()
    })
  } catch (error: any) {
    console.error('[START] Error fatal:', error.message || error)

    return NextResponse.json({
      ok: false,
      error: 'WAHA_UNREACHABLE',
      detail: error.message || String(error),
      wahaUrl: WAHA || 'undefined',
    }, {
      status: 502,
      headers: corsHeaders()
    })
  }
}
