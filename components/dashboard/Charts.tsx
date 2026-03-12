'use client'

import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { STATUS_COLORS, STATUS_LIST } from '@/types'
import type { HCRequest, Status } from '@/types'

interface ChartsProps {
  requests: HCRequest[]
}

const DEPARTMENT_COLORS = [
  '#008065',
  '#00ce7c',
  '#ff6600',
  '#f5ce3e',
  '#3b82f6',
  '#8b5cf6',
  '#ef4444',
  '#f97316',
  '#6b7280',
  '#ec4899',
]

export default function Charts({ requests }: ChartsProps) {
  // --- By Status ---
  const byStatus = useMemo(() => {
    const counts: Record<string, number> = {}
    STATUS_LIST.forEach((s) => (counts[s] = 0))
    requests.forEach((r) => {
      counts[r.status] = (counts[r.status] ?? 0) + 1
    })
    return STATUS_LIST.map((s) => ({
      name: s,
      count: counts[s],
      fill: STATUS_COLORS[s],
    }))
  }, [requests])

  // --- By Department ---
  const byDepartment = useMemo(() => {
    const counts: Record<string, number> = {}
    requests.forEach((r) => {
      counts[r.department] = (counts[r.department] ?? 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [requests])

  // --- Over Time (monthly) ---
  const overTime = useMemo(() => {
    const counts: Record<string, number> = {}
    requests.forEach((r) => {
      const month = format(parseISO(r.created_at), 'yyyy-MM')
      counts[month] = (counts[month] ?? 0) + 1
    })
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month: format(parseISO(`${month}-01`), 'MMM yyyy'),
        count,
      }))
  }, [requests])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Bar Chart - By Status */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          คำขอแยกตามสถานะ
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={byStatus}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              angle={-30}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" name="จำนวน" radius={[4, 4, 0, 0]}>
              {byStatus.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart - By Department */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          คำขอแยกตามแผนก
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={byDepartment}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              labelLine={{ strokeWidth: 1 }}
            >
              {byDepartment.map((_, i) => (
                <Cell
                  key={i}
                  fill={DEPARTMENT_COLORS[i % DEPARTMENT_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Line Chart - Over Time */}
      <div className="bg-white rounded-lg shadow-sm p-4 lg:col-span-2 xl:col-span-1">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          คำขอรายเดือน
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={overTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              angle={-30}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              name="จำนวนคำขอ"
              stroke="#008065"
              strokeWidth={2}
              dot={{ fill: '#008065', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
