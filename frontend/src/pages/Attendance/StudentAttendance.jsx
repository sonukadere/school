import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Save,
  CalendarCheck,
  Users,
  Database,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Sparkles,
  School,
  AlertCircle,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import Avatar from '../../components/common/Avatar'
import EmptyState from '../../components/common/EmptyState'
import { attendanceApi, api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { ATTENDANCE_STATUS } from '../../utils/constants'
import { todayISO, cn, formatDate } from '../../utils/helpers'

const STATUS_ACTIVE_STYLES = {
  Present: 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm font-semibold',
  Absent: 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm font-semibold',
  Leave: 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm font-semibold',
}

function StatusRadio({ selected, onChange }) {
  return (
    <div className="inline-flex gap-1.5">
      {ATTENDANCE_STATUS.map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => onChange(status)}
          className={cn(
            'rounded-lg border px-3 py-1.5 text-xs transition-all duration-150',
            selected === status
              ? STATUS_ACTIVE_STYLES[status]
              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50',
          )}
        >
          {status}
        </button>
      ))}
    </div>
  )
}

function StudentAttendance() {
  const { showToast } = useToast()
  const [date, setDate] = useState(todayISO())
  const [classes, setClasses] = useState([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [className, setClassName] = useState('')
  const [section, setSection] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [students, setStudents] = useState([])
  const [records, setRecords] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 1. Fetch real active classes from MongoDB database on mount
  useEffect(() => {
    let mounted = true
    const loadClasses = async () => {
      setLoadingClasses(true)
      try {
        const data = await api.getClasses()
        if (!mounted) return
        const classList = Array.isArray(data) ? data : []
        setClasses(classList)

        // If exactly 1 class exists in database, auto-select it for instant convenience
        if (classList.length === 1) {
          const onlyClass = classList[0]
          setClassName(onlyClass.name)
          setSection(onlyClass.section || '')
          setSelectedClassId(onlyClass.id)
        }
      } catch (err) {
        console.error('Failed to load database classes:', err)
        showToast('Failed to load classes from database', 'error')
      } finally {
        if (mounted) setLoadingClasses(false)
      }
    }

    loadClasses()
    return () => {
      mounted = false
    }
  }, [])

  // 2. Generate unique class names directly from database
  const classOptions = useMemo(() => {
    const names = Array.from(new Set(classes.map((c) => c.name).filter(Boolean)))
    return names.map((name) => ({ value: name, label: name }))
  }, [classes])

  // 3. Generate available sections for the selected class from database
  const sectionOptions = useMemo(() => {
    if (!className) return []
    const matching = classes.filter((c) => c.name === className && c.section)
    const uniqueSecs = Array.from(new Set(matching.map((c) => c.section)))
    return uniqueSecs.map((sec) => ({ value: sec, label: `Section ${sec}` }))
  }, [classes, className])

  // Resolve currently active database class object
  const activeClass = useMemo(() => {
    return (
      classes.find((c) => c.id === selectedClassId) ||
      classes.find((c) => c.name === className && c.section === section) ||
      null
    )
  }, [classes, selectedClassId, className, section])

  // Handle class change
  const handleClassChange = (newClassName) => {
    setClassName(newClassName)
    const matching = classes.filter((c) => c.name === newClassName)
    if (matching.length === 1) {
      setSection(matching[0].section || '')
      setSelectedClassId(matching[0].id)
    } else if (matching.some((c) => c.section === section)) {
      const found = matching.find((c) => c.section === section)
      setSelectedClassId(found ? found.id : '')
    } else {
      setSection(matching[0]?.section || '')
      setSelectedClassId(matching[0]?.id || '')
    }
  }

  // Handle section change
  const handleSectionChange = (newSection) => {
    setSection(newSection)
    const found = classes.find((c) => c.name === className && c.section === newSection)
    setSelectedClassId(found ? found.id : '')
  }

  // 4. Load students and saved attendance records from database when date, class & section change
  useEffect(() => {
    let mounted = true
    const loadAttendanceData = async () => {
      if (!date || !className || !section) {
        setStudents([])
        setRecords({})
        return
      }

      setLoading(true)
      try {
        const targetClassId = activeClass?.id || selectedClassId

        // Fetch students and saved attendance records concurrently
        const [allStudents, savedRecords] = await Promise.all([
          api.getStudents({ limit: 100 }),
          attendanceApi.getStudentAttendance({
            date,
            classId: targetClassId,
            className,
            section,
          }),
        ])

        if (!mounted) return

        // Filter students belonging to this class & section from database
        const classStudents = allStudents.filter(
          (student) =>
            (targetClassId && student.classId === targetClassId) ||
            (student.className === className && student.section === section) ||
            (student.class?.id === targetClassId) ||
            (student.class?.name === className && student.class?.section === section),
        )

        // Sort by roll number if present, otherwise by name
        classStudents.sort((a, b) => {
          if (a.rollNumber != null && b.rollNumber != null) {
            return Number(a.rollNumber) - Number(b.rollNumber)
          }
          return (a.fullName || '').localeCompare(b.fullName || '')
        })

        // Map existing attendance records
        const recordMap = {}
        if (Array.isArray(savedRecords)) {
          savedRecords.forEach((record) => {
            recordMap[record.studentId] = record.status
          })
        }

        setStudents(classStudents)
        setRecords(recordMap)
      } catch (err) {
        console.error('Error loading attendance from database:', err)
        if (mounted) showToast('Failed to load students for this class', 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadAttendanceData()
    return () => {
      mounted = false
    }
  }, [date, className, section, activeClass, selectedClassId])

  const updateStatus = (studentId, status) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }))
  }

  // Quick action: Mark all students
  const markAll = (status) => {
    if (!students.length) return
    const updated = {}
    students.forEach((s) => {
      updated[s.id] = status
    })
    setRecords(updated)
    showToast(`Marked all as ${status}`, 'info')
  }

  // Reset all marks
  const clearAll = () => {
    setRecords({})
    showToast('Attendance status cleared', 'info')
  }

  // 5. Save attendance to database
  const handleSave = async () => {
    const targetClassId = activeClass?.id || selectedClassId
    if (!targetClassId && !className) {
      showToast('Please select a valid class from the database', 'error')
      return
    }

    if (!students.length) {
      showToast('No students to record attendance for', 'error')
      return
    }

    const unassigned = students.filter((s) => !records[s.id])
    if (unassigned.length > 0) {
      showToast(
        `Please mark attendance for all students (${unassigned.length} remaining) or use "Mark All Present"`,
        'error',
      )
      return
    }

    setSaving(true)
    try {
      const recordsToSave = students.map((student) => ({
        studentId: student.id,
        status: records[student.id] || 'Present',
      }))

      await attendanceApi.saveStudentAttendance({
        date,
        classId: targetClassId,
        className,
        section,
        records: recordsToSave,
      })

      showToast(
        `Attendance for ${className} - Section ${section} saved to database!`,
        'success',
      )
    } catch (err) {
      console.error('Failed to save attendance:', err)
      showToast(err.message || 'Failed to save attendance', 'error')
    } finally {
      setSaving(false)
    }
  }

  const presentCount = students.filter((s) => records[s.id] === 'Present').length
  const absentCount = students.filter((s) => records[s.id] === 'Absent').length
  const leaveCount = students.filter((s) => records[s.id] === 'Leave').length
  const unmarkedCount = students.length - (presentCount + absentCount + leaveCount)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Attendance"
        description="Mark and track student attendance backed by live database records"
        breadcrumb={[
          { label: 'Attendance', href: '/attendance' },
          { label: 'Student Attendance' },
        ]}
      />

      {/* Database-Driven Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800 tracking-wide uppercase">
              Class & Date Selection
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {loadingClasses ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
                Loading classes...
              </span>
            ) : classes.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Database ({classes.length} {classes.length === 1 ? 'Class' : 'Classes'})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200/60">
                <AlertCircle className="h-3 w-3" />
                No classes in database
              </span>
            )}
          </div>
        </div>

        {classes.length === 0 && !loadingClasses ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
            <School className="h-8 w-8 text-slate-400 mb-2" />
            <p className="font-semibold text-slate-800">No classes found in database</p>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              You need to add classes in the database before you can mark student attendance.
            </p>
            <Link
              to="/classes"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              Go to Classes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
            <Select
              label="Class"
              value={className}
              onChange={(event) => handleClassChange(event.target.value)}
              options={classOptions}
              placeholder={loadingClasses ? 'Loading classes...' : 'Select database class'}
              disabled={loadingClasses || classOptions.length === 0}
              required
            />
            <Select
              label="Section"
              value={section}
              onChange={(event) => handleSectionChange(event.target.value)}
              options={sectionOptions}
              placeholder={
                !className
                  ? 'Choose class first'
                  : sectionOptions.length === 0
                  ? 'No sections'
                  : 'Select section'
              }
              disabled={!className || sectionOptions.length === 0}
              required
            />
          </div>
        )}

        {/* Selected Class Database Info & Quick Action Bar */}
        {activeClass && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 sm:px-4 sm:py-2.5">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-600">
              <span className="font-semibold text-indigo-900">
                {activeClass.name} - Section {activeClass.section}
              </span>
              {activeClass.roomNumber && (
                <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 font-medium text-slate-600 border border-slate-200">
                  Room: {activeClass.roomNumber}
                </span>
              )}
              {activeClass.classTeacher && activeClass.classTeacher !== 'Not Assigned' && (
                <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 font-medium text-slate-600 border border-slate-200">
                  Teacher: {activeClass.classTeacher}
                </span>
              )}
            </div>

            {students.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => markAll('Present')}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-2xs hover:bg-emerald-50 transition-colors"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => markAll('Absent')}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 shadow-2xs hover:bg-rose-50 transition-colors"
                >
                  <XCircle className="h-3 w-3" />
                  Mark All Absent
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-500 shadow-2xs hover:bg-slate-100 transition-colors"
                  title="Clear all selections"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Roster & Attendance Table */}
      {loading ? (
        <Card>
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <p className="text-sm font-medium text-slate-700">Loading student roster...</p>
            <p className="text-xs text-slate-500">Connecting to database records</p>
          </div>
        </Card>
      ) : !className || !section ? (
        <Card>
          <EmptyState
            title="Select class and section"
            description="Choose a database class and section above to load enrolled students."
            icon={CalendarCheck}
          />
        </Card>
      ) : students.length === 0 ? (
        <Card>
          <EmptyState
            title="No students enrolled in this class"
            description={`No students are currently linked to ${className} - Section ${section} in the database.`}
            icon={Users}
            action={
              <Link
                to="/students/new"
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                Enroll Student to this Class
              </Link>
            }
          />
        </Card>
      ) : (
        <Card
          title={`${className} - Section ${section}`}
          subtitle={
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{students.length} Students</span>
              <span>•</span>
              <span className="font-medium text-emerald-600">{presentCount} Present</span>
              <span>•</span>
              <span className="font-medium text-rose-600">{absentCount} Absent</span>
              <span>•</span>
              <span className="font-medium text-amber-600">{leaveCount} Leave</span>
              {unmarkedCount > 0 && (
                <>
                  <span>•</span>
                  <span className="font-medium text-slate-400">{unmarkedCount} Unmarked</span>
                </>
              )}
            </div>
          }
          actions={
            <Button
              onClick={handleSave}
              loading={saving}
              leftIcon={Save}
              className="shadow-sm"
            >
              Save Attendance
            </Button>
          }
          className="overflow-hidden"
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto touch-scroll">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-3.5 py-2.5 sm:px-5 sm:py-3 text-[10px] sm:text-xs font-semibold tracking-wider text-slate-500 uppercase whitespace-nowrap">
                    Roll No
                  </th>
                  <th className="px-3.5 py-2.5 sm:px-5 sm:py-3 text-[10px] sm:text-xs font-semibold tracking-wider text-slate-500 uppercase whitespace-nowrap">
                    Student Details
                  </th>
                  <th className="px-3.5 py-2.5 sm:px-5 sm:py-3 text-[10px] sm:text-xs font-semibold tracking-wider text-slate-500 uppercase whitespace-nowrap">
                    Student ID
                  </th>
                  <th className="px-3.5 py-2.5 sm:px-5 sm:py-3 text-[10px] sm:text-xs font-semibold tracking-wider text-slate-500 uppercase text-right pr-4 sm:pr-6 whitespace-nowrap">
                    Attendance Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-3.5 py-3 sm:px-5 sm:py-3.5 text-xs sm:text-sm font-semibold text-slate-700 whitespace-nowrap">
                      {student.rollNumber ?? '—'}
                    </td>
                    <td className="px-3.5 py-3 sm:px-5 sm:py-3.5">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <Avatar name={student.fullName} size="sm" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-xs sm:text-sm whitespace-nowrap">
                            {student.fullName}
                          </p>
                          {student.email && (
                            <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                              {student.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 sm:px-5 sm:py-3.5 text-xs font-mono text-slate-500 whitespace-nowrap">
                      {student.studentId || student.id.slice(0, 10)}
                    </td>
                    <td className="px-3.5 py-3 sm:px-5 sm:py-3.5 text-right pr-4 sm:pr-6 whitespace-nowrap">
                      <StatusRadio
                        selected={records[student.id] || ''}
                        onChange={(status) => updateStatus(student.id, status)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 p-3.5 sm:p-4">
            <div className="text-xs text-slate-500 text-center sm:text-left">
              Showing {students.length} students from database • Marking for {formatDate(date)}
            </div>
            <Button
              onClick={handleSave}
              loading={saving}
              leftIcon={Save}
              className="shadow-sm w-full sm:w-auto"
            >
              Save Attendance
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-6 text-center text-sm text-slate-500">
        <Link
          to="/attendance/teachers"
          className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Switch to Teacher Attendance →
        </Link>
      </div>
    </div>
  )
}

export default StudentAttendance
