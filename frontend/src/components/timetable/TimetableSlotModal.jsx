import { useState, useEffect, useMemo } from 'react'
import { Calendar, Clock, BookOpen, Users, School, AlertCircle } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import Select from '../common/Select'
import Input from '../common/Input'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'

const DAY_OPTIONS = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
]

function TimetableSlotModal({
  open,
  onClose,
  initialSlot = null,
  classes = [],
  periods = [],
  subjects = [],
  teachers = [],
  preselectedClassId = null,
  preselectedDay = null,
  preselectedPeriodId = null,
  onSaved,
}) {
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [conflictError, setConflictError] = useState(null)

  const [values, setValues] = useState({
    classId: '',
    day: 'MONDAY',
    periodId: '',
    subjectId: '',
    teacherId: '',
    roomNumber: '',
    startTime: '08:00',
    endTime: '08:45',
  })

  // Synchronize initial values when modal opens
  useEffect(() => {
    if (!open) {
      setConflictError(null)
      return
    }

    if (initialSlot) {
      setValues({
        classId: initialSlot.classId || '',
        day: initialSlot.day || 'MONDAY',
        periodId: initialSlot.periodId || '',
        subjectId: initialSlot.subjectId || '',
        teacherId: initialSlot.teacherId || '',
        roomNumber: initialSlot.roomNumber || '',
        startTime: initialSlot.startTime || '08:00',
        endTime: initialSlot.endTime || '08:45',
      })
    } else {
      const selectedPeriod = periods.find((p) => p.id === preselectedPeriodId) || periods[0]
      const selectedClass = classes.find((c) => c.id === preselectedClassId) || classes[0]

      setValues({
        classId: preselectedClassId || selectedClass?.id || '',
        day: preselectedDay || 'MONDAY',
        periodId: preselectedPeriodId || selectedPeriod?.id || '',
        subjectId: '',
        teacherId: '',
        roomNumber: selectedClass?.roomNumber || '',
        startTime: selectedPeriod?.startTime || '08:00',
        endTime: selectedPeriod?.endTime || '08:45',
      })
    }
    setConflictError(null)
  }, [open, initialSlot, preselectedClassId, preselectedDay, preselectedPeriodId, classes, periods])

  // Filter subjects for the selected class if classId is set
  const classSubjects = useMemo(() => {
    if (!values.classId) return subjects
    const filtered = subjects.filter((s) => s.classId === values.classId)
    // If no subjects found for this exact class, show all subjects
    return filtered.length > 0 ? filtered : subjects
  }, [values.classId, subjects])

  // When class changes, optionally prefill room number
  const handleClassChange = (e) => {
    const classId = e.target.value
    const cls = classes.find((c) => c.id === classId)
    setValues((prev) => ({
      ...prev,
      classId,
      roomNumber: cls?.roomNumber || prev.roomNumber,
      // Reset subject if previous subject belonged to another class
      subjectId: '',
      teacherId: '',
    }))
    setConflictError(null)
  }

  // When period changes, sync start & end time
  const handlePeriodChange = (e) => {
    const periodId = e.target.value
    const period = periods.find((p) => p.id === periodId)
    setValues((prev) => ({
      ...prev,
      periodId,
      startTime: period?.startTime || prev.startTime,
      endTime: period?.endTime || prev.endTime,
    }))
    setConflictError(null)
  }

  // When subject changes, auto-fill teacher if assigned
  const handleSubjectChange = (e) => {
    const subjectId = e.target.value
    const subj = subjects.find((s) => s.id === subjectId)
    setValues((prev) => ({
      ...prev,
      subjectId,
      teacherId: subj?.teacherId || prev.teacherId,
    }))
    setConflictError(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    setConflictError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setConflictError(null)

    if (!values.classId) {
      setConflictError('Please select a class.')
      return
    }
    if (!values.subjectId) {
      setConflictError('Please select a subject.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        classId: values.classId,
        subjectId: values.subjectId,
        teacherId: values.teacherId || null,
        periodId: values.periodId || null,
        day: values.day,
        startTime: values.startTime,
        endTime: values.endTime,
        roomNumber: values.roomNumber?.trim() || null,
      }

      if (initialSlot?.id) {
        await api.updateTimetableSlot(initialSlot.id, payload)
        showToast('Timetable slot updated successfully', 'success')
      } else {
        await api.addTimetableSlot(payload)
        showToast('Timetable slot created successfully', 'success')
      }

      onSaved?.()
      onClose()
    } catch (err) {
      console.error('[TimetableSlotModal] Error:', err)
      const message = err?.response?.data?.message || err?.message || 'Failed to save timetable slot'
      setConflictError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const classOptions = useMemo(
    () =>
      classes.map((c) => ({
        value: c.id,
        label: `${c.name} ${c.section ? `(${c.section})` : ''}`.trim(),
      })),
    [classes]
  )

  const periodOptions = useMemo(
    () =>
      periods.map((p) => ({
        value: p.id,
        label: `${p.name} (${p.startTime} - ${p.endTime})${p.isBreak ? ' [Break]' : ''}`,
      })),
    [periods]
  )

  const subjectOptions = useMemo(
    () =>
      classSubjects.map((s) => ({
        value: s.id,
        label: `${s.name} ${s.code ? `[${s.code}]` : ''}`,
      })),
    [classSubjects]
  )

  const teacherOptions = useMemo(
    () => [
      { value: '', label: '-- No Teacher Assigned --' },
      ...teachers.map((t) => ({
        value: t.id,
        label: `${t.name} ${t.teacherId ? `(${t.teacherId})` : ''}`,
      })),
    ],
    [teachers]
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialSlot ? 'Edit Timetable Slot' : 'Assign Timetable Slot'}
      description="Schedule subject, teacher, class, and period with automatic conflict validation."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {initialSlot ? 'Save Changes' : 'Assign Slot'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {conflictError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 flex items-start gap-2.5 text-rose-800 text-xs">
            <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Scheduling Conflict: </span>
              <span>{conflictError}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Class & Section"
            name="classId"
            value={values.classId}
            onChange={handleClassChange}
            options={classOptions}
            placeholder="Select Class..."
            leftIcon={School}
            required
          />

          <Select
            label="Day of Week"
            name="day"
            value={values.day}
            onChange={handleChange}
            options={DAY_OPTIONS}
            leftIcon={Calendar}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Period"
            name="periodId"
            value={values.periodId}
            onChange={handlePeriodChange}
            options={periodOptions}
            placeholder="Select Period..."
            leftIcon={Clock}
          />

          <Input
            label="Room Number"
            name="roomNumber"
            value={values.roomNumber}
            onChange={handleChange}
            placeholder="e.g. Room 101"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Time"
            type="time"
            name="startTime"
            value={values.startTime}
            onChange={handleChange}
            required
          />
          <Input
            label="End Time"
            type="time"
            name="endTime"
            value={values.endTime}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Subject"
            name="subjectId"
            value={values.subjectId}
            onChange={handleSubjectChange}
            options={subjectOptions}
            placeholder="Select Subject..."
            leftIcon={BookOpen}
            required
          />

          <Select
            label="Teacher"
            name="teacherId"
            value={values.teacherId}
            onChange={handleChange}
            options={teacherOptions}
            leftIcon={Users}
          />
        </div>
      </form>
    </Modal>
  )
}

export default TimetableSlotModal
