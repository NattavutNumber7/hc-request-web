'use client'

import { STATUS_LIST } from '@/types'
import type { Status } from '@/types'
import SearchBox from './SearchBox'

export interface FilterValues {
  status: Status | ''
  department: string
  search: string
}

interface FilterBarProps {
  filters: FilterValues
  departments: string[]
  onChange: (filters: FilterValues) => void
}

export default function FilterBar({
  filters,
  departments,
  onChange,
}: FilterBarProps) {
  const update = (partial: Partial<FilterValues>) => {
    onChange({ ...filters, ...partial })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status */}
      <select
        value={filters.status}
        onChange={(e) => update({ status: e.target.value as Status | '' })}
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white
          focus:outline-none focus:ring-2 focus:ring-[#008065]/30 focus:border-[#008065]"
      >
        <option value="">สถานะทั้งหมด</option>
        {STATUS_LIST.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* Department */}
      <select
        value={filters.department}
        onChange={(e) => update({ department: e.target.value })}
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white
          focus:outline-none focus:ring-2 focus:ring-[#008065]/30 focus:border-[#008065]"
      >
        <option value="">แผนกทั้งหมด</option>
        {departments.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      {/* Search */}
      <div className="w-full sm:w-64">
        <SearchBox
          value={filters.search}
          onChange={(v) => update({ search: v })}
          placeholder="ค้นหา ตำแหน่ง, Request ID..."
        />
      </div>
    </div>
  )
}
