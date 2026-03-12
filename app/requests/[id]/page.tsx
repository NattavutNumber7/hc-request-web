'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { ArrowLeft, Pencil, Trash2, FileText, ExternalLink } from 'lucide-react'
import { useAuth } from '@/lib/context'
import { supabase } from '@/lib/supabase'
import {
  canEditRequest,
  canCancelRequest,
  canAssign,
  canChangeStatus,
} from '@/lib/permissions'
import type { HCRequest, HCLog, User } from '@/types'
import Layout from '@/components/layout/Layout'
import StatusBadge from '@/components/requests/StatusBadge'
import AssignButton from '@/components/requests/AssignButton'
import StatusChanger from '@/components/requests/StatusChanger'
import LogTimeline from '@/components/logs/LogTimeline'

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [request, setRequest] = useState<HCRequest | null>(null)
  const [logs, setLogs] = useState<HCLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [user, authLoading, router])

  const fetchData = useCallback(async () => {
    if (!user || !id) return
    setLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const headers = { Authorization: `Bearer ${session.access_token}` }

      const [reqRes, logRes] = await Promise.all([
        fetch(`/api/requests/${id}`, { headers }),
        fetch(`/api/requests/${id}/logs`, { headers }),
      ])

      if (!reqRes.ok) {
        const data = await reqRes.json().catch(() => ({}))
        throw new Error(data.error || 'ไม่สามารถโหลดข้อมูลได้')
      }

      const reqJson = await reqRes.json()
      setRequest(reqJson.data)

      if (logRes.ok) {
        const logJson = await logRes.json()
        setLogs(logJson.data || [])
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }, [user, id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCancel = async () => {
    if (!request) return
    if (!confirm('คุณต้องการยกเลิกคำขอนี้ใช่หรือไม่?')) return

    setCancelling(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/requests/${request.request_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token || ''}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'ไม่สามารถยกเลิกได้')
      }
      fetchData()
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาด')
    } finally {
      setCancelling(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3eae3]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#008065] border-t-transparent" />
      </div>
    )
  }

  if (!user) return null

  if (error) {
    return (
      <Layout user={user}>
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-sm text-[#008065] hover:underline"
          >
            ← กลับ
          </button>
        </div>
      </Layout>
    )
  }

  if (!request) return null

  const positionDisplay = request.position_new || request.position_select || '-'
  const showEdit = canEditRequest(user, request)
  const showCancel = canCancelRequest(user, request)
  const showAssign = canAssign(user, request)
  const showStatusChanger = canChangeStatus(user)

  return (
    <Layout user={user}>
      <div className="space-y-6">
        {/* Back + Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับ
          </button>

          <div className="flex flex-wrap gap-2">
            {showAssign && (
              <AssignButton requestId={request.request_id} onAssigned={fetchData} />
            )}
            {showStatusChanger && request.status !== 'Cancelled' && request.status !== 'Closed' && (
              <StatusChanger
                requestId={request.request_id}
                currentStatus={request.status}
                onStatusChanged={fetchData}
              />
            )}
            {showEdit && (
              <button
                onClick={() => router.push(`/requests/${request.request_id}/edit`)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Pencil className="h-4 w-4" />
                แก้ไข
              </button>
            )}
            {showCancel && request.status !== 'Cancelled' && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {cancelling ? 'กำลังยกเลิก...' : 'ยกเลิก'}
              </button>
            )}
          </div>
        </div>

        {/* Header card */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">{request.request_id}</h1>
                <StatusBadge status={request.status} />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                สร้างเมื่อ{' '}
                {format(new Date(request.created_at), 'd MMMM yyyy HH:mm', { locale: th })}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                {request.request_type}
              </span>
            </div>
          </div>
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Request Info */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              ข้อมูลคำขอ
            </h2>
            <dl className="space-y-4">
              <InfoRow label="แผนก" value={request.department} />
              <InfoRow label="ตำแหน่ง" value={positionDisplay} />
              <InfoRow label="Job Grade" value={request.job_grade || '-'} />
              <InfoRow label="ผู้ขอ" value={request.manager_name || request.manager_email} />

              {request.request_type === 'Replacement' && (
                <>
                  <InfoRow label="แทนที่" value={request.replace_who || '-'} />
                  <InfoRow
                    label="วันสุดท้ายของคนเดิม"
                    value={
                      request.last_working_date
                        ? format(new Date(request.last_working_date), 'd MMM yyyy', { locale: th })
                        : '-'
                    }
                  />
                </>
              )}

              {request.requirements_comment && (
                <div>
                  <dt className="text-xs font-medium text-gray-500">Requirements / Comment</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                    {request.requirements_comment}
                  </dd>
                </div>
              )}

              {request.jd_file_url && (
                <div>
                  <dt className="text-xs font-medium text-gray-500">JD File</dt>
                  <dd className="mt-1">
                    <a
                      href={request.jd_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-[#008065] hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      เปิดไฟล์ JD
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Right: Assignment & Status info */}
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                การมอบหมาย
              </h2>
              <dl className="space-y-4">
                <InfoRow
                  label="ผู้รับผิดชอบ"
                  value={
                    request.assigned_name ||
                    request.assigned_to ||
                    '⏳ ยังไม่มีคนรับ'
                  }
                />
                <InfoRow
                  label="วันที่รับ"
                  value={
                    request.assigned_date
                      ? format(new Date(request.assigned_date), 'd MMM yyyy HH:mm', { locale: th })
                      : '-'
                  }
                />
                <InfoRow
                  label="อัปเดตล่าสุด"
                  value={format(new Date(request.updated_at), 'd MMM yyyy HH:mm', { locale: th })}
                />
              </dl>
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            ประวัติ (Audit Log)
          </h2>
          <LogTimeline logs={logs} />
        </div>
      </div>
    </Layout>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
    </div>
  )
}
