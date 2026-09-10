import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  UserCheck,
  UserX,
  School,
  Search,
  ExternalLink,
  UserPlus,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import Modal from '../common/Modal'
import Badge from '../common/Badge'
import Button from '../common/Button'
import Avatar from '../common/Avatar'
import Loader from '../common/Loader'
import { api } from '../../services/api'
import { STATUS_STYLES } from '../../utils/helpers'

export default function ClassDetailsModal({ open, onClose, classData }) {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL, ACTIVE, INACTIVE

  useEffect(() => {
    if (!open || !classData?.id) {
      setDetails(null)
      setSearch('')
      setStatusFilter('ALL')
      return
    }

    let isMounted = true
    setLoading(true)

    api.getClass(classData.id)
      .then((data) => {
        if (isMounted) {
          setDetails(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Failed to fetch class details:', err)
        if (isMounted) {
          // Fallback to classData passed in
          setDetails(classData)
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [open, classData])

  const students = useMemo(() => {
    if (!details?.students || !Array.isArray(details.students)) return []
    return details.students
  }, [details])

  const totalCount = details?.studentCount ?? students.length
  const activeCount = details?.activeStudentCount ?? students.filter((s) => s.status === 'Active' || s.status === 'ACTIVE').length
  const inactiveCount = details?.inactiveStudentCount ?? (totalCount - activeCount)

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const fullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase()
      const studentId = (s.studentId || '').toLowerCase()
      const roll = String(s.rollNumber || '')
      const q = search.toLowerCase().trim()

      const matchesSearch = !q || fullName.includes(q) || studentId.includes(q) || roll.includes(q)

      const isStudentActive = s.status === 'ACTIVE' || s.status === 'Active'
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && isStudentActive) ||
        (statusFilter === 'INACTIVE' && !isStudentActive)

      return matchesSearch && matchesStatus
    })
  }, [students, search, statusFilter])

  const className = details?.name || classData?.name || 'Class'
  const section = details?.section || classData?.section || 'A'
  const teacherName =
    details?.classTeacherName ||
    details?.classTeacher ||
    classData?.classTeacherName ||
    classData?.classTeacher ||
    'Not Assigned'

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <School size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900">
                {className} - Section {section}
              </span>
              <Badge variant="primary" className="font-semibold text-xs">
                Section {section}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Room {details?.roomNumber || classData?.roomNumber || 'TBD'} &bull; Class Teacher: <span className="font-medium text-slate-700">{teacherName}</span>
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-between">
          <Link
            to={`/students?class=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}`}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            <span>Open in Student Directory</span>
            <ExternalLink size={13} />
          </Link>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* KPI Counter Cards */}
        <div className="grid grid-cols-1 min-[440px]:grid-cols-3 gap-2 sm:gap-3">
          <div
            onClick={() => setStatusFilter('ALL')}
            className={`cursor-pointer rounded-xl border p-3 transition-all ${
              statusFilter === 'ALL'
                ? 'border-indigo-400 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-200'
                : 'border-slate-200/80 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Total Students</span>
              <Users size={15} className="text-indigo-600" />
            </div>
            <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">{totalCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Assigned to this class</p>
          </div>

          <div
            onClick={() => setStatusFilter('ACTIVE')}
            className={`cursor-pointer rounded-xl border p-3 transition-all ${
              statusFilter === 'ACTIVE'
                ? 'border-emerald-400 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-200'
                : 'border-slate-200/80 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Active Students</span>
              <UserCheck size={15} className="text-emerald-600" />
            </div>
            <p className="mt-1 text-xl font-bold tracking-tight text-emerald-600">{activeCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Currently active</p>
          </div>

          <div
            onClick={() => setStatusFilter('INACTIVE')}
            className={`cursor-pointer rounded-xl border p-3 transition-all ${
              statusFilter === 'INACTIVE'
                ? 'border-amber-400 bg-amber-50/50 shadow-xs ring-2 ring-amber-200'
                : 'border-slate-200/80 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Inactive Students</span>
              <UserX size={15} className="text-amber-600" />
            </div>
            <p className="mt-1 text-xl font-bold tracking-tight text-amber-600">{inactiveCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Inactive / Suspended</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, roll number, or ID..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto text-xs bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                statusFilter === 'INACTIVE'
                  ? 'bg-white text-amber-700 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Inactive ({inactiveCount})
            </button>
          </div>
        </div>

        {/* Student Roster Table / List */}
        {loading ? (
          <div className="py-12">
            <Loader label="Loading class roster..." />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-10 px-4 text-center">
            <Users size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              {search || statusFilter !== 'ALL' ? 'No matching students found' : 'No students enrolled in this class'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== 'ALL'
                ? 'Try clearing the search or status filter.'
                : 'Add admissions or assign students to this class to see them here.'}
            </p>
            {!search && statusFilter === 'ALL' && (
              <Link to="/students/add" onClick={onClose} className="mt-3 inline-block">
                <Button size="sm" variant="outline" leftIcon={UserPlus}>
                  Admit New Student
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
            <div className="max-h-[380px] overflow-y-auto overflow-x-auto touch-scroll">
              <table className="min-w-[520px] w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3 w-20">Roll No</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Student ID</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student, idx) => {
                    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student'
                    const isStudentActive = student.status === 'ACTIVE' || student.status === 'Active'

                    return (
                      <tr
                        key={student.id || student.studentId || idx}
                        className="hover:bg-indigo-50/30 transition-colors"
                      >
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                            {student.rollNumber ?? '—'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={fullName} size="sm" />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{fullName}</p>
                              {student.email && (
                                <p className="text-[11px] text-slate-400 truncate">{student.email}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 font-medium">
                          {student.studentId || '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            className={
                              isStudentActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full mr-1 ${
                                isStudentActive ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            {student.status || 'Active'}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            to={`/students/${student.id}`}
                            onClick={onClose}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition"
                          >
                            <span>Profile</span>
                            <ExternalLink size={11} />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
