'use client'

import { useCallback, useRef, useState } from 'react'
import { Upload, FileText, X } from 'lucide-react'

interface FileUploadProps {
  onFileSelected: (file: File) => void
  currentUrl?: string
}

export default function FileUpload({ onFileSelected, currentUrl }: FileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name)
      onFileSelected(file)
    },
    [onFileSelected]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => setDragging(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const clearFile = () => {
    setFileName(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const hasFile = fileName || currentUrl

  return (
    <div>
      {hasFile ? (
        <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-gray-50">
          <FileText className="w-5 h-5 text-[#008065] shrink-0" />
          <span className="text-sm text-gray-700 truncate flex-1">
            {fileName ?? 'ไฟล์ JD ปัจจุบัน'}
          </span>
          {currentUrl && !fileName && (
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#008065] hover:underline shrink-0"
            >
              ดูไฟล์
            </a>
          )}
          <button
            type="button"
            onClick={clearFile}
            className="text-gray-400 hover:text-gray-600 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            dragging
              ? 'border-[#008065] bg-[#008065]/5'
              : 'border-gray-300 hover:border-[#008065]/50 bg-white'
          }`}
        >
          <Upload className="w-8 h-8 text-gray-400" />
          <p className="text-sm text-gray-600">
            ลากไฟล์มาวางที่นี่ หรือ{' '}
            <span className="text-[#008065] font-medium">คลิกเพื่อเลือกไฟล์</span>
          </p>
          <p className="text-xs text-gray-400">PDF, DOC, DOCX (สูงสุด 10MB)</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  )
}
