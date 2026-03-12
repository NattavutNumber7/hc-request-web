import { STATUS_COLORS } from '@/types'
import type { Status } from '@/types'

interface StatusBadgeProps {
  status: Status
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const bg = STATUS_COLORS[status] ?? '#6b7280'

  return (
    <span
      className="inline-block px-3 py-1 text-xs font-medium text-white rounded-full whitespace-nowrap"
      style={{ backgroundColor: bg }}
    >
      {status}
    </span>
  )
}
