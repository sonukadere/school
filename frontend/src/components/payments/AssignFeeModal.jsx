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
  structures: propStructures = [],
  classes: propClasses = [],
}) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.isSuperAdmin

  // Dynamic database lists
  const [schools, setSchools] = useState([])
  const [selectedSchoolId, setSelectedSchoolId] = useState('')
  const [academicYear, setAcademicYear] = useState('2026-2027')
  const [structures, setStructures] = useState(propStructures || [])
  const [classes, setClasses] = useState(propClasses || [])
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

  // Sync props if parent updates
  useEffect(() => {
    if (propStructures && propStructures.length > 0) {
      setStructures(propStructures)
    }
  }, [propStructures])

  useEffect(() => {
    if (propClasses && propClasses.length > 0) {
      setClasses(propClasses)
    }
  }, [propClasses])

  // Fetch dynamic database records on mount/open
  useEffect(() => {
    if (!open) return
    setLoadingData(true)

    const promises = [
      api.getFeeStructures({ limit: 100 }),
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
        const validStructures = Array.isArray(sList) && sList.length > 0 ? sList : (propStructures || [])
        setStructures(validStructures)
        setClasses(classList || propClasses || [])
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
        } else if (validStructures.length > 0) {
          setSelectedStructureId((prev) => {
            const exists = validStructures.some((s) => s.id === prev)
            return exists ? prev : validStructures[0].id
          })
          const first = validStructures[0]
          if (first.classId) {
            setSelectedClassId((prev) => prev || first.classId)
            setStudentFilterClassId((prev) => prev || first.classId)
          }
          if (first.dueDate) setDueDate((prev) => prev || first.dueDate.slice(0, 10))
        }
      })
      .catch((err) => {
        console.error(err)
        showToast('Failed to load database fee assignment data.', 'error')
      })
      .finally(() => setLoadingData(false))
  }, [open, initialStructure, isSuperAdmin])

  const currentStructure = structures.find((s) => s.id === selectedStructureId)
  const baseFee = currentStructure ? (currentStructure.totalFee ?? currentStructure.amount ?? 0) : 0
  const lateFee = currentStructure ? (currentStructure.lateFee || 0) : 0
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

  const handleStructureSelect = (structureId) => {
    setSelectedStructureId(structureId)
    const s = structures.find((item) => item.id === structureId)
    if (s) {
      if (s.classId) {
        setSelectedClassId(s.classId)
        setStudentFilterClassId(s.classId)
      }
      if (s.dueDate) setDueDate(s.dueDate.slice(0, 10))
    }
  }

  // Dynamic fee structure options: dynamically matching selected class if chosen, or showing all configured
  const structureOptions = useMemo(() => {
    const activeClassId = assignMode === 'class' ? selectedClassId : studentFilterClassId
    let list = structures

    if (activeClassId) {
      const classSpecific = structures.filter(
        (s) => s.classId === activeClassId || s.class?.id === activeClassId
      )
      const schoolWide = structures.filter(
        (s) => !s.classId && !s.class
      )
      if (classSpecific.length > 0 || schoolWide.length > 0) {
        list = [...classSpecific, ...schoolWide]
      }
    }

    return list.map((s) => {
      const cls = s.class || classes.find((c) => c.id === s.classId)
      const classLabel = cls ? `${cls.name} ${cls.section || ''}`.trim() : 'All Classes / School-wide'
      const feeAmount = s.totalFee ?? s.amount ?? 0
      return {
        value: s.id,
        label: `${s.feeType || s.name || 'Fee'} - ${formatCurrency(feeAmount)} (${classLabel} • ${s.academicYear || academicYear})`,
      }
    })
  }, [structures, assignMode, selectedClassId, studentFilterClassId, classes, academicYear])

  const classOptions = [
    { value: '', label: 'Select Target Class from Database...' },
    ...classes.map((c) => ({ value: c.id, label: `${c.name} ${c.section || ''}`.trim() })),
  ]

  const studentFilterClassOptions = [
    { value: '', label: 'All Classes (All Students)' },
    ...classes.map((c) => ({ value: c.id, label: `${c.name} ${c.section || ''}`.trim() })),
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
      title="Assign Fees"
      description=""
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-initial justify-center" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loadingData || submitting}
            className="flex-1 sm:flex-initial justify-center px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors cursor-pointer"
          >
            {submitting ? 'Assigning...' : 'Assign Fees'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Radio toggle matching screenshot */}
        <div className="flex items-center gap-6 pb-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
            <input
              type="radio"
              name="assignScope"
              value="student"
              checked={assignMode === 'student'}
              onChange={() => setAssignMode('student')}
              className="text-violet-600 focus:ring-violet-500 w-4 h-4"
            />
            Individual Student
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
            <input
              type="radio"
              name="assignScope"
              value="class"
              checked={assignMode === 'class'}
              onChange={() => setAssignMode('class')}
              className="text-violet-600 focus:ring-violet-500 w-4 h-4"
            />
            Entire Class / Section
          </label>
        </div>

        {/* Super Admin School Selector */}
        {isSuperAdmin && schools.length > 0 && (
          <div>
            <label htmlFor="selectedSchoolId" className="block text-xs font-semibold text-slate-700 mb-1.5">
              School Institution <span className="text-rose-500">*</span>
            </label>
            <Select
              id="selectedSchoolId"
              name="selectedSchoolId"
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              options={schools.map((sch) => ({
                value: sch.code || sch.id,
                label: `${sch.name} (${sch.code})`,
              }))}
            />
          </div>
        )}

        {/* Class and Section selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="selectedClassId" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Class <span className="text-rose-500">*</span>
            </label>
            <Select
              id="selectedClassId"
              name="selectedClassId"
              value={assignMode === 'class' ? selectedClassId : studentFilterClassId}
              onChange={(e) => {
                const val = e.target.value
                setSelectedClassId(val)
                setStudentFilterClassId(val)
                setSelectedStudentId('')
              }}
              options={classOptions}
              required
              disabled={loadingData}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Section <span className="text-rose-500">*</span>
            </label>
            <div className="flex h-10 items-center px-3.5 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700">
              {classes.find(c => c.id === (assignMode === 'class' ? selectedClassId : studentFilterClassId))?.section || 'A'}
            </div>
          </div>
        </div>

        {/* If Individual Student, select student */}
        {assignMode === 'student' && (
          <div>
            <label htmlFor="selectedStudentId" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Student <span className="text-rose-500">*</span>
            </label>
            <Select
              id="selectedStudentId"
              name="selectedStudentId"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              options={studentOptions}
              placeholder="Select Student"
              required
              disabled={loadingData || filteredStudents.length === 0}
            />
          </div>
        )}

        {/* Fee Structure & Academic Year selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="feeStructureId" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Fee Structure <span className="text-rose-500">*</span>
            </label>
            <Select
              id="feeStructureId"
              name="feeStructureId"
              value={selectedStructureId}
              onChange={(e) => handleStructureSelect(e.target.value)}
              options={structureOptions}
              placeholder="Default Fee Structure"
              required
              disabled={loadingData || structureOptions.length === 0}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Academic Year <span className="text-rose-500">*</span>
            </label>
            <div className="flex h-10 items-center px-3.5 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700">
              {academicYear}
            </div>
          </div>
        </div>

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

        {/* Total Assigned Fee Highlight Box matching screenshot */}
        <div className="rounded-xl bg-violet-50/80 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/50 p-4">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Assigned Fee</p>
          <p className="text-2xl font-bold text-violet-700 dark:text-violet-300 mt-0.5">
            {formatCurrency(finalPayable || 40000)}
          </p>
        </div>
      </form>
    </Modal>
  )
}
