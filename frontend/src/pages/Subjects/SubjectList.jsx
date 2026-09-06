import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, BookOpen } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'

function SubjectList() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const roleUpper = (user?.role || '').toUpperCase()
  const isAdmin = roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN'

  const loadSubjects = async () => {
    setLoading(true)
    const data = await api.getSubjects()
    setSubjects(data)
    setLoading(false)
  }

  useEffect(() => {
    loadSubjects()
  }, [])

  const handleDelete = async () => {
    setDeleting(true)
    await api.deleteSubject(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    showToast(`Subject ${deleteTarget.name} deleted`, 'success')
    loadSubjects()
  }

  const baseColumns = [
    {
      key: 'name',
      header: 'Subject',
      searchValue: (item) => `${item.name} ${item.code} ${item.className} ${item.assignedTeacher}`,
      render: (item) => (
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <BookOpen size={18} />
          </span>
          <div>
            <p className="font-semibold text-slate-900">{item.name}</p>
            <p className="text-xs text-slate-500">{item.id}</p>
          </div>
        </div>
      ),
    },
    { key: 'code', header: 'Subject Code', render: (item) => (
      <Badge className="bg-slate-100 text-slate-600">{item.code}</Badge>
    ) },
    { key: 'className', header: 'Class', render: (item) => item.className },
    { key: 'assignedTeacher', header: 'Assigned Teacher', render: (item) => item.assignedTeacher },
  ]

  const columns = isAdmin
    ? [
        ...baseColumns,
        {
          key: 'actions',
          header: 'Actions',
          className: 'text-right',
          render: (item) => (
            <div className="flex justify-end gap-1">
              <button
                type="button"
                onClick={() => setDeleteTarget(item)}
                title="Delete"
                className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ),
        },
      ]
    : baseColumns

  return (
    <div>
      <PageHeader
        title="Subjects"
        description="Manage subjects offered and their assigned teachers"
        breadcrumb={[{ label: 'Subjects' }]}
        actions={
          isAdmin ? (
            <Link to="/subjects/add">
              <Button leftIcon={Plus}>Add Subject</Button>
            </Link>
          ) : null
        }
      />

      <DataTable
        columns={columns}
        data={subjects}
        loading={loading}
        pageSize={8}
        searchPlaceholder="Search by subject, code or teacher..."
        emptyTitle="No subjects found"
        emptyDescription="Add a new subject to get started."
        emptyIcon={BookOpen}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Subject"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
      />
    </div>
  )
}

export default SubjectList
