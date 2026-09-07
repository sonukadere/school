import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Mail, Phone, MapPin, GraduationCap, FileText, KeyRound, Wallet, Receipt, History, Printer } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Avatar from '../../components/common/Avatar'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Loader from '../../components/common/Loader'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import MarksheetModal from '../../components/marksheets/MarksheetModal'
import TransferCertificateModal from '../../components/certificates/TransferCertificateModal'
import GenerateTcModal from '../../components/certificates/GenerateTcModal'
import RecordPaymentModal from '../../components/payments/RecordPaymentModal'
import PaymentReceiptModal from '../../components/payments/PaymentReceiptModal'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
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
  const { user } = useAuth()
  const { showToast } = useToast()
  const [student, setStudent] = useState(null)
  const [fees, setFees] = useState([])
  const [feeLedger, setFeeLedger] = useState(null)
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Payment & Receipt modals
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [selectedReceiptId, setSelectedReceiptId] = useState(null)
  const [activeFeeTab, setActiveFeeTab] = useState('invoices') // 'invoices' | 'payments'

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.isSuperAdmin
  const isTeacher = user?.role === 'TEACHER' || user?.isTeacher

  // Document modals
  const [marksheetModalOpen, setMarksheetModalOpen] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState(null)
  const [tcModalOpen, setTcModalOpen] = useState(false)
  const [generateTcOpen, setGenerateTcOpen] = useState(false)
  const [existingTc, setExistingTc] = useState(null)

  // Portal Account Credentials Modal
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [resetUsername, setResetUsername] = useState('')
  const [resetPassword, setResetPassword] = useState('student123')
  const [resetting, setResetting] = useState(false)

  const handleResetCredentials = async (e) => {
    e.preventDefault()
    setResetting(true)
    try {
      await api.resetStudentCredentials(id, {
        username: resetUsername,
        password: resetPassword,
      })
      setResetting(false)
      setResetModalOpen(false)
      showToast('Student portal credentials updated successfully!', 'success')
      // Refresh student details to show updated user info
      const refreshed = await api.getStudent(id)
      setStudent(refreshed)
    } catch (err) {
      setResetting(false)
      showToast(err.message || 'Failed to update credentials', 'error')
    }
  }

  const loadStudentData = () => {
    return Promise.all([
      api.getStudent(id),
      api.getFees(),
      api.getExams(),
      api.getStudentTransferCertificate(id).catch(() => null),
      api.getStudentFeeLedger(id).catch(() => null),
    ])
      .then(([studentData, feeData, examData, tcData, ledgerData]) => {
        setStudent(studentData)
        setFees(feeData.filter((fee) => fee.studentId === id))
        setExams(examData)
        setExistingTc(tcData)
        setFeeLedger(ledgerData?.data || ledgerData)
        if (examData.length > 0) {
          setSelectedExamId(examData[0].id)
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
        showToast('Student not found', 'error')
        navigate('/students')
      })
  }

  useEffect(() => {
    loadStudentData()
  }, [id, navigate, showToast])

  const handleOpenMarksheet = () => {
    if (!exams.length) {
      showToast('No examination records found for marksheet generation.', 'info')
      return
    }
    setMarksheetModalOpen(true)
  }

  const handleOpenTc = () => {
    if (existingTc) {
      setTcModalOpen(true)
    } else {
      setGenerateTcOpen(true)
    }
  }

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
            <Button variant="outline" leftIcon={GraduationCap} onClick={handleOpenMarksheet}>
              Marksheet
            </Button>
            <Button variant="outline" leftIcon={FileText} onClick={handleOpenTc}>
              Transfer Certificate
            </Button>
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

      <div className="space-y-4 sm:space-y-6">
        <Card bodyClassName="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:gap-6 sm:flex-row sm:items-center">
            {student.photo ? (
              <img src={student.photo} alt={student.fullName} className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover shadow-md mx-auto sm:mx-0" />
            ) : (
              <Avatar name={student.fullName} size="xl" className="rounded-2xl mx-auto sm:mx-0" />
            )}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-bold text-slate-900">{student.fullName}</h2>
                <Badge className="bg-indigo-100 text-indigo-700">{student.className} - {student.section}</Badge>
                <Badge className={STATUS_STYLES[student.gender]}>{student.gender}</Badge>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 font-mono">Student ID: {student.studentId || student.id}</p>
              <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-slate-600">
                <span className="flex items-center gap-1.5"><Mail size={15} className="text-slate-400" />{student.email}</span>
                <span className="flex items-center gap-1.5"><Phone size={15} className="text-slate-400" />{student.phone}</span>
                <span className="flex items-center gap-1.5"><MapPin size={15} className="text-slate-400" />{student.address}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <Card bodyClassName="flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><GraduationCap size={22} /></div>
            <div>
              <p className="text-xs text-slate-500">Roll Number</p>
              <p className="text-base sm:text-lg font-bold text-slate-900">{student.rollNumber}</p>
            </div>
          </Card>
          <Card bodyClassName="flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Phone size={22} /></div>
            <div>
              <p className="text-xs text-slate-500">Total Fees Paid</p>
              <p className="text-base sm:text-lg font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
            </div>
          </Card>
          <Card bodyClassName="flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><MapPin size={22} /></div>
            <div>
              <p className="text-xs text-slate-500">Fees Due</p>
              <p className="text-base sm:text-lg font-bold text-rose-600">{formatCurrency(totalDue)}</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="Personal Information" className="h-fit">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <InfoItem label="Full Name" value={student.fullName} />
              <InfoItem label="Student ID" value={student.studentId || student.id} />
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

          {/* Portal Authentication & Login Card */}
          <Card title="Portal Authentication & Login" className="h-fit lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-1">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Portal Account Status:</span>
                  <Badge className={student.user ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                    {student.user ? 'Active & Linked' : 'Not Linked'}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-6 pt-1 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block">Student Login ID / Username:</span>
                    <span className="font-mono font-bold text-slate-900">{student.user?.username || student.studentId || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Student ID:</span>
                    <span className="font-mono font-bold text-indigo-600">{student.studentId}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Account Email:</span>
                    <span className="text-slate-700">{student.user?.email || student.email || '—'}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={KeyRound}
                onClick={() => {
                  setResetUsername(student.user?.username || student.studentId?.toLowerCase() || '')
                  setResetPassword('student123')
                  setResetModalOpen(true)
                }}
                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 shrink-0"
              >
                {student.user ? 'Reset Password / Login ID' : 'Set Up Portal Account'}
              </Button>
            </div>
          </Card>
        </div>

        {/* FEE & PAYMENT MANAGEMENT SECTION */}
        <Card
          title="Student Fee & Payment Management"
          subtitle="Real-time fee ledger, billing invoices, payment history, and official receipts"
          actions={
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={Wallet}
                  onClick={() => setRecordPaymentOpen(true)}
                >
                  Add Payment
                </Button>
              )}
            </div>
          }
        >
          {/* Dynamic Balance Sequence: Total Fee -> Paid Amount -> Pending Amount */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 block">Total Fee</span>
              <p className="mt-1 font-mono text-2xl font-bold text-slate-900">
                {formatCurrency(feeLedger?.ledger?.totalFee ?? fees.reduce((sum, f) => sum + f.totalFee, 0))}
              </p>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Total assessed fee</span>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block">Paid Amount</span>
              <p className="mt-1 font-mono text-2xl font-bold text-emerald-600">
                {formatCurrency(feeLedger?.ledger?.paidAmount ?? fees.reduce((sum, f) => sum + f.paidFee, 0))}
              </p>
              <span className="text-[11px] text-emerald-600 mt-0.5 block">Cleared payments</span>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 block">Pending Amount</span>
              <p className="mt-1 font-mono text-2xl font-bold text-rose-600">
                {formatCurrency(
                  feeLedger?.ledger?.pendingAmount ??
                  Math.max(
                    fees.reduce((sum, f) => sum + f.totalFee, 0) - fees.reduce((sum, f) => sum + f.paidFee, 0),
                    0
                  )
                )}
              </p>
              <span className="text-[11px] text-rose-600 mt-0.5 block">Outstanding balance</span>
            </div>
          </div>

          {/* Sub-tabs: Invoices / Payment History */}
          <div className="flex border-b border-slate-200 mb-4 gap-4 text-xs font-semibold">
            <button
              onClick={() => setActiveFeeTab('invoices')}
              className={`pb-2 border-b-2 transition ${
                activeFeeTab === 'invoices'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Fee Invoices / Dues ({feeLedger?.invoices?.length || fees.length})
            </button>
            <button
              onClick={() => setActiveFeeTab('payments')}
              className={`pb-2 border-b-2 transition ${
                activeFeeTab === 'payments'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Payment History & Receipts ({feeLedger?.payments?.length || 0})
            </button>
          </div>

          {/* Tab 1: Invoices */}
          {activeFeeTab === 'invoices' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Invoice #</th>
                    <th className="px-4 py-2.5">Fee Head</th>
                    <th className="px-4 py-2.5">Total Fee</th>
                    <th className="px-4 py-2.5">Paid</th>
                    <th className="px-4 py-2.5">Pending Due</th>
                    <th className="px-4 py-2.5">Due Date</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feeLedger?.invoices?.length > 0 ? (
                    feeLedger.invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{inv.feeType}</td>
                        <td className="px-4 py-3 font-mono">{formatCurrency(inv.totalFee)}</td>
                        <td className="px-4 py-3 font-mono text-emerald-600">{formatCurrency(inv.paidAmount)}</td>
                        <td className="px-4 py-3 font-mono font-bold text-rose-600">{formatCurrency(inv.pendingAmount)}</td>
                        <td className="px-4 py-3 text-slate-500">{inv.dueDate ? formatDate(inv.dueDate) : '—'}</td>
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              inv.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : inv.status === 'PARTIAL'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }
                          >
                            {inv.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : fees.length > 0 ? (
                    fees.map((fee) => (
                      <tr key={fee.id}>
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600">INV-LEGACY</td>
                        <td className="px-4 py-3 font-medium text-slate-900">General Tuition Fee</td>
                        <td className="px-4 py-3 font-mono">{formatCurrency(fee.totalFee)}</td>
                        <td className="px-4 py-3 font-mono text-emerald-600">{formatCurrency(fee.paidFee)}</td>
                        <td className="px-4 py-3 font-mono font-bold text-rose-600">{formatCurrency(fee.dueFee)}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(fee.paymentDate)}</td>
                        <td className="px-4 py-3"><Badge className={STATUS_STYLES[fee.status]}>{fee.status}</Badge></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                        No billing invoices recorded for this student.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 2: Payment History & Receipts */}
          {activeFeeTab === 'payments' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Receipt #</th>
                    <th className="px-4 py-2.5">Payment Date</th>
                    <th className="px-4 py-2.5">Fee Head</th>
                    <th className="px-4 py-2.5">Method</th>
                    <th className="px-4 py-2.5">Amount Paid</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Receipt Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feeLedger?.payments?.length > 0 ? (
                    feeLedger.payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600">{p.receiptNumber}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(p.paymentDate)}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{p.feeType}</td>
                        <td className="px-4 py-3 font-mono text-[11px]">{p.paymentMethod}</td>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                        <td className="px-4 py-3">
                          <Badge className={p.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                            {p.paymentStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={Receipt}
                            onClick={() => {
                              setSelectedReceiptId(p.receiptNumber || p.id)
                              setReceiptModalOpen(true)
                            }}
                          >
                            View Receipt
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                        No payments recorded yet for this student.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Record Payment Modal for this Student */}
      <RecordPaymentModal
        open={recordPaymentOpen}
        onClose={() => setRecordPaymentOpen(false)}
        preselectedStudent={student}
        onPaymentSuccess={(result) => {
          loadStudentData()
          const rcpt = result?.receipt?.receiptNumber || result?.payment?.receiptNumber
          if (rcpt) {
            setSelectedReceiptId(rcpt)
            setReceiptModalOpen(true)
          }
        }}
      />

      {/* Official Payment Receipt Modal */}
      <PaymentReceiptModal
        open={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false)
          setSelectedReceiptId(null)
        }}
        receiptNumberOrId={selectedReceiptId}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Student"
        message={`Are you sure you want to delete ${student.fullName}? This action cannot be undone.`}
      />

      {/* Marksheet Modal */}
      {selectedExamId && (
        <MarksheetModal
          open={marksheetModalOpen}
          onClose={() => setMarksheetModalOpen(false)}
          studentId={id}
          examId={selectedExamId}
        />
      )}

      {/* Transfer Certificate Modal */}
      <TransferCertificateModal
        open={tcModalOpen}
        onClose={() => setTcModalOpen(false)}
        studentId={id}
        initialCertificate={existingTc}
        onStatusChange={(updated) => setExistingTc(updated)}
      />

      {/* Generate TC Modal */}
      <GenerateTcModal
        open={generateTcOpen}
        onClose={() => setGenerateTcOpen(false)}
        student={student}
        onGenerated={(newTc) => {
          setExistingTc(newTc)
          setTcModalOpen(true)
        }}
      />

      {/* Reset Portal Credentials Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="text-indigo-600" size={20} />
              {student.user ? 'Reset Student Credentials' : 'Set Up Student Portal Account'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Configure login credentials for <strong>{student.fullName}</strong> ({student.studentId}).
            </p>

            <form onSubmit={handleResetCredentials} className="mt-5 space-y-4">
              <Input
                label="Student Login ID / Username"
                value={resetUsername}
                onChange={(e) => setResetUsername(e.target.value)}
                placeholder="e.g. STU-001 or custom username"
                required
                helper="The student can log in using this username or their Student ID"
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

export default StudentDetails
