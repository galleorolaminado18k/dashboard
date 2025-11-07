import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  const waha = process.env.WAHA_BASE_URL || process.env.WAHA_URL || 'NOT_CONFIGURED'
  const apiKey = process.env.WAHA_API_KEY || 'NOT_CONFIGURED'

  return NextResponse.json({
    ok: true,
    waha_url: waha,
    has_api_key: apiKey !== 'NOT_CONFIGURED',
    environment: process.env.NODE_ENV || 'unknown'
  })
}

