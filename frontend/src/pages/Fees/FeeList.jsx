import { useEffect, useMemo, useState } from 'react'
import {
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  FileText,
  Layers,
  BarChart3,
  Building2,
  Search,
  Filter,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Select from '../../components/common/Select'
import RecordPaymentModal from '../../components/payments/RecordPaymentModal'
import PaymentReceiptModal from '../../components/payments/PaymentReceiptModal'
import FeeStructureTab from './FeeStructureTab'
import PendingFeesTab from './PendingFeesTab'
import PaymentHistoryTab from './PaymentHistoryTab'
import PaymentReportsTab from './PaymentReportsTab'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { STATUS_STYLES, formatDate, formatCurrency } from '../../utils/helpers'

export default function FeeList() {
  const { user } = useAuth()
  const { showToast } = useToast()

  // Active tab: 'overview' | 'history' | 'pending' | 'structures' | 'reports'
  const [activeTab, setActiveTab] = useState('overview')

  // Super Admin school selector
  const [schools, setSchools] = useState([])
  const [selectedSchoolId, setSelectedSchoolId] = useState('')

  // Overview data
  const [fees, setFees] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')

  // Modals
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false)
  const [selectedStudentForPay, setSelectedStudentForPay] = useState(null)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [selectedReceiptId, setSelectedReceiptId] = useState(null)

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.isSuperAdmin
  const isAdmin = user?.role === 'ADMIN' || isSuperAdmin
  const isStudentOrParent = user?.isStudent || user?.isParent || user?.role === 'STUDENT' || user?.role === 'PARENT'

  // Load super admin schools
  useEffect(() => {
    if (isSuperAdmin) {
      api.getPaymentSchools()
        .then((res) => {
          const list = res?.data || res || []
          setSchools(list)
        })
        .catch(() => {})
    }
  }, [isSuperAdmin])

  const loadFeeData = async () => {
    setLoading(true)
    try {
      const [feeData, studentData] = await Promise.all([
        api.getFees({ schoolId: selectedSchoolId || undefined }),
        api.getStudents(),
      ])
      setFees(Array.isArray(feeData) ? feeData : feeData?.data || [])
      setStudents(studentData || [])
    } catch (err) {
      console.error(err)
      showToast('Failed to load fee ledger records', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeeData()
  }, [selectedSchoolId])

  const enrichedFees = useMemo(() => {
    return fees.map((fee) => {
      const student = students.find((s) => s.id === fee.studentId)
      return {
        ...fee,
        studentName: fee.studentName || student?.fullName || 'Student',
        studentCode: student?.studentId || fee.studentId,
        className: fee.className || student?.className || 'Unassigned',
        section: student?.section || '',
        dueFee: Math.max((fee.totalFee || 0) - (fee.paidFee || 0), 0),
      }
    })
  }, [fees, students])

  const filteredFees = useMemo(() => {
    return enrichedFees.filter((fee) => {
      if (statusFilter && fee.status !== statusFilter) return false
      if (classFilter && fee.className !== classFilter && !fee.className.includes(classFilter)) return false
      return true
    })
  }, [enrichedFees, statusFilter, classFilter])

  const totalCollected = enrichedFees.reduce((sum, f) => sum + (f.paidFee || 0), 0)
  const totalDue = enrichedFees.reduce((sum, f) => sum + (f.dueFee || 0), 0)
  const paidCount = enrichedFees.filter((f) => f.status === 'Paid' || f.status === 'PAID').length
  const pendingCount = enrichedFees.filter((f) => f.status !== 'Paid' && f.status !== 'PAID').length

  const openPaymentForStudent = (studentData) => {
    setSelectedStudentForPay(studentData)
    setRecordPaymentOpen(true)
  }

  const handlePaymentSuccess = (paymentResult) => {
    loadFeeData()
    // Open receipt modal immediately
    const rcptNum = paymentResult?.receipt?.receiptNumber || paymentResult?.payment?.receiptNumber
    if (rcptNum) {
      setSelectedReceiptId(rcptNum)
      setReceiptModalOpen(true)
    }
  }

  const handleOpenReceipt = (receiptNumberOrId) => {
    setSelectedReceiptId(receiptNumberOrId)
    setReceiptModalOpen(true)
  }

  const columns = [
    {
      key: 'studentName',
      header: 'Student',
      searchValue: (fee) => `${fee.studentName} ${fee.studentCode}`,
      render: (fee) => (
        <div>
          <p className="font-semibold text-slate-900">{fee.studentName}</p>
          <p className="font-mono text-xs text-slate-500">{fee.studentCode}</p>
        </div>
      ),
    },
    {
      key: 'className',
      header: 'Class',
      render: (fee) => (
        <Badge className="bg-slate-100 text-slate-800">
          {fee.className} {fee.section}
        </Badge>
      ),
    },
    {
      key: 'totalFee',
      header: 'Total Fee',
      render: (fee) => <span className="font-medium text-slate-800">{formatCurrency(fee.totalFee)}</span>,
    },
    {
      key: 'paidFee',
      header: 'Paid Amount',
      render: (fee) => (
        <span className="font-mono font-semibold text-emerald-600">
          {formatCurrency(fee.paidFee)}
        </span>
      ),
    },
    {
      key: 'dueFee',
      header: 'Pending Due',
      render: (fee) => (
        <span className="font-mono font-bold text-rose-600">
          {formatCurrency(fee.dueFee)}
        </span>
      ),
    },
    {
      key: 'paymentDate',
      header: 'Last Payment',
      render: (fee) => formatDate(fee.paymentDate),
    },
    {
      key: 'status',
      header: 'Payment Status',
      render: (fee) => (
        <Badge
          className={
            fee.status === 'Paid' || fee.status === 'PAID'
              ? 'bg-emerald-100 text-emerald-800'
              : fee.status === 'Partial' || fee.status === 'PARTIAL'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-rose-100 text-rose-800'
          }
        >
          {fee.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (fee) => (
        <div className="flex items-center justify-end gap-2">
          {isAdmin && (
            <Button
              size="sm"
              variant={fee.dueFee === 0 ? 'ghost' : 'outline'}
              onClick={() =>
                openPaymentForStudent({
                  id: fee.studentId,
                  studentId: fee.studentCode,
                  fullName: fee.studentName,
                  name: fee.studentName,
                  className: fee.className,
                  section: fee.section,
                })
              }
              disabled={fee.dueFee === 0}
            >
              {fee.dueFee === 0 ? 'Settled' : 'Record Payment'}
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Fee & Payment Management"
        description="Real-time school financial ledger, receipts, pending fees, and collection analytics"
        breadcrumb={[{ label: 'Fees & Payments' }]}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {/* Super Admin School Filter */}
            {isSuperAdmin && schools.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Building2 size={14} /> School:
                </span>
                <select
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">All Schools (Aggregated)</option>
                  {schools.map((sch) => (
                    <option key={sch.id || sch.code} value={sch.code || sch.id}>
                      {sch.name} ({sch.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isAdmin && (
              <Button
                variant="primary"
                leftIcon={Plus}
                onClick={() => {
                  setSelectedStudentForPay(null)
                  setRecordPaymentOpen(true)
                }}
              >
                Record Payment
              </Button>
            )}
          </div>
        }
      />

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto text-sm font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 transition ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <Wallet size={16} />
            Student Fees
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 transition ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <FileText size={16} />
            Payment History & Receipts
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-2 border-b-2 py-3 px-1 transition ${
                activeTab === 'pending'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              <AlertTriangle size={16} />
              Pending & Overdue Fees
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setActiveTab('structures')}
              className={`flex items-center gap-2 border-b-2 py-3 px-1 transition ${
                activeTab === 'structures'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              <Layers size={16} />
              Fee Structures
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 border-b-2 py-3 px-1 transition ${
                activeTab === 'reports'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              <BarChart3 size={16} />
              Collection Reports
            </button>
          )}
        </nav>
      </div>

      {/* Tab 1: Overview / Student Fees */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Wallet size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Collected</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(totalCollected)}</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Outstanding</p>
                <p className="text-lg font-bold text-rose-600">{formatCurrency(totalDue)}</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Fully Settled</p>
                <p className="text-lg font-bold text-emerald-600">{paidCount}</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Pending Accounts</p>
                <p className="text-lg font-bold text-amber-600">{pendingCount}</p>
              </div>
            </Card>
          </div>

          <DataTable
            columns={columns}
            data={filteredFees}
            loading={loading}
            pageSize={10}
            searchPlaceholder="Search student name or ID..."
            emptyTitle="No fee accounts found"
            emptyDescription="No student fee records found matching your filters."
            emptyIcon={Wallet}
            toolbar={
              <>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: '', label: 'All Statuses' },
                    { value: 'Paid', label: 'Paid / Cleared' },
                    { value: 'Partial', label: 'Partial' },
                    { value: 'Pending', label: 'Pending' },
                  ]}
                  className="w-40"
                />
                {statusFilter && (
                  <Button variant="ghost" size="sm" onClick={() => setStatusFilter('')}>
                    Clear
                  </Button>
                )}
              </>
            }
          />
        </div>
      )}

      {/* Tab 2: Payment History & Receipts */}
      {activeTab === 'history' && (
        <PaymentHistoryTab onViewReceipt={handleOpenReceipt} />
      )}

      {/* Tab 3: Pending & Overdue Fees */}
      {activeTab === 'pending' && isAdmin && (
        <PendingFeesTab onCollectPayment={openPaymentForStudent} />
      )}

      {/* Tab 4: Fee Structures */}
      {activeTab === 'structures' && isAdmin && <FeeStructureTab />}

      {/* Tab 5: Collection Reports */}
      {activeTab === 'reports' && isAdmin && <PaymentReportsTab />}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        open={recordPaymentOpen}
        onClose={() => {
          setRecordPaymentOpen(false)
          setSelectedStudentForPay(null)
        }}
        preselectedStudent={selectedStudentForPay}
        onPaymentSuccess={handlePaymentSuccess}
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
    </div>
  )
}
