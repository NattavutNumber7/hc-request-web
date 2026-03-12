import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

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

    // Only PE can list all staff
    if (user.role !== 'people_experience') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const db = createServerClient()
    const { searchParams } = new URL(request.url)
    const department = searchParams.get('department')

    let query = db
      .from('staff')
      .select('*')
      .order('name_surname', { ascending: true })

    if (department) {
      query = query.eq('department', department)
    }

    const { data, error } = await query

    if (error) {
      console.error('Fetch staff error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('GET /api/staff error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
