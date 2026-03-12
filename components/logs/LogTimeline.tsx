'use client'

import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { STATUS_COLORS } from '@/types'
import type { HCLog, Status } from '@/types'

interface LogTimelineProps {
  logs: HCLog[]
}

export default function LogTimeline({ logs }: LogTimelineProps) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4">ยังไม่มีประวัติ</p>
    )
  }

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-200" />

      <div className="space-y-6">
        {logs.map((log, idx) => {
          const dotColor = log.to_status
            ? STATUS_COLORS[log.to_status as Status] ?? '#6b7280'
            : '#6b7280'

          return (
            <div key={log.id ?? idx} className="relative">
              {/* Dot */}
              <div
                className="absolute -left-6 top-1 w-[18px] h-[18px] rounded-full border-2 border-white"
                style={{ backgroundColor: dotColor }}
              />

              <div className="bg-white rounded-lg border border-gray-100 p-3">
                {/* Action */}
                <p className="text-sm font-medium text-gray-800">{log.action}</p>

                {/* Status change */}
                {log.from_status && log.to_status && (
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="inline-block px-2 py-0.5 text-xs text-white rounded-full"
                      style={{
                        backgroundColor:
                          STATUS_COLORS[log.from_status as Status] ?? '#6b7280',
                      }}
                    >
                      {log.from_status}
                    </span>
                    <span className="text-xs text-gray-400">&rarr;</span>
                    <span
                      className="inline-block px-2 py-0.5 text-xs text-white rounded-full"
                      style={{
                        backgroundColor:
                          STATUS_COLORS[log.to_status as Status] ?? '#6b7280',
                      }}
                    >
                      {log.to_status}
                    </span>
                  </div>
                )}

                {/* Comment */}
                {log.comment && (
                  <p className="mt-1 text-sm text-gray-600 italic">&ldquo;{log.comment}&rdquo;</p>
                )}

                {/* Meta */}
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                  <span>{log.action_by_name ?? log.action_by}</span>
                  <span>&middot;</span>
                  <span>
                    {format(new Date(log.action_date), 'd MMM yyyy HH:mm', {
                      locale: th,
                    })}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
