'use client'

import { FormEvent, useState } from 'react'
import { Loader2 } from 'lucide-react'
import FileUpload from '@/components/ui/FileUpload'
import { JOB_GRADES } from '@/types'
import type { HCRequest, Position, Staff, User, RequestType } from '@/types'

interface RequestFormProps {
  initialData?: Partial<HCRequest>
  departments: string[]
  positions: Position[]
  staffList: Staff[]
  user: User
  onSubmit: (data: FormData) => Promise<void>
}

export default function RequestForm({
  initialData,
  departments,
  positions,
  staffList,
  user,
  onSubmit,
}: RequestFormProps) {
  const isCeo = user.role === 'ceo'
  const isEdit = !!initialData?.id

  const [requestType, setRequestType] = useState<RequestType>(
    initialData?.request_type ?? 'Replacement'
  )
  const [department, setDepartment] = useState(initialData?.department ?? user.department)
  const [positionSelect, setPositionSelect] = useState(initialData?.position_select ?? '')
  const [positionNew, setPositionNew] = useState(initialData?.position_new ?? '')
  const [replaceWho, setReplaceWho] = useState(initialData?.replace_who ?? '')
  const [lastWorkingDate, setLastWorkingDate] = useState(initialData?.last_working_date ?? '')
  const [jobGrade, setJobGrade] = useState(initialData?.job_grade ?? '')
  const [comment, setComment] = useState(initialData?.requirements_comment ?? '')
  const [jdFile, setJdFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Filter positions / staff by department
  const filteredPositions = positions.filter((p) => p.department === department)
  const filteredStaff = staffList.filter((s) => s.department === department)

  const validate = (): boolean => {
    const errs: Record<string, string> = {}

    if (!department) errs.department = 'กรุณาเลือกแผนก'
    if (!jobGrade) errs.jobGrade = 'กรุณาเลือก Job Grade'

    if (requestType === 'Replacement') {
      if (!positionSelect) errs.positionSelect = 'กรุณาเลือกตำแหน่ง'
      if (!replaceWho) errs.replaceWho = 'กรุณาเลือกพนักงานที่ต้องการทดแทน'
    } else {
      if (!positionNew) errs.positionNew = 'กรุณาระบุตำแหน่ง'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('request_type', requestType)
      fd.append('department', department)
      fd.append('job_grade', jobGrade)
      fd.append('requirements_comment', comment)

      if (requestType === 'Replacement') {
        fd.append('position_select', positionSelect)
        fd.append('replace_who', replaceWho)
        if (lastWorkingDate) fd.append('last_working_date', lastWorkingDate)
      } else {
        fd.append('position_new', positionNew)
      }

      if (jdFile) fd.append('jd_file', jdFile)

      await onSubmit(fd)
    } catch {
      // handled by parent
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#008065]/30 focus:border-[#008065]'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'
  const errorClass = 'text-xs text-red-500 mt-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Request Type */}
      <div>
        <label className={labelClass}>ประเภทคำขอ *</label>
        <div className="flex gap-4 mt-1">
          {(['Replacement', 'Request New HC'] as RequestType[]).map((t) => (
            <label
              key={t}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-colors ${
                requestType === t
                  ? 'border-[#008065] bg-[#008065]/5 text-[#008065]'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="request_type"
                value={t}
                checked={requestType === t}
                onChange={() => setRequestType(t)}
                className="accent-[#008065]"
              />
              <span className="text-sm font-medium">{t}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Department */}
      <div>
        <label className={labelClass}>แผนก *</label>
        {isCeo ? (
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className={inputClass}
          >
            <option value="">เลือกแผนก</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={department}
            readOnly
            className={`${inputClass} bg-gray-50`}
          />
        )}
        {errors.department && <p className={errorClass}>{errors.department}</p>}
      </div>

      {/* Replacement fields */}
      {requestType === 'Replacement' && (
        <>
          <div>
            <label className={labelClass}>ตำแหน่ง *</label>
            <select
              value={positionSelect}
              onChange={(e) => setPositionSelect(e.target.value)}
              className={inputClass}
            >
              <option value="">เลือกตำแหน่ง</option>
              {filteredPositions.map((p) => (
                <option key={p.id} value={p.position}>
                  {p.position}
                </option>
              ))}
            </select>
            {errors.positionSelect && (
              <p className={errorClass}>{errors.positionSelect}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>ทดแทนใคร *</label>
            <select
              value={replaceWho}
              onChange={(e) => setReplaceWho(e.target.value)}
              className={inputClass}
            >
              <option value="">เลือกพนักงาน</option>
              {filteredStaff.map((s) => (
                <option key={s.id} value={s.name_surname}>
                  {s.full_name ?? s.name_surname}
                  {s.nickname ? ` (${s.nickname})` : ''}
                </option>
              ))}
            </select>
            {errors.replaceWho && (
              <p className={errorClass}>{errors.replaceWho}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>วันทำงานวันสุดท้าย</label>
            <input
              type="date"
              value={lastWorkingDate}
              onChange={(e) => setLastWorkingDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </>
      )}

      {/* New HC fields */}
      {requestType === 'Request New HC' && (
        <div>
          <label className={labelClass}>ตำแหน่ง *</label>
          <input
            type="text"
            value={positionNew}
            onChange={(e) => setPositionNew(e.target.value)}
            placeholder="ระบุตำแหน่งที่ต้องการ"
            className={inputClass}
          />
          {errors.positionNew && (
            <p className={errorClass}>{errors.positionNew}</p>
          )}
        </div>
      )}

      {/* Job Grade */}
      <div>
        <label className={labelClass}>Job Grade *</label>
        <select
          value={jobGrade}
          onChange={(e) => setJobGrade(e.target.value)}
          className={inputClass}
        >
          <option value="">เลือก Job Grade</option>
          {JOB_GRADES.map((jg) => (
            <option key={jg} value={jg}>
              {jg}
            </option>
          ))}
        </select>
        {errors.jobGrade && <p className={errorClass}>{errors.jobGrade}</p>}
      </div>

      {/* Requirements */}
      <div>
        <label className={labelClass}>ความต้องการ / หมายเหตุ</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="รายละเอียดเพิ่มเติม..."
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* JD File */}
      <div>
        <label className={labelClass}>ไฟล์ Job Description (JD)</label>
        <FileUpload
          onFileSelected={setJdFile}
          currentUrl={initialData?.jd_file_url}
        />
      </div>

      {/* Submit */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white
            bg-[#008065] hover:bg-[#006a54] rounded-lg transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? 'บันทึกการแก้ไข' : 'ส่งคำขอ'}
        </button>
      </div>
    </form>
  )
}
