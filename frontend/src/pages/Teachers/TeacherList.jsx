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
            <p className="text-xs text-slate-500">ID: {teacher.id}</p>
          </div>
        </div>
      ),
    },
    { key: 'subject', header: 'Subject', render: (teacher) => (
      <Badge className="bg-violet-100 text-violet-700">{teacher.subject}</Badge>
    ) },
    { key: 'qualification', header: 'Qualification', render: (teacher) => (
      <span className="text-slate-700">{teacher.qualification}</span>
    ) },
    { key: 'contact', header: 'Contact', render: (teacher) => (
      <div>
        <p className="text-slate-700">{teacher.phone}</p>
        <p className="text-xs text-slate-400">{teacher.email}</p>
      </div>
    ) },
    { key: 'salary', header: 'Salary', render: (teacher) => (
      <span className="font-medium text-slate-800">{formatCurrency(teacher.salary)}</span>
    ) },
    { key: 'joiningDate', header: 'Joined', render: (teacher) => formatDate(teacher.joiningDate) },
    { key: 'gender', header: 'Gender', render: (teacher) => (
      <Badge className={STATUS_STYLES[teacher.gender]}>{teacher.gender}</Badge>
    ) },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (teacher) => (
        <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
          <Link to={`/teachers/${teacher.id}`} title="View" className="rounded-lg p-2 text-sky-600 transition hover:bg-sky-50">
            <Eye size={16} />
          </Link>
          <Link to={`/teachers/edit/${teacher.id}`} title="Edit" className="rounded-lg p-2 text-amber-600 transition hover:bg-amber-50">
            <Pencil size={16} />
          </Link>
          <button
            type="button"
            onClick={() => setDeleteTarget(teacher)}
            title="Delete"
            className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50"
          >
            <Trash2 size={16} />
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
          <>
            <Select
              name="subjectFilter"
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
              options={SUBJECT_OPTIONS}
              placeholder="All Subjects"
              className="w-44"
            />
            {subjectFilter && (
              <Button variant="ghost" size="sm" onClick={() => setSubjectFilter('')}>
                Clear
              </Button>
            )}
          </>
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
