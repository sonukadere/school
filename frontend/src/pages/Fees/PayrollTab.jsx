import { useState, useEffect, useMemo } from 'react'
import {
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  AlertTriangle,
  CreditCard,
  Building2,
  Printer,
  ChevronRight,
  Filter,
} from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Select from '../../components/common/Select'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import DataTable from '../../components/common/DataTable'
import PayslipModal from '../../components/payments/PayslipModal'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { formatCurrency, formatDate } from '../../utils/helpers'

const MONTH_NAMES = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

export default function PayrollTab() {
  const { showToast } = useToast()
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  const [payrolls, setPayrolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  // Mark Paid Modal state
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [payingRecord, setPayingRecord] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [transactionId, setTransactionId] = useState('')
  const [notes, setNotes] = useState('')
  const [processingPay, setProcessingPay] = useState(false)

  // Payslip Modal state
  const [payslipModalOpen, setPayslipModalOpen] = useState(false)
  const [selectedPayslipId, setSelectedPayslipId] = useState(null)

  const loadPayroll = async () => {
    setLoading(true)
    try {
      const res = await api.getPayrollList({
        salaryMonth: selectedMonth,
        salaryYear: selectedYear,
        limit: 200,
      })
      const list = res?.data || res || []
      setPayrolls(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error(err)
      showToast('Failed to load payroll list', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayroll()
  }, [selectedMonth, selectedYear])

  const handleGeneratePayroll = async () => {
    setGenerating(true)
    try {
      const res = await api.generateMonthlyPayroll({
        salaryMonth: selectedMonth,
        salaryYear: selectedYear,
      })
      showToast(res.message || 'Monthly payroll generated successfully.', 'success')
      setGenerating(false)
      loadPayroll()
    } catch (err) {
      setGenerating(false)
      showToast(err.message || 'Failed to generate payroll.', 'error')
    }
  }

  const openMarkPaidModal = (record) => {
    setPayingRecord(record)
    setPaymentMethod(record.paymentMethod || 'BANK_TRANSFER')
    setPaymentDate(new Date().toISOString().slice(0, 10))
    setTransactionId('')
    setNotes('')
    setPayModalOpen(true)
  }

  const handleConfirmSalaryPayment = async (e) => {
    e.preventDefault()
    if (!payingRecord) return

    setProcessingPay(true)
    try {
      const res = await api.markSalaryPaid(payingRecord.id, {
        paymentDate,
        paymentMethod,
        transactionId: transactionId.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      showToast('Salary disbursed and payslip generated.', 'success')
      setProcessingPay(false)
      setPayModalOpen(false)

      // Open payslip immediately
      const pNum = res?.payslip?.payslipNumber || res?.payslipNumber || payingRecord.payslip?.payslipNumber
      if (pNum) {
        setSelectedPayslipId(pNum)
        setPayslipModalOpen(true)
      }

      loadPayroll()
    } catch (err) {
      setProcessingPay(false)
      showToast(err.message || 'Failed to mark salary as paid', 'error')
    }
  }

  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((p) => {
      if (statusFilter && p.paymentStatus !== statusFilter) return false
      return true
    })
  }, [payrolls, statusFilter])

  const totalPayable = payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0)
  const totalPaid = payrolls
    .filter((p) => p.paymentStatus === 'PAID')
    .reduce((sum, p) => sum + (p.netSalary || 0), 0)
  const totalPending = payrolls
    .filter((p) => p.paymentStatus === 'PENDING')
    .reduce((sum, p) => sum + (p.netSalary || 0), 0)

  const columns = [
    {
      key: 'teacher',
      header: 'Teacher',
      searchValue: (p) => `${p.teacher?.name} ${p.teacher?.teacherId} ${p.designation}`,
      render: (p) => (
        <div>
          <p className="font-semibold text-slate-900">{p.teacher?.name}</p>
          <p className="font-mono text-xs text-slate-500">
            {p.teacher?.teacherId} • {p.designation || 'Teacher'}
          </p>
        </div>
      ),
    },
    {
      key: 'basicSalary',
      header: 'Basic Pay',
      render: (p) => <span className="font-mono text-slate-700">{formatCurrency(p.basicSalary)}</span>,
    },
    {
      key: 'allowances',
      header: 'Allowances',
      render: (p) => (
        <span className="font-mono text-emerald-600">
          {p.allowances > 0 ? `+${formatCurrency(p.allowances)}` : '—'}
        </span>
      ),
    },
    {
      key: 'bonus',
      header: 'Bonus',
      render: (p) => (
        <span className="font-mono text-emerald-600">
          {p.bonus > 0 ? `+${formatCurrency(p.bonus)}` : '—'}
        </span>
      ),
    },
    {
      key: 'grossSalary',
      header: 'Gross Salary',
      render: (p) => <span className="font-mono font-semibold text-slate-900">{formatCurrency(p.grossSalary)}</span>,
    },
    {
      key: 'deductions',
      header: 'Deductions',
      render: (p) => (
        <span className="font-mono text-rose-600">
          {p.deductions > 0 ? `-${formatCurrency(p.deductions)}` : '—'}
        </span>
      ),
    },
    {
      key: 'advance',
      header: 'Advance',
      render: (p) => (
        <span className="font-mono text-rose-600">
          {p.advance > 0 ? `-${formatCurrency(p.advance)}` : '—'}
        </span>
      ),
    },
    {
      key: 'netSalary',
      header: 'Net Payable',
      render: (p) => (
        <span className="font-mono font-bold text-indigo-700 text-sm">
          {formatCurrency(p.netSalary)}
        </span>
      ),
    },
    {
      key: 'paymentDate',
      header: 'Paid Date',
      render: (p) => (
        <span className="text-xs text-slate-600 font-mono">
          {p.paymentDate ? formatDate(p.paymentDate) : '—'}
        </span>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Status',
      render: (p) => (
        <Badge
          className={
            p.paymentStatus === 'PAID'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }
        >
          {p.paymentStatus}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          {p.paymentStatus === 'PENDING' ? (
            <Button
              size="sm"
              variant="primary"
              onClick={() => openMarkPaidModal(p)}
              className="bg-emerald-600 hover:bg-emerald-700 border-none text-xs"
            >
              Mark Paid
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              leftIcon={FileCheck}
              onClick={() => {
                const num = p.payslip?.payslipNumber || p.payrollNumber || p.id
                setSelectedPayslipId(num)
                setPayslipModalOpen(true)
              }}
              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            >
              Payslip
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Filter & Generator Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Calendar size={16} className="text-indigo-600" />
            <span className="text-xs font-bold text-slate-700">Period:</span>
          </div>
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            options={MONTH_NAMES}
            className="w-36"
          />
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            options={[
              { value: 2025, label: '2025' },
              { value: 2026, label: '2026' },
              { value: 2027, label: '2027' },
              { value: 2028, label: '2028' },
            ]}
            className="w-28"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            leftIcon={DollarSign}
            onClick={handleGeneratePayroll}
            loading={generating}
          >
            Generate Monthly Payroll
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card bodyClassName="flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <DollarSign size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Payroll Payable</p>
            <p className="text-base sm:text-lg font-bold text-slate-900">{formatCurrency(totalPayable)}</p>
          </div>
        </Card>

        <Card bodyClassName="flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Salary Disbursed</p>
            <p className="text-base sm:text-lg font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
          </div>
        </Card>

        <Card bodyClassName="flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Salary Pending</p>
            <p className="text-base sm:text-lg font-bold text-amber-600">{formatCurrency(totalPending)}</p>
          </div>
        </Card>

        <Card bodyClassName="flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <FileCheck size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Teachers on Payroll</p>
            <p className="text-base sm:text-lg font-bold text-purple-700">{payrolls.length}</p>
          </div>
        </Card>
      </div>

      {/* Payroll Table */}
      <DataTable
        columns={columns}
        data={filteredPayrolls}
        loading={loading}
        pageSize={10}
        searchPlaceholder="Search teacher name, ID, or designation..."
        emptyTitle="No payroll records generated"
        emptyDescription="Click 'Generate Monthly Payroll' above to calculate and assess monthly salary sheets for all teachers."
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'PENDING', label: 'Pending Payment' },
                { value: 'PAID', label: 'Disbursed / Paid' },
              ]}
              className="w-40"
            />
            {statusFilter && (
              <Button variant="ghost" size="sm" onClick={() => setStatusFilter('')}>
                Clear
              </Button>
            )}
          </div>
        }
      />

      {/* Mark as Paid Modal */}
      <Modal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title="Disburse Teacher Salary"
        description="Record electronic or cash disbursement and generate verified payslip"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setPayModalOpen(false)} disabled={processingPay}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmSalaryPayment}
              loading={processingPay}
              className="bg-emerald-600 hover:bg-emerald-700 border-none"
            >
              Confirm Disbursement & Generate Payslip
            </Button>
          </>
        }
      >
        {payingRecord && (
          <form onSubmit={handleConfirmSalaryPayment} className="space-y-4">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-medium uppercase block">Faculty Member</span>
                <p className="font-bold text-slate-900 text-sm">{payingRecord.teacher?.name}</p>
                <p className="text-xs text-slate-500 font-mono">
                  {payingRecord.teacher?.teacherId} • {payingRecord.designation}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-indigo-500 font-medium uppercase block">Net Payable</span>
                <p className="font-mono text-xl font-black text-indigo-900">
                  {formatCurrency(payingRecord.netSalary)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Payment Date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Payment Method <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  options={[
                    { value: 'BANK_TRANSFER', label: 'Bank Transfer / NEFT' },
                    { value: 'UPI', label: 'UPI Direct' },
                    { value: 'CHEQUE', label: 'Cheque' },
                    { value: 'CASH', label: 'Cash' },
                    { value: 'ONLINE', label: 'Online Payment' },
                  ]}
                />
              </div>
            </div>

            <Input
              label="Transaction ID / Reference Number"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. UTR-2026-994821 or Cheque #10294"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Disbursement Remarks / Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes or bank advice details..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </form>
        )}
      </Modal>

      {/* Payslip Modal */}
      <PayslipModal
        open={payslipModalOpen}
        onClose={() => {
          setPayslipModalOpen(false)
          setSelectedPayslipId(null)
        }}
        payslipNumberOrId={selectedPayslipId}
      />
    </div>
  )
}
