import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { canAssign } from '@/lib/permissions'
import { logAction } from '@/lib/logger'
import { notifySlack, assignedMessage } from '@/lib/slack'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token =
      request.cookies.get('sb-access-token')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getServerUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = createServerClient()

    // Fetch existing request
    const { data: existing, error: fetchError } = await db
      .from('hc_requests')
      .select('*')
      .eq('request_id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (!canAssign(user, existing)) {
      return NextResponse.json(
        { error: 'You do not have permission to assign this request' },
        { status: 403 }
      )
    }

    const now = new Date().toISOString()
    const { data: updated, error: updateError } = await db
      .from('hc_requests')
      .update({
        assigned_to: user.email,
        assigned_date: now,
        status: 'Assigned',
        updated_at: now,
      })
      .eq('request_id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Assign request error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Log action
    await logAction({
      requestId: id,
      action: 'Assigned',
      actionBy: user.email,
      fromStatus: existing.status,
      toStatus: 'Assigned',
    })

    // Slack notification
    const positionDisplay =
      existing.request_type === 'Request New HC'
        ? existing.position_new
        : existing.position_select
    const message = assignedMessage({
      requestId: id,
      position: positionDisplay || '-',
      assignedTo: user.name_surname,
    })
    notifySlack(message).catch(console.error)

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('POST /api/requests/[id]/assign error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
