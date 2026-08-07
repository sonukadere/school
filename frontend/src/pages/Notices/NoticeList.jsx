import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, Megaphone } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { STATUS_STYLES, formatDate } from '../../utils/helpers'

function NoticeList() {
  const { showToast } = useToast()
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadNotices = async () => {
    setLoading(true)
    const data = await api.getNotices()
    setNotices(data)
    setLoading(false)
  }

  useEffect(() => {
    loadNotices()
  }, [])

  const handleDelete = async () => {
    setDeleting(true)
    await api.deleteNotice(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    showToast('Notice deleted', 'success')
    loadNotices()
  }

  const columns = [
    {
      key: 'title',
      header: 'Title',
      searchValue: (item) => `${item.title} ${item.description} ${item.priority}`,
      render: (item) => (
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Megaphone size={18} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{item.title}</p>
            <p className="truncate text-xs text-slate-500">{item.description}</p>
          </div>
        </div>
      ),
    },
    { key: 'date', header: 'Published', render: (item) => formatDate(item.date) },
    { key: 'priority', header: 'Priority', render: (item) => (
      <Badge className={STATUS_STYLES[item.priority]}>{item.priority}</Badge>
    ) },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <button
          type="button"
          onClick={() => setDeleteTarget(item)}
          title="Delete"
          className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50"
        >
          <Trash2 size={16} />
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Notice Board"
        description="Publish and manage announcements for students and staff"
        breadcrumb={[{ label: 'Notice Board' }]}
        actions={
          <Link to="/notices/create">
            <Button leftIcon={Plus}>Create Notice</Button>
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={notices}
        loading={loading}
        pageSize={8}
        searchPlaceholder="Search notices..."
        emptyTitle="No notices published"
        emptyDescription="Create a notice to announce it."
        emptyIcon={Megaphone}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Notice"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
      />
    </div>
  )
}

export default NoticeList
