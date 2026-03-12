'use client'

import { useState } from 'react'
import { Hand, Loader2 } from 'lucide-react'

interface AssignButtonProps {
  requestId: string
  onAssigned: () => void
}

export default function AssignButton({ requestId, onAssigned }: AssignButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleAssign = async () => {
    if (!confirm('คุณต้องการรับเคสนี้ใช่หรือไม่?')) return

    setLoading(true)
    try {
      const res = await fetch(`/api/requests/${requestId}/assign`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'ไม่สามารถรับเคสได้')
      }
      onAssigned()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleAssign}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white
        bg-[#008065] hover:bg-[#006a54] rounded-lg transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Hand className="w-4 h-4" />
      )}
      {loading ? 'กำลังรับเคส...' : '✋ รับเคสนี้'}
    </button>
  )
}
