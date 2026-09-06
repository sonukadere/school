import { useState, useEffect, useMemo } from 'react'
import { AlertTriangle, Clock, Download, Search, Wallet, CheckCircle } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Select from '../../components/common/Select'
import DataTable from '../../components/common/DataTable'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { formatCurrency, formatDate } from '../../utils/helpers'

export default function PendingFeesTab({ onCollectPayment }) {
  const { showToast } = useToast()
  const [pendingList, setPendingList] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  // Filter states
  const [classFilter, setClassFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [pendingRes, classList] = await Promise.all([
        api.getPendingFees({ limit: 200 }),
        api.getClasses(),
      ])
      const data = pendingRes?.data || pendingRes || []
      setPendingList(Array.isArray(data) ? data : [])
      setClasses(classList || [])
    } catch (err) {
      console.error(err)
      showToast('Failed to load pending fees records', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredData = useMemo(() => {
    return pendingList.filter((item) => {
      if (classFilter && item.className !== classFilter && !item.className.includes(classFilter)) {
        return false
      }
      if (statusFilter && item.status !== statusFilter) {
        return false
      }
      return true
    })
  }, [pendingList, classFilter, statusFilter])

  const totalOutstanding = filteredData.reduce((sum, item) => sum + (item.dueAmount || 0), 0)
  const overdueCount = filteredData.filter((item) => item.status === 'OVERDUE' || item.daysOverdue > 0).length

  // CSV Export handler
  const handleExportCSV = () => {
    if (!filteredData.length) {
      showToast('No pending records to export.', 'info')
      return
    }

    const headers = [
      'Invoice #',
      'Student Name',
      'Student ID',
      'Class',
      'Section',
      'Fee Head',
      'Total Fee',
      'Paid Fee',
      'Due Balance',
      'Due Date',
      'Days Overdue',
      'Status',
    ]

    const rows = filteredData.map((item) => [
      `"${item.invoiceNumber || ''}"`,
      `"${item.studentName || ''}"`,
      `"${item.studentCode || ''}"`,
      `"${item.className || ''}"`,
      `"${item.section || ''}"`,
      `"${item.feeType || ''}"`,
      item.totalFee || 0,
      item.paidAmount || 0,
      item.dueAmount || 0,
      item.dueDate ? item.dueDate.slice(0, 10) : '',
      item.daysOverdue || 0,
      item.status || '',
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `pending_fees_report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Pending fees report downloaded.', 'success')
  }

  const columns = [
    {
      key: 'studentName',
      header: 'Student',
      searchValue: (item) => `${item.studentName} ${item.studentCode}`,
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-900">{item.studentName}</p>
          <p className="font-mono text-xs text-slate-500">{item.studentCode}</p>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class & Section',
      render: (item) => (
        <span className="font-medium text-slate-700">
          {item.className} - {item.section}
        </span>
      ),
    },
    {
      key: 'feeType',
      header: 'Fee Head',
      render: (item) => <span className="text-xs text-slate-600 font-medium">{item.feeType}</span>,
    },
    {
      key: 'totalFee',
      header: 'Total Fee',
      render: (item) => <span className="text-slate-700 font-medium">{formatCurrency(item.totalFee)}</span>,
    },
    {
      key: 'paidAmount',
      header: 'Paid',
      render: (item) => <span className="text-emerald-600 font-medium">{formatCurrency(item.paidAmount)}</span>,
    },
    {
      key: 'dueAmount',
      header: 'Outstanding Due',
      render: (item) => (
        <span className="font-bold text-rose-600 font-mono text-sm">
          {formatCurrency(item.dueAmount)}
        </span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (item) => (item.dueDate ? formatDate(item.dueDate) : <span className="text-slate-400">—</span>),
    },
    {
      key: 'daysOverdue',
      header: 'Days Overdue',
      render: (item) =>
        item.daysOverdue > 0 ? (
          <span className="inline-flex items-center gap-1 font-bold text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
            <AlertTriangle size={12} /> {item.daysOverdue} days
          </span>
        ) : (
          <span className="text-xs text-slate-400 font-medium">On Schedule</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge
          className={
            item.status === 'OVERDUE'
              ? 'bg-rose-100 text-rose-700 border border-rose-200'
              : item.status === 'PARTIAL'
              ? 'bg-amber-100 text-amber-700 border border-amber-200'
              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
          }
        >
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      className: 'text-right',
      render: (item) => (
        <Button
          size="sm"
          variant="outline"
          leftIcon={Wallet}
          onClick={() => {
            if (onCollectPayment) {
              onCollectPayment({
                id: item.studentId,
                studentId: item.studentCode,
                fullName: item.studentName,
                name: item.studentName,
                className: item.className,
                section: item.section,
              })
            }
          }}
          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
        >
          Collect
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Pending Dues</p>
            <p className="text-xl font-bold text-rose-600">{formatCurrency(totalOutstanding)}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Students with Pending Dues</p>
            <p className="text-xl font-bold text-slate-900">{filteredData.length}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Overdue Invoices</p>
            <p className="text-xl font-bold text-purple-600">{overdueCount}</p>
          </div>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        loading={loading}
        pageSize={10}
        searchPlaceholder="Search student name or ID..."
        emptyTitle="No pending fees found"
        emptyDescription="Great news! All students have cleared their scheduled fee balances."
        emptyIcon={CheckCircle}
        toolbar={
          <>
            <Select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              options={[
                { value: '', label: 'All Classes' },
                ...classes.map((c) => ({ value: c.name, label: `${c.name} ${c.section}`.trim() })),
              ]}
              className="w-44"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'OVERDUE', label: 'Overdue Only' },
                { value: 'PARTIAL', label: 'Partial Dues' },
                { value: 'PENDING', label: 'Unpaid / Pending' },
              ]}
              className="w-40"
            />
            <Button
              variant="outline"
              size="sm"
              leftIcon={Download}
              onClick={handleExportCSV}
              disabled={!filteredData.length}
            >
              Export CSV
            </Button>
            {(classFilter || statusFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setClassFilter('')
                  setStatusFilter('')
                }}
              >
                Clear
              </Button>
            )}
          </>
        }
      />
    </div>
  )
}
