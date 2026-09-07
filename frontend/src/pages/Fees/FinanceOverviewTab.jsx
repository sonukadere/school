import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Scale,
  Users,
  CreditCard,
} from 'lucide-react'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Loader from '../../components/common/Loader'
import Button from '../../components/common/Button'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { formatCurrency } from '../../utils/helpers'

export default function FinanceOverviewTab() {
  const { showToast } = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadSummary = async () => {
    setLoading(true)
    try {
      const res = await api.getFinanceSummary()
      const payload = res?.data || res
      setData(payload)
    } catch (err) {
      console.error(err)
      showToast('Failed to load financial dashboard summary', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [])

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader label="Compiling live institutional cashflow and ledger balances..." />
      </div>
    )
  }

  const fees = data?.studentFees || {}
  const salary = data?.teacherSalary || {}
  const summary = data?.financeSummary || {}

  const isSurplus = summary.netBalance >= 0

  return (
    <div className="space-y-6">
      {/* 1. Global Institutional Cashflow Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 text-xs font-semibold text-indigo-200 mb-2">
              <Scale size={14} className="text-indigo-300" />
              Institutional Financial Balance Sheet
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Net Operating Balance: {formatCurrency(summary.netBalance || 0)}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-xl">
              Real-time balance computed strictly as <strong>Total Fee Collections minus Disbursed Teacher Salaries</strong>.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/10 text-center min-w-[130px]">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block">Total Income</span>
              <span className="font-mono text-xl font-bold text-white mt-0.5 block">
                {formatCurrency(summary.totalIncome || 0)}
              </span>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/10 text-center min-w-[130px]">
              <span className="text-[10px] uppercase font-bold text-rose-300 block">Salary Expenses</span>
              <span className="font-mono text-xl font-bold text-white mt-0.5 block">
                {formatCurrency(summary.totalSalaryExpense || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top-Level Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total School Income</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">{formatCurrency(summary.totalIncome || 0)}</p>
          <p className="mt-1 text-xs text-slate-500">Cleared student fee payments</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Salary Expenses</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown size={20} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-rose-600">{formatCurrency(summary.totalSalaryExpense || 0)}</p>
          <p className="mt-1 text-xs text-slate-500">Disbursed faculty compensation</p>
        </Card>

        <Card className={`p-5 border-l-4 ${isSurplus ? 'border-l-indigo-500' : 'border-l-amber-500'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Balance</span>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isSurplus ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
              <Scale size={20} />
            </div>
          </div>
          <p className={`mt-3 text-2xl font-black ${isSurplus ? 'text-indigo-900' : 'text-amber-700'}`}>
            {formatCurrency(summary.netBalance || 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">{isSurplus ? 'Operational Surplus' : 'Operational Deficit'}</p>
        </Card>
      </div>

      {/* 3. Detailed Student Fee Ledger Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="text-indigo-600" size={18} /> Student Fee Ledger Breakdown
          </h3>
          <span className="text-xs text-slate-500">Academic Year {data?.academicYear || '2026-2027'}</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card bodyClassName="p-4">
            <span className="text-xs text-slate-500 font-medium block">Total Expected Fees</span>
            <p className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(fees.totalExpectedFees || 0)}</p>
            <span className="text-[11px] text-slate-400 mt-1 block">Assessed student invoices</span>
          </Card>

          <Card bodyClassName="p-4">
            <span className="text-xs text-emerald-700 font-medium block">Total Collected Fees</span>
            <p className="mt-1 text-xl font-bold text-emerald-600">{formatCurrency(fees.totalCollected || 0)}</p>
            <span className="text-[11px] text-emerald-600 mt-1 block">
              {fees.totalExpectedFees > 0
                ? `${Math.round((fees.totalCollected / fees.totalExpectedFees) * 100)}% recovery rate`
                : '0%'}
            </span>
          </Card>

          <Card bodyClassName="p-4">
            <span className="text-xs text-rose-700 font-medium block">Total Pending Fees</span>
            <p className="mt-1 text-xl font-bold text-rose-600">{formatCurrency(fees.totalPending || 0)}</p>
            <span className="text-[11px] text-rose-500 mt-1 block">Remaining accounts receivable</span>
          </Card>

          <Card bodyClassName="p-4">
            <span className="text-xs text-purple-700 font-medium block">Total Overdue Fees</span>
            <p className="mt-1 text-xl font-bold text-purple-700">{formatCurrency(fees.totalOverdue || 0)}</p>
            <span className="text-[11px] text-purple-500 mt-1 block">Past scheduled due dates</span>
          </Card>
        </div>

        {/* Student Settlement Distribution */}
        <Card title="Student Payment Compliance">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Fully Paid Students</p>
                <p className="text-2xl font-bold text-emerald-700">{fees.fullyPaidStudents || 0}</p>
                <p className="text-[11px] text-emerald-600">Zero pending balance</p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-bold">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Partial Paid Students</p>
                <p className="text-2xl font-bold text-amber-700">{fees.partialPaidStudents || 0}</p>
                <p className="text-[11px] text-amber-600">Installments in progress</p>
              </div>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-700 font-bold">
                <AlertTriangle size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Unpaid Students</p>
                <p className="text-2xl font-bold text-rose-700">{fees.unpaidStudents || 0}</p>
                <p className="text-[11px] text-rose-600">No payments recorded</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 4. Teacher Salary & Payroll Section */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <DollarSign className="text-emerald-600" size={18} /> Teacher Salary & Payroll Status
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card bodyClassName="p-4">
            <span className="text-xs text-slate-500 font-medium block">Total Salary Payable (YTD)</span>
            <p className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(salary.totalSalaryPayable || 0)}</p>
            <span className="text-[11px] text-slate-400 mt-1 block">Total compensation assessed</span>
          </Card>

          <Card bodyClassName="p-4">
            <span className="text-xs text-emerald-700 font-medium block">Total Salary Paid</span>
            <p className="mt-1 text-xl font-bold text-emerald-600">{formatCurrency(salary.totalSalaryPaid || 0)}</p>
            <span className="text-[11px] text-emerald-600 mt-1 block">Disbursed with payslips</span>
          </Card>

          <Card bodyClassName="p-4">
            <span className="text-xs text-amber-700 font-medium block">Total Salary Pending</span>
            <p className="mt-1 text-xl font-bold text-amber-600">{formatCurrency(salary.totalSalaryPending || 0)}</p>
            <span className="text-[11px] text-amber-600 mt-1 block">Awaiting disbursement</span>
          </Card>

          <Card bodyClassName="p-4">
            <span className="text-xs text-indigo-700 font-medium block">Current Month Payroll</span>
            <p className="mt-1 text-xl font-bold text-indigo-700">
              {formatCurrency(salary.currentMonthPayroll || 0)}
            </p>
            <span className="text-[11px] text-indigo-600 mt-1 block">
              Month {salary.currentMonth || ''}, {salary.currentYear || ''}
            </span>
          </Card>
        </div>
      </div>
    </div>
  )
}
