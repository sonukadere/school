import { useEffect, useState, useRef } from 'react'
import { Printer, Download, CheckCircle2, ShieldCheck, X, School, User, Calendar, CreditCard, Building2 } from 'lucide-react'
import Button from '../common/Button'
import Badge from '../common/Badge'
import Loader from '../common/Loader'
import { api } from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/helpers'

export default function PaymentReceiptModal({ open, onClose, receiptNumberOrId }) {
  const [loading, setLoading] = useState(false)
  const [receiptData, setReceiptData] = useState(null)
  const [error, setError] = useState(null)
  const printRef = useRef(null)

  useEffect(() => {
    if (!open || !receiptNumberOrId) {
      setReceiptData(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    api
      .getPaymentReceipt(receiptNumberOrId)
      .then((res) => {
        const payload = res?.data || res
        setReceiptData(payload)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Receipt error:', err)
        setError(err.message || 'Failed to fetch payment receipt')
        setLoading(false)
      })
  }, [open, receiptNumberOrId])

  if (!open) return null

  const meta = receiptData?.metadata || {}
  const school = meta.school || {}
  const student = meta.student || {}
  const payment = meta.payment || {}
  const authorized = meta.authorized || {}

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6 print:m-0 print:border-none print:shadow-none print:w-full print:max-w-none">
        {/* Modal Toolbar - Hidden during print */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <ShieldCheck size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Official Payment Receipt</h3>
              <p className="text-xs text-slate-500">Verified transaction record</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={Printer}
              onClick={handlePrint}
              disabled={loading || !!error}
            >
              Print Receipt
            </Button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body / Printable Receipt Area */}
        <div className="p-6 sm:p-8" ref={printRef}>
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <Loader label="Loading official receipt details..." />
            </div>
          ) : error ? (
            <div className="py-12 text-center text-rose-600">
              <p className="font-semibold text-base">Unable to load receipt</p>
              <p className="text-xs text-slate-500 mt-1">{error}</p>
            </div>
          ) : receiptData ? (
            <div className="receipt-container border-2 border-slate-200 rounded-xl p-6 sm:p-7 bg-white relative">
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                <span className="text-8xl font-extrabold tracking-widest uppercase rotate-[-25deg]">
                  PAID
                </span>
              </div>

              {/* 1. School Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-slate-800 pb-5">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  {school.logo ? (
                    <img
                      src={school.logo}
                      alt={school.name}
                      className="h-16 w-16 object-contain rounded-xl border border-slate-100 p-1 shadow-xs"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-2xl shadow-sm">
                      <School size={32} />
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                      {school.name || 'Daily Day Academy'}
                    </h1>
                    <p className="text-xs text-slate-600 mt-0.5">{school.address}</p>
                    <p className="text-xs text-slate-500">
                      Ph: {school.phone} | Email: {school.email}
                    </p>
                    {school.affiliationNumber && (
                      <p className="text-[11px] font-semibold text-indigo-700 mt-0.5">
                        Affiliation No: {school.affiliationNumber}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-center sm:text-right shrink-0">
                  <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-md">
                    FEE RECEIPT
                  </span>
                  <p className="mt-2 font-mono text-sm font-bold text-indigo-900">
                    {payment.receiptNumber || receiptData.receiptNumber}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Date: {formatDate(payment.paymentDate || receiptData.receiptDate)}
                  </p>
                </div>
              </div>

              {/* 2. Student Information Section */}
              <div className="mt-5 rounded-lg bg-slate-50/90 border border-slate-200/80 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium uppercase text-[10px] block">Student Name</span>
                  <span className="font-bold text-slate-900 text-sm">{student.name || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium uppercase text-[10px] block">Student ID</span>
                  <span className="font-mono font-bold text-indigo-600">{student.studentId || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium uppercase text-[10px] block">Class & Section</span>
                  <span className="font-bold text-slate-800">{student.className} - {student.section}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium uppercase text-[10px] block">Parent / Guardian</span>
                  <span className="font-bold text-slate-800">{student.parentName || '—'}</span>
                </div>
              </div>

              {/* 3. Payment Particulars Table */}
              <div className="mt-6">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100/70">
                      <th className="py-2.5 px-3">Description / Fee Head</th>
                      <th className="py-2.5 px-3">Payment Method</th>
                      <th className="py-2.5 px-3">Transaction / Ref ID</th>
                      <th className="py-2.5 px-3 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    <tr>
                      <td className="py-3.5 px-3 font-semibold text-slate-900">
                        {payment.feeType || 'Tuition Fee'}
                      </td>
                      <td className="py-3.5 px-3 font-medium text-slate-700">
                        {payment.paymentMethod || 'CASH'}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-500">
                        {payment.transactionId || 'N/A'}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-700 text-sm text-right">
                        {formatCurrency(payment.amount || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 4. Financial Summary Breakdown */}
              <div className="mt-5 border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">Status:</span>
                    <Badge className={payment.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                      {payment.paymentStatus || 'PAID'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Payment recorded electronically into school accounts ledger.
                  </p>
                </div>

                <div className="w-full sm:w-64 bg-slate-50 rounded-lg p-3 border border-slate-200/70 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Previous Outstanding:</span>
                    <span className="font-mono font-medium">{formatCurrency(payment.previousDue || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                    <span>Amount Paid Now:</span>
                    <span className="font-mono text-emerald-600">{formatCurrency(payment.amount || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-rose-600 border-t border-slate-200 pt-1">
                    <span>Remaining Due:</span>
                    <span className="font-mono">{formatCurrency(payment.remainingDue || 0)}</span>
                  </div>
                </div>
              </div>

              {/* 5. Signatures & Authorization */}
              <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-200 grid grid-cols-2 gap-6 text-center text-xs">
                <div className="flex flex-col items-center justify-end">
                  <div className="w-36 border-b border-slate-400 pb-1 font-signature text-sm text-slate-700 font-semibold">
                    {authorized.generatedBy || 'Accounts Desk'}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 mt-1 font-medium">
                    Issued By: {authorized.generatedBy || 'Administrator'}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-end">
                  <div className="h-9 flex items-center justify-center">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 size={13} /> Official Seal
                    </span>
                  </div>
                  <div className="w-40 border-b border-slate-400 pb-1"></div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 mt-1 font-medium">
                    {authorized.signatureLabel || 'Authorized Bursar / Cashier'}
                  </span>
                </div>
              </div>

              {/* Notice Footer */}
              <p className="mt-6 text-[10px] text-center text-slate-400 border-t border-slate-100 pt-3">
                This is a computer-generated school fee receipt. No physical stamp required if verified with transaction ID.
              </p>
            </div>
          ) : null}
        </div>

        {/* Modal Footer - Hidden during print */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 print:hidden">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" leftIcon={Printer} onClick={handlePrint} disabled={loading || !receiptData}>
            Print / Save as PDF
          </Button>
        </div>
      </div>
    </div>
  )
}
