import { useState, useEffect, useMemo } from 'react'
import { Plus, Edit2, DollarSign, Briefcase, Building2, CheckCircle2 } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import DataTable from '../../components/common/DataTable'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { formatCurrency } from '../../utils/helpers'

export default function SalaryStructureTab() {
  const { showToast } = useToast()
  const [structures, setStructures] = useState([])
  const [loading, setLoading] = useState(true)

  // Edit modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)
  const [designation, setDesignation] = useState('Teacher')
  const [basicSalary, setBasicSalary] = useState('30000')
  const [allowances, setAllowances] = useState('5000')
  const [bonus, setBonus] = useState('0')
  const [deductions, setDeductions] = useState('2500')
  const [advance, setAdvance] = useState('0')
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER')
  const [bankAccount, setBankAccount] = useState('')
  const [bankName, setBankName] = useState('')
  const [ifscCode, setIfscCode] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.getTeacherSalaryStructures({ limit: 100 })
      const list = res?.data || res || []
      setStructures(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error(err)
      showToast('Failed to load salary structures', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openEditModal = (item) => {
    setEditingTeacher(item)
    setDesignation(item.designation || 'Teacher')
    setBasicSalary(String(item.basicSalary || 0))
    setAllowances(String(item.allowances || 0))
    setBonus(String(item.bonus || 0))
    setDeductions(String(item.deductions || 0))
    setAdvance(String(item.advance || 0))
    setPaymentMethod(item.paymentMethod || 'BANK_TRANSFER')
    setBankAccount(item.bankAccount || '')
    setBankName(item.bankName || '')
    setIfscCode(item.ifscCode || '')
    setStatus(item.status || 'ACTIVE')
    setModalOpen(true)
  }

  // Live calculation preview
  const numBasic = Number(basicSalary) || 0
  const numAllowances = Number(allowances) || 0
  const numBonus = Number(bonus) || 0
  const numDeductions = Number(deductions) || 0
  const numAdvance = Number(advance) || 0

  const previewGross = numBasic + numAllowances + numBonus
  const previewNet = Math.max(previewGross - numDeductions - numAdvance, 0)

  const handleSave = async (e) => {
    e.preventDefault()
    if (!editingTeacher) return

    setSaving(true)
    try {
      await api.saveTeacherSalaryStructure({
        teacherId: editingTeacher.teacherId,
        designation,
        basicSalary: numBasic,
        allowances: numAllowances,
        bonus: numBonus,
        deductions: numDeductions,
        advance: numAdvance,
        paymentMethod,
        bankAccount: bankAccount.trim() || null,
        bankName: bankName.trim() || null,
        ifscCode: ifscCode.trim() || null,
        status,
      })

      showToast(`Salary structure saved for ${editingTeacher.name}.`, 'success')
      setSaving(false)
      setModalOpen(false)
      loadData()
    } catch (err) {
      setSaving(false)
      showToast(err.message || 'Failed to save salary structure', 'error')
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Faculty Member',
      searchValue: (item) => `${item.name} ${item.teacherCode} ${item.designation}`,
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-900">{item.name}</p>
          <p className="font-mono text-xs text-slate-500">
            {item.teacherCode} • {item.designation}
          </p>
        </div>
      ),
    },
    {
      key: 'subjectName',
      header: 'Department / Subject',
      render: (item) => <span className="font-medium text-slate-700">{item.subjectName}</span>,
    },
    {
      key: 'basicSalary',
      header: 'Basic Salary',
      render: (item) => <span className="font-mono font-medium text-slate-800">{formatCurrency(item.basicSalary)}</span>,
    },
    {
      key: 'allowances',
      header: 'Allowances',
      render: (item) => (
        <span className="font-mono text-emerald-600">
          {item.allowances > 0 ? `+${formatCurrency(item.allowances)}` : '—'}
        </span>
      ),
    },
    {
      key: 'grossSalary',
      header: 'Gross Salary',
      render: (item) => <span className="font-mono font-semibold text-slate-900">{formatCurrency(item.grossSalary)}</span>,
    },
    {
      key: 'deductions',
      header: 'Deductions',
      render: (item) => (
        <span className="font-mono text-rose-600">
          {item.deductions > 0 ? `-${formatCurrency(item.deductions)}` : '—'}
        </span>
      ),
    },
    {
      key: 'netSalary',
      header: 'Net Take-Home',
      render: (item) => (
        <span className="font-mono font-bold text-indigo-700 text-sm">
          {formatCurrency(item.netSalary)}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Disbursement Method',
      render: (item) => (
        <Badge className="bg-slate-100 text-slate-700 font-mono text-[11px]">
          {item.paymentMethod}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge className={item.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <Button size="sm" variant="outline" leftIcon={Edit2} onClick={() => openEditModal(item)}>
          Configure
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Teacher Salary Configurations</h3>
          <p className="text-xs text-slate-500">
            Define basic pay, HRA/DA allowances, deductions, and bank accounts for automatic monthly payroll computation.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={structures}
        loading={loading}
        pageSize={10}
        searchPlaceholder="Search teacher name or ID..."
        emptyTitle="No teachers found"
        emptyDescription="Add teachers under Faculty Management to configure salary structures."
      />

      {/* Edit Salary Structure Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Configure Salary: ${editingTeacher?.name}`}
        description="Set basic compensation, recurring allowances, statutory deductions, and banking details"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving} className="flex-1 sm:flex-initial">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving} className="flex-1 sm:flex-initial">
              Save Structure
            </Button>
          </>
        }
      >
        {editingTeacher && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Designation / Position"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Senior Faculty / HOD"
                required
              />
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Employment Status</label>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  options={[
                    { value: 'ACTIVE', label: 'Active (Included in Payroll)' },
                    { value: 'INACTIVE', label: 'Inactive (Excluded)' },
                  ]}
                />
              </div>
            </div>

            {/* Earnings Heads */}
            <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-3.5 space-y-3">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block">
                Earnings Configuration
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Basic Salary (₹)"
                  type="number"
                  step="100"
                  value={basicSalary}
                  onChange={(e) => setBasicSalary(e.target.value)}
                  required
                />
                <Input
                  label="Allowances (HRA, DA, Medical) (₹)"
                  type="number"
                  step="100"
                  value={allowances}
                  onChange={(e) => setAllowances(e.target.value)}
                />
                <Input
                  label="Performance Bonus / Incentives (₹)"
                  type="number"
                  step="100"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                />
              </div>
            </div>

            {/* Deductions Heads */}
            <div className="rounded-xl bg-rose-50/50 border border-rose-100 p-3.5 space-y-3">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-wider block">
                Deductions & Advance Recoveries
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Statutory Deductions (PF, Tax, ESI) (₹)"
                  type="number"
                  step="100"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                />
                <Input
                  label="Salary Advance / Loan Recovery (₹)"
                  type="number"
                  step="100"
                  value={advance}
                  onChange={(e) => setAdvance(e.target.value)}
                />
              </div>
            </div>

            {/* Live Calculation Preview Banner */}
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-indigo-50/80 border border-indigo-200 p-3.5 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-500 block">Gross Salary</span>
                <span className="font-mono font-bold text-slate-900 text-lg">
                  {formatCurrency(previewGross)}
                </span>
                <span className="text-[10px] text-slate-500 block">Basic + Allowances + Bonus</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">Net Take-Home</span>
                <span className="font-mono font-bold text-emerald-600 text-lg">
                  {formatCurrency(previewNet)}
                </span>
                <span className="text-[10px] text-slate-500 block">Gross - Deductions - Advance</span>
              </div>
            </div>

            {/* Banking Particulars */}
            <div className="border-t border-slate-200 pt-3 space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Disbursement & Banking Particulars
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Method</label>
                  <Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    options={[
                      { value: 'BANK_TRANSFER', label: 'Bank Transfer / Direct Credit' },
                      { value: 'UPI', label: 'UPI' },
                      { value: 'CHEQUE', label: 'Cheque' },
                      { value: 'CASH', label: 'Cash' },
                    ]}
                  />
                </div>
                <Input
                  label="Bank Account Number"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="e.g. 9182309182093"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Bank Name & Branch"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. State Bank of India, Main Branch"
                />
                <Input
                  label="IFSC Code"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  placeholder="e.g. SBIN0001029"
                />
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
