'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context'
import { supabase } from '@/lib/supabase'
import { Position } from '@/types'
import Layout from '@/components/layout/Layout'
import RequestForm from '@/components/requests/RequestForm'

export default function NewRequestPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [departments, setDepartments] = useState<string[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  // Fetch departments
  useEffect(() => {
    if (!user) return
    const fetchDeps = async () => {
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
    fetchDeps()
  }, [user])

  // Fetch positions when department selected (handled by form via callback)
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
    setSubmitting(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to create request')
      }

      const json = await res.json()
      const requestId = json.data?.request_id
      router.push(requestId ? `/requests/${requestId}` : '/requests')
    } catch (err: any) {
      setError(err.message || 'Failed to create request')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3eae3]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#008065] border-t-transparent" />
      </div>
    )
  }

  if (!user) return null

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
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">New HC Request</h1>
          <p className="mt-1 text-sm text-gray-500">
            Fill in the details below to submit a new headcount request.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <RequestForm
            user={user}
            departments={departments}
            positions={positions}
            onDepartmentChange={handleDepartmentChange}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        </div>
      </div>
    </Layout>
  )
}
