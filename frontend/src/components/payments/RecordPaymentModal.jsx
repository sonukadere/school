import { useState, useEffect } from 'react'
import { Wallet, AlertCircle, Calendar, Hash, CreditCard, FileText } from 'lucide-react'
import Modal from '../common/Modal'
import Input from '../common/Input'
import Select from '../common/Select'
import Button from '../common/Button'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { formatCurrency } from '../../utils/helpers'

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'ONLINE', label: 'Online Payment' },
]

export default function RecordPaymentModal({
  open,
  onClose,
  preselectedStudent = null,
  onPaymentSuccess,
}) {
  const { showToast } = useToast()
  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [studentLedger, setStudentLedger] = useState(null)
  const [loadingLedger, setLoadingLedger] = useState(false)

  const [feeType, setFeeType] = useState('Tuition Fee')
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [transactionId, setTransactionId] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Load students for selector if not preselected
  useEffect(() => {
    if (open) {
      if (preselectedStudent?.id) {
        setSelectedStudentId(preselectedStudent.id)
      } else {
        setLoadingStudents(true)
        api
          .getStudents()
          .then((res) => {
            setStudents(res || [])
            if (res?.length > 0 && !selectedStudentId) {
              setSelectedStudentId(res[0].id)
            }
            setLoadingStudents(false)
          })
          .catch(() => setLoadingStudents(false))
      }
    }
  }, [open, preselectedStudent])

  // When selected student changes, fetch student ledger
  useEffect(() => {
    if (selectedStudentId && open) {
      setLoadingLedger(true)
      api
        .getStudentFeeLedger(selectedStudentId)
        .then((res) => {
          const payload = res?.data || res
          setStudentLedger(payload)
          // Default amount to pending amount
          if (payload?.ledger?.pendingAmount) {
            setAmount(String(payload.ledger.pendingAmount))
          } else {
            setAmount('')
          }
          setLoadingLedger(false)
        })
        .catch(() => {
          setLoadingLedger(false)
          setStudentLedger(null)
        })
    }
  }, [selectedStudentId, open])

  const pendingDue = studentLedger?.ledger?.pendingAmount ?? 0
  const totalFee = studentLedger?.ledger?.totalFee ?? 0
  const paidAmount = studentLedger?.ledger?.paidAmount ?? 0

  const handleSubmit = async (e) => {
    e.preventDefault()

    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid positive payment amount.', 'error')
      return
    }

    // VALIDATION: cannot exceed remaining payable amount
    if (pendingDue > 0 && numAmount > pendingDue) {
      showToast(
        `Payment amount (${formatCurrency(numAmount)}) cannot exceed the remaining due of ${formatCurrency(pendingDue)}.`,
        'error'
      )
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        studentId: selectedStudentId,
        amount: numAmount,
        feeType,
        paymentDate,
        paymentMethod,
        transactionId: transactionId.trim() || undefined,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      }

      const res = await api.recordPayment(payload)
      const recorded = res?.data || res
      showToast('Payment recorded successfully! Generating receipt...', 'success')

      setSubmitting(false)
      onClose()

      if (onPaymentSuccess) {
        onPaymentSuccess(recorded)
      }
    } catch (err) {
      setSubmitting(false)
      showToast(err.message || 'Failed to record payment.', 'error')
    }
  }

  const studentOptions = students.map((s) => ({
    value: s.id,
    label: `${s.fullName || s.firstName} (${s.studentId || s.id}) - ${s.className || 'Class'} ${s.section || ''}`.trim(),
  }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record Fee Payment"
      description="Create a real database-backed payment transaction and generate official receipt"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            leftIcon={Wallet}
            onClick={handleSubmit}
            loading={submitting}
            disabled={submitting || (pendingDue === 0 && totalFee > 0)}
          >
            {pendingDue === 0 && totalFee > 0 ? 'Dues Already Cleared' : 'Process Payment & Generate Receipt'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Student Selection */}
        {!preselectedStudent ? (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Student <span className="text-rose-500">*</span>
            </label>
            <Select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              options={studentOptions}
              placeholder="Choose a student..."
              disabled={loadingStudents || submitting}
              required
            />
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase">Student</p>
              <p className="font-bold text-slate-900 text-sm">
                {preselectedStudent.fullName || preselectedStudent.name}
              </p>
              <p className="text-xs text-slate-500">
                ID: {preselectedStudent.studentId || preselectedStudent.id} | Class: {preselectedStudent.className} {preselectedStudent.section}
              </p>
            </div>
          </div>
        )}

        {/* Dynamic Balance Snapshot */}
        {selectedStudentId && (
          <div className="grid grid-cols-3 gap-3 rounded-xl bg-indigo-50/70 border border-indigo-100 p-3.5 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-500 block">Total Fee</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {formatCurrency(totalFee)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">Paid So Far</span>
              <span className="font-mono font-bold text-emerald-600 text-sm">
                {formatCurrency(paidAmount)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-600 block">Remaining Due</span>
              <span className="font-mono font-bold text-rose-600 text-sm">
                {formatCurrency(pendingDue)}
              </span>
            </div>
          </div>
        )}

        {/* Fee Head & Amount */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Fee Head / Type"
            value={feeType}
            onChange={(e) => setFeeType(e.target.value)}
            placeholder="e.g. Tuition Fee, Exam Fee"
            required
          />
          <Input
            label="Payment Amount ($)"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter payment amount"
            helper={pendingDue > 0 ? `Max payable: ${formatCurrency(pendingDue)}` : ''}
            required
          />
        </div>

        {/* Date & Method */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              options={PAYMENT_METHODS}
            />
          </div>
        </div>

        {/* Transaction ID & Reference Number */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Transaction ID (Bank / UPI / Cheque No)"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="e.g. UPI/2026/89472"
          />
          <Input
            label="Reference Number"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="e.g. REF-2026-001"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Notes / Remarks</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special remarks or receipt instructions..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </form>
    </Modal>
  )
}
