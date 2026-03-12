import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import {
  canViewRequest,
  canEditRequest,
  canCancelRequest,
  canChangeStatus,
} from '@/lib/permissions'
import { logAction } from '@/lib/logger'
import { notifySlack, statusChangedMessage } from '@/lib/slack'
import { HCRequest } from '@/types'

function getToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get('sb-access-token')?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '') ||
    undefined
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getServerUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = createServerClient()
    const { data, error } = await db
      .from('hc_requests')
      .select(
        '*, manager:staff!hc_requests_manager_email_fkey(name_surname, nickname), assignee:staff!hc_requests_assigned_to_fkey(name_surname, nickname)'
      )
      .eq('request_id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const hcRequest: HCRequest = {
      ...data,
      manager_name: data.manager?.name_surname || data.manager?.nickname || null,
      assigned_name: data.assignee?.name_surname || data.assignee?.nickname || null,
      position_display:
        data.request_type === 'Request New HC'
          ? data.position_new
          : data.position_select,
    }

    // Remove joined objects
    delete (hcRequest as any).manager
    delete (hcRequest as any).assignee

    if (!canViewRequest(user, hcRequest)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ data: hcRequest })
  } catch (error) {
    console.error('GET /api/requests/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getToken(request)
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
      .eq('request_id', params.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const body = await request.json()
    const isStatusChange = body.status && body.status !== existing.status

    // Permission check
    if (isStatusChange) {
      if (!canChangeStatus(user)) {
        return NextResponse.json(
          { error: 'You do not have permission to change status' },
          { status: 403 }
        )
      }
    } else {
      if (!canEditRequest(user, existing)) {
        return NextResponse.json(
          { error: 'You do not have permission to edit this request' },
          { status: 403 }
        )
      }
    }

    // Build update payload (only allowed fields)
    const allowedFields = [
      'request_type',
      'position_select',
      'position_new',
      'replace_who',
      'last_working_date',
      'job_grade',
      'requirements_comment',
      'jd_file_url',
      'status',
    ]

    const updateData: Record<string, any> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }
    updateData.updated_at = new Date().toISOString()

    const { data: updated, error: updateError } = await db
      .from('hc_requests')
      .update(updateData)
      .eq('request_id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Update request error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // If status changed, log and notify
    if (isStatusChange) {
      await logAction({
        requestId: params.id,
        action: `Status changed to ${body.status}`,
        actionBy: user.email,
        fromStatus: existing.status,
        toStatus: body.status,
        comment: body.comment,
      })

      const message = statusChangedMessage({
        requestId: params.id,
        fromStatus: existing.status,
        toStatus: body.status,
      })
      notifySlack(message).catch(console.error)
    } else {
      await logAction({
        requestId: params.id,
        action: 'Updated',
        actionBy: user.email,
        comment: body.comment,
      })
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PATCH /api/requests/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getServerUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = createServerClient()

    const { data: existing, error: fetchError } = await db
      .from('hc_requests')
      .select('*')
      .eq('request_id', params.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (!canCancelRequest(user, existing)) {
      return NextResponse.json(
        { error: 'You do not have permission to cancel this request' },
        { status: 403 }
      )
    }

    const { data: updated, error: updateError } = await db
      .from('hc_requests')
      .update({
        status: 'Cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('request_id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Cancel request error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    await logAction({
      requestId: params.id,
      action: 'Cancelled',
      actionBy: user.email,
      fromStatus: existing.status,
      toStatus: 'Cancelled',
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DELETE /api/requests/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
