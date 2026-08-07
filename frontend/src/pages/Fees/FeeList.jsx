import { useEffect, useMemo, useState } from 'react'
import { Wallet, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import Select from '../../components/common/Select'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { STATUS_STYLES, formatDate, formatCurrency } from '../../utils/helpers'
import { PAYMENT_STATUS } from '../../utils/constants'

function FeeList() {
  const { showToast } = useToast()
  const [fees, setFees] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)

  const loadFees = async () => {
    setLoading(true)
    const [feeData, studentData] = await Promise.all([api.getFees(), api.getStudents()])
    setFees(feeData)
    setStudents(studentData)
    setLoading(false)
  }

  useEffect(() => {
    loadFees()
  }, [])

  const enrichedFees = useMemo(
    () =>
      fees.map((fee) => ({
        ...fee,
        studentName:
          students.find((student) => student.id === fee.studentId)?.fullName || 'Unknown Student',
        dueFee: fee.totalFee - fee.paidFee,
      })),
    [fees, students],
  )

  const filteredFees = useMemo(
    () => enrichedFees.filter((fee) => !statusFilter || fee.status === statusFilter),
    [enrichedFees, statusFilter],
  )

  const totalCollected = enrichedFees.reduce((sum, fee) => sum + fee.paidFee, 0)
  const totalDue = enrichedFees.reduce((sum, fee) => sum + fee.dueFee, 0)
  const paidCount = enrichedFees.filter((fee) => fee.status === 'Paid').length
  const pendingCount = enrichedFees.filter((fee) => fee.status === 'Pending' || fee.status === 'Overdue').length

  const openPayment = (fee) => {
    setSelected(fee)
    setPayAmount(fee.dueFee)
    setPaymentDate(new Date().toISOString().slice(0, 10))
    setPaymentOpen(true)
  }

  const handleRecordPayment = async () => {
    if (!selected || !payAmount || Number(payAmount) <= 0) {
      showToast('Enter a valid payment amount', 'error')
      return
    }
    const amount = Number(payAmount)
    const newPaid = selected.paidFee + amount
    const newStatus = newPaid >= selected.totalFee ? 'Paid' : newPaid > 0 ? 'Partial' : 'Pending'
    setSaving(true)
    await api.updateFee(selected.id, {
      paidFee: newPaid,
      paymentDate,
      status: newStatus,
    })
    setSaving(false)
    setPaymentOpen(false)
    showToast('Payment recorded successfully', 'success')
    loadFees()
  }

  const columns = [
    {
      key: 'studentName',
      header: 'Student',
      searchValue: (fee) => `${fee.studentName} ${fee.studentId}`,
      render: (fee) => (
        <div>
          <p className="font-semibold text-slate-900">{fee.studentName}</p>
          <p className="text-xs text-slate-500">{fee.studentId}</p>
        </div>
      ),
    },
    { key: 'className', header: 'Class', render: (fee) => fee.className },
    { key: 'totalFee', header: 'Total Fee', render: (fee) => (
      <span className="font-medium text-slate-800">{formatCurrency(fee.totalFee)}</span>
    ) },
    { key: 'paidFee', header: 'Paid Fee', render: (fee) => (
      <span className="font-medium text-emerald-600">{formatCurrency(fee.paidFee)}</span>
    ) },
    { key: 'dueFee', header: 'Due Fee', render: (fee) => (
      <span className="font-medium text-rose-600">{formatCurrency(fee.dueFee)}</span>
    ) },
    { key: 'paymentDate', header: 'Payment Date', render: (fee) => formatDate(fee.paymentDate) },
    { key: 'status', header: 'Status', render: (fee) => (
      <Badge className={STATUS_STYLES[fee.status]}>{fee.status}</Badge>
    ) },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (fee) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => openPayment(fee)}
          disabled={fee.status === 'Paid'}
        >
          {fee.status === 'Paid' ? 'Paid' : 'Record Payment'}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Fees"
        description="Manage fee collections and payment records"
        breadcrumb={[{ label: 'Fees' }]}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Wallet size={22} /></div>
          <div>
            <p className="text-xs text-slate-500">Total Collected</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(totalCollected)}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><AlertTriangle size={22} /></div>
          <div>
            <p className="text-xs text-slate-500">Total Due</p>
            <p className="text-lg font-bold text-rose-600">{formatCurrency(totalDue)}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={22} /></div>
          <div>
            <p className="text-xs text-slate-500">Fully Paid</p>
            <p className="text-lg font-bold text-emerald-600">{paidCount}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Clock size={22} /></div>
          <div>
            <p className="text-xs text-slate-500">Pending / Overdue</p>
            <p className="text-lg font-bold text-amber-600">{pendingCount}</p>
          </div>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={filteredFees}
        loading={loading}
        pageSize={8}
        searchPlaceholder="Search by student name or ID..."
        emptyTitle="No fee records found"
        emptyDescription="Try adjusting filters."
        emptyIcon={Wallet}
        toolbar={
          <>
            <Select
              name="statusFilter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              options={PAYMENT_STATUS}
              placeholder="All Statuses"
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

      <Modal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="Record Payment"
        description={selected ? `${selected.studentName} - ${selected.className}` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} loading={saving}>
              Record Payment
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Total Fee"
            value={selected ? formatCurrency(selected.totalFee) : ''}
            disabled
          />
          <Input
            label="Amount Paid"
            type="number"
            value={payAmount}
            onChange={(event) => setPayAmount(event.target.value)}
            placeholder="Enter amount"
            required
          />
          <Input label="Payment Date" type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} required />
          <Input
            label="Remaining Due"
            value={selected ? formatCurrency(selected.dueFee) : ''}
            disabled
          />
        </div>
      </Modal>
    </div>
  )
}

export default FeeList
