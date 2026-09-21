import {
  Wallet,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Receipt,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle2,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AccountantDashboardView({ data, user }) {
  const counts = data?.counts || {}
  const recentPayments = data?.recentPayments || []
  const recentInvoices = data?.recentInvoices || []
  const notices = data?.notices || []

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            Accounts & Finance Control Center
          </span>
          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name || 'Accountant'}!
          </h1>
          <p className="mt-1 text-emerald-100 text-sm max-w-xl">
            Real-time fee collections, outstanding parent balances, and automated teacher payroll disbursements.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              to="/fees"
              aria-label="Collect Student Fee"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-emerald-800 shadow-md hover:bg-emerald-50 transition"
            >
              <Receipt size={16} /> Collect Student Fee
            </Link>
            <Link
              to="/payroll"
              aria-label="Monthly Payroll"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-800/60 border border-emerald-400/30 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition"
            >
              <CreditCard size={16} /> Monthly Payroll
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Financial Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Today's Collections</p>
              <h3 className="mt-1 text-2xl font-bold text-emerald-600">
                ₹{Number(counts.todayFeeCollected || 0).toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-600">Collected today at cash counter & online</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Month's Collection</p>
              <h3 className="mt-1 text-2xl font-bold text-indigo-600">
                ₹{Number(counts.monthFeeCollected || 0).toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Wallet size={24} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-600">Total fees realized this calendar month</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Outstanding Dues</p>
              <h3 className="mt-1 text-2xl font-bold text-amber-600">
                ₹{Number(counts.totalPendingFees || 0).toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <AlertCircle size={24} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-600">Unpaid parent invoice balances</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Monthly Payroll</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-800">
                ₹{Number(counts.monthPayrollDisbursed || 0).toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <CreditCard size={24} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-600">
            Pending: ₹{Number(counts.monthPayrollPending || 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Main Dual Data Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payment Transactions */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Receipt className="text-emerald-600" size={18} />
                Recent Fee Transactions
              </h3>
              <Link to="/fees" aria-label="View all fee payments" className="text-xs font-bold text-emerald-600 hover:underline">
                View All Payments
              </Link>
            </div>

            {recentPayments.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">No payment receipts logged yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentPayments.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-slate-800 text-sm">
                        {p.student?.firstName} {p.student?.lastName}
                      </h5>
                      <p className="text-xs text-slate-500">
                        {p.student?.class?.name} • {new Date(p.paymentDate).toLocaleDateString()} • {p.paymentMethod}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 text-sm">
                        +₹{Number(p.amount).toLocaleString('en-IN')}
                      </span>
                      <p className="text-[10px] text-slate-500 font-mono">{p.paymentNumber || p.id.slice(-6)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Outstanding Pending Invoices */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <AlertCircle className="text-amber-500" size={18} />
                Pending Fee Invoices
              </h3>
              <Link to="/fees" aria-label="View all fee invoices" className="text-xs font-bold text-indigo-600 hover:underline">
                All Invoices
              </Link>
            </div>

            {recentInvoices.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">No pending fee balances! All up to date.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentInvoices.map((inv) => (
                  <div key={inv.id} className="py-3 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-slate-800 text-sm">
                        {inv.student?.firstName} {inv.student?.lastName}
                      </h5>
                      <p className="text-xs text-slate-500">
                        Due: {new Date(inv.dueDate).toLocaleDateString()} • {inv.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-600 text-sm">
                        ₹{Number(inv.pendingAmount).toLocaleString('en-IN')}
                      </span>
                      <p className="text-[10px] text-slate-500 font-mono">{inv.invoiceNumber}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
