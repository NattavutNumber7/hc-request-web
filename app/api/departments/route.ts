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

    const db = createServerClient()
    const { data, error } = await db
      .from('positions')
      .select('department')
      .order('department', { ascending: true })

    if (error) {
      console.error('Fetch departments error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Extract distinct departments
    const departments = [...new Set((data || []).map((row: any) => row.department))].filter(Boolean)

    return NextResponse.json({ data: departments })
  } catch (error) {
    console.error('GET /api/departments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
