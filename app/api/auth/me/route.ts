import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'

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
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('GET /api/auth/me error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
