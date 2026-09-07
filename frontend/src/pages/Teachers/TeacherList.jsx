import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Eye, Pencil, Trash2, Users } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Avatar from '../../components/common/Avatar'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Select from '../../components/common/Select'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { STATUS_STYLES, formatDate, formatCurrency } from '../../utils/helpers'

const SUBJECT_OPTIONS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Computer Science', 'Physical Education', 'Geography']

function TeacherList() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [subjectFilter, setSubjectFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadTeachers = async () => {
    setLoading(true)
    const data = await api.getTeachers()
    setTeachers(data)
    setLoading(false)
  }

  useEffect(() => {
    loadTeachers()
  }, [])

  const filteredTeachers = useMemo(
    () => teachers.filter((teacher) => !subjectFilter || teacher.subject === subjectFilter),
    [teachers, subjectFilter],
  )

  const handleDelete = async () => {
    setDeleting(true)
    await api.deleteTeacher(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    showToast(`Teacher ${deleteTarget.name} deleted`, 'success')
    loadTeachers()
  }

  const columns = [
    {
      key: 'teacher',
      header: 'Teacher',
      searchValue: (teacher) => `${teacher.name} ${teacher.id} ${teacher.email} ${teacher.subject} ${teacher.phone}`,
      render: (teacher) => (
        <div className="flex items-center gap-3">
          {teacher.photo ? (
            <img src={teacher.photo} alt={teacher.name} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <Avatar name={teacher.name} size="md" />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{teacher.name}</p>
            <p className="text-xs font-mono text-slate-400">ID: {teacher.teacherId || teacher.id.slice(-6)}</p>
          </div>
        </div>
      ),
    },
    { key: 'subject', header: 'Subject', render: (teacher) => (
      <Badge variant="primary">{teacher.subject}</Badge>
    ) },
    { key: 'qualification', header: 'Qualification', render: (teacher) => (
      <span className="text-slate-700 text-sm font-medium">{teacher.qualification || '—'}</span>
    ) },
    { key: 'contact', header: 'Contact', render: (teacher) => (
      <div>
        <p className="text-slate-700 text-xs font-medium">{teacher.phone || '—'}</p>
        <p className="text-[11px] text-slate-400">{teacher.email}</p>
      </div>
    ) },
    { key: 'salary', header: 'Salary', render: (teacher) => (
      <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded">
        {formatCurrency(teacher.salary)}
      </span>
    ) },
    { key: 'joiningDate', header: 'Joined', render: (teacher) => (
      <span className="text-xs text-slate-500">{formatDate(teacher.joiningDate)}</span>
    ) },
    { key: 'gender', header: 'Gender', render: (teacher) => (
      <Badge className={STATUS_STYLES[teacher.gender]}>{teacher.gender}</Badge>
    ) },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (teacher) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(event) => event.stopPropagation()}>
          <Link
            to={`/teachers/${teacher.id}`}
            title="View Details"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition-all hover:border-sky-300 hover:bg-sky-50/60 hover:text-sky-600"
          >
            <Eye size={14} />
          </Link>
          <Link
            to={`/teachers/edit/${teacher.id}`}
            title="Edit Teacher"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition-all hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-600"
          >
            <Pencil size={14} />
          </Link>
          <button
            type="button"
            onClick={() => setDeleteTarget(teacher)}
            title="Delete Teacher"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition-all hover:border-rose-300 hover:bg-rose-50/60 hover:text-rose-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Teachers"
        description="Manage teaching staff, profiles and assignments"
        breadcrumb={[{ label: 'Teachers' }]}
        actions={
          <Link to="/teachers/add">
            <Button leftIcon={Plus}>Add Teacher</Button>
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={filteredTeachers}
        loading={loading}
        pageSize={8}
        searchPlaceholder="Search by name, subject, email..."
        emptyTitle="No teachers found"
        emptyDescription="Try changing filters or add a new teacher."
        emptyIcon={Users}
        onRowClick={(teacher) => navigate(`/teachers/${teacher.id}`)}
        toolbar={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-48">
              <Select
                name="subjectFilter"
                value={subjectFilter}
                onChange={(event) => setSubjectFilter(event.target.value)}
                options={SUBJECT_OPTIONS}
                placeholder="All Subjects"
              />
            </div>
            {subjectFilter && (
              <Button variant="ghost" size="sm" onClick={() => setSubjectFilter('')}>
                Clear
              </Button>
            )}
          </div>
        }
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Teacher"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
      />
    </div>
  )
}

export default TeacherList
