'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { STATUS_COLORS } from '@/types'
import type { Status } from '@/types'

const STATUS_FLOW: Record<Status, Status[]> = {
  Open: ['Assigned', 'On Hold', 'Cancelled'],
  Assigned: ['Recruiting', 'On Hold', 'Cancelled'],
  Recruiting: ['Interviewing', 'On Hold', 'Cancelled'],
  Interviewing: ['Offering', 'Recruiting', 'On Hold', 'Cancelled'],
  Offering: ['Closed', 'Recruiting', 'On Hold', 'Cancelled'],
  'On Hold': ['Open', 'Assigned', 'Recruiting', 'Cancelled'],
  Cancelled: [],
  Closed: [],
}

interface StatusChangerProps {
  requestId: string
  currentStatus: Status
  onStatusChanged: () => void
}

export default function StatusChanger({
  requestId,
  currentStatus,
  onStatusChanged,
}: StatusChangerProps) {
  const [loading, setLoading] = useState(false)
  const nextStatuses = STATUS_FLOW[currentStatus] ?? []

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as Status
    if (!newStatus) return

    setLoading(true)
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'ไม่สามารถเปลี่ยนสถานะได้')
      }
      onStatusChanged()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  if (nextStatuses.length === 0) return null

  return (
    <div className="relative inline-flex items-center gap-2">
      {loading && <Loader2 className="w-4 h-4 animate-spin text-[#008065]" />}
      <select
        disabled={loading}
        defaultValue=""
        onChange={handleChange}
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white
          focus:outline-none focus:ring-2 focus:ring-[#008065]/30 focus:border-[#008065]
          disabled:opacity-50"
      >
        <option value="" disabled>
          เปลี่ยนสถานะ...
        </option>
        {nextStatuses.map((s) => (
          <option key={s} value={s} style={{ color: STATUS_COLORS[s] }}>
            {s}
          </option>
        ))}
      </select>
    </div>
  )
}
