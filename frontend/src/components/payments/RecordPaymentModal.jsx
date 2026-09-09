import { useState, useEffect, useRef, useMemo } from 'react'
import { Wallet, AlertCircle, Calendar, Hash, CreditCard, FileText, Search, Check, ChevronDown, X } from 'lucide-react'
import Modal from '../common/Modal'
import Input from '../common/Input'
import Select from '../common/Select'
import Button from '../common/Button'
import Avatar from '../common/Avatar'
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
  const [studentSearch, setStudentSearch] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  const [feeType, setFeeType] = useState('Tuition Fee')
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [transactionId, setTransactionId] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Auto-focus search input whenever dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [isDropdownOpen])

  // Click outside to close student search dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  // Load students for selector if not preselected
  useEffect(() => {
    if (open) {
      setStudentSearch('')
      setIsDropdownOpen(false)
      if (preselectedStudent?.id) {
        setSelectedStudentId(preselectedStudent.id)
      } else {
        setSelectedStudentId('')
        setStudentLedger(null)
        setAmount('')
        setLoadingStudents(true)
        api
          .getStudents()
          .then((res) => {
            setStudents(res || [])
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
    } else {
      setStudentLedger(null)
      setAmount('')
    }
  }, [selectedStudentId, open])

  const selectedStudent = useMemo(() => {
    if (preselectedStudent?.id) return preselectedStudent
    return students.find((s) => s.id === selectedStudentId) || null
  }, [students, selectedStudentId, preselectedStudent])

  const filteredStudentOptions = useMemo(() => {
    if (!studentSearch.trim()) return students
    const q = studentSearch.toLowerCase().trim()
    return students.filter((s) => {
      const name = (s.fullName || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase()
      const code = (s.studentId || s.id || '').toLowerCase()
      const cls = (s.className || '').toLowerCase()
      const sec = (s.section || '').toLowerCase()
      const roll = String(s.rollNumber || '')
      const father = (s.fatherName || '').toLowerCase()
      const phone = (s.phone || '').toLowerCase()
      return (
        name.includes(q) ||
        code.includes(q) ||
        cls.includes(q) ||
        sec.includes(q) ||
        roll.includes(q) ||
        father.includes(q) ||
        phone.includes(q)
      )
    })
  }, [students, studentSearch])

  const pendingDue = studentLedger?.ledger?.pendingAmount ?? 0
  const totalFee = studentLedger?.ledger?.totalFee ?? 0
  const paidAmount = studentLedger?.ledger?.paidAmount ?? 0

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedStudentId) {
      showToast('Please search and select a student first.', 'error')
      return
    }

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

      // Dispatch global event so all pages/dashboards update immediately
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sms:payment-recorded', { detail: recorded }))
      }

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
            disabled={submitting || !selectedStudentId || (pendingDue === 0 && totalFee > 0)}
          >
            {!selectedStudentId
              ? 'Select Student to Pay'
              : pendingDue === 0 && totalFee > 0
              ? 'Dues Already Cleared'
              : 'Process Payment & Generate Receipt'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Searchable Student Selection */}
        {!preselectedStudent ? (
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Select Student <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-indigo-600 font-medium">Search by name, ID, or roll</span>
            </div>

            {/* Clickable Card Trigger */}
            <div
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className={`w-full min-h-[46px] rounded-xl border bg-white px-3 py-2 cursor-pointer transition flex items-center justify-between gap-2 shadow-2xs ${
                isDropdownOpen
                  ? 'border-indigo-500 ring-2 ring-indigo-100'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {selectedStudent ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={selectedStudent.fullName || selectedStudent.firstName} size="sm" />
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {selectedStudent.fullName || `${selectedStudent.firstName} ${selectedStudent.lastName || ''}`.trim()}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      ID: {selectedStudent.studentId || selectedStudent.id} &bull; {selectedStudent.className || 'Class'} {selectedStudent.section ? `(${selectedStudent.section})` : ''} {selectedStudent.rollNumber ? `&bull; Roll #${selectedStudent.rollNumber}` : ''}
                    </p>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-400">Search and choose a student...</span>
              )}

              <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                {selectedStudent && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedStudentId('')
                      setStudentLedger(null)
                      setAmount('')
                    }}
                    className="p-1 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
                    title="Remove selected student"
                  >
                    <X size={14} />
                  </button>
                )}
                <ChevronDown size={16} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {/* Searchable Dropdown Floating Panel */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden animate-scale-in">
                {/* Search input field */}
                <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      autoFocus
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Type student name, ID, or roll number..."
                      className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                    />
                    {studentSearch && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setStudentSearch('')
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filtered Students List */}
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-50 p-1">
                  {loadingStudents ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Loading students list...
                    </div>
                  ) : filteredStudentOptions.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No student found matching &ldquo;{studentSearch}&rdquo;
                    </div>
                  ) : (
                    filteredStudentOptions.map((s) => {
                      const isSelected = s.id === selectedStudentId
                      const sName = s.fullName || `${s.firstName || ''} ${s.lastName || ''}`.trim()

                      return (
                        <div
                          key={s.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedStudentId(s.id)
                            setIsDropdownOpen(false)
                            setStudentSearch('')
                          }}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                            isSelected
                              ? 'bg-indigo-50 text-indigo-900 font-semibold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar name={sName} size="xs" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">{sName}</p>
                              <p className="text-[10px] text-slate-400 truncate">
                                ID: {s.studentId || s.id} &bull; {s.className || 'Class'} {s.section ? `(${s.section})` : ''} {s.rollNumber ? `&bull; Roll #${s.rollNumber}` : ''}
                              </p>
                            </div>
                          </div>

                          {isSelected && (
                            <Check size={15} className="text-indigo-600 shrink-0 mr-1" />
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
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
