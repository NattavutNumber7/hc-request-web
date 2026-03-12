'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { ArrowUpDown } from 'lucide-react'
import Table, { Column } from '@/components/ui/Table'
import StatusBadge from './StatusBadge'
import type { HCRequest } from '@/types'

type SortKey = 'request_id' | 'department' | 'request_type' | 'status' | 'job_grade' | 'created_at'
type SortDir = 'asc' | 'desc'

interface RequestTableProps {
  requests: HCRequest[]
  loading?: boolean
  onRowClick?: (req: HCRequest) => void
}

export default function RequestTable({
  requests,
  loading,
  onRowClick,
}: RequestTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    const copy = [...requests]
    copy.sort((a, b) => {
      const aVal = (a[sortKey] ?? '') as string
      const bVal = (b[sortKey] ?? '') as string
      const cmp = aVal.localeCompare(bVal)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [requests, sortKey, sortDir])

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <button
      type="button"
      onClick={() => toggleSort(field)}
      className="inline-flex items-center gap-1 hover:text-[#008065] transition-colors"
    >
      {label}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  )

  const columns: Column<HCRequest>[] = [
    {
      key: 'request_id',
      label: 'Request ID',
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-[#008065]">
          {r.request_id}
        </span>
      ),
    },
    {
      key: 'position_display',
      label: 'Position',
      render: (r) => (
        <span className="text-sm">
          {r.position_display ?? r.position_select ?? r.position_new ?? '-'}
        </span>
      ),
    },
    {
      key: 'department',
      label: 'Department',
    },
    {
      key: 'request_type',
      label: 'Type',
      render: (r) => (
        <span className="text-xs">{r.request_type}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'job_grade',
      label: 'JG',
      render: (r) => (
        <span className="text-xs font-medium">{r.job_grade ?? '-'}</span>
      ),
    },
    {
      key: 'assigned_to',
      label: 'Assigned To',
      render: (r) => (
        <span className="text-sm">{r.assigned_name ?? r.assigned_display ?? r.assigned_to ?? '-'}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (r) => (
        <span className="text-xs text-gray-500">
          {format(new Date(r.created_at), 'd MMM yyyy', { locale: th })}
        </span>
      ),
    },
  ]

  // Override labels with sortable headers
  const columnsWithSort: Column<HCRequest>[] = columns.map((col) => {
    const sortableKeys: SortKey[] = [
      'request_id',
      'department',
      'request_type',
      'status',
      'job_grade',
      'created_at',
    ]
    if (sortableKeys.includes(col.key as SortKey)) {
      return {
        ...col,
        label: col.label, // label stays as string for the Table header
      }
    }
    return col
  })

  return (
    <div>
      {/* Sort controls above table */}
      <div className="flex flex-wrap items-center gap-3 mb-2 text-xs text-gray-500">
        <span>เรียงตาม:</span>
        <SortHeader label="Request ID" field="request_id" />
        <SortHeader label="Department" field="department" />
        <SortHeader label="Type" field="request_type" />
        <SortHeader label="Status" field="status" />
        <SortHeader label="JG" field="job_grade" />
        <SortHeader label="Created" field="created_at" />
      </div>

      <Table<HCRequest>
        columns={columnsWithSort}
        data={sorted}
        loading={loading}
        onRowClick={onRowClick}
      />
    </div>
  )
}
