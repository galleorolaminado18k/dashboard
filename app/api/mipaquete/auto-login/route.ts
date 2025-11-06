import { NextResponse } from 'next/server'

/**
 * API para autenticar automáticamente en MiPaquete
 * y obtener el token de sesión
 */

const MIPAQUETE_LOGIN_URL = 'https://api-v2.mpr.mipaquete.com/auth/login'
const MIPAQUETE_EMAIL = 'galleorolaminado18k@gmail.com'
const MIPAQUETE_PASSWORD = 'Om@r1430**'

export async function POST(request: Request) {
  try {
    console.log('🔐 Iniciando autenticación automática en MiPaquete...')

    // Hacer login en MiPaquete
    const loginResponse = await fetch(MIPAQUETE_LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: MIPAQUETE_EMAIL,
        password: MIPAQUETE_PASSWORD
      })
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
    console.log('✅ Login exitoso:', { ...loginData, password: '[REDACTED]' })

    // Extraer token
    const token = loginData.token || loginData.access_token || loginData.data?.token

    if (!token) {
      console.error('❌ No se encontró token en respuesta:', loginData)
      return NextResponse.json(
        { error: 'No se obtuvo token de autenticación', details: loginData },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      token,
      user: loginData.user || loginData.data?.user,
      message: 'Autenticación exitosa'
    })

  } catch (error: any) {
    console.error('❌ Error en autenticación:', error)
    return NextResponse.json(
      { error: 'Error interno al autenticar', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Endpoint para verificar estado de autenticación
  return NextResponse.json({
    message: 'Endpoint de autenticación MiPaquete',
    email: MIPAQUETE_EMAIL.replace(/(.{3}).*(@.*)/, '$1***$2'), // Ocultar parte del email
    status: 'ready'
  })
}

