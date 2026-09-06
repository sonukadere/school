import { useState, useEffect, useMemo } from 'react'
import { Plus, Edit2, Trash2, Calendar, BookOpen, Layers, CheckCircle2 } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import DataTable from '../../components/common/DataTable'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { formatCurrency, formatDate } from '../../utils/helpers'

const FEE_TYPE_OPTIONS = [
  'Tuition Fee',
  'Admission Fee',
  'Examination Fee',
  'Transport Fee',
  'Library Fee',
  'Computer Fee',
  'Other Fee',
]

export default function FeeStructureTab() {
  const { showToast } = useToast()
  const [structures, setStructures] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [classFilter, setClassFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Create / Edit modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [saving, setSaving] = useState(false)

  // Form states
  const [academicYear, setAcademicYear] = useState('2026-2027')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [feeType, setFeeType] = useState('Tuition Fee')
  const [totalFee, setTotalFee] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [lateFee, setLateFee] = useState('0')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('ACTIVE')

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [structRes, classList] = await Promise.all([
        api.getFeeStructures(),
        api.getClasses(),
      ])
      const data = structRes?.data || structRes || []
      setStructures(Array.isArray(data) ? data : [])
      setClasses(classList || [])
    } catch (err) {
      console.error(err)
      showToast('Failed to load fee structures', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openAddModal = () => {
    setEditingItem(null)
    setAcademicYear('2026-2027')
    setSelectedClassId(classes[0]?.id || '')
    setFeeType('Tuition Fee')
    setTotalFee('')
    setDueDate('')
    setLateFee('0')
    setDescription('')
    setStatus('ACTIVE')
    setModalOpen(true)
  }

  const openEditModal = (item) => {
    setEditingItem(item)
    setAcademicYear(item.academicYear || '2026-2027')
    setSelectedClassId(item.classId || '')
    setFeeType(item.feeType || 'Tuition Fee')
    setTotalFee(String(item.totalFee || ''))
    setDueDate(item.dueDate ? item.dueDate.slice(0, 10) : '')
    setLateFee(String(item.lateFee || 0))
    setDescription(item.description || '')
    setStatus(item.status || 'ACTIVE')
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!totalFee || Number(totalFee) <= 0) {
      showToast('Please enter a valid positive fee amount', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        academicYear,
        classId: selectedClassId || undefined,
        feeType,
        totalFee: Number(totalFee),
        dueDate: dueDate || undefined,
        lateFee: Number(lateFee) || 0,
        description: description || undefined,
        status,
      }

      if (editingItem) {
        await api.updateFeeStructure(editingItem.id, payload)
        showToast('Fee structure updated successfully', 'success')
      } else {
        await api.createFeeStructure(payload)
        showToast('Fee structure configured successfully', 'success')
      }

      setSaving(false)
      setModalOpen(false)
      loadData()
    } catch (err) {
      setSaving(false)
      showToast(err.message || 'Failed to save fee structure', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    setDeleting(true)
    try {
      await api.deleteFeeStructure(deletingId)
      showToast('Fee structure removed', 'success')
      setDeleteOpen(false)
      loadData()
    } catch (err) {
      showToast(err.message || 'Failed to remove fee structure', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const filteredStructures = useMemo(() => {
    return structures.filter((s) => {
      if (classFilter && s.classId !== classFilter) return false
      if (statusFilter && s.status !== statusFilter) return false
      return true
    })
  }, [structures, classFilter, statusFilter])

  const classOptions = [
    { value: '', label: 'All Classes' },
    ...classes.map((c) => ({ value: c.id, label: `${c.name} ${c.section}`.trim() })),
  ]

  const formClassOptions = [
    { value: '', label: 'All Classes / School-wide' },
    ...classes.map((c) => ({ value: c.id, label: `${c.name} ${c.section}`.trim() })),
  ]

  const columns = [
    {
      key: 'feeType',
      header: 'Fee Type',
      searchValue: (s) => `${s.feeType} ${s.description}`,
      render: (s) => (
        <div>
          <p className="font-semibold text-slate-900">{s.feeType}</p>
          <p className="text-xs text-slate-500 line-clamp-1">{s.description || 'No description provided'}</p>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Target Class',
      render: (s) => (
        <Badge className="bg-slate-100 text-slate-800">
          {s.class ? `${s.class.name} ${s.class.section}` : 'School-wide'}
        </Badge>
      ),
    },
    {
      key: 'academicYear',
      header: 'Academic Year',
      render: (s) => <span className="font-mono text-xs text-slate-600">{s.academicYear}</span>,
    },
    {
      key: 'totalFee',
      header: 'Standard Fee',
      render: (s) => <span className="font-bold text-slate-900">{formatCurrency(s.totalFee)}</span>,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (s) => (s.dueDate ? formatDate(s.dueDate) : <span className="text-slate-400">Open</span>),
    },
    {
      key: 'lateFee',
      header: 'Late Penalty',
      render: (s) => (
        <span className={s.lateFee > 0 ? 'text-amber-600 font-medium' : 'text-slate-400'}>
          {s.lateFee > 0 ? formatCurrency(s.lateFee) : 'None'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <Badge className={s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
          {s.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => openEditModal(s)} title="Edit">
            <Edit2 size={15} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-rose-600 hover:bg-rose-50"
            onClick={() => {
              setDeletingId(s.id)
              setDeleteOpen(true)
            }}
            title="Delete"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Configured Fee Structures</h3>
          <p className="text-xs text-slate-500">
            Define standard tuition rates, term examination dues, transportation, and special fees per class.
          </p>
        </div>
        <Button variant="primary" leftIcon={Plus} onClick={openAddModal}>
          Add Fee Structure
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredStructures}
        loading={loading}
        pageSize={10}
        searchPlaceholder="Search fee types or descriptions..."
        emptyTitle="No fee structures configured"
        emptyDescription="Create a fee structure to assign standard tuition or exam dues to classes."
        toolbar={
          <>
            <Select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              options={classOptions}
              className="w-44"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
              className="w-36"
            />
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

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Fee Structure' : 'Configure New Fee Structure'}
        description="Set base fee amount, due dates and late penalties"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {editingItem ? 'Save Changes' : 'Create Structure'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Academic Year"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g. 2026-2027"
              required
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Class</label>
              <Select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                options={formClassOptions}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Fee Head / Type <span className="text-rose-500">*</span>
              </label>
              <Select
                value={feeType}
                onChange={(e) => setFeeType(e.target.value)}
                options={FEE_TYPE_OPTIONS.map((f) => ({ value: f, label: f }))}
              />
            </div>
            <Input
              label="Base Fee Amount ($)"
              type="number"
              step="0.01"
              value={totalFee}
              onChange={(e) => setTotalFee(e.target.value)}
              placeholder="e.g. 15000"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Payment Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <Input
              label="Late Fee Penalty (₹)"
              type="number"
              step="1"
              value={lateFee}
              onChange={(e) => setLateFee(e.target.value)}
              placeholder="e.g. 500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status</label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'ACTIVE', label: 'Active (Available for billing)' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description or purpose of this fee..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Fee Structure"
        message="Are you sure you want to remove this fee structure? Existing student billing invoices will not be modified."
      />
    </div>
  )
}
