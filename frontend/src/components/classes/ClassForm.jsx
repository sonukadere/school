import { useEffect, useState, useMemo } from 'react'
import { School, UserCheck, DoorOpen, Sparkles, CheckCircle2, ArrowLeft, Eye, ShieldCheck, BookOpen, Layers } from 'lucide-react'
import Input from '../common/Input'
import Select from '../common/Select'
import Button from '../common/Button'
import { CLASS_OPTIONS, SECTION_OPTIONS } from '../../utils/constants'
import { api } from '../../services/api'

function ClassForm({ initialValues = {}, onSubmit, submitting, submitLabel = 'Save Class', onBack }) {
  const [values, setValues] = useState({
    name: initialValues.name || '',
    section: initialValues.section || '',
    classTeacherId:
      initialValues.classTeacherId ||
      (typeof initialValues.classTeacher === 'object' ? initialValues.classTeacher?.id : '') ||
      '',
    roomNumber: initialValues.roomNumber || '',
    ...initialValues,
  })
  const [teachers, setTeachers] = useState([])
  const [loadingTeachers, setLoadingTeachers] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    let isMounted = true
    setLoadingTeachers(true)
    api
      .getTeachers()
      .then((list) => {
        if (isMounted) {
          setTeachers(list || [])
          setLoadingTeachers(false)
        }
      })
      .catch(() => {
        if (isMounted) setLoadingTeachers(false)
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
        classTeacherId:
          initialValues.classTeacherId ||
          (typeof initialValues.classTeacher === 'object' ? initialValues.classTeacher?.id : '') ||
          prev.classTeacherId ||
          '',
      }))
    }
  }, [initialValues])

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!values.name) nextErrors.name = 'Class name is required'
    if (!values.section) nextErrors.section = 'Section is required'
    return nextErrors
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onSubmit(values)
  }

  const selectedTeacher = useMemo(() => {
    return teachers.find((t) => t.id === values.classTeacherId)
  }, [teachers, values.classTeacherId])

  const teacherOptions = [
    { value: '', label: 'None / Not Assigned' },
    ...teachers.map((t) => ({
      value: t.id,
      label: `${t.name} (${t.subject || 'Teacher'})`,
    })),
  ]

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Form Details (2 spans) */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_6px_24px_0_rgba(15,23,42,0.05)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 via-slate-50/30 to-transparent px-6 py-4.5">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20">
                  <School size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Class & Section Setup</h3>
                  <p className="text-xs text-slate-500">Configure academic division, assigned mentor, and classroom</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100/80 px-3 py-1 text-[11px] font-semibold text-indigo-700">
                <Sparkles size={12} /> Academic Unit
              </span>
            </div>

            {/* Form Fields */}
            <div className="p-6 sm:p-7 space-y-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Select
                  label="Class Name"
                  name="name"
                  value={values.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                  options={CLASS_OPTIONS}
                  placeholder="Select class"
                />
                <Select
                  label="Section"
                  name="section"
                  value={values.section}
                  onChange={handleChange}
                  error={errors.section}
                  required
                  options={SECTION_OPTIONS}
                  placeholder="Select section"
                />
                <Select
                  label="Class Teacher"
                  name="classTeacherId"
                  value={values.classTeacherId || ''}
                  onChange={handleChange}
                  error={errors.classTeacherId}
                  options={teacherOptions}
                  placeholder={loadingTeachers ? 'Loading teachers...' : 'Select class teacher (optional)'}
                />
                <Input
                  label="Room Number"
                  name="roomNumber"
                  value={values.roomNumber}
                  onChange={handleChange}
                  error={errors.roomNumber}
                  placeholder="e.g. Room 201 (optional)"
                  icon={DoorOpen}
                />
              </div>

              {/* Assignment Notice */}
              <div className="rounded-xl border border-indigo-100/90 bg-indigo-50/40 p-4 flex items-start gap-3.5 text-xs text-slate-600">
                <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <UserCheck size={16} />
                </div>
                <div>
                  <p className="font-bold text-indigo-950">Faculty Assignment Note</p>
                  <p className="mt-0.5 text-slate-600 leading-relaxed">
                    Assigning a class teacher delegates student attendance tracking, class timetable management, and examination mark entry privileges for this specific section.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Footer */}
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

        {/* Right Column: Live Preview & Guidance (1 span) */}
        <div className="space-y-6">
          {/* Live Preview Card */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_6px_24px_0_rgba(15,23,42,0.05)] p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              <Eye size={14} className="text-indigo-600" /> Live Preview
            </div>

            <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                  Class Division
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Active
                </span>
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-900 tracking-tight font-heading">
                  {values.name ? `${values.name}` : 'Class Name'}{' '}
                  <span className="text-indigo-600">
                    {values.section ? `- ${values.section}` : '- Section'}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {values.roomNumber ? `Assigned to ${values.roomNumber}` : 'Room unassigned'}
                </p>
              </div>

              <div className="pt-3 border-t border-indigo-100/70 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Class Teacher:</span>
                <span className="font-bold text-slate-800">
                  {selectedTeacher ? selectedTeacher.name : 'Not Assigned'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Academic Rules Card */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_6px_24px_0_rgba(15,23,42,0.05)] p-5 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <ShieldCheck size={14} className="text-indigo-600" /> Academic Guidelines
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold mt-0.5">
                  ✓
                </span>
                <span>Each class and section combination must be unique per academic year.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold mt-0.5">
                  ✓
                </span>
                <span>Students admitted to this class will be automatically listed in this roster.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold mt-0.5">
                  ✓
                </span>
                <span>Report cards and official marksheets will reflect this class configuration.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  )
}

export default ClassForm
