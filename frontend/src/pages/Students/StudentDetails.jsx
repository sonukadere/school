import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Mail, Phone, MapPin, GraduationCap } from 'lucide-react'
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

function StudentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [student, setStudent] = useState(null)
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let mounted = true
    Promise.all([api.getStudent(id), api.getFees()])
      .then(([studentData, feeData]) => {
        if (mounted) {
          setStudent(studentData)
          setFees(feeData.filter((fee) => fee.studentId === id))
          setLoading(false)
        }
      })
      .catch(() => {
        if (mounted) {
          setLoading(false)
          showToast('Student not found', 'error')
          navigate('/students')
        }
      })
    return () => {
      mounted = false
    }
  }, [id, navigate, showToast])

  const handleDelete = async () => {
    setDeleting(true)
    await api.deleteStudent(id)
    setDeleting(false)
    showToast('Student deleted successfully', 'success')
    navigate('/students')
  }

  if (loading) return <Loader fullScreen label="Loading student details..." />
  if (!student) return null

  const totalPaid = fees.reduce((sum, fee) => sum + fee.paidFee, 0)
  const totalDue = fees.reduce((sum, fee) => sum + (fee.totalFee - fee.paidFee), 0)

  return (
    <div>
      <PageHeader
        title="Student Details"
        breadcrumb={[
          { label: 'Students', href: '/students' },
          { label: student.fullName },
        ]}
        actions={
          <>
            <Link to="/students">
              <Button variant="outline" leftIcon={ArrowLeft}>
                Back
              </Button>
            </Link>
            <Link to={`/students/edit/${id}`}>
              <Button variant="outline" leftIcon={Pencil}>
                Edit
              </Button>
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
            {student.photo ? (
              <img src={student.photo} alt={student.fullName} className="h-24 w-24 rounded-2xl object-cover shadow-md" />
            ) : (
              <Avatar name={student.fullName} size="xl" className="rounded-2xl" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{student.fullName}</h2>
                <Badge className="bg-indigo-100 text-indigo-700">{student.className} - {student.section}</Badge>
                <Badge className={STATUS_STYLES[student.gender]}>{student.gender}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">Student ID: {student.id}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1.5"><Mail size={15} className="text-slate-400" />{student.email}</span>
                <span className="flex items-center gap-1.5"><Phone size={15} className="text-slate-400" />{student.phone}</span>
                <span className="flex items-center gap-1.5"><MapPin size={15} className="text-slate-400" />{student.address}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><GraduationCap size={22} /></div>
            <div>
              <p className="text-xs text-slate-500">Roll Number</p>
              <p className="text-lg font-bold text-slate-900">{student.rollNumber}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Phone size={22} /></div>
            <div>
              <p className="text-xs text-slate-500">Total Fees Paid</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><MapPin size={22} /></div>
            <div>
              <p className="text-xs text-slate-500">Fees Due</p>
              <p className="text-lg font-bold text-rose-600">{formatCurrency(totalDue)}</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="Personal Information" className="h-fit">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <InfoItem label="Full Name" value={student.fullName} />
              <InfoItem label="Student ID" value={student.id} />
              <InfoItem label="Father Name" value={student.fatherName} />
              <InfoItem label="Mother Name" value={student.motherName} />
              <InfoItem label="Gender" value={student.gender} />
              <InfoItem label="Date of Birth" value={formatDate(student.dob)} />
            </div>
          </Card>

          <Card title="Academic Information" className="h-fit">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <InfoItem label="Class" value={student.className} />
              <InfoItem label="Section" value={student.section} />
              <InfoItem label="Roll Number" value={student.rollNumber} />
              <InfoItem label="Admission Date" value={formatDate(student.admissionDate)} />
              <InfoItem label="Email Address" value={student.email} />
              <InfoItem label="Phone Number" value={student.phone} />
              <div className="sm:col-span-2">
                <InfoItem label="Address" value={student.address} />
              </div>
            </div>
          </Card>
        </div>

        {fees.length > 0 && (
          <Card title="Fee Records">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50">
                  <tr>
                    {['Total Fee', 'Paid Fee', 'Due Fee', 'Payment Date', 'Status'].map((header) => (
                      <th key={header} className="px-5 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fees.map((fee) => (
                    <tr key={fee.id}>
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{formatCurrency(fee.totalFee)}</td>
                      <td className="px-5 py-3.5 text-sm text-emerald-600">{formatCurrency(fee.paidFee)}</td>
                      <td className="px-5 py-3.5 text-sm text-rose-600">{formatCurrency(fee.totalFee - fee.paidFee)}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{formatDate(fee.paymentDate)}</td>
                      <td className="px-5 py-3.5"><Badge className={STATUS_STYLES[fee.status]}>{fee.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Student"
        message={`Are you sure you want to delete ${student.fullName}? This action cannot be undone.`}
      />
    </div>
  )
}

export default StudentDetails
