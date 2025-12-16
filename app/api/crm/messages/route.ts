/**
 * API Route: CRM Messages
 * Endpoint para obtener mensajes de una conversación
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMessages, saveMessage } from '@/lib/crm-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/crm/messages?conversationId=xxx
 * Obtener mensajes de una conversación
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50

    if (!conversationId) {
      return NextResponse.json(
        { ok: false, error: 'conversationId es requerido' },
        { status: 400 }
      )
    }

    const messages = await getMessages(conversationId, limit)

    return NextResponse.json({
      ok: true,
      messages,
      total: messages.length,
    })
  } catch (error: any) {
    console.error('Error fetching CRM messages:', error)
    return NextResponse.json(
      { ok: false, error: error.message, messages: [] },
      { status: 500 }
    )
  }
}

/**
 * POST /api/crm/messages
 * Guardar un nuevo mensaje (desde el agente)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversationId, content, type = 'text' } = body

    if (!conversationId || !content) {
      return NextResponse.json(
        { ok: false, error: 'conversationId y content son requeridos' },
        { status: 400 }
      )
    }

    const message = await saveMessage(
      conversationId,
      'agent',
      content,
      type
    )

    return NextResponse.json({
      ok: true,
      message,
    })
  } catch (error: any) {
    console.error('Error saving CRM message:', error)
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    )
  }
}

