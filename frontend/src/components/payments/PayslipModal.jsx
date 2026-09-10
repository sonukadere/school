import { useEffect, useState, useRef } from 'react'
import {
  Printer,
  ShieldCheck,
  X,
  School,
  User,
  Calendar,
  CreditCard,
  Building2,
  CheckCircle2,
  FileCheck,
} from 'lucide-react'
import Button from '../common/Button'
import Badge from '../common/Badge'
import Loader from '../common/Loader'
import { api } from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/helpers'

export default function PayslipModal({ open, onClose, payslipNumberOrId }) {
  const [loading, setLoading] = useState(false)
  const [payslipData, setPayslipData] = useState(null)
  const [error, setError] = useState(null)
  const printRef = useRef(null)

  useEffect(() => {
    if (!open || !payslipNumberOrId) {
      setPayslipData(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    api
      .getPayslip(payslipNumberOrId)
      .then((res) => {
        const payload = res?.data || res
        setPayslipData(payload)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Payslip fetch error:', err)
        setError(err.message || 'Failed to fetch payslip details')
        setLoading(false)
      })
  }, [open, payslipNumberOrId])

  if (!open) return null

  const meta = payslipData?.metadata || {}
  const school = meta.school || {}
  const teacher = meta.teacher || {}
  const payroll = meta.payroll || {}
  const authorized = meta.authorized || {}

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] overflow-hidden print:p-0 print:bg-white animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[min(90vh,860px)] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col print:m-0 print:border-none print:shadow-none print:w-full print:max-w-none">
        {/* Modal Toolbar - Hidden during print */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/95 px-3.5 sm:px-6 py-3 sm:py-4 print:hidden shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 shrink-0">
              <FileCheck size={18} />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">Official Teacher Payslip</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">Verified monthly salary disbursement record</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              leftIcon={Printer}
              onClick={handlePrint}
              disabled={loading || !!error}
            >
              <span className="hidden sm:inline">Print / Save as PDF</span>
              <span className="sm:hidden">Print</span>
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

        {/* Modal Body / Printable Payslip Area */}
        <div className="p-3 sm:p-6 md:p-8 overflow-y-auto flex-1 min-h-0 touch-scroll overscroll-contain print:overflow-visible print:p-0" ref={printRef}>
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <Loader label="Loading official teacher payslip..." />
            </div>
          ) : error ? (
            <div className="py-12 text-center text-rose-600">
              <p className="font-semibold text-base">Unable to load payslip</p>
              <p className="text-xs text-slate-500 mt-1">{error}</p>
            </div>
          ) : payslipData ? (
            <div className="payslip-container border sm:border-2 border-slate-200 rounded-xl p-3 sm:p-6 md:p-8 bg-white relative overflow-x-auto">
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
                  <span className="inline-block px-3 py-1 bg-indigo-900 text-white text-xs font-bold uppercase tracking-wider rounded-md">
                    SALARY PAYSLIP
                  </span>
                  <p className="mt-2 font-mono text-sm font-bold text-indigo-900">
                    {payroll.payslipNumber || payslipData.payslipNumber}
                  </p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    Pay Period: {payroll.month} {payroll.year}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Issue Date: {formatDate(payroll.paymentDate || payslipData.issueDate)}
                  </p>
                </div>
              </div>

              {/* 2. Employee Details Banner */}
              <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200/80 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium uppercase text-[10px] block">Teacher Name</span>
                  <span className="font-bold text-slate-900 text-sm">{teacher.name || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium uppercase text-[10px] block">Teacher ID</span>
                  <span className="font-mono font-bold text-indigo-600">{teacher.teacherId || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium uppercase text-[10px] block">Designation</span>
                  <span className="font-bold text-slate-800">{teacher.designation || 'Faculty Member'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium uppercase text-[10px] block">Bank Account</span>
                  <span className="font-mono text-slate-700">{teacher.bankAccount || 'Direct Credit'}</span>
                </div>
              </div>

              {/* 3. Itemized Earnings & Deductions Breakdown Tables */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-200 rounded-xl overflow-hidden">
                {/* Left Side: Earnings */}
                <div>
                  <div className="bg-emerald-50/70 px-4 py-2.5 border-b border-slate-200 text-xs font-bold text-emerald-900 uppercase tracking-wider flex justify-between">
                    <span>Earnings Head</span>
                    <span>Amount</span>
                  </div>
                  <table className="w-full text-xs divide-y divide-slate-100">
                    <tbody>
                      <tr>
                        <td className="py-2.5 px-4 text-slate-700">Basic Salary</td>
                        <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-900">
                          {formatCurrency(payroll.basicSalary || 0)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-slate-700">Allowances (HRA, DA, Special)</td>
                        <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-900">
                          {formatCurrency(payroll.allowances || 0)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-slate-700">Performance Bonus / Incentives</td>
                        <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-900">
                          {formatCurrency(payroll.bonus || 0)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="border-t border-slate-200 bg-slate-50 font-bold text-xs">
                      <tr>
                        <td className="py-2.5 px-4 text-slate-900">Gross Salary (A)</td>
                        <td className="py-2.5 px-4 text-right font-mono text-emerald-700">
                          {formatCurrency(payroll.grossSalary || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Right Side: Deductions */}
                <div className="border-t md:border-t-0 md:border-l border-slate-200">
                  <div className="bg-rose-50/70 px-4 py-2.5 border-b border-slate-200 text-xs font-bold text-rose-900 uppercase tracking-wider flex justify-between">
                    <span>Deduction Head</span>
                    <span>Amount</span>
                  </div>
                  <table className="w-full text-xs divide-y divide-slate-100">
                    <tbody>
                      <tr>
                        <td className="py-2.5 px-4 text-slate-700">Statutory Deductions (PF / Tax / TDS)</td>
                        <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-900">
                          {formatCurrency(payroll.deductions || 0)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-slate-700">Salary Advance / Recovery</td>
                        <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-900">
                          {formatCurrency(payroll.advance || 0)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-slate-400 italic">Other Withholdings</td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-400">{formatCurrency(0)}</td>
                      </tr>
                    </tbody>
                    <tfoot className="border-t border-slate-200 bg-slate-50 font-bold text-xs">
                      <tr>
                        <td className="py-2.5 px-4 text-slate-900">Total Deductions (B)</td>
                        <td className="py-2.5 px-4 text-right font-mono text-rose-700">
                          {formatCurrency((payroll.deductions || 0) + (payroll.advance || 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 4. Net Salary Card */}
              <div className="mt-5 rounded-xl bg-indigo-50/80 border-2 border-indigo-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block">
                    Net Take-Home Salary (Gross A - Deductions B)
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Disbursed via <strong>{payroll.paymentMethod || 'Bank Transfer'}</strong> • Txn ID: {payroll.transactionId || 'N/A'}
                  </p>
                </div>
                <div className="text-center sm:text-right">
                  <span className="font-mono text-2xl sm:text-3xl font-black text-indigo-900">
                    {formatCurrency(payroll.netSalary || 0)}
                  </span>
                  <div className="flex items-center justify-center sm:justify-end gap-1.5 mt-1">
                    <Badge className="bg-emerald-100 text-emerald-800 text-xs font-bold">
                      {payroll.paymentStatus || 'PAID'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 5. Signatures & Authorization */}
              <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-200 grid grid-cols-2 gap-6 text-center text-xs">
                <div className="flex flex-col items-center justify-end">
                  <div className="w-36 border-b border-slate-400 pb-1 font-signature text-sm text-slate-700 font-semibold">
                    {teacher.name || 'Faculty Member'}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 mt-1 font-medium">
                    Employee Signature
                  </span>
                </div>
                <div className="flex flex-col items-center justify-end">
                  <div className="h-9 flex items-center justify-center">
                    <span className="inline-flex items-center gap-1 text-indigo-700 font-bold text-xs bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      <CheckCircle2 size={13} /> Official Seal
                    </span>
                  </div>
                  <div className="w-40 border-b border-slate-400 pb-1"></div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 mt-1 font-medium">
                    {authorized.signatureLabel || 'Authorized Bursar / Principal'}
                  </span>
                </div>
              </div>

              {/* Notice Footer */}
              <p className="mt-6 text-[10px] text-center text-slate-400 border-t border-slate-100 pt-3">
                This is a computer-generated salary payslip issued by {school.name || 'Daily Day Academy'}. No physical stamp required if electronic transaction ID is verified.
              </p>
            </div>
          ) : null}
        </div>

        {/* Modal Footer - Hidden during print */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 print:hidden">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" leftIcon={Printer} onClick={handlePrint} disabled={loading || !payslipData}>
            Print / Save as PDF
          </Button>
        </div>
      </div>
    </div>
  )
}
