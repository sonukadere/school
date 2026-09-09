import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, School, Users, UserCheck, UserX, Eye, BookOpen } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import ClassDetailsModal from '../../components/classes/ClassDetailsModal'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

function ClassList() {
  const { user } = useAuth()
  const canManage = ['Admin', 'Super Admin'].includes(user?.role) || Boolean(user?.isAdmin)
  const { showToast } = useToast()
  const [classes, setClasses] = useState([])
  const [totalStudentsCount, setTotalStudentsCount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [selectedClassForModal, setSelectedClassForModal] = useState(null)

  const loadClasses = async () => {
    setLoading(true)
    try {
      const [classRes, studentRes] = await Promise.allSettled([
        api.getClasses(),
        api.getStudents(),
      ])

      const classData = classRes.status === 'fulfilled' && Array.isArray(classRes.value) ? classRes.value : []
      const studentData = studentRes.status === 'fulfilled' && Array.isArray(studentRes.value) ? studentRes.value : []

      setClasses(classData)
      setTotalStudentsCount(studentData.length)
    } catch {
      showToast('Failed to load classes', 'error')
      setClasses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClasses()
  }, [])

  const stats = useMemo(() => {
    const total = classes.length
    const totalStudents = classes.reduce(
      (sum, c) => sum + (c.studentCount ?? (c._count?.students ?? 0)),
      0
    )
    const activeStudents = classes.reduce(
      (sum, c) => sum + (c.activeStudentCount ?? c.studentCount ?? 0),
      0
    )
    const inactiveStudents = classes.reduce(
      (sum, c) => sum + (c.inactiveStudentCount ?? 0),
      0
    )
    const withTeacher = classes.filter(
      (c) =>
        Boolean(c.classTeacherId) ||
        (c.classTeacher && c.classTeacher !== 'Not Assigned' && c.classTeacherName !== 'Not Assigned')
    ).length

    return { total, totalStudents, activeStudents, inactiveStudents, withTeacher }
  }, [classes])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deleteClass(deleteTarget.id)
      showToast(`Class ${deleteTarget.name} - ${deleteTarget.section} deleted successfully`, 'success')
      loadClasses()
    } catch (err) {
      showToast(err.message || 'Failed to delete class', 'error')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Class',
      searchValue: (item) =>
        `${item.name} Section ${item.section} ${item.classTeacherName || item.classTeacher || ''} Room ${item.roomNumber || ''}`,
      render: (item) => (
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50/90 text-indigo-600 border border-indigo-100 shadow-2xs">
            <School size={18} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Room {item.roomNumber || 'TBD'} &bull; {item.subjectCount ?? 0} Subjects
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'section',
      header: 'Section',
      render: (item) => (
        <Badge variant="primary" className="font-semibold">
          Section {item.section}
        </Badge>
      ),
    },
    {
      key: 'classTeacher',
      header: 'Class Teacher',
      render: (item) => {
        const teacherName =
          item.classTeacherName ||
          (typeof item.classTeacher === 'string' ? item.classTeacher : item.classTeacher?.name) ||
          'Not Assigned'
        const isAssigned = teacherName && teacherName !== 'Not Assigned'

        if (!isAssigned) {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 italic">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              Not Assigned
            </span>
          )
        }

        return (
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
              {teacherName.charAt(0).toUpperCase()}
            </span>
            <span className="font-medium text-slate-800 text-sm">{teacherName}</span>
          </div>
        )
      },
    },
    {
      key: 'studentCount',
      header: 'Total Students',
      render: (item) => {
        const count = item.studentCount ?? (item._count?.students ?? 0)
        return (
          <button
            type="button"
            onClick={() => setSelectedClassForModal(item)}
            title="Click to view enrolled students"
            className="group inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50/70 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 hover:border-indigo-300 shadow-2xs cursor-pointer"
          >
            <Users size={12} className="text-indigo-600 transition-transform group-hover:scale-110" />
            <span>{count} {count === 1 ? 'Student' : 'Students'}</span>
          </button>
        )
      },
    },
    {
      key: 'activeStudentCount',
      header: 'Active',
      render: (item) => {
        const count = item.activeStudentCount ?? item.studentCount ?? 0
        return (
          <button
            type="button"
            onClick={() => setSelectedClassForModal(item)}
            title="Click to view active students"
            className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50/70 px-2 py-0.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 cursor-pointer"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>{count} Active</span>
          </button>
        )
      },
    },
    {
      key: 'inactiveStudentCount',
      header: 'Inactive',
      render: (item) => {
        const count = item.inactiveStudentCount ?? 0
        return (
          <button
            type="button"
            onClick={() => setSelectedClassForModal(item)}
            title="Click to view inactive students"
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold transition cursor-pointer ${
              count > 0
                ? 'border-amber-200 bg-amber-50/70 text-amber-700 hover:bg-amber-100'
                : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${count > 0 ? 'bg-amber-500' : 'bg-slate-300'}`} />
            <span>{count} Inactive</span>
          </button>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedClassForModal(item)}
            title="View Class Students Roster"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition-all duration-150 hover:border-sky-300 hover:bg-sky-50/60 hover:text-sky-600 cursor-pointer"
          >
            <Eye size={14} />
          </button>
          {canManage && (
            <>
              <Link
                to={`/classes/edit/${item.id}`}
                title="Edit Class"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition-all duration-150 hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-600"
              >
                <Pencil size={14} />
              </Link>
              <button
                type="button"
                onClick={() => setDeleteTarget(item)}
                title="Delete Class"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition-all duration-150 hover:border-rose-300 hover:bg-rose-50/60 hover:text-rose-600 cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes"
        description="Manage classes, sections, student distributions and assigned class teachers"
        breadcrumb={[{ label: 'Classes' }]}
        actions={
          canManage ? (
            <Link to="/classes/add">
              <Button leftIcon={Plus}>Add Class</Button>
            </Link>
          ) : null
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Total Classes</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <School size={16} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {loading ? <div className="h-8 w-14 animate-pulse rounded bg-slate-100" /> : stats.total}
          </div>
          <p className="mt-0.5 text-xs text-slate-400">Active class sections</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Total Students</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {loading ? <div className="h-8 w-14 animate-pulse rounded bg-slate-100" /> : stats.totalStudents}
          </div>
          <p className="mt-0.5 text-xs text-slate-400">Enrolled across all classes</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Active Students</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
            {loading ? <div className="h-8 w-16 animate-pulse rounded bg-slate-100" /> : stats.activeStudents}
          </div>
          <p className="mt-0.5 text-xs text-slate-400">Regular attendees</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Inactive Students</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <UserX size={16} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-amber-600">
            {loading ? <div className="h-8 w-14 animate-pulse rounded bg-slate-100" /> : stats.inactiveStudents}
          </div>
          <p className="mt-0.5 text-xs text-slate-400">Inactive or suspended</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={classes}
        loading={loading}
        pageSize={8}
        searchPlaceholder="Search by class name, section, or teacher..."
        emptyTitle="No classes found"
        emptyDescription="Add a new class to get started."
        emptyIcon={School}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Class"
        message={`Are you sure you want to delete ${deleteTarget?.name} - Section ${deleteTarget?.section}? This action cannot be undone.`}
      />

      <ClassDetailsModal
        open={Boolean(selectedClassForModal)}
        onClose={() => setSelectedClassForModal(null)}
        classData={selectedClassForModal}
      />
    </div>
  )
}

export default ClassList
