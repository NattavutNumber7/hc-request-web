import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { canViewRequest } from '@/lib/permissions'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Check request exists and user has access
    const { data: hcRequest, error: reqError } = await db
      .from('hc_requests')
      .select('*')
      .eq('request_id', params.id)
      .single()

    if (reqError || !hcRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (!canViewRequest(user, hcRequest)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch logs with action_by name joined from staff
    const { data: logs, error: logsError } = await db
      .from('hc_logs')
      .select('*, actor:staff!hc_logs_action_by_fkey(name_surname, nickname)')
      .eq('request_id', params.id)
      .order('action_date', { ascending: false })

    if (logsError) {
      console.error('Fetch logs error:', logsError)
      return NextResponse.json({ error: logsError.message }, { status: 500 })
    }

    const mappedLogs = (logs || []).map((log: any) => ({
      ...log,
      action_by_name: log.actor?.name_surname || log.actor?.nickname || null,
      actor: undefined,
    }))

    return NextResponse.json({ data: mappedLogs })
  } catch (error) {
    console.error('GET /api/requests/[id]/logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
