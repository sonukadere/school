import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Mail, Phone, MapPin, BookOpen, CalendarDays } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Avatar from '../../components/common/Avatar'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Card from '../../components/common/Card'
import Loader from '../../components/common/Loader'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { STATUS_STYLES, formatDate, formatCurrency } from '../../utils/helpers'

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value || '—'}</p>
    </div>
  )
}

function TeacherDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [teacher, setTeacher] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let mounted = true
    api.getTeacher(id).then((data) => {
      if (mounted) {
        setTeacher(data)
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) {
        setLoading(false)
        showToast('Teacher not found', 'error')
        navigate('/teachers')
      }
    })
    return () => {
      mounted = false
    }
  }, [id, navigate, showToast])

  const handleDelete = async () => {
    setDeleting(true)
    await api.deleteTeacher(id)
    setDeleting(false)
    showToast('Teacher deleted successfully', 'success')
    navigate('/teachers')
  }

  if (loading) return <Loader fullScreen label="Loading teacher details..." />
  if (!teacher) return null

  return (
    <div>
      <PageHeader
        title="Teacher Details"
        breadcrumb={[
          { label: 'Teachers', href: '/teachers' },
          { label: teacher.name },
        ]}
        actions={
          <>
            <Link to="/teachers">
              <Button variant="outline" leftIcon={ArrowLeft}>Back</Button>
            </Link>
            <Link to={`/teachers/edit/${id}`}>
              <Button variant="outline" leftIcon={Pencil}>Edit</Button>
            </Link>
            <Button variant="danger" leftIcon={Trash2} onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
          </>
        }
      />

      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {teacher.photo ? (
              <img src={teacher.photo} alt={teacher.name} className="h-24 w-24 rounded-2xl object-cover shadow-md" />
            ) : (
              <Avatar name={teacher.name} size="xl" className="rounded-2xl" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{teacher.name}</h2>
                <Badge className="bg-violet-100 text-violet-700">{teacher.subject}</Badge>
                <Badge className={STATUS_STYLES[teacher.gender]}>{teacher.gender}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">Teacher ID: {teacher.id}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1.5"><Mail size={15} className="text-slate-400" />{teacher.email}</span>
                <span className="flex items-center gap-1.5"><Phone size={15} className="text-slate-400" />{teacher.phone}</span>
                <span className="flex items-center gap-1.5"><MapPin size={15} className="text-slate-400" />{teacher.address}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><BookOpen size={22} /></div>
            <div>
              <p className="text-xs text-slate-500">Subject</p>
              <p className="text-lg font-bold text-slate-900">{teacher.subject}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CalendarDays size={22} /></div>
            <div>
              <p className="text-xs text-slate-500">Joined</p>
              <p className="text-lg font-bold text-slate-900">{formatDate(teacher.joiningDate)}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Mail size={22} /></div>
            <div>
              <p className="text-xs text-slate-500">Monthly Salary</p>
              <p className="text-lg font-bold text-amber-600">{formatCurrency(teacher.salary)}</p>
            </div>
          </Card>
        </div>

        <Card title="Teacher Information" className="h-fit">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="Full Name" value={teacher.name} />
            <InfoItem label="Teacher ID" value={teacher.id} />
            <InfoItem label="Gender" value={teacher.gender} />
            <InfoItem label="Subject" value={teacher.subject} />
            <InfoItem label="Qualification" value={teacher.qualification} />
            <InfoItem label="Joining Date" value={formatDate(teacher.joiningDate)} />
            <InfoItem label="Monthly Salary" value={formatCurrency(teacher.salary)} />
            <InfoItem label="Email Address" value={teacher.email} />
            <InfoItem label="Phone Number" value={teacher.phone} />
            <div className="sm:col-span-2 lg:col-span-3">
              <InfoItem label="Address" value={teacher.address} />
            </div>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Teacher"
        message={`Are you sure you want to delete ${teacher.name}? This action cannot be undone.`}
      />
    </div>
  )
}

export default TeacherDetails
