import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Save, Users } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Avatar from '../../components/common/Avatar'
import EmptyState from '../../components/common/EmptyState'
import { attendanceApi } from '../../services/api'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { ATTENDANCE_STATUS } from '../../utils/constants'
import { todayISO, cn } from '../../utils/helpers'

const STATUS_ACTIVE_STYLES = {
  Present: 'border-emerald-500 bg-emerald-50 text-emerald-700',
  Absent: 'border-rose-500 bg-rose-50 text-rose-700',
  Leave: 'border-amber-500 bg-amber-50 text-amber-700',
}

function TeacherAttendance() {
  const { showToast } = useToast()
  const [date, setDate] = useState(todayISO())
  const [teachers, setTeachers] = useState([])
  const [records, setRecords] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!date) return
      setLoading(true)
      const allTeachers = await api.getTeachers()
      const savedRecords = await attendanceApi.getTeacherAttendance(date)
      if (!mounted) return
      const recordMap = {}
      savedRecords.forEach((record) => {
        recordMap[record.teacherId] = record.status
      })
      setTeachers(allTeachers)
      setRecords(recordMap)
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [date])

  const updateStatus = (teacherId, status) => {
    setRecords((prev) => ({ ...prev, [teacherId]: status }))
  }

  const handleSave = async () => {
    setSaving(true)
    const recordsToSave = teachers.map((teacher) => ({
      teacherId: teacher.id,
      status: records[teacher.id] || 'Present',
    }))
    await attendanceApi.saveTeacherAttendance({ date, records: recordsToSave })
    setSaving(false)
    showToast('Teacher attendance saved successfully', 'success')
  }

  const presentCount = teachers.filter((t) => records[t.id] === 'Present').length
  const absentCount = teachers.filter((t) => records[t.id] === 'Absent').length
  const leaveCount = teachers.filter((t) => records[t.id] === 'Leave').length

  return (
    <div>
      <PageHeader
        title="Teacher Attendance"
        description="Mark attendance for teachers"
        breadcrumb={[
          { label: 'Attendance', href: '/attendance' },
          { label: 'Teacher Attendance' },
        ]}
      />

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-md">
          <Input label="Date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </div>
      </div>

      {loading ? (
        <Card>
          <EmptyState title="Loading..." description="Fetching teacher list" />
        </Card>
      ) : teachers.length === 0 ? (
        <Card>
          <EmptyState title="No teachers found" description="Add teachers to mark attendance." icon={Users} />
        </Card>
      ) : (
        <Card
          title="Teacher List"
          subtitle={`${teachers.length} teachers • ${presentCount} present • ${absentCount} absent • ${leaveCount} leave`}
          actions={<Button onClick={handleSave} loading={saving} leftIcon={Save}>Save Attendance</Button>}
          className="overflow-hidden"
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  {['Teacher', 'Subject', 'Status'].map((header) => (
                    <th key={header} className="px-5 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={teacher.name} size="sm" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{teacher.name}</p>
                          <p className="text-xs text-slate-500">{teacher.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{teacher.subject}</td>
                    <td className="px-5 py-3">
                      <div className="inline-flex gap-1.5">
                        {ATTENDANCE_STATUS.map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => updateStatus(teacher.id, status)}
                            className={cn(
                              'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-150',
                              records[teacher.id] === status
                                ? STATUS_ACTIVE_STYLES[status]
                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50',
                            )}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
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
        <Link to="/attendance/students" className="font-medium text-indigo-600 hover:text-indigo-700">
          Switch to Student Attendance →
        </Link>
      </div>
    </div>
  )
}

export default TeacherAttendance
