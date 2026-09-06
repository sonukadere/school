import { useState, useEffect } from 'react'
import {
  TrendingUp,
  CreditCard,
  Wallet,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowUpRight,
  Download,
} from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Loader from '../../components/common/Loader'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { formatCurrency } from '../../utils/helpers'

export default function PaymentReportsTab() {
  const { showToast } = useToast()
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [academicYear, setAcademicYear] = useState('2026-2027')

  const loadReports = async () => {
    setLoading(true)
    try {
      const res = await api.getPaymentReports({ academicYear })
      const data = res?.data || res
      setReportData(data)
    } catch (err) {
      console.error(err)
      showToast('Failed to load payment reports', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [academicYear])

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader label="Compiling real-time database payment analytics..." />
      </div>
    )
  }

  const summary = reportData?.summary || {}
  const methods = reportData?.methodBreakdown || []
  const classReports = reportData?.classWiseReport || []
  const monthly = reportData?.monthlyCollection || []
  const statusCounts = reportData?.statusCounts || {}

  const maxMonthAmount = Math.max(...monthly.map((m) => m.amount), 1)

  return (
    <div className="space-y-6">
      {/* 1. KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Collection</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">{formatCurrency(summary.totalCollection || 0)}</p>
          <p className="mt-1 text-xs text-slate-500">Across {summary.totalTransactions || 0} cleared receipts</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Outstanding</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-rose-600">{formatCurrency(summary.totalPending || 0)}</p>
          <p className="mt-1 text-xs text-slate-500">Pending & overdue invoices</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Invoiced</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Wallet size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-indigo-900">{formatCurrency(summary.totalInvoiced || 0)}</p>
          <p className="mt-1 text-xs text-slate-500">Academic Year {academicYear}</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Collection Rate</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-purple-700">
            {summary.totalInvoiced > 0
              ? `${Math.round((summary.totalCollection / summary.totalInvoiced) * 100)}%`
              : '0%'}
          </p>
          <p className="mt-1 text-xs text-slate-500">Of total projected revenue</p>
        </Card>
      </div>

      {/* 2. Payment Method Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Payment Method Collections" className="lg:col-span-1">
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold text-slate-800">Cash Collection</span>
              </div>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(summary.cashCollection || 0)}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full bg-indigo-500" />
                <span className="text-sm font-semibold text-slate-800">UPI Collection</span>
              </div>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(summary.upiCollection || 0)}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-sm font-semibold text-slate-800">Card Payments</span>
              </div>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(summary.cardCollection || 0)}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full bg-purple-500" />
                <span className="text-sm font-semibold text-slate-800">Bank Transfer</span>
              </div>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(summary.bankTransferCollection || 0)}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-sm font-semibold text-slate-800">Online / Cheque</span>
              </div>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(summary.onlineCollection || 0)}</span>
            </div>
          </div>
        </Card>

        {/* 3. Monthly Collection Distribution Bars */}
        <Card title="Monthly Collection Trend" className="lg:col-span-2">
          <p className="text-xs text-slate-500 mb-4">Monthly fee collection volume (12 Months)</p>
          <div className="grid grid-cols-12 gap-2 h-52 items-end pt-4 border-b border-slate-200">
            {monthly.map((m) => {
              const heightPct = Math.max(Math.round((m.amount / maxMonthAmount) * 100), 4)
              return (
                <div key={m.month} className="flex flex-col items-center h-full justify-end group">
                  <div className="text-[10px] font-mono text-slate-600 opacity-0 group-hover:opacity-100 transition mb-1">
                    {formatCurrency(m.amount)}
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-indigo-600 to-violet-500 transition-all group-hover:from-indigo-700 group-hover:to-violet-600"
                  />
                  <span className="text-[11px] font-medium text-slate-600 mt-2 truncate w-full text-center">
                    {m.month}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* 4. Class-wise Collection Report Table */}
      <Card title="Class-wise Collection & Pending Analysis">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4 text-right">Collected Revenue</th>
                <th className="py-3 px-4 text-right">Outstanding Dues</th>
                <th className="py-3 px-4 text-right">Collection Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {classReports.length > 0 ? (
                classReports.map((c) => {
                  const total = c.collected + c.pending
                  const rate = total > 0 ? Math.round((c.collected / total) * 100) : 0
                  return (
                    <tr key={c.classId} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{c.className}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600">
                        {formatCurrency(c.collected)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-rose-600">
                        {formatCurrency(c.pending)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-bold text-slate-800">{rate}%</span>
                          <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              style={{ width: `${rate}%` }}
                              className={`h-full ${rate > 75 ? 'bg-emerald-500' : rate > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    No class fee records available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
