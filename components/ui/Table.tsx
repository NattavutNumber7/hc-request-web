'use client'

import { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

export interface Column<T> {
  key: string
  label: string
  render?: (item: T) => ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (item: T) => void
  loading?: boolean
}

export default function Table<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  loading,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-white rounded-lg shadow-sm">
        <Loader2 className="w-6 h-6 animate-spin text-[#008065]" />
        <span className="ml-2 text-sm text-gray-500">กำลังโหลด...</span>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 bg-white rounded-lg shadow-sm">
        <span className="text-sm text-gray-500">ไม่พบข้อมูล</span>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((item, idx) => (
            <tr
              key={(item as Record<string, unknown>).id as string ?? idx}
              onClick={() => onRowClick?.(item)}
              className={`transition-colors ${
                onRowClick
                  ? 'cursor-pointer hover:bg-[#f3eae3]/50'
                  : 'hover:bg-gray-50'
              }`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                  {col.render
                    ? col.render(item)
                    : (item[col.key] as ReactNode) ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
