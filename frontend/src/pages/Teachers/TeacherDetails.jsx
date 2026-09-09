import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Mail, Phone, MapPin, BookOpen, CalendarDays, KeyRound } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Avatar from '../../components/common/Avatar'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Loader from '../../components/common/Loader'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
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
  const { user } = useAuth()
  const { showToast } = useToast()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.isSuperAdmin
  const [teacher, setTeacher] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Portal Account Credentials Modal
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [resetUsername, setResetUsername] = useState('')
  const [resetPassword, setResetPassword] = useState('teacher123')
  const [resetting, setResetting] = useState(false)

  const handleResetCredentials = async (e) => {
    e.preventDefault()
    setResetting(true)
    try {
      await api.resetTeacherCredentials(id, {
        username: resetUsername,
        password: resetPassword,
      })
      setResetting(false)
      setResetModalOpen(false)
      showToast('Faculty portal credentials updated successfully!', 'success')
      // Refresh teacher details to show updated user info
      const refreshed = await api.getTeacher(id)
      setTeacher(refreshed)
    } catch (err) {
      setResetting(false)
      showToast(err.message || 'Failed to update credentials', 'error')
    }
  }

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
                {teacher.gender && <Badge className={STATUS_STYLES[teacher.gender]}>{teacher.gender}</Badge>}
              </div>
              <p className="mt-1 text-sm text-slate-500">Teacher ID: {teacher.teacherId || teacher.id}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1.5"><Mail size={15} className="text-slate-400" />{teacher.email}</span>
                <span className="flex items-center gap-1.5"><Phone size={15} className="text-slate-400" />{teacher.phone}</span>
                <span className="flex items-center gap-1.5"><MapPin size={15} className="text-slate-400" />{teacher.address}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className={`grid grid-cols-1 gap-4 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
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
          {isAdmin && (
            <Card className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Mail size={22} /></div>
              <div>
                <p className="text-xs text-slate-500">Monthly Salary</p>
                <p className="text-lg font-bold text-amber-600">{formatCurrency(teacher.salary)}</p>
              </div>
            </Card>
          )}
        </div>

        <Card title="Teacher Information" className="h-fit">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="Full Name" value={teacher.name} />
            <InfoItem label="Teacher ID" value={teacher.teacherId || teacher.id} />
            <InfoItem label="Gender" value={teacher.gender} />
            <InfoItem label="Subject" value={teacher.subject} />
            <InfoItem label="Qualification" value={teacher.qualification} />
            <InfoItem label="Joining Date" value={formatDate(teacher.joiningDate)} />
            {isAdmin && <InfoItem label="Monthly Salary" value={formatCurrency(teacher.salary)} />}
            <InfoItem label="Email Address" value={teacher.email} />
            <InfoItem label="Phone Number" value={teacher.phone} />
            <div className="sm:col-span-2 lg:col-span-3">
              <InfoItem label="Address" value={teacher.address} />
            </div>
          </div>
        </Card>

        {/* Faculty Portal Authentication & Login Card */}
        <Card title="Faculty Portal Authentication & Login" className="h-fit">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-1">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Portal Account Status:</span>
                <Badge className={teacher.user ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                  {teacher.user ? 'Active & Linked' : 'Not Linked'}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-6 pt-1 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">Faculty Login ID / Username:</span>
                  <span className="font-mono font-bold text-slate-900">{teacher.user?.username || teacher.teacherId || 'None'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Teacher ID:</span>
                  <span className="font-mono font-bold text-violet-600">{teacher.teacherId || teacher.id}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Account Email:</span>
                  <span className="text-slate-700">{teacher.user?.email || teacher.email || '—'}</span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={KeyRound}
              onClick={() => {
                setResetUsername(teacher.user?.username || (teacher.teacherId ? teacher.teacherId.toLowerCase().replace(/[^a-z0-9_-]/g, '') : ''))
                setResetPassword('teacher123')
                setResetModalOpen(true)
              }}
              className="text-violet-600 border-violet-200 hover:bg-violet-50 shrink-0"
            >
              {teacher.user ? 'Reset Password / Login ID' : 'Set Up Portal Account'}
            </Button>
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

      {/* Reset Portal Credentials Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="text-violet-600" size={20} />
              {teacher.user ? 'Reset Faculty Credentials' : 'Set Up Faculty Portal Account'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Configure login credentials for <strong>{teacher.name}</strong> ({teacher.teacherId || teacher.id}).
            </p>

            <form onSubmit={handleResetCredentials} className="mt-5 space-y-4">
              <Input
                label="Faculty Login ID / Username"
                value={resetUsername}
                onChange={(e) => setResetUsername(e.target.value)}
                placeholder="e.g. TCH-001 or custom username"
                required
                helper="The teacher can log in using this username or their Teacher ID"
              />
              <Input
                label="New Password"
                type="text"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Enter password (min 6 characters)"
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setResetModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={resetting}>
                  Save Credentials
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherDetails

