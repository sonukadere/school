import { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Download,
  Printer,
  CalendarCheck,
  Wallet,
  GraduationCap,
  Users,
  CreditCard,
  Building2,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Loader from '../../components/common/Loader'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { apiClient } from '../../services/apiClient'
import api from '../../services/api'

export default function ReportsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState('fees') // 'fees' | 'payroll' | 'students'
  const [loading, setLoading] = useState(true)

  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')

  // Report Data States
  const [feeInvoices, setFeeInvoices] = useState([])
  const [payrollRecords, setPayrollRecords] = useState([])
  const [studentsList, setStudentsList] = useState([])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [clsRes, invRes, payRes, stuRes] = await Promise.all([
        api.getClasses ? api.getClasses() : apiClient.get('/classes'),
        apiClient.get('/fees/invoices', { limit: 100 }).catch(() => ({ data: [] })),
        apiClient.get('/payroll', { limit: 100 }).catch(() => ({ data: [] })),
        api.getStudents({ limit: 100 }).catch(() => ({ data: [] })),
      ])

      setClasses(Array.isArray(clsRes) ? clsRes : (clsRes?.data || []))
      setFeeInvoices(invRes?.data || [])
      setPayrollRecords(payRes?.data || [])
      setStudentsList(stuRes?.data || [])
    } catch (err) {
      showToast('Failed to load reports data', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // CSV Export utility
  const exportToCsv = (filename, headers, rows) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Report CSV exported successfully!', 'success')
  }

  // Print Report utility
  const handlePrint = () => {
    window.print()
  }

  // Calculate Fee Totals
  const totalFeesInvoiced = feeInvoices.reduce((acc, curr) => acc + (Number(curr.finalAmount) || 0), 0)
  const totalFeesCollected = feeInvoices.reduce((acc, curr) => acc + (Number(curr.paidAmount) || 0), 0)
  const totalFeesOutstanding = feeInvoices.reduce((acc, curr) => acc + (Number(curr.pendingAmount) || 0), 0)

  // Calculate Payroll Totals
  const totalPayrollDisbursed = payrollRecords
    .filter((p) => p.paymentStatus === 'PAID')
    .reduce((acc, curr) => acc + (Number(curr.netSalary) || 0), 0)

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageHeader
          title="Institutional Reports & Audit Center"
          description="Consolidated analytical reports across fees, admissions funnel, staff payroll, and student demographics"
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={handlePrint}
                icon={Printer}
              >
                Print Report
              </Button>
            </div>
          }
        />

        {/* Tab Navigator */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
          {[
            { id: 'fees', label: 'Fee Collections & Dues', icon: Wallet },
            { id: 'payroll', label: 'Teacher Salary & Payroll', icon: CreditCard },
            { id: 'students', label: 'Student Demographics', icon: GraduationCap },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold whitespace-nowrap transition ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader size="lg" />
        </div>
      ) : activeTab === 'fees' ? (
        /* ================== FEES REPORT ================== */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
              <p className="text-xs font-semibold uppercase text-slate-400">Total Billed Invoices</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-800">
                ₹{totalFeesInvoiced.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
              <p className="text-xs font-semibold uppercase text-slate-400">Realized Collections</p>
              <h3 className="mt-1 text-2xl font-bold text-emerald-600">
                ₹{totalFeesCollected.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
              <p className="text-xs font-semibold uppercase text-slate-400">Outstanding Balances</p>
              <h3 className="mt-1 text-2xl font-bold text-amber-600">
                ₹{totalFeesOutstanding.toLocaleString('en-IN')}
              </h3>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <h4 className="text-base font-bold text-slate-800">Fee Invoices Breakdown</h4>
              <Button
                size="sm"
                variant="secondary"
                icon={Download}
                onClick={() =>
                  exportToCsv(
                    'fee_collection_report',
                    ['Invoice No', 'Student Name', 'Class', 'Due Date', 'Billed Amount', 'Paid Amount', 'Pending Amount', 'Status'],
                    feeInvoices.map((inv) => [
                      inv.invoiceNumber,
                      `${inv.student?.firstName || ''} ${inv.student?.lastName || ''}`,
                      inv.student?.class?.name || '',
                      new Date(inv.dueDate).toLocaleDateString(),
                      inv.finalAmount,
                      inv.paidAmount,
                      inv.pendingAmount,
                      inv.status,
                    ])
                  )
                }
              >
                Export CSV
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-100 bg-slate-50/75 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Invoice No</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3">Billed</th>
                    <th className="px-4 py-3">Paid</th>
                    <th className="px-4 py-3">Pending</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feeInvoices.slice(0, 50).map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-xs text-indigo-600">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {inv.student?.firstName} {inv.student?.lastName}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{inv.student?.class?.name}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">₹{Number(inv.finalAmount).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">₹{Number(inv.paidAmount).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-bold text-amber-600">₹{Number(inv.pendingAmount).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'payroll' ? (
        /* ================== PAYROLL REPORT ================== */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
              <p className="text-xs font-semibold uppercase text-slate-400">Total Salary Disbursed</p>
              <h3 className="mt-1 text-2xl font-bold text-emerald-600">
                ₹{totalPayrollDisbursed.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
              <p className="text-xs font-semibold uppercase text-slate-400">Payroll Records Generated</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-800">{payrollRecords.length}</h3>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <h4 className="text-base font-bold text-slate-800">Faculty Payroll Register</h4>
              <Button
                size="sm"
                variant="secondary"
                icon={Download}
                onClick={() =>
                  exportToCsv(
                    'teacher_payroll_report',
                    ['Payroll ID', 'Teacher Name', 'Month', 'Year', 'Basic Salary', 'Deductions', 'Net Salary', 'Status'],
                    payrollRecords.map((p) => [
                      p.payrollNumber || p.id,
                      p.teacher?.name || '',
                      p.month,
                      p.year,
                      p.basicSalary,
                      p.deductions,
                      p.netSalary,
                      p.paymentStatus,
                    ])
                  )
                }
              >
                Export CSV
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-100 bg-slate-50/75 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Payroll ID</th>
                    <th className="px-4 py-3">Teacher Name</th>
                    <th className="px-4 py-3">Month/Year</th>
                    <th className="px-4 py-3">Basic Salary</th>
                    <th className="px-4 py-3">Attendance Deductions</th>
                    <th className="px-4 py-3">Net Disbursed</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payrollRecords.slice(0, 50).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-xs text-indigo-600">{p.payrollNumber || p.id.slice(-6)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{p.teacher?.name}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{p.month} {p.year}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">₹{Number(p.basicSalary).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-medium text-red-500">-₹{Number(p.deductions).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">₹{Number(p.netSalary).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {p.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ================== STUDENTS DEMOGRAPHICS ================== */
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <h4 className="text-base font-bold text-slate-800">Student Enrollment Register ({studentsList.length})</h4>
              <Button
                size="sm"
                variant="secondary"
                icon={Download}
                onClick={() =>
                  exportToCsv(
                    'students_enrollment_report',
                    ['Student ID', 'First Name', 'Last Name', 'Class', 'Roll No', 'Gender', 'Phone', 'Status'],
                    studentsList.map((s) => [
                      s.studentId,
                      s.firstName,
                      s.lastName,
                      s.className || s.class?.name || '',
                      s.rollNumber || '',
                      s.gender,
                      s.phone,
                      s.status,
                    ])
                  )
                }
              >
                Export CSV
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-100 bg-slate-50/75 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Student ID</th>
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Roll No</th>
                    <th className="px-4 py-3">Gender</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentsList.slice(0, 50).map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-xs text-indigo-600">{s.studentId}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {s.firstName} {s.lastName}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{s.className || s.class?.name}</td>
                      <td className="px-4 py-3 text-xs text-slate-700">{s.rollNumber || '-'}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{s.gender}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{s.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
