import { useState, useEffect, useMemo } from 'react'
import {
  BookOpen,
  UserCheck,
  CheckCircle2,
  ArrowLeft,
  Eye,
  ShieldCheck,
  School,
} from 'lucide-react'
import Input from '../common/Input'
import Select from '../common/Select'
import Button from '../common/Button'
import { CLASS_OPTIONS } from '../../utils/constants'
import { api } from '../../services/api'

function SubjectForm({
  initialValues = {},
  onSubmit,
  submitting,
  submitLabel = 'Save Subject',
  onBack,
}) {
  const [values, setValues] = useState({
    name: initialValues.name || '',
    code: initialValues.code || '',
    className: initialValues.className || '',
    classId: initialValues.classId || '',
    assignedTeacher: initialValues.assignedTeacher || '',
    teacherId: initialValues.teacherId || '',
    ...initialValues,
  })

  const [teachers, setTeachers] = useState([])
  const [classes, setClasses] = useState([])
  const [loadingTeachers, setLoadingTeachers] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [errors, setErrors] = useState({})

  // Fetch real teachers and classes directly from database
  useEffect(() => {
    let isMounted = true
    setLoadingTeachers(true)
    setLoadingClasses(true)

    api
      .getTeachers()
      .then((list) => {
        if (isMounted) {
          setTeachers(list || [])
          setLoadingTeachers(false)
        }
      })
      .catch((err) => {
        console.error('[SubjectForm] Error fetching teachers:', err)
        if (isMounted) setLoadingTeachers(false)
      })

    api
      .getClasses()
      .then((list) => {
        if (isMounted) {
          setClasses(list || [])
          setLoadingClasses(false)
        }
      })
      .catch((err) => {
        console.error('[SubjectForm] Error fetching classes:', err)
        if (isMounted) setLoadingClasses(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setValues((prev) => ({
        ...prev,
        ...initialValues,
      }))
    }
  }, [initialValues])

  // Real class options from database with fallback to standard options
  const classOptions = useMemo(() => {
    if (classes && classes.length > 0) {
      return classes.map((c) => {
        const full = `${c.name} ${c.section || ''}`.trim()
        return { value: full, label: full }
      })
    }
    return CLASS_OPTIONS
  }, [classes])

  // Real teacher options directly from database
  const teacherOptions = useMemo(() => {
    return (teachers || []).map((t) => ({
      value: t.id,
      label: `${t.name}${t.teacherId ? ` (${t.teacherId})` : ''}`,
    }))
  }, [teachers])

  const selectedTeacherRecord = useMemo(() => {
    return (
      teachers.find((t) => t.id === values.teacherId) ||
      teachers.find((t) => t.name === values.assignedTeacher) ||
      null
    )
  }, [teachers, values.teacherId, values.assignedTeacher])

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleClassChange = (event) => {
    const selectedClassVal = event.target.value
    const found = classes.find(
      (c) =>
        c.id === selectedClassVal ||
        `${c.name} ${c.section || ''}`.trim() === selectedClassVal ||
        c.name === selectedClassVal
    )
    setValues((prev) => ({
      ...prev,
      className: selectedClassVal,
      classId: found?.id || prev.classId || '',
    }))
    if (errors.className) setErrors((prev) => ({ ...prev, className: '' }))
  }

  const handleTeacherChange = (event) => {
    const selectedTeacherId = event.target.value
    const found = teachers.find(
      (t) => t.id === selectedTeacherId || t.name === selectedTeacherId
    )
    setValues((prev) => ({
      ...prev,
      teacherId: found?.id || selectedTeacherId,
      assignedTeacher: found?.name || selectedTeacherId,
    }))
    if (errors.assignedTeacher) {
      setErrors((prev) => ({ ...prev, assignedTeacher: '' }))
    }
  }



  const validate = () => {
    const nextErrors = {}
    if (!values.name?.trim()) nextErrors.name = 'Subject name is required'
    if (!values.code?.trim()) nextErrors.code = 'Subject code is required'
    if (!values.className?.trim()) nextErrors.className = 'Class is required'
    if (!values.assignedTeacher?.trim() && !values.teacherId) {
      nextErrors.assignedTeacher = 'Assigned teacher is required'
    }
    return nextErrors
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Form Fields and Action Footer (2 spans) */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <div className="border-b border-slate-100 bg-white p-6 pb-4">
              <div className="flex items-center gap-2 text-indigo-600">
                <BookOpen size={18} />
                <h3 className="text-base font-bold text-slate-900">Subject Details</h3>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Configure curriculum course parameters and assign an authorized teacher.
              </p>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Subject Name"
                  name="name"
                  value={values.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                  placeholder="e.g. English"
                />

                <Input
                  label="Subject Code"
                  name="code"
                  value={values.code}
                  onChange={handleChange}
                  error={errors.code}
                  required
                  placeholder="e.g. En-1"
                />

                <Select
                  label="Class"
                  name="className"
                  value={values.className}
                  onChange={handleClassChange}
                  error={errors.className}
                  required
                  options={classOptions}
                  placeholder={
                    loadingClasses ? 'Loading classes from database...' : 'Select class'
                  }
                />

                <Select
                  label="Assigned Teacher"
                  name="assignedTeacher"
                  value={selectedTeacherRecord?.id || values.teacherId || ''}
                  onChange={handleTeacherChange}
                  error={errors.assignedTeacher}
                  required
                  options={teacherOptions}
                  placeholder={
                    loadingTeachers
                      ? 'Loading teachers from database...'
                      : teachers.length === 0
                      ? 'No teachers found in database'
                      : 'Select assigned teacher'
                  }
                />
              </div>




            </div>

            {/* Action Footer seamlessly attached to the card */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                leftIcon={ArrowLeft}
                onClick={onBack || (() => window.history.back())}
                disabled={submitting}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                leftIcon={CheckCircle2}
                loading={submitting}
              >
                {submitLabel}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Subject Preview Card (1 span) */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Eye size={14} className="text-indigo-600" /> Live Preview
            </div>

            <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                  Subject Course
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {values.code ? values.code : 'CODE-000'}
                </span>
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-900 tracking-tight font-heading">
                  {values.name ? values.name : 'Subject Name'}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <School size={13} className="text-slate-400" />
                  <span>{values.className ? values.className : 'Class unassigned'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-indigo-100/70 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Faculty:</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <UserCheck size={13} className="text-emerald-600" />
                  {selectedTeacherRecord
                    ? selectedTeacherRecord.name
                    : values.assignedTeacher || 'Not Assigned'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Academic Guidelines Card */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <ShieldCheck size={14} className="text-indigo-600" /> Subject Guidelines
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold mt-0.5 shrink-0">
                  ✓
                </span>
                <span>Subject code and class combination identifies this curriculum unit.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold mt-0.5 shrink-0">
                  ✓
                </span>
                <span>Assigned teachers receive data-scoped examination mark entry access.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold mt-0.5 shrink-0">
                  ✓
                </span>
                <span>Results and student marksheets reflect this subject's grading.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  )
}

export default SubjectForm
