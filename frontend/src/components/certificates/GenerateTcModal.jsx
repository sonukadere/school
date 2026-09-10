import React, { useState, useEffect } from 'react'
import { FileText, CheckCircle2, X } from 'lucide-react'
import Button from '../common/Button'
import Input from '../common/Input'
import Select from '../common/Select'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'

export default function GenerateTcModal({ open, onClose, student: initialStudent, students = [], onGenerated }) {
  const { showToast } = useToast()
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudent?.id || '')
  const [leavingDate, setLeavingDate] = useState(new Date().toISOString().split('T')[0])
  const [reason, setReason] = useState('Parent Transfer / Higher Studies')
  const [conduct, setConduct] = useState('Good')
  const [resultStatus, setResultStatus] = useState('PASS')
  const [remarks, setRemarks] = useState('Promoted to higher class with good conduct.')
  const [status, setStatus] = useState('GENERATED')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialStudent?.id) {
      setSelectedStudentId(initialStudent.id)
    } else if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id)
    }
  }, [initialStudent, students])

  const student = students.find((s) => s.id === selectedStudentId) || initialStudent

  if (!open || (!student && students.length === 0)) return null

  const studentDisplayName = student
    ? student.fullName || `${student.firstName} ${student.lastName || ''}`.trim()
    : 'Select Student'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!student?.id) {
      showToast('Please select a student.', 'warning')
      return
    }
    setLoading(true)

    try {
      const payload = {
        studentId: student.id,
        leavingDate: new Date(leavingDate),
        reason,
        conduct,
        resultStatus,
        remarks,
        status,
      }

      const tc = await api.createTransferCertificate(payload)
      showToast(`Transfer Certificate ${tc.tcNumber} created successfully!`, 'success')
      onClose()
      if (onGenerated) onGenerated(tc)
    } catch (err) {
      showToast(err.message || 'Failed to generate transfer certificate.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[calc(100dvh-1.5rem)] flex flex-col overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 truncate">Generate Transfer Certificate</h3>
              <p className="text-xs text-slate-500 truncate">For {studentDisplayName} ({student?.id || student?.studentId || ''})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors shrink-0 ml-2"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto min-h-0">
          {students.length > 0 && (
            <Select
              label="Select Student by Name"
              value={student?.id || ''}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              options={students.map((s) => ({
                value: s.id,
                label: `${s.fullName || `${s.firstName} ${s.lastName || ''}`.trim()} (${s.studentId || s.id})`,
              }))}
              required
            />
          )}

          {student && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2.5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">Student Name</span>
                  <span className="font-bold text-slate-900 truncate block">{studentDisplayName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Student ID</span>
                  <span className="font-semibold text-slate-800">{student.studentId || student.id}</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block text-[11px]">Class</span>
                  <span className="font-semibold text-slate-800">
                    {student.className || (student.class ? `${student.class.name} - ${student.class.section}` : 'Class 10')}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border-t border-slate-200/60 pt-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">Father's Name</span>
                  <span className="font-semibold text-slate-800 truncate block">{student.fatherName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Mother's Name</span>
                  <span className="font-semibold text-slate-800 truncate block">{student.motherName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Roll Number</span>
                  <span className="font-semibold text-slate-800">#{student.rollNumber || '—'}</span>
                </div>
              </div>
            </div>
          )}

          <Input
            label="Date of Leaving"
            type="date"
            value={leavingDate}
            onChange={(e) => setLeavingDate(e.target.value)}
            required
          />

          <Input
            label="Reason for Leaving"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Relocating / Higher Studies"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Select
              label="General Conduct"
              value={conduct}
              onChange={(e) => setConduct(e.target.value)}
              options={[
                { value: 'Good', label: 'Good' },
                { value: 'Very Good', label: 'Very Good' },
                { value: 'Exemplary', label: 'Exemplary' },
                { value: 'Satisfactory', label: 'Satisfactory' },
              ]}
            />

            <Select
              label="Annual Result"
              value={resultStatus}
              onChange={(e) => setResultStatus(e.target.value)}
              options={[
                { value: 'PASS', label: 'PASS / Promoted' },
                { value: 'PROMOTED', label: 'PROMOTED' },
                { value: 'FAIL', label: 'FAIL' },
                { value: 'COMPARTMENT', label: 'COMPARTMENT' },
              ]}
            />
          </div>

          <Input
            label="Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional remarks"
          />

          <Select
            label="Initial Certificate Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'GENERATED', label: 'GENERATED (Official & Ready)' },
              { value: 'APPROVED', label: 'APPROVED' },
              { value: 'PENDING', label: 'PENDING (Awaiting Review)' },
              { value: 'DRAFT', label: 'DRAFT' },
            ]}
          />

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button variant="primary" type="submit" leftIcon={CheckCircle2} loading={loading} className="w-full sm:w-auto">
              Generate Certificate
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
