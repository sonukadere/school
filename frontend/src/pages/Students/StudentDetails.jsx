import { useEffect, useState, lazy, Suspense } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Mail, Phone, MapPin, GraduationCap, FileText, KeyRound, Wallet, Receipt, Printer } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Avatar from '../../components/common/Avatar'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Loader from '../../components/common/Loader'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import AdmissionFormModal from '../../components/students/AdmissionFormModal'

// Lazy load heavy document and payment modals
const MarksheetModal = lazy(() => import('../../components/marksheets/MarksheetModal'))
const TransferCertificateModal = lazy(() => import('../../components/certificates/TransferCertificateModal'))
const GenerateTcModal = lazy(() => import('../../components/certificates/GenerateTcModal'))
const RecordPaymentModal = lazy(() => import('../../components/payments/RecordPaymentModal'))
const PaymentReceiptModal = lazy(() => import('../../components/payments/PaymentReceiptModal'))

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
  const [feeTab, setFeeTab] = useState('invoices') // 'invoices' | 'payments'

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.isSuperAdmin
  const isTeacher = user?.role === 'TEACHER' || user?.isTeacher

  const getInvoiceBadgeVariant = (status) => {
    if (status === 'PAID') return 'success'
    if (status === 'PARTIAL') return 'warning'
    return 'danger'
  }

  // Document modals
  const [marksheetModalOpen, setMarksheetModalOpen] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState(null)
  const [tcModalOpen, setTcModalOpen] = useState(false)
  const [generateTcOpen, setGenerateTcOpen] = useState(false)
  const [existingTc, setExistingTc] = useState(null)
  const [admissionModalOpen, setAdmissionModalOpen] = useState(false)

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

  // Real-time dynamic sync: auto-reload when payment is recorded
  useEffect(() => {
    const handlePayment = () => {
      loadStudentData()
    }
    window.addEventListener('sms:payment-recorded', handlePayment)
    return () => {
      window.removeEventListener('sms:payment-recorded', handlePayment)
    }
  }, [id])

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

  const totalFee = feeLedger?.ledger?.totalFee ?? fees.reduce((sum, f) => sum + (f.totalFee || 0), 0)
  const totalPaid = feeLedger?.ledger?.paidAmount ?? fees.reduce((sum, f) => sum + (f.paidFee || 0), 0)
  const totalDue = feeLedger?.ledger?.pendingAmount ?? Math.max(totalFee - totalPaid, 0)
  const invoices = feeLedger?.invoices || []
  const payments = feeLedger?.payments || []

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
            <Button variant="primary" leftIcon={Printer} onClick={() => setAdmissionModalOpen(true)}>
              Print Admission Form (प्रवेश फार्म)
            </Button>
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
              <img src={student.photo} alt={student.fullName} className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover shadow-md mx-auto sm:mx-0 border-2 border-indigo-100" />
            ) : (
              <Avatar name={student.fullName} size="xl" className="rounded-2xl mx-auto sm:mx-0" />
            )}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-bold text-slate-900">{student.fullName}</h2>
                {student.nameInHindi && (
                  <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                    {student.nameInHindi}
                  </span>
                )}
                <Badge className="bg-indigo-100 text-indigo-700">{student.className} - {student.section}</Badge>
                <Badge className={STATUS_STYLES[student.gender]}>{student.gender}</Badge>
                {student.category && (
                  <Badge variant="outline" className="font-bold text-indigo-600 border-indigo-200">
                    {student.category}
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs sm:text-sm text-slate-500 font-mono">
                <span>Student ID: <strong className="text-slate-800">{student.studentId || student.id}</strong></span>
                {student.scholarNo && <span>Scholar No: <strong className="text-slate-800">{student.scholarNo}</strong></span>}
                {student.formNo && <span>Form No: <strong className="text-slate-800">{student.formNo}</strong></span>}
                <span>Medium: <strong className="text-slate-800 uppercase">{student.medium || 'HINDI'}</strong></span>
              </div>
              <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-slate-600">
                <span className="flex items-center gap-1.5"><Mail size={15} className="text-slate-400" />{student.email || '—'}</span>
                <span className="flex items-center gap-1.5"><Phone size={15} className="text-slate-400" />{student.phone || '—'}</span>
                <span className="flex items-center gap-1.5"><MapPin size={15} className="text-slate-400" />{student.address || student.colony || 'Indore'}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <Card bodyClassName="flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><GraduationCap size={22} /></div>
            <div>
              <p className="text-xs text-slate-500">Roll Number</p>
              <p className="text-base sm:text-lg font-bold text-slate-900">{student.rollNumber || '—'}</p>
            </div>
          </Card>
          {!isTeacher && isAdmin && (
            <>
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
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Card 1: Personal & Family Information */}
          <Card title="Personal & Family Information (विद्यार्थी व पालक विवरण)" className="h-fit">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoItem label="Student Name (English)" value={student.fullName} />
              <InfoItem label="विद्यार्थी का नाम (हिन्दी)" value={student.nameInHindi} />
              <InfoItem label="Father's Name" value={student.fatherName} />
              <InfoItem label="पिता का नाम (हिन्दी)" value={student.fatherNameHindi} />
              <InfoItem label="Mother's Name" value={student.motherName} />
              <InfoItem label="माता का नाम (हिन्दी)" value={student.motherNameHindi} />
              <InfoItem label="Occupation (व्यवसाय)" value={student.occupation} />
              <InfoItem label="Income (आय)" value={student.annualIncome ? `₹ ${student.annualIncome}` : '—'} />
              <InfoItem label="Gender" value={student.gender} />
              <InfoItem label="Date of Birth" value={formatDate(student.dob)} />
              <div className="sm:col-span-2">
                <InfoItem label="Date of Birth in Words (जन्म दिनांक शब्दों में)" value={student.dobInWords} />
              </div>
              <div className="sm:col-span-2">
                <InfoItem label="Age as on 1st July (1 जुलाई को आयु)" value={student.ageAsOnJuly1} />
              </div>
            </div>
          </Card>

          {/* Card 2: Academic & Admission Information */}
          <Card title="Academic & Admission Records (प्रवेश विवरण)" className="h-fit">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoItem label="Scholar No. (स्कॉलर नं.)" value={student.scholarNo || student.studentId} />
              <InfoItem label="Form No. (प्रवेश फार्म क्र.)" value={student.formNo} />
              <InfoItem label="Class (कक्षा)" value={student.className} />
              <InfoItem label="Section (सेक्शन)" value={student.section} />
              <InfoItem label="Medium (माध्यम)" value={student.medium ? (student.medium === 'HINDI' ? 'Hindi (हिन्दी)' : 'English') : 'Hindi (हिन्दी)'} />
              <InfoItem label="Roll Number" value={student.rollNumber} />
              <InfoItem label="Admission Date" value={formatDate(student.admissionDate)} />
              <InfoItem label="Student Status" value={student.status} />
              <div className="sm:col-span-2">
                <InfoItem label="संलग्न दस्तावेज (Enclosures)" value={student.enclosures} />
              </div>
            </div>
          </Card>

          {/* Card 3: Permanent Address & Contact */}
          <Card title="Permanent Address & Contact (स्थाई पता व सम्पर्क)" className="h-fit">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoItem label="H.No. (मकान नं.)" value={student.houseNo} />
              <InfoItem label="Apartment / Sector / Street" value={student.apartmentSectorStreet} />
              <InfoItem label="Colony / Area" value={student.colony} />
              <InfoItem label="District" value={student.district || 'Indore'} />
              <InfoItem label="State" value={student.state || 'Madhya Pradesh'} />
              <InfoItem label="Mobile Number" value={student.phone} />
              <InfoItem label="Email Address" value={student.email} />
              <div className="sm:col-span-2">
                <InfoItem label="Full Residential Address" value={student.address} />
              </div>
            </div>
          </Card>

          {/* Card 4: Demographics, Previous School & Government IDs */}
          <Card title="Demographics, Previous School & Govt IDs (सामाजिक व समग्र विवरण)" className="h-fit">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoItem label="Mother Tongue (मातृभाषा)" value={student.motherTongue || 'Hindi'} />
              <InfoItem label="Religion (धर्म)" value={student.religion || 'Hindu'} />
              <InfoItem label="Caste (जाति)" value={student.caste} />
              <InfoItem label="Category (वर्ग)" value={student.category || 'GEN'} />
              <InfoItem label="SSSM I.D. (समग्र आईडी - 9 अंक)" value={student.sssmId} />
              <InfoItem label="Family ID (परिवार आईडी - 8 अंक)" value={student.familyId} />
              <InfoItem label="Bank Account No. (खाता क्र.)" value={student.bankAccountNo} />
              <InfoItem label="IFSC Code" value={student.ifscCode} />
              <div className="sm:col-span-2">
                <InfoItem label="Previous School (पूर्व विद्यालय)" value={student.previousSchool} />
              </div>
              <div className="sm:col-span-2">
                <InfoItem label="पिछले विद्यालय का डायस कोड (DISE Code)" value={student.previousSchoolDiseCode} />
              </div>
            </div>
          </Card>

          {/* Card 5: FOR OFFICE USE ONLY (कार्यालयीन उपयोग व दस्तावेज सत्यापन) */}
          <Card title="Office Verification & Test Details (कार्यालयीन उपयोग व सत्यापन)" className="h-fit lg:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">Admission Status</p>
                <div className="mt-1">
                  <Badge variant={student.admissionGranted === 'NOT_GRANTED' ? 'danger' : 'success'}>
                    {student.admissionGranted === 'NOT_GRANTED' ? 'Admission Not Granted' : 'Admission Granted'}
                  </Badge>
                </div>
              </div>
              <InfoItem label="Bus Number (बस क्रमांक)" value={student.busNumber} />
              <InfoItem label="Entrance Test Date & Time" value={student.testDate ? `${formatDate(student.testDate)} ${student.testTime || ''}`.trim() : '—'} />
              <InfoItem label="Test Conducted By" value={student.testConductedBy} />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoItem label="Remarks - Test (Subject Wise)" value={student.testRemarks} />
              <InfoItem label="Interview - Parent / Guardian" value={student.interviewRemarks} />
            </div>

            {/* Document Checklist Badges */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Document Verification Checklist:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg border border-slate-200 p-2.5 bg-slate-50/60">
                  <span className="text-[11px] text-slate-500 block font-medium">Birth Certificate</span>
                  <Badge variant={student.docBirthCertificate === 'NOT_SUBMITTED' ? 'danger' : 'success'} className="mt-1">
                    {student.docBirthCertificate === 'NOT_SUBMITTED' ? 'Not Submitted' : 'Submitted'}
                  </Badge>
                </div>
                <div className="rounded-lg border border-slate-200 p-2.5 bg-slate-50/60">
                  <span className="text-[11px] text-slate-500 block font-medium">Transfer Certificate (TC)</span>
                  <Badge variant={student.docTransferCertificate === 'NOT_SUBMITTED' ? 'danger' : 'success'} className="mt-1">
                    {student.docTransferCertificate === 'NOT_SUBMITTED' ? 'Not Submitted' : 'Submitted'}
                  </Badge>
                </div>
                <div className="rounded-lg border border-slate-200 p-2.5 bg-slate-50/60">
                  <span className="text-[11px] text-slate-500 block font-medium">Caste Certificate</span>
                  <Badge variant={student.docCasteCertificate === 'NOT_SUBMITTED' ? 'danger' : student.docCasteCertificate === 'NA' ? 'secondary' : 'success'} className="mt-1">
                    {student.docCasteCertificate === 'NOT_SUBMITTED' ? 'Not Submitted' : student.docCasteCertificate === 'NA' ? 'N/A' : 'Submitted'}
                  </Badge>
                </div>
                <div className="rounded-lg border border-slate-200 p-2.5 bg-slate-50/60">
                  <span className="text-[11px] text-slate-500 block font-medium">Copy of Marksheet</span>
                  <Badge variant={student.docMarksheet === 'NOT_SUBMITTED' ? 'danger' : 'success'} className="mt-1">
                    {student.docMarksheet === 'NOT_SUBMITTED' ? 'Not Submitted' : 'Submitted'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoItem label="Pending Documents Last Date" value={formatDate(student.docPendingLastDate)} />
              <InfoItem label="Fee Deposit Due Date" value={formatDate(student.feeDepositDate)} />
              <div className="sm:col-span-2">
                <InfoItem label="Office Instruction / Remarks" value={student.officeInstructions} />
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
        {!isTeacher && isAdmin && (
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
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Total Assigned Fee</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{formatCurrency(totalFee)}</p>
                <p className="mt-0.5 text-xs text-slate-400">Total amount billed</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Total Paid</p>
                <p className="mt-1 text-2xl font-black text-emerald-700">{formatCurrency(totalPaid)}</p>
                <p className="mt-0.5 text-xs text-slate-400">Collected amount</p>
              </div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">Pending Due</p>
                <p className="mt-1 text-2xl font-black text-rose-700">{formatCurrency(totalDue)}</p>
                <p className="mt-0.5 text-xs text-slate-400">Outstanding balance</p>
              </div>
            </div>

            {/* Fee Tabs */}
            <div className="mb-4 flex flex-wrap sm:flex-nowrap gap-1 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setFeeTab('invoices')}
                className={`pb-2.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
                  feeTab === 'invoices'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Invoices & Fee Structure ({invoices.length})
              </button>
              <button
                type="button"
                onClick={() => setFeeTab('payments')}
                className={`pb-2.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
                  feeTab === 'payments'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Payment History & Receipts ({payments.length})
              </button>
            </div>

            {feeTab === 'invoices' ? (
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="min-w-[620px] w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Invoice #</th>
                      <th className="px-4 py-3">Fee Title</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Paid</th>
                      <th className="px-4 py-3">Balance</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.length > 0 ? (
                      invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 font-mono font-medium text-slate-900">
                            {inv.invoiceNumber || inv.id.slice(-6)}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {inv.title || inv.feeStructure?.name || 'Academic Fee'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(inv.dueDate)}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(inv.totalAmount || inv.amount)}</td>
                          <td className="px-4 py-3 text-emerald-600 font-medium">{formatCurrency(inv.paidAmount)}</td>
                          <td className="px-4 py-3 font-bold text-rose-600">
                            {formatCurrency((inv.totalAmount || inv.amount || 0) - (inv.paidAmount || 0))}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={getInvoiceBadgeVariant(inv.status)}>
                              {inv.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                          No fee invoices assigned yet for this student.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="min-w-[620px] w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Receipt #</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Ref/Txn</th>
                      <th className="px-4 py-3">Invoice</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.length > 0 ? (
                      payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 font-mono font-semibold text-indigo-600">
                            {p.receiptNumber || p.paymentNumber || p.id.slice(-6)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(p.paymentDate || p.createdAt)}</td>
                          <td className="px-4 py-3 font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="capitalize">
                              {p.paymentMethod || 'CASH'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.transactionId || '—'}</td>
                          <td className="px-4 py-3 text-slate-600 text-xs">
                            {p.invoice?.invoiceNumber || (p.invoiceId ? p.invoiceId.slice(-6) : '—')}
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
        )}
      </div>

      <Suspense fallback={null}>
        {/* Record Payment Modal for this Student */}
        {recordPaymentOpen && (
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
        )}

        {/* Official Payment Receipt Modal */}
        {receiptModalOpen && (
          <PaymentReceiptModal
            open={receiptModalOpen}
            onClose={() => {
              setReceiptModalOpen(false)
              setSelectedReceiptId(null)
            }}
            receiptNumberOrId={selectedReceiptId}
          />
        )}

        {/* Marksheet Modal */}
        {selectedExamId && marksheetModalOpen && (
          <MarksheetModal
            open={marksheetModalOpen}
            onClose={() => setMarksheetModalOpen(false)}
            studentId={id}
            examId={selectedExamId}
          />
        )}

        {/* Transfer Certificate Modal */}
        {tcModalOpen && (
          <TransferCertificateModal
            open={tcModalOpen}
            onClose={() => setTcModalOpen(false)}
            studentId={id}
            initialCertificate={existingTc}
            onStatusChange={(updated) => setExistingTc(updated)}
          />
        )}

        {/* Generate TC Modal */}
        {generateTcOpen && (
          <GenerateTcModal
            open={generateTcOpen}
            onClose={() => setGenerateTcOpen(false)}
            student={student}
            onGenerated={(newTc) => {
              setExistingTc(newTc)
              setTcModalOpen(true)
            }}
          />
        )}
      </Suspense>

      {/* Official Daily Day Academy Admission Form (प्रवेश फार्म) Modal */}
      {admissionModalOpen && (
        <AdmissionFormModal
          open={admissionModalOpen}
          onClose={() => setAdmissionModalOpen(false)}
          student={student}
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Student"
        message={`Are you sure you want to delete ${student.fullName}? This action cannot be undone.`}
      />

      {/* Reset Portal Credentials Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-fade-in overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 sm:p-6 shadow-2xl border border-slate-100 max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="text-indigo-600 shrink-0" size={20} />
              <span className="truncate">{student.user ? 'Reset Student Credentials' : 'Set Up Student Portal Account'}</span>
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Configure login credentials for <strong>{student.fullName}</strong> ({student.studentId}).
            </p>

            <form onSubmit={handleResetCredentials} className="mt-4 sm:mt-5 space-y-4">
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
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setResetModalOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={resetting} className="w-full sm:w-auto">
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
