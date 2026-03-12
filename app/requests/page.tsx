'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context'
import { canViewAllRequests } from '@/lib/permissions'
import { supabase } from '@/lib/supabase'
import { HCRequest, Status, STATUS_LIST } from '@/types'
import Layout from '@/components/layout/Layout'
import RequestTable from '@/components/requests/RequestTable'
import FilterBar from '@/components/ui/FilterBar'

interface RequestsResponse {
  data: HCRequest[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function RequestsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [requests, setRequests] = useState<HCRequest[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('')
  const [searchFilter, setSearchFilter] = useState<string>('')
  const [departments, setDepartments] = useState<string[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  // Fetch departments for filter dropdown
  useEffect(() => {
    if (!user) return
    const fetchDepartments = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const res = await fetch('/api/departments', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setDepartments(json.data || [])
      }
    }
    fetchDepartments()
  }, [user])

  const fetchRequests = useCallback(async () => {
    if (!user) return
    setFetching(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (statusFilter) params.set('status', statusFilter)
      if (departmentFilter) params.set('department', departmentFilter)
      if (searchFilter) params.set('search', searchFilter)

      const res = await fetch(`/api/requests?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!res.ok) {
        throw new Error('Failed to fetch requests')
      }

      const json: RequestsResponse = await res.json()
      setRequests(json.data)
      setTotal(json.total)
      setTotalPages(json.totalPages)
    } catch (err: any) {
      setError(err.message || 'Failed to load requests')
    } finally {
      setFetching(false)
    }
  }, [user, page, statusFilter, departmentFilter, searchFilter])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [statusFilter, departmentFilter, searchFilter])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3eae3]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#008065] border-t-transparent" />
      </div>
    )
  }

  if (!user) return null

  const isAdmin = canViewAllRequests(user)
  const title = isAdmin ? 'All Requests' : 'My Requests'

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {total} request{total !== 1 ? 's' : ''} found
            </p>
          </div>
          <button
            onClick={() => router.push('/requests/new')}
            className="inline-flex items-center gap-2 rounded-lg bg-[#008065] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#006b55]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Request
          </button>
        </div>

        {/* Filters */}
        <FilterBar
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          departmentFilter={departmentFilter}
          onDepartmentChange={setDepartmentFilter}
          searchFilter={searchFilter}
          onSearchChange={setSearchFilter}
          departments={departments}
          statusList={STATUS_LIST}
          showDepartment={isAdmin}
        />

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Table / Loading */}
        {fetching ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-white shadow-sm" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-sm">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-4 text-gray-500">No requests found</p>
          </div>
        ) : (
          <RequestTable requests={requests} user={user} />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
