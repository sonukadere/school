import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, FileText, ArrowRight, Printer, Monitor } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../utils/helpers'

function ExamList() {
  const { showToast } = useToast()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadExams = async () => {
    setLoading(true)
    const data = await api.getExams()
    setExams(data)
    setLoading(false)
  }

  useEffect(() => {
    loadExams()
  }, [])

  const handleDelete = async () => {
    setDeleting(true)
    await api.deleteExam(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    showToast(`Exam ${deleteTarget.name} deleted`, 'success')
    loadExams()
  }

  const columns = [
    {
      key: 'name',
      header: 'Exam',
      searchValue: (item) => `${item.name} ${item.className} ${item.subject} ${item.id}`,
      render: (item) => (
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.type === 'DIGITAL' ? 'bg-purple-50 text-purple-600' : 'bg-violet-50 text-violet-600'}`}>
            {item.type === 'DIGITAL' ? <Monitor size={18} /> : <FileText size={18} />}
          </span>
          <div>
            <p className="font-semibold text-slate-900">{item.name}</p>
            <p className="text-xs text-slate-500">{item.id}</p>
          </div>
        </div>
      ),
    },
    { key: 'className', header: 'Class', render: (item) => item.className },
    { key: 'subject', header: 'Subject', render: (item) => (
      <Badge className="bg-sky-100 text-sky-700">{item.subject}</Badge>
    ) },
    {
      key: 'type',
      header: 'Mode',
      render: (item) => (
        <div className="flex flex-col gap-0.5">
          <Badge className={item.type === 'DIGITAL' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}>
            {item.type === 'DIGITAL' ? 'Digital Online' : 'Paper Exam'}
          </Badge>
          <span className="text-[11px] text-slate-500">
            {item.questionCount || 0} Questions • {item.totalMarks || 100}M
          </span>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (item) => {
        const upcoming = new Date(item.date) >= new Date()
        return (
          <div>
            <p className="text-slate-700">{formatDate(item.date)}</p>
            {upcoming && <Badge className="mt-1 bg-emerald-100 text-emerald-700">Upcoming</Badge>}
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Link
            to={`/exams/${item.id}/paper`}
            title="Question Paper & Answer Key"
            className="rounded-lg p-2 text-indigo-600 transition hover:bg-indigo-50"
          >
            <Printer size={16} />
          </Link>
          {item.type === 'DIGITAL' && (
            <Link
              to={`/exams/${item.id}/attempt`}
              title="Take / Preview Online Exam"
              className="rounded-lg p-2 text-purple-600 transition hover:bg-purple-50"
            >
              <Monitor size={16} />
            </Link>
          )}
          <Link to="/marks/results" title="View Results" className="rounded-lg p-2 text-sky-600 transition hover:bg-sky-50">
            <ArrowRight size={16} />
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
        title="Exams"
        description="Schedule and manage examinations"
        breadcrumb={[{ label: 'Exams' }]}
        actions={
          <Link to="/exams/create">
            <Button leftIcon={Plus}>Create Exam</Button>
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={exams}
        loading={loading}
        pageSize={8}
        searchPlaceholder="Search by exam name, class or subject..."
        emptyTitle="No exams scheduled"
        emptyDescription="Create an exam to get started."
        emptyIcon={FileText}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Exam"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
      />
    </div>
  )
}

export default ExamList
