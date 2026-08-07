import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Save, CalendarCheck, Users } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import Avatar from '../../components/common/Avatar'
import EmptyState from '../../components/common/EmptyState'
import { attendanceApi } from '../../services/api'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { CLASS_OPTIONS, SECTION_OPTIONS, ATTENDANCE_STATUS } from '../../utils/constants'
import { todayISO, cn } from '../../utils/helpers'

const STATUS_ACTIVE_STYLES = {
  Present: 'border-emerald-500 bg-emerald-50 text-emerald-700',
  Absent: 'border-rose-500 bg-rose-50 text-rose-700',
  Leave: 'border-amber-500 bg-amber-50 text-amber-700',
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
            'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-150',
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
  const [className, setClassName] = useState('')
  const [section, setSection] = useState('')
  const [students, setStudents] = useState([])
  const [records, setRecords] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!date || !className || !section) {
        setStudents([])
        setRecords({})
        return
      }
      setLoading(true)
      const allStudents = await api.getStudents()
      if (!mounted) return
      const classStudents = allStudents.filter(
        (student) => student.className === className && student.section === section,
      )
      const savedRecords = await attendanceApi.getStudentAttendance({ date, className, section })
      if (!mounted) return
      const recordMap = {}
      savedRecords.forEach((record) => {
        recordMap[record.studentId] = record.status
      })
      setStudents(classStudents)
      setRecords(recordMap)
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [date, className, section])

  const updateStatus = (studentId, status) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }))
  }

  const handleSave = async () => {
    const statuses = Object.values(records)
    if (statuses.length && statuses.some((status) => !status)) {
      showToast('Please mark attendance for all students', 'error')
      return
    }
    setSaving(true)
    const recordsToSave = students.map((student) => ({
      studentId: student.id,
      status: records[student.id] || 'Present',
    }))
    await attendanceApi.saveStudentAttendance({ date, className, section, records: recordsToSave })
    setSaving(false)
    showToast('Attendance saved successfully', 'success')
  }

  const presentCount = students.filter((s) => records[s.id] === 'Present').length
  const absentCount = students.filter((s) => records[s.id] === 'Absent').length
  const leaveCount = students.filter((s) => records[s.id] === 'Leave').length

  return (
    <div>
      <PageHeader
        title="Student Attendance"
        description="Mark attendance for students"
        breadcrumb={[
          { label: 'Attendance', href: '/attendance' },
          { label: 'Student Attendance' },
        ]}
      />

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          <Select label="Class" value={className} onChange={(event) => setClassName(event.target.value)} options={CLASS_OPTIONS} placeholder="Select class" />
          <Select label="Section" value={section} onChange={(event) => setSection(event.target.value)} options={SECTION_OPTIONS} placeholder="Select section" />
        </div>
      </div>

      {loading ? (
        <Card>
          <EmptyState title="Loading..." description="Fetching student list" />
        </Card>
      ) : !className || !section ? (
        <Card>
          <EmptyState
            title="Select class and section"
            description="Choose a class and section to load the student list."
            icon={CalendarCheck}
          />
        </Card>
      ) : students.length === 0 ? (
        <Card>
          <EmptyState
            title="No students found"
            description="No students are enrolled in the selected class and section."
            icon={Users}
          />
        </Card>
      ) : (
        <Card
          title={`${className} - Section ${section}`}
          subtitle={`${students.length} students • ${presentCount} present • ${absentCount} absent • ${leaveCount} leave`}
          actions={<Button onClick={handleSave} loading={saving} leftIcon={Save}>Save Attendance</Button>}
          className="overflow-hidden"
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  {['Student', 'Roll No', 'Status'].map((header) => (
                    <th key={header} className="px-5 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={student.fullName} size="sm" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{student.fullName}</p>
                          <p className="text-xs text-slate-500">{student.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{student.rollNumber}</td>
                    <td className="px-5 py-3">
                      <StatusRadio selected={records[student.id] || ''} onChange={(status) => updateStatus(student.id, status)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end border-t border-slate-100 p-4">
            <Button onClick={handleSave} loading={saving} leftIcon={Save}>Save Attendance</Button>
          </div>
        </Card>
      )}

      <div className="mt-6 text-center text-sm text-slate-500">
        <Link to="/attendance/teachers" className="font-medium text-indigo-600 hover:text-indigo-700">
          Switch to Teacher Attendance →
        </Link>
      </div>
    </div>
  )
}

export default StudentAttendance
