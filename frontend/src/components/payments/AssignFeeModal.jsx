import { useState, useEffect, useMemo } from 'react'
import {
  Layers,
  Users,
  GraduationCap,
  Calendar,
  Building2,
  BookOpen,
  CheckCircle2,
  Info,
} from 'lucide-react'
import Modal from '../common/Modal'
import Input from '../common/Input'
import Select from '../common/Select'
import Button from '../common/Button'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { formatCurrency, formatDate } from '../../utils/helpers'

export default function AssignFeeModal({
  open,
  onClose,
  initialStructure = null,
  onAssigned,
}) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.isSuperAdmin

  // Dynamic database lists
  const [schools, setSchools] = useState([])
  const [selectedSchoolId, setSelectedSchoolId] = useState('')
  const [academicYear, setAcademicYear] = useState('2026-2027')
  const [structures, setStructures] = useState([])
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [loadingData, setLoadingData] = useState(false)

  // Assignment mode & selection
  const [assignMode, setAssignMode] = useState('class') // 'class' | 'student'
  const [selectedStructureId, setSelectedStructureId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [studentFilterClassId, setStudentFilterClassId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [discount, setDiscount] = useState('0')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Fetch dynamic database records on mount/open
  useEffect(() => {
    if (!open) return
    setLoadingData(true)

    const promises = [
      api.getFeeStructures(),
      api.getClasses(),
      api.getStudents(),
      api.getSettings().catch(() => null),
    ]

    if (isSuperAdmin) {
      promises.push(api.getPaymentSchools().catch(() => []))
    }

    Promise.all(promises)
      .then(([structRes, classList, studentList, settingsRes, schoolsRes]) => {
        const sList = structRes?.data || structRes || []
        setStructures(Array.isArray(sList) ? sList : [])
        setClasses(classList || [])
        setStudents(studentList || [])

        if (settingsRes?.academicYear) {
          setAcademicYear(settingsRes.academicYear)
        }

        if (schoolsRes?.length > 0) {
          setSchools(schoolsRes)
          setSelectedSchoolId(schoolsRes[0].code || schoolsRes[0].id)
        }

        if (initialStructure) {
          setSelectedStructureId(initialStructure.id)
          if (initialStructure.classId) {
            setSelectedClassId(initialStructure.classId)
            setStudentFilterClassId(initialStructure.classId)
          }
          if (initialStructure.dueDate) setDueDate(initialStructure.dueDate.slice(0, 10))
        } else if (sList.length > 0) {
          setSelectedStructureId(sList[0].id)
          if (sList[0].classId) {
            setSelectedClassId(sList[0].classId)
            setStudentFilterClassId(sList[0].classId)
          }
          if (sList[0].dueDate) setDueDate(sList[0].dueDate.slice(0, 10))
        }
      })
      .catch((err) => {
        console.error(err)
        showToast('Failed to load database fee assignment data.', 'error')
      })
      .finally(() => setLoadingData(false))
  }, [open, initialStructure, isSuperAdmin])

  const currentStructure = structures.find((s) => s.id === selectedStructureId)
  const baseFee = currentStructure ? currentStructure.totalFee : 0
  const lateFee = currentStructure ? currentStructure.lateFee || 0 : 0
  const discountVal = Number(discount) || 0
  const finalPayable = Math.max(baseFee + lateFee - discountVal, 0)

  // Dynamically filter students based on chosen class/section
  const filteredStudents = useMemo(() => {
    if (!studentFilterClassId) return students
    return students.filter((s) => s.classId === studentFilterClassId || s.className === studentFilterClassId)
  }, [students, studentFilterClassId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedStructureId) {
      showToast('Please select a fee structure from the database.', 'error')
      return
    }

    setSubmitting(true)
    try {
      if (assignMode === 'class') {
        if (!selectedClassId) {
          showToast('Please select a target class from the database.', 'error')
          setSubmitting(false)
          return
        }

        const res = await api.assignFeeStructureToClass({
          feeStructureId: selectedStructureId,
          classId: selectedClassId,
          discount: discountVal,
          dueDate: dueDate || undefined,
          academicYear,
          schoolId: selectedSchoolId || undefined,
        })
        showToast(res.message || 'Fee invoices assigned to class students in database.', 'success')
      } else {
        if (!selectedStudentId) {
          showToast('Please select a target student from the database.', 'error')
          setSubmitting(false)
          return
        }

        await api.assignFeeToStudent({
          studentId: selectedStudentId,
          feeStructureId: selectedStructureId,
          feeType: currentStructure?.feeType || 'Tuition Fee',
          totalFee: baseFee,
          discount: discountVal,
          lateFee: lateFee,
          dueDate: dueDate || undefined,
          academicYear,
          schoolId: selectedSchoolId || undefined,
        })
        showToast('Fee invoice created and saved to database.', 'success')
      }

      setSubmitting(false)
      onClose()
      if (onAssigned) onAssigned()
    } catch (err) {
      setSubmitting(false)
      showToast(err.message || 'Failed to assign fee', 'error')
    }
  }

  const structureOptions = structures.map((s) => ({
    value: s.id,
    label: `${s.feeType} - ${formatCurrency(s.totalFee)} (${s.class ? s.class.name + ' ' + s.class.section : 'All Classes'} | ${s.academicYear || academicYear})`,
  }))

  const classOptions = [
    { value: '', label: 'Select Target Class from Database...' },
    ...classes.map((c) => ({ value: c.id, label: `${c.name} ${c.section}`.trim() })),
  ]

  const studentFilterClassOptions = [
    { value: '', label: 'All Classes (All Students)' },
    ...classes.map((c) => ({ value: c.id, label: `${c.name} ${c.section}`.trim() })),
  ]

  const studentOptions = [
    { value: '', label: 'Select Target Student from Database...' },
    ...filteredStudents.map((s) => ({
      value: s.id,
      label: `${s.fullName} (${s.studentId}) — Class: ${s.className || 'Class'} ${s.section || ''} ${s.rollNumber ? `#${s.rollNumber}` : ''}`.trim(),
    })),
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Student Fee / Generate Invoices"
      description="Apply standard fee structures to an entire class or configure customized dues for a student from real database records."
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            leftIcon={Layers}
            onClick={handleSubmit}
            loading={submitting}
            disabled={loadingData}
          >
            {assignMode === 'class' ? 'Generate Invoices for Class' : 'Generate Student Invoice'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Super Admin School Selector */}
        {isSuperAdmin && schools.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              School Institution <span className="text-rose-500">*</span>
            </label>
            <Select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              options={schools.map((sch) => ({
                value: sch.code || sch.id,
                label: `${sch.name} (${sch.code})`,
              }))}
            />
          </div>
        )}

        {/* Dynamic Academic Year Display / Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Academic Session</label>
            <div className="flex h-11 items-center px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800">
              {academicYear}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assignment Scope</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAssignMode('class')}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold transition border ${
                  assignMode === 'class'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Users size={14} /> Class Batch
              </button>
              <button
                type="button"
                onClick={() => setAssignMode('student')}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold transition border ${
                  assignMode === 'student'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <GraduationCap size={14} /> Single Student
              </button>
            </div>
          </div>
        </div>

        {/* Database Fee Structure Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Select Database Fee Structure <span className="text-rose-500">*</span>
          </label>
          <Select
            value={selectedStructureId}
            onChange={(e) => {
              setSelectedStructureId(e.target.value)
              const s = structures.find((item) => item.id === e.target.value)
              if (s?.classId) {
                setSelectedClassId(s.classId)
                setStudentFilterClassId(s.classId)
              }
              if (s?.dueDate) setDueDate(s.dueDate.slice(0, 10))
            }}
            options={structureOptions}
            placeholder={loadingData ? 'Loading database fee structures...' : 'Choose fee structure...'}
            required
            disabled={loadingData || structures.length === 0}
          />
          {structures.length === 0 && !loadingData && (
            <p className="mt-1 text-xs text-amber-600">
              No fee structures configured yet. Please configure a fee structure first.
            </p>
          )}
        </div>

        {/* Target Class or Student Mode */}
        {assignMode === 'class' ? (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Database Class <span className="text-rose-500">*</span>
            </label>
            <Select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              options={classOptions}
              required
              disabled={loadingData}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Filter Students by Class & Section (Optional)
              </label>
              <Select
                value={studentFilterClassId}
                onChange={(e) => {
                  setStudentFilterClassId(e.target.value)
                  setSelectedStudentId('')
                }}
                options={studentFilterClassOptions}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Student <span className="text-rose-500">*</span>
                <span className="ml-1 text-[11px] font-normal text-slate-500">
                  ({filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'} available)
                </span>
              </label>
              <Select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                options={studentOptions}
                required
                disabled={loadingData || filteredStudents.length === 0}
              />
            </div>
          </div>
        )}

        {/* Scholarship / Discount & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Scholarship / Discount (₹)"
            type="number"
            step="1"
            min="0"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="e.g. 1000"
          />
          <Input
            label="Payment Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        {/* Dynamic Financial Calculation Preview Box */}
        {currentStructure && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Database Fee Head:</span>
              <span className="font-semibold text-slate-900">{currentStructure.feeType}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Base Fee Amount:</span>
              <span className="font-mono">{formatCurrency(baseFee)}</span>
            </div>
            {lateFee > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Late Fee Penalty:</span>
                <span className="font-mono">+{formatCurrency(lateFee)}</span>
              </div>
            )}
            {discountVal > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount / Scholarship:</span>
                <span className="font-mono">-{formatCurrency(discountVal)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900 text-sm">
              <span>Net Invoiced Payable:</span>
              <span className="font-mono text-indigo-600">{formatCurrency(finalPayable)}</span>
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
