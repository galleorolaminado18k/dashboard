/**
 * Cliente API para WAHA (WhatsApp HTTP API)
 * Documentación: https://waha.devlike.pro/docs/
 */

const WAHA_URL = process.env.WAHA_URL || 'http://localhost:3000'
const WAHA_API_KEY = process.env.WAHA_API_KEY // Sin fallback - autenticación opcional

export interface WAHASession {
  name: string
  status: 'STOPPED' | 'STARTING' | 'SCAN_QR_CODE' | 'WORKING' | 'FAILED'
  config?: {
    webhooks?: Array<{
      url: string
      events: string[]
    }>
  }
}

export interface WAHAQRResponse {
  qr?: string // Base64 QR code
}

export interface WAHAMessagePayload {
  chatId: string // 573001234567@c.us
  text: string
  session?: string
}

class WAHAClient {
  private baseUrl: string
  private apiKey?: string

  constructor(baseUrl: string = WAHA_URL, apiKey?: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey || WAHA_API_KEY
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    // Solo agregar API key si está configurada
    if (this.apiKey) {
      headers['X-Api-Key'] = this.apiKey
    }

    const response = await fetch(url, { ...options, headers })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`WAHA API Error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // ========== SESSIONS ==========

  /**
   * Obtener todas las sesiones
   */
  async getSessions(): Promise<WAHASession[]> {
    return this.fetch('/api/sessions')
  }

  /**
   * Obtener una sesión específica
   */
  async getSession(name: string): Promise<WAHASession> {
    return this.fetch(`/api/sessions/${name}`)
  }

  /**
   * Crear o iniciar una sesión
   */
  async startSession(name: string = 'default', webhookUrl?: string): Promise<WAHASession> {
    const config: WAHASession['config'] = webhookUrl
      ? {
          webhooks: [
            {
              url: webhookUrl,
              events: ['message', 'message.any', 'session.status', 'state.change'],
            },
          ],
        }
      : undefined

    return this.fetch('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ name, config }),
    })
  }

  /**
   * Detener una sesión
   */
  async stopSession(name: string): Promise<void> {
    return this.fetch(`/api/sessions/${name}/stop`, {
      method: 'POST',
    })
  }

  /**
   * Eliminar una sesión
   */
  async deleteSession(name: string): Promise<void> {
    return this.fetch(`/api/sessions/${name}`, {
      method: 'DELETE',
    })
  }

  /**
   * Reiniciar una sesión
   */
  async restartSession(name: string): Promise<void> {
    return this.fetch(`/api/sessions/${name}/restart`, {
      method: 'POST',
    })
  }

  // ========== QR CODE ==========

  /**
   * Obtener código QR para escanear
   */
  async getQRCode(name: string = 'default'): Promise<WAHAQRResponse> {
    return this.fetch(`/api/sessions/${name}/qr`, {
      method: 'GET',
    })
  }

  // ========== MESSAGES ==========

  /**
   * Enviar mensaje de texto
   */
  async sendText(payload: WAHAMessagePayload): Promise<any> {
    const session = payload.session || 'default'
    return this.fetch(`/api/sendText`, {
      method: 'POST',
      body: JSON.stringify({
        session,
        chatId: payload.chatId,
        text: payload.text,
      }),
    })
  }

  /**
   * Enviar imagen
   */
  async sendImage(session: string, chatId: string, imageUrl: string, caption?: string): Promise<any> {
    return this.fetch(`/api/sendImage`, {
      method: 'POST',
      body: JSON.stringify({
        session,
        chatId,
        file: { url: imageUrl },
        caption,
      }),
    })
  }

  /**
   * Enviar archivo
   */
  async sendFile(session: string, chatId: string, fileUrl: string, filename?: string): Promise<any> {
    return this.fetch(`/api/sendFile`, {
      method: 'POST',
      body: JSON.stringify({
        session,
        chatId,
        file: { url: fileUrl, filename },
      }),
    })
  }

  // ========== HELPERS ==========

  /**
   * Formatear número de teléfono a chatId
   * @param phone - Número sin código de país (ej: 3001234567)
   * @param countryCode - Código de país (default: 57 para Colombia)
   */
  formatChatId(phone: string, countryCode: string = '57'): string {
    const cleanPhone = phone.replace(/\D/g, '')
    return `${countryCode}${cleanPhone}@c.us`
  }

  /**
   * Verificar si la sesión está conectada
   */
  async isConnected(name: string = 'default'): Promise<boolean> {
    try {
      const session = await this.getSession(name)
      return session.status === 'WORKING'
    } catch {
      return false
    }
  }

  /**
   * Esperar a que la sesión esté conectada
   * @param name - Nombre de la sesión
   * @param maxAttempts - Intentos máximos (default: 60)
   * @param interval - Intervalo entre intentos en ms (default: 2000)
   */
  async waitForConnection(
    name: string = 'default',
    maxAttempts: number = 60,
    interval: number = 2000
  ): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      const connected = await this.isConnected(name)
      if (connected) return true
      await new Promise((resolve) => setTimeout(resolve, interval))
    }
    return false
  }
}

// Exportar instancia singleton
export const wahaClient = new WAHAClient()

// Exportar clase para instancias personalizadas
export default WAHAClient

