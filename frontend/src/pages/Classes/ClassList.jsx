import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, School } from 'lucide-react'
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
    const data = await api.getClasses()
    setClasses(data)
    setLoading(false)
  }

  useEffect(() => {
    loadClasses()
  }, [])

  const handleDelete = async () => {
    setDeleting(true)
    await api.deleteClass(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    showToast(`Class ${deleteTarget.name} - ${deleteTarget.section} deleted`, 'success')
    loadClasses()
  }

  const columns = [
    {
      key: 'name',
      header: 'Class',
      searchValue: (item) => `${item.name} ${item.id} ${item.classTeacher} ${item.roomNumber}`,
      render: (item) => (
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <School size={18} />
          </span>
          <div>
            <p className="font-semibold text-slate-900">{item.name}</p>
            <p className="text-xs text-slate-500">{item.id}</p>
          </div>
        </div>
      ),
    },
    { key: 'section', header: 'Section', render: (item) => (
      <Badge className="bg-indigo-100 text-indigo-700">{item.section}</Badge>
    ) },
    { key: 'classTeacher', header: 'Class Teacher', render: (item) => item.classTeacher },
    { key: 'roomNumber', header: 'Room', render: (item) => (
      <Badge className="bg-slate-100 text-slate-600">{item.roomNumber}</Badge>
    ) },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Link to={`/classes/edit/${item.id}`} title="Edit" className="rounded-lg p-2 text-amber-600 transition hover:bg-amber-50">
            <Pencil size={16} />
          </Link>
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

  return (
    <div>
      <PageHeader
        title="Classes"
        description="Manage classes, sections and class teachers"
        breadcrumb={[{ label: 'Classes' }]}
        actions={
          <Link to="/classes/add">
            <Button leftIcon={Plus}>Add Class</Button>
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={classes}
        loading={loading}
        pageSize={8}
        searchPlaceholder="Search by class name or teacher..."
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
