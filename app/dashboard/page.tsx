'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context'
import { supabase } from '@/lib/supabase'
import { canViewDashboard } from '@/lib/permissions'
import type { HCRequest, Status } from '@/types'
import { STATUS_COLORS, STATUS_LIST } from '@/types'
import Layout from '@/components/layout/Layout'
import Charts from '@/components/dashboard/Charts'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [requests, setRequests] = useState<HCRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
    if (!authLoading && user && !canViewDashboard(user)) {
      router.replace('/requests')
    }
  }, [user, authLoading, router])

  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      // Fetch all requests (no pagination limit for dashboard)
      const res = await fetch('/api/requests?limit=9999', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) throw new Error('Failed to load data')

      const json = await res.json()
      setRequests(json.data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3eae3]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#008065] border-t-transparent" />
      </div>
    )
  }

  if (!user) return null

  // Summary cards
  const total = requests.length
  const statusCounts: Record<string, number> = {}
  STATUS_LIST.forEach((s) => (statusCounts[s] = 0))
  requests.forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1
  })

  const activeCount =
    (statusCounts['Open'] || 0) +
    (statusCounts['Assigned'] || 0) +
    (statusCounts['Recruiting'] || 0) +
    (statusCounts['Interviewing'] || 0) +
    (statusCounts['Offering'] || 0)

  return (
    <Layout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">ภาพรวมคำขอ HC ทั้งหมด</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <SummaryCard label="ทั้งหมด" count={total} color="#008065" />
          <SummaryCard label="กำลังดำเนินการ" count={activeCount} color="#3b82f6" />
          <SummaryCard label="On Hold" count={statusCounts['On Hold'] || 0} color="#6b7280" />
          <SummaryCard label="Closed" count={statusCounts['Closed'] || 0} color="#008065" />
          <SummaryCard label="Cancelled" count={statusCounts['Cancelled'] || 0} color="#ef4444" />
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {STATUS_LIST.map((status) => (
            <button
              key={status}
              onClick={() => router.push(`/requests?status=${encodeURIComponent(status)}`)}
              className="rounded-lg bg-white p-3 shadow-sm text-center hover:shadow-md transition-shadow"
            >
              <div
                className="mx-auto mb-1 h-2 w-8 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[status] }}
              />
              <p className="text-lg font-bold text-gray-900">{statusCounts[status] || 0}</p>
              <p className="text-xs text-gray-500">{status}</p>
            </button>
          ))}
        </div>

        {/* Charts */}
        {requests.length > 0 ? (
          <Charts requests={requests} />
        ) : (
          <div className="rounded-lg bg-white p-12 text-center shadow-sm">
            <p className="text-gray-500">ยังไม่มีข้อมูลสำหรับแสดงกราฟ</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

function SummaryCard({
  label,
  count,
  color,
}: {
  label: string
  count: number
  color: string
}) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color }}>
        {count}
      </p>
    </div>
  )
}
