'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

interface SearchBoxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchBox({
  value,
  onChange,
  placeholder = 'ค้นหา...',
}: SearchBoxProps) {
  const [internal, setInternal] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setInternal(value)
  }, [value])

  const handleChange = (val: string) => {
    setInternal(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onChange(val)
    }, 300)
  }

  const handleClear = () => {
    setInternal('')
    onChange('')
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={internal}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white
          focus:outline-none focus:ring-2 focus:ring-[#008065]/30 focus:border-[#008065]
          placeholder:text-gray-400"
      />
      {internal && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
