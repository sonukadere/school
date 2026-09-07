import { useState, useEffect, useMemo } from 'react'
import { FileText, Printer, Search, Calendar, Filter, CreditCard, ShieldCheck } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Select from '../../components/common/Select'
import Input from '../../components/common/Input'
import DateInput from '../../components/common/DateInput'
import DataTable from '../../components/common/DataTable'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { formatCurrency, formatDate } from '../../utils/helpers'

const PAYMENT_METHODS = [
  { value: '', label: 'All Methods' },
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'ONLINE', label: 'Online' },
]

export default function PaymentHistoryTab({ onViewReceipt }) {
  const { showToast } = useToast()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [methodFilter, setMethodFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const loadPayments = async () => {
    setLoading(true)
    try {
      const query = { limit: 200 }
      if (methodFilter) query.paymentMethod = methodFilter
      if (fromDate) query.from = fromDate
      if (toDate) query.to = toDate

      const res = await api.getPayments(query)
      const list = res?.data || res || []
      setPayments(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error(err)
      showToast('Failed to load payment history', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [methodFilter, fromDate, toDate])

  const totalCollectedInList = useMemo(() => {
    return payments
      .filter((p) => p.paymentStatus !== 'CANCELLED')
      .reduce((sum, p) => sum + (p.amount || 0), 0)
  }, [payments])

  const columns = [
    {
      key: 'receiptNumber',
      header: 'Receipt Number',
      searchValue: (p) => `${p.receiptNumber} ${p.transactionId || ''} ${p.referenceNumber || ''}`,
      render: (p) => (
        <div>
          <button
            onClick={() => onViewReceipt(p.receiptNumber || p.id)}
            className="font-mono font-bold text-xs text-indigo-600 hover:underline flex items-center gap-1"
          >
            <ShieldCheck size={13} className="text-emerald-600" />
            {p.receiptNumber}
          </button>
          {p.transactionId && (
            <p className="font-mono text-[11px] text-slate-400">Txn: {p.transactionId}</p>
          )}
        </div>
      ),
    },
    {
      key: 'student',
      header: 'Student',
      searchValue: (p) =>
        `${p.student?.firstName} ${p.student?.lastName} ${p.student?.studentId}`,
      render: (p) => (
        <div>
          <p className="font-semibold text-slate-900">
            {p.student ? `${p.student.firstName} ${p.student.lastName || ''}`.trim() : 'Unknown'}
          </p>
          <p className="text-xs text-slate-500">
            {p.student?.studentId} • {p.student?.class ? `${p.student.class.name} ${p.student.class.section}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'feeType',
      header: 'Fee Head',
      render: (p) => <span className="text-xs font-medium text-slate-700">{p.feeType || 'Tuition Fee'}</span>,
    },
    {
      key: 'amount',
      header: 'Amount Paid',
      render: (p) => (
        <span className="font-mono font-bold text-emerald-600 text-sm">
          {formatCurrency(p.amount)}
        </span>
      ),
    },
    {
      key: 'paymentDate',
      header: 'Payment Date',
      render: (p) => formatDate(p.paymentDate),
    },
    {
      key: 'paymentMethod',
      header: 'Method',
      render: (p) => (
        <Badge className="bg-slate-100 text-slate-700 font-mono text-[11px]">
          {p.paymentMethod}
        </Badge>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Status',
      render: (p) => (
        <Badge
          className={
            p.paymentStatus === 'PAID'
              ? 'bg-emerald-100 text-emerald-800'
              : p.paymentStatus === 'PARTIAL'
              ? 'bg-amber-100 text-amber-800'
              : p.paymentStatus === 'CANCELLED'
              ? 'bg-rose-100 text-rose-800'
              : 'bg-indigo-100 text-indigo-800'
          }
        >
          {p.paymentStatus}
        </Badge>
      ),
    },
    {
      key: 'createdBy',
      header: 'Recorded By',
      render: (p) => (
        <span className="text-xs text-slate-500">{p.createdBy?.name || 'Admin'}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Receipt',
      className: 'text-right',
      render: (p) => (
        <Button
          size="sm"
          variant="outline"
          leftIcon={FileText}
          onClick={() => onViewReceipt(p.receiptNumber || p.id)}
        >
          View
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Payment Transaction History</h3>
          <p className="text-xs text-slate-500">
            Audit trail of all registered payments, official receipts, and fee settlement records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Card className="px-4 py-2 bg-emerald-50/70 border border-emerald-100">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">Total Filtered</span>
            <span className="font-mono font-bold text-emerald-700 text-base">
              {formatCurrency(totalCollectedInList)}
            </span>
          </Card>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        pageSize={10}
        searchPlaceholder="Search receipt #, student name, or transaction ID..."
        emptyTitle="No payment transactions found"
        emptyDescription="No payment records match the specified date range or filter criteria."
        toolbar={
          <>
            <Select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              options={PAYMENT_METHODS}
              className="w-40"
            />
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-36">
                <DateInput
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  placeholder="From Date"
                />
              </div>
              <span className="text-slate-400">to</span>
              <div className="w-36">
                <DateInput
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  placeholder="To Date"
                />
              </div>
            </div>
            {(methodFilter || fromDate || toDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMethodFilter('')
                  setFromDate('')
                  setToDate('')
                }}
              >
                Reset
              </Button>
            )}
          </>
        }
      />
    </div>
  )
}
