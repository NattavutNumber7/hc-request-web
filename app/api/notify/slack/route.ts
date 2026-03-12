import { NextRequest, NextResponse } from 'next/server'
import { notifySlack } from '@/lib/slack'

export async function POST(request: NextRequest) {
  try {
    // Verify internal secret to prevent external abuse
    const internalSecret = process.env.INTERNAL_API_SECRET
    const providedSecret =
      request.headers.get('x-internal-secret') ||
      request.headers.get('Authorization')?.replace('Bearer ', '')

    if (internalSecret && providedSecret !== internalSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.message) {
      return NextResponse.json(
        { error: 'message field is required' },
        { status: 400 }
      )
    }

    await notifySlack(body.message)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/notify/slack error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
