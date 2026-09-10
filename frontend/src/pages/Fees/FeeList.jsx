import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  DollarSign,
  Scale,
  Briefcase,
  ShieldCheck,
  CreditCard,
  Receipt,
  ChevronDown,
  X,
  RefreshCw,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Select from '../../components/common/Select'
import Loader from '../../components/common/Loader'
import RecordPaymentModal from '../../components/payments/RecordPaymentModal'
import PaymentReceiptModal from '../../components/payments/PaymentReceiptModal'
import AssignFeeModal from '../../components/payments/AssignFeeModal'
import FeeStructureTab from './FeeStructureTab'
import PendingFeesTab from './PendingFeesTab'
import PaymentHistoryTab from './PaymentHistoryTab'
import PaymentReportsTab from './PaymentReportsTab'
import FinanceOverviewTab from './FinanceOverviewTab'
import SalaryStructureTab from './SalaryStructureTab'
import PayrollTab from './PayrollTab'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { STATUS_STYLES, formatDate, formatCurrency, cn } from '../../utils/helpers'

export default function FeeList() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const isSuperAdmin = Boolean(user?.isSuperAdmin || user?.role === 'Super Admin' || user?.role === 'SUPER_ADMIN')
  const isAdmin = Boolean(user?.isAdmin || isSuperAdmin || user?.role === 'Admin' || user?.role === 'ADMIN' || user?.role === 'Administrator')
  const isStudentOrParent = Boolean(user?.isStudent || user?.isParent || user?.role === 'Student' || user?.role === 'STUDENT' || user?.role === 'Parent' || user?.role === 'PARENT')

  // Active tab: 'finance' | 'overview' | 'history' | 'pending' | 'structures' | 'salary-structures' | 'payroll' | 'reports'
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabFromUrl || (isAdmin ? 'finance' : 'overview'))
  const [tabSearch, setTabSearch] = useState('')
  const [tabCategory, setTabCategory] = useState('all')

  // Sync tab with URL search parameter if it changes and auto-open record payment
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && tab !== activeTab) {
      setActiveTab(tab)
    }
    if (searchParams.get('record') === 'true' || searchParams.get('pay') === 'true') {
      setRecordPaymentOpen(true)
    }
  }, [searchParams])

  // Real-time dynamic sync: auto reload fee data when payment is recorded anywhere
  useEffect(() => {
    const handlePaymentRecorded = () => {
      loadFeeData()
    }
    window.addEventListener('sms:payment-recorded', handlePaymentRecorded)
    return () => {
      window.removeEventListener('sms:payment-recorded', handlePaymentRecorded)
    }
  }, [])

  const handleTabChange = (newTab) => {
    setActiveTab(newTab)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', newTab)
      return next
    })
  }

  // Super Admin school selector
  const [schools, setSchools] = useState([])
  const [selectedSchoolId, setSelectedSchoolId] = useState('')

  // Overview data (for Admin)
  const [fees, setFees] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')

  // Student personal ledger data (for Student / Parent view)
  const [studentLedger, setStudentLedger] = useState(null)

  // Modals
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false)
  const [selectedStudentForPay, setSelectedStudentForPay] = useState(null)
  const [assignFeeModalOpen, setAssignFeeModalOpen] = useState(false)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [selectedReceiptId, setSelectedReceiptId] = useState(null)

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
      if (isStudentOrParent) {
        let studentId = user?.studentId || user?.student?.id
        if (!studentId && (user?.isStudent || user?.role === 'Student')) {
          try {
            const profile = await api.getMyProfile()
            studentId = profile?.id || profile?.studentId
          } catch {}
        }
        if (!studentId) {
          studentId = user?.id
        }
        if (studentId) {
          const ledgerRes = await api.getStudentFeeLedger(studentId)
          const ledgerData = ledgerRes?.data || ledgerRes
          setStudentLedger(ledgerData)
        }
      } else {
        const [feeData, studentData] = await Promise.all([
          api.getFees({ schoolId: selectedSchoolId || undefined }),
          api.getStudents(),
        ])
        setFees(Array.isArray(feeData) ? feeData : feeData?.data || [])
        setStudents(studentData || [])
      }
    } catch (err) {
      console.error(err)
      showToast('Failed to load fee records', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeeData()
  }, [selectedSchoolId, isStudentOrParent])

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

  const TABS = useMemo(() => [
    { id: 'finance', label: 'Finance Dashboard', icon: Scale, category: 'finance', desc: 'Overall institutional finance & revenue charts' },
    { id: 'overview', label: 'Student Fees', icon: Wallet, category: 'student', desc: 'Student fee collection, ledgers & dues' },
    { id: 'history', label: 'Payment History & Receipts', icon: FileText, category: 'student', desc: 'Transaction ledger & printable payment receipts' },
    { id: 'pending', label: 'Pending & Overdue Fees', icon: AlertTriangle, category: 'student', badge: pendingCount > 0 ? pendingCount : null, badgeColor: 'bg-rose-100 text-rose-700', desc: 'Overdue balances, defaulters & payment collection' },
    { id: 'structures', label: 'Fee Structures', icon: Layers, category: 'setup', desc: 'Tuition, transport & grade fee schedules' },
    { id: 'salary-structures', label: 'Teacher Salaries', icon: Briefcase, category: 'payroll', desc: 'Teacher base pay, allowances & deductions' },
    { id: 'payroll', label: 'Monthly Payroll', icon: DollarSign, category: 'payroll', desc: 'Monthly salary disbursement & slips' },
    { id: 'reports', label: 'Collection Reports', icon: BarChart3, category: 'finance', desc: 'Comprehensive financial reports & breakdown' },
  ], [pendingCount])

  const filteredTabs = useMemo(() => {
    return TABS.filter((tab) => {
      if (tabCategory !== 'all' && tab.category !== tabCategory) return false
      if (tabSearch.trim()) {
        const q = tabSearch.trim().toLowerCase()
        return tab.label.toLowerCase().includes(q) || tab.desc.toLowerCase().includes(q)
      }
      return true
    })
  }, [TABS, tabCategory, tabSearch])

  const openPaymentForStudent = (studentData) => {
    setSelectedStudentForPay(studentData)
    setRecordPaymentOpen(true)
  }

  const handlePaymentSuccess = (paymentResult) => {
    loadFeeData()
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

  // If viewing as Student or Parent, render clean personal ledger view
  if (isStudentOrParent) {
    const personalStudent = studentLedger?.student || {}
    const personalLedger = studentLedger?.ledger || {}
    const invoices = studentLedger?.invoices || []
    const payments = studentLedger?.payments || []

    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="My Fee Account & Payment Receipts"
          description="View your active billing invoices, pending due balances, and download official payment receipts"
          breadcrumb={[{ label: 'Fees & Receipts' }]}
          actions={
            <Button
              variant="outline"
              size="sm"
              leftIcon={RefreshCw}
              loading={loading}
              onClick={loadFeeData}
            >
              Refresh
            </Button>
          }
        />

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader label="Loading personal fee account records..." />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Balance Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card className="p-5 border-l-4 border-l-indigo-500">
                <span className="text-xs text-slate-500 font-medium block uppercase tracking-wider">Total Assessed Fee</span>
                <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(personalLedger.totalFee || 0)}</p>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Academic Term 2026-2027</span>
              </Card>

              <Card className="p-5 border-l-4 border-l-emerald-500">
                <span className="text-xs text-emerald-700 font-medium block uppercase tracking-wider">Total Amount Paid</span>
                <p className="mt-2 text-2xl font-black text-emerald-600">{formatCurrency(personalLedger.paidAmount || 0)}</p>
                <span className="text-[11px] text-emerald-600 mt-0.5 block">Cleared payments</span>
              </Card>

              <Card className="p-5 border-l-4 border-l-rose-500">
                <span className="text-xs text-rose-700 font-medium block uppercase tracking-wider">Remaining Due Balance</span>
                <p className="mt-2 text-2xl font-black text-rose-600">{formatCurrency(personalLedger.pendingAmount || 0)}</p>
                <div className="mt-1">
                  <Badge className={personalLedger.pendingAmount === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}>
                    {personalLedger.paymentStatus || 'PENDING'}
                  </Badge>
                </div>
              </Card>
            </div>

            {/* Invoices Table */}
            <Card title="Billing Invoices & Dues">
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="min-w-[760px] w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Fee Head</th>
                      <th className="py-3 px-4">Total Fee</th>
                      <th className="py-3 px-4">Discount</th>
                      <th className="py-3 px-4">Late Fee</th>
                      <th className="py-3 px-4">Final Payable</th>
                      <th className="py-3 px-4">Total Paid</th>
                      <th className="py-3 px-4">Pending Amount</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.length > 0 ? (
                      invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600">{inv.invoiceNumber}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{inv.feeType}</td>
                          <td className="py-3 px-4 font-mono">{formatCurrency(inv.totalFee)}</td>
                          <td className="py-3 px-4 font-mono text-emerald-600">
                            {inv.discount > 0 ? `-${formatCurrency(inv.discount)}` : '—'}
                          </td>
                          <td className="py-3 px-4 font-mono text-amber-600">
                            {inv.lateFee > 0 ? `+${formatCurrency(inv.lateFee)}` : '—'}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {formatCurrency(inv.finalAmount || inv.totalFee)}
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-600">{formatCurrency(inv.paidAmount)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-rose-600">{formatCurrency(inv.pendingAmount)}</td>
                          <td className="py-3 px-4 text-slate-500">{inv.dueDate ? formatDate(inv.dueDate) : 'Open'}</td>
                          <td className="py-3 px-4">
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
                    ) : (
                      <tr>
                        <td colSpan={10} className="py-6 text-center text-slate-400">
                          No active fee invoices issued.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Payment History & Receipts */}
            <Card title="Payment History & Official Receipts">
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="min-w-[620px] w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="py-3 px-4">Receipt #</th>
                      <th className="py-3 px-4">Payment Date</th>
                      <th className="py-3 px-4">Fee Head</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Amount Paid</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Receipt Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.length > 0 ? (
                      payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600">{p.receiptNumber}</td>
                          <td className="py-3 px-4 text-slate-600">{formatDate(p.paymentDate)}</td>
                          <td className="py-3 px-4 font-medium text-slate-900">{p.feeType}</td>
                          <td className="py-3 px-4 font-mono text-[11px]">{p.paymentMethod}</td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                          <td className="py-3 px-4">
                            <Badge className={p.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                              {p.paymentStatus}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              leftIcon={Receipt}
                              onClick={() => {
                                setSelectedReceiptId(p.receiptNumber || p.id)
                                setReceiptModalOpen(true)
                              }}
                            >
                              Download / Print
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400">
                          No payment receipts on record.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Official Receipt Modal */}
            <PaymentReceiptModal
              open={receiptModalOpen}
              onClose={() => {
                setReceiptModalOpen(false)
                setSelectedReceiptId(null)
              }}
              receiptNumberOrId={selectedReceiptId}
            />
          </div>
        )}
      </div>
    )
  }

  // Admin & Super Admin Full Finance View
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Finance, Fees & Payroll Management"
        description="Comprehensive institutional accounting, student fee collections, faculty payroll, and financial balance sheet"
        breadcrumb={[{ label: 'Finance & Accounts' }]}
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
                variant="outline"
                leftIcon={Layers}
                onClick={() => setAssignFeeModalOpen(true)}
              >
                Assign Fees
              </Button>
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

      {/* Modern Navigation Header with Search & Dropdown */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-2.5 sm:p-3.5 shadow-xs space-y-3">
        {/* Top Control Bar: Search Input + Category / Module Dropdown + Mobile Tab Switcher */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          {/* Mobile Tab Dropdown Switcher (visible on mobile only) */}
          <div className="relative sm:hidden w-full">
            <div className="relative">
              <select
                value={activeTab}
                onChange={(e) => handleTabChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/90 py-2.5 pl-3.5 pr-10 text-xs font-semibold text-slate-800 shadow-2xs focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {TABS.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label} {tab.badge ? `(${tab.badge} pending)` : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          {/* Search Bar for Tabs & Modules */}
          <div className="relative flex-1 sm:max-w-md">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={tabSearch}
              onChange={(e) => setTabSearch(e.target.value)}
              placeholder="Search tabs & modules (e.g. payroll, history, pending)..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {tabSearch && (
              <button
                type="button"
                onClick={() => setTabSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Dropdown: Category / Group Filter */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-48">
              <select
                value={tabCategory}
                onChange={(e) => setTabCategory(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-3 pr-8 text-xs font-medium text-slate-700 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">All Modules ({TABS.length})</option>
                <option value="finance">Finance & Reports</option>
                <option value="student">Student Fee Accounts</option>
                <option value="payroll">Faculty Payroll</option>
                <option value="setup">Fee Structures</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                <ChevronDown size={14} />
              </div>
            </div>
            {(tabCategory !== 'all' || tabSearch) && (
              <button
                type="button"
                onClick={() => { setTabCategory('all'); setTabSearch(''); }}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 shrink-0"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Modern Segmented Pill Tabs Navigation (Desktop & Tablet) */}
        <div className="hidden sm:block pt-1 border-t border-slate-100">
          <nav className="flex flex-wrap gap-1.5" aria-label="Finance navigation tabs">
            {filteredTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    'group relative inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-150',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200 ring-1 ring-indigo-600'
                      : 'bg-slate-50/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                  )}
                  title={tab.desc}
                >
                  <Icon
                    size={15}
                    className={cn(
                      'shrink-0 transition-transform duration-150 group-hover:scale-110',
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'
                    )}
                  />
                  <span>{tab.label}</span>
                  {tab.badge ? (
                    <span
                      className={cn(
                        'ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold shrink-0',
                        isActive
                          ? 'bg-white/20 text-white'
                          : tab.badgeColor || 'bg-rose-100 text-rose-700'
                      )}
                    >
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </nav>
          {filteredTabs.length === 0 && (
            <div className="py-3 text-center text-xs text-slate-400">
              No tabs match "{tabSearch}".{' '}
              <button
                type="button"
                onClick={() => { setTabSearch(''); setTabCategory('all'); }}
                className="text-indigo-600 font-semibold hover:underline"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab 0: Finance Dashboard */}
      {activeTab === 'finance' && <FinanceOverviewTab />}

      {/* Tab 1: Overview / Student Fees */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
            <Card bodyClassName="flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Wallet size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Collected</p>
                <p className="text-base sm:text-lg font-bold text-slate-900">{formatCurrency(totalCollected)}</p>
              </div>
            </Card>

            <Card bodyClassName="flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Outstanding</p>
                <p className="text-base sm:text-lg font-bold text-rose-600">{formatCurrency(totalDue)}</p>
              </div>
            </Card>

            <Card bodyClassName="flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Fully Settled</p>
                <p className="text-base sm:text-lg font-bold text-emerald-600">{paidCount}</p>
              </div>
            </Card>

            <Card bodyClassName="flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Pending Accounts</p>
                <p className="text-base sm:text-lg font-bold text-amber-600">{pendingCount}</p>
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
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="w-full sm:w-44">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    options={[
                      { value: '', label: 'All Statuses' },
                      { value: 'Paid', label: 'Paid / Cleared' },
                      { value: 'Partial', label: 'Partial' },
                      { value: 'Pending', label: 'Pending' },
                    ]}
                  />
                </div>
                {statusFilter && (
                  <Button variant="ghost" size="sm" onClick={() => setStatusFilter('')}>
                    Clear
                  </Button>
                )}
              </div>
            }
          />
        </div>
      )}

      {/* Tab 2: Payment History & Receipts */}
      {activeTab === 'history' && (
        <PaymentHistoryTab onViewReceipt={handleOpenReceipt} />
      )}

      {/* Tab 3: Pending & Overdue Fees */}
      {activeTab === 'pending' && (
        <PendingFeesTab onCollectPayment={openPaymentForStudent} />
      )}

      {/* Tab 4: Fee Structures */}
      {activeTab === 'structures' && <FeeStructureTab />}

      {/* Tab 5: Teacher Salary Structures */}
      {activeTab === 'salary-structures' && <SalaryStructureTab />}

      {/* Tab 6: Monthly Payroll */}
      {activeTab === 'payroll' && <PayrollTab />}

      {/* Tab 7: Collection Reports */}
      {activeTab === 'reports' && <PaymentReportsTab />}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        open={recordPaymentOpen}
        onClose={() => {
          setRecordPaymentOpen(false)
          setSelectedStudentForPay(null)
          if (searchParams.get('record') || searchParams.get('pay')) {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev)
              next.delete('record')
              next.delete('pay')
              return next
            })
          }
        }}
        preselectedStudent={selectedStudentForPay}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Assign Fee Modal */}
      <AssignFeeModal
        open={assignFeeModalOpen}
        onClose={() => setAssignFeeModalOpen(false)}
        onAssigned={loadFeeData}
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
