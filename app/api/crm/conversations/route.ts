/**
 * API Route: CRM Conversations
 * Endpoint para obtener y gestionar conversaciones del CRM
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getConversations,
  getCRMStats,
  updateConversationStatus,
  markConversationAsRead,
} from '@/lib/crm-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/crm/conversations
 * Obtener lista de conversaciones con filtros
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const filters = {
      status: searchParams.get('status') || undefined,
      canal: searchParams.get('canal') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
    }

    const conversations = await getConversations(filters)
    const stats = await getCRMStats()

    return NextResponse.json({
      ok: true,
      conversations,
      stats,
      total: conversations.length,
    })
  } catch (error: any) {
    console.error('Error fetching CRM conversations:', error)
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        conversations: [],
        stats: {},
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/crm/conversations
 * Actualizar estado de una conversación
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversationId, action, status } = body

    if (!conversationId) {
      return NextResponse.json(
        { ok: false, error: 'conversationId es requerido' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'updateStatus':
        if (!status) {
          return NextResponse.json(
            { ok: false, error: 'status es requerido' },
            { status: 400 }
          )
        }
        await updateConversationStatus(conversationId, status)
        break

      case 'markAsRead':
        await markConversationAsRead(conversationId)
        break

      default:
        return NextResponse.json(
          { ok: false, error: 'Acción no válida' },
          { status: 400 }
        )
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Error updating CRM conversation:', error)
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    )
  }
}

