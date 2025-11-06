import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * API para autenticar automáticamente en MiPaquete
 * Hace login y establece las cookies de sesión
 */

const MIPAQUETE_LOGIN_URL = 'https://api-v2.mpr.mipaquete.com/auth/login'
const MIPAQUETE_PORTAL_URL = 'https://centrodenovedades.mipaquete.com'
const MIPAQUETE_EMAIL = 'galleorolaminado18k@gmail.com'
const MIPAQUETE_PASSWORD = 'Om@r1430**'

export async function POST(request: Request) {
  try {
    console.log('🔐 Iniciando autenticación automática en MiPaquete...')

    // 1. Hacer login en la API de MiPaquete
    const loginResponse = await fetch(MIPAQUETE_LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': MIPAQUETE_PORTAL_URL,
        'Referer': MIPAQUETE_PORTAL_URL
      },
      body: JSON.stringify({
        email: MIPAQUETE_EMAIL,
        password: MIPAQUETE_PASSWORD
      }),
      credentials: 'include'
    })

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text()
      console.error('❌ Error en login:', errorText)
      return NextResponse.json(
        { error: 'Error al autenticar en MiPaquete', details: errorText },
        { status: loginResponse.status }
      )
    }

    const loginData = await loginResponse.json()
    console.log('✅ Login exitoso')

    // 2. Extraer token y cookies
    const token = loginData.token || loginData.access_token || loginData.data?.token
    const setCookieHeaders = loginResponse.headers.getSetCookie?.() || []

    console.log('🍪 Cookies recibidas:', setCookieHeaders.length)

    if (!token) {
      console.error('❌ No se encontró token en respuesta')
      return NextResponse.json(
        { error: 'No se obtuvo token de autenticación' },
        { status: 500 }
      )
    }

    // 3. Crear respuesta con las cookies
    const response = NextResponse.json({
      success: true,
      token,
      cookies: setCookieHeaders,
      user: loginData.user || loginData.data?.user,
      message: 'Autenticación exitosa'
    })

    // 4. Establecer cookies en la respuesta para que el navegador las use
    setCookieHeaders.forEach(cookieStr => {
      try {
        // Parsear cookie string
        const [nameValue, ...attributes] = cookieStr.split(';')
        const [name, value] = nameValue.split('=')

        if (name && value) {
          response.cookies.set(name.trim(), value.trim(), {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/'
          })
        }
      } catch (e) {
        console.error('Error parsing cookie:', e)
      }
    })

    return response

  } catch (error: any) {
    console.error('❌ Error en autenticación:', error)
    return NextResponse.json(
      { error: 'Error interno al autenticar', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de autenticación MiPaquete',
    email: MIPAQUETE_EMAIL.replace(/(.{3}).*(@.*)/, '$1***$2'),
    status: 'ready'
  })
}

