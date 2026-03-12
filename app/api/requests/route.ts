import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { canViewAllRequests } from '@/lib/permissions'
import { generateRequestId } from '@/lib/utils'
import { logAction } from '@/lib/logger'
import { notifySlack, newRequestMessage } from '@/lib/slack'

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

    const db = createServerClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')
    const department = searchParams.get('department')
    const assignedToMe = searchParams.get('assigned_to') === 'me'
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'created_at'
    const order = searchParams.get('order') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build query - select with joined manager name from staff
    let query = db
      .from('hc_requests')
      .select(
        '*, manager:staff!hc_requests_manager_email_fkey(name_surname, nickname)',
        { count: 'exact' }
      )

    // Role-based filtering
    if (!canViewAllRequests(user)) {
      // Managers only see their own requests
      query = query.eq('manager_email', user.email)
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (department) {
      query = query.eq('department', department)
    }
    if (assignedToMe) {
      query = query.eq('assigned_to', user.email)
    }
    if (search) {
      query = query.or(
        `request_id.ilike.%${search}%,position_select.ilike.%${search}%,position_new.ilike.%${search}%,replace_who.ilike.%${search}%`
      )
    }

    // Sort and paginate
    const ascending = order === 'asc'
    query = query.order(sort, { ascending }).range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      console.error('List requests error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map joined manager name and compute position_display
    const requests = (data || []).map((r: any) => ({
      ...r,
      manager_name: r.manager?.name_surname || r.manager?.nickname || null,
      position_display: r.request_type === 'Request New HC' ? r.position_new : r.position_select,
      manager: undefined,
    }))

    return NextResponse.json({
      data: requests,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error('GET /api/requests error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const db = createServerClient()

    const requestId = await generateRequestId()

    const insertData = {
      request_id: requestId,
      manager_email: user.email,
      department: body.department || user.department,
      request_type: body.request_type,
      position_select: body.position_select || null,
      position_new: body.position_new || null,
      replace_who: body.replace_who || null,
      last_working_date: body.last_working_date || null,
      job_grade: body.job_grade || null,
      requirements_comment: body.requirements_comment || null,
      jd_file_url: body.jd_file_url || null,
      status: 'Open' as const,
    }

    const { data, error } = await db
      .from('hc_requests')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Create request error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log action
    await logAction({
      requestId: requestId,
      action: 'Submitted',
      actionBy: user.email,
      toStatus: 'Open',
    })

    // Slack notification
    const positionDisplay =
      body.request_type === 'Request New HC' ? body.position_new : body.position_select
    const message = newRequestMessage({
      department: insertData.department,
      position: positionDisplay || '-',
      managerName: user.name_surname,
      jobGrade: body.job_grade,
    })
    notifySlack(message).catch(console.error)

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('POST /api/requests error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
