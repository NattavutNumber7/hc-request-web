import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { canViewAuditLog } from '@/lib/permissions'

export async function GET(request: NextRequest) {
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

    if (!canViewAuditLog(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const db = createServerClient()
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    const { data, count, error } = await db
      .from('hc_logs')
      .select('*, actor:staff!hc_logs_action_by_fkey(name_surname, nickname)', {
        count: 'exact',
      })
      .order('action_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Fetch all logs error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const mappedLogs = (data || []).map((log: any) => ({
      ...log,
      action_by_name: log.actor?.name_surname || log.actor?.nickname || null,
      actor: undefined,
    }))

    return NextResponse.json({
      data: mappedLogs,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error('GET /api/logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
