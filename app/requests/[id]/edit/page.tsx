'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context'
import { supabase } from '@/lib/supabase'
import { canEditRequest } from '@/lib/permissions'
import type { HCRequest, Position } from '@/types'
import Layout from '@/components/layout/Layout'
import RequestForm from '@/components/requests/RequestForm'

export default function EditRequestPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [request, setRequest] = useState<HCRequest | null>(null)
  const [departments, setDepartments] = useState<string[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [user, authLoading, router])

  // Fetch request data + departments
  const fetchData = useCallback(async () => {
    if (!user || !id) return
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const headers = { Authorization: `Bearer ${session.access_token}` }

      const [reqRes, deptRes] = await Promise.all([
        fetch(`/api/requests/${id}`, { headers }),
        fetch('/api/departments', { headers }),
      ])

      if (!reqRes.ok) {
        throw new Error('ไม่สามารถโหลดข้อมูลได้')
      }

      const reqJson = await reqRes.json()
      const req = reqJson.data as HCRequest

      // Permission check
      if (!canEditRequest(user, req)) {
        router.replace(`/requests/${id}`)
        return
      }

      setRequest(req)

      if (deptRes.ok) {
        const deptJson = await deptRes.json()
        setDepartments(deptJson.data || [])
      }

      // Fetch positions for current department
      const dept = req.department || user.department
      const posRes = await fetch(
        `/api/positions?department=${encodeURIComponent(dept)}`,
        { headers }
      )
      if (posRes.ok) {
        const posJson = await posRes.json()
        setPositions(posJson.data || [])
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }, [user, id, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDepartmentChange = async (dept: string) => {
    if (!dept) {
      setPositions([])
      return
    }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return
    const res = await fetch(`/api/positions?department=${encodeURIComponent(dept)}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (res.ok) {
      const json = await res.json()
      setPositions(json.data || [])
    }
  }

  const handleSubmit = async (formData: Record<string, any>) => {
    if (!request) return
    setSubmitting(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')

      const res = await fetch(`/api/requests/${request.request_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'ไม่สามารถแก้ไขได้')
      }

      router.push(`/requests/${request.request_id}`)
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3eae3]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#008065] border-t-transparent" />
      </div>
    )
  }

  if (!user || !request) return null

  return (
    <Layout user={user}>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            กลับ
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            แก้ไขคำขอ {request.request_id}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            แก้ไขข้อมูลคำขอ (เฉพาะสถานะ Open เท่านั้น)
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        {/* Form */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <RequestForm
            user={user}
            departments={departments}
            positions={positions}
            initialData={request}
            onDepartmentChange={handleDepartmentChange}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        </div>
      </div>
    </Layout>
  )
}
