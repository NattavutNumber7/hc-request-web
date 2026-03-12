'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { FileText, ExternalLink, Search } from 'lucide-react'
import { useAuth } from '@/lib/context'
import { supabase } from '@/lib/supabase'
import type { HCRequest } from '@/types'
import Layout from '@/components/layout/Layout'
import StatusBadge from '@/components/requests/StatusBadge'

export default function JdFilesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [requests, setRequests] = useState<HCRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [user, authLoading, router])

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const res = await fetch('/api/requests?limit=9999', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) throw new Error('Failed to load requests')

      const json = await res.json()
      // Filter only those with JD files
      const withJd = (json.data || []).filter(
        (r: HCRequest) => r.jd_file_url && r.jd_file_url.trim() !== ''
      )
      setRequests(withJd)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3eae3]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#008065] border-t-transparent" />
      </div>
    )
  }

  if (!user) return null

  // Filter by search
  const filtered = requests.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    const posDisplay = r.position_new || r.position_select || ''
    return (
      r.request_id.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      posDisplay.toLowerCase().includes(q) ||
      (r.manager_name || r.manager_email || '').toLowerCase().includes(q)
    )
  })

  return (
    <Layout user={user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">JD Files</h1>
            <p className="mt-1 text-sm text-gray-500">
              ไฟล์ Job Description ที่แนบมากับคำขอทั้งหมด ({filtered.length} ไฟล์)
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหา..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-[#008065] focus:outline-none focus:ring-2 focus:ring-[#008065]/30 sm:w-72"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-sm">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">
              {search ? 'ไม่พบไฟล์ที่ค้นหา' : 'ยังไม่มีไฟล์ JD'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Request
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      แผนก
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      ตำแหน่ง
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      สถานะ
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      วันที่
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      ไฟล์
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((r) => {
                    const posDisplay = r.position_new || r.position_select || '-'
                    // Extract filename from URL
                    const fileName = r.jd_file_url
                      ? decodeURIComponent(r.jd_file_url.split('/').pop() || 'JD File')
                      : 'JD File'

                    return (
                      <tr
                        key={r.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => router.push(`/requests/${r.request_id}`)}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-[#008065]">
                          {r.request_id}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                          {r.department}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {posDisplay}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                          {format(new Date(r.created_at), 'd MMM yy', { locale: th })}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <a
                            href={r.jd_file_url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-sm text-[#008065] hover:underline"
                          >
                            <FileText className="h-4 w-4" />
                            <span className="max-w-[150px] truncate">{fileName}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
