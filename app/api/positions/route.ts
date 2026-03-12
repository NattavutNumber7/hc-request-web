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

    const { searchParams } = new URL(request.url)
    const department = searchParams.get('department')

    if (!department) {
      return NextResponse.json(
        { error: 'department query parameter is required' },
        { status: 400 }
      )
    }

    const db = createServerClient()
    const { data, error } = await db
      .from('positions')
      .select('*')
      .eq('department', department)
      .order('position', { ascending: true })

    if (error) {
      console.error('Fetch positions error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('GET /api/positions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
