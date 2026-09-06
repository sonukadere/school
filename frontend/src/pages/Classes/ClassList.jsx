import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, School, Users, UserCheck, BookOpen } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'

function ClassList() {
  const { showToast } = useToast()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadClasses = async () => {
    setLoading(true)
    try {
      const data = await api.getClasses()
      setClasses(Array.isArray(data) ? data : [])
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
    const totalStudents = classes.reduce((sum, c) => sum + (c.studentCount ?? (c._count?.students ?? 0)), 0)
    const withTeacher = classes.filter(
      (c) => c.classTeacher && c.classTeacher !== 'Not Assigned' && c.classTeacherName !== 'Not Assigned'
    ).length
    const avgStudents = total > 0 ? (totalStudents / total).toFixed(1) : 0
    return { total, totalStudents, withTeacher, avgStudents }
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
      header: 'Students',
      render: (item) => {
        const count = item.studentCount ?? (item._count?.students ?? 0)
        return (
          <Badge variant="info" className="gap-1.5">
            <Users size={12} className="opacity-70" />
            <span>{count} {count === 1 ? 'Student' : 'Students'}</span>
          </Badge>
        )
      },
    },
    {
      key: 'roomNumber',
      header: 'Room',
      render: (item) => (
        <span className="inline-flex items-center font-mono text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded">
          {item.roomNumber ? `Room ${item.roomNumber}` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
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
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition-all duration-150 hover:border-rose-300 hover:bg-rose-50/60 hover:text-rose-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes"
        description="Manage classes, sections, and assigned class teachers"
        breadcrumb={[{ label: 'Classes' }]}
        actions={
          <Link to="/classes/add">
            <Button leftIcon={Plus}>Add Class</Button>
          </Link>
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Total Classes</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <School size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stats.total}</p>
          <p className="mt-0.5 text-xs text-slate-400">Active class groups</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Total Students</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Users size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stats.totalStudents}</p>
          <p className="mt-0.5 text-xs text-slate-400">Enrolled across classes</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Assigned Teachers</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <UserCheck size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {stats.withTeacher} <span className="text-xs font-normal text-slate-400">/ {stats.total}</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-400">Classes with lead teachers</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Avg. Class Size</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <BookOpen size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stats.avgStudents}</p>
          <p className="mt-0.5 text-xs text-slate-400">Students per section</p>
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
    </div>
  )
}

export default ClassList
