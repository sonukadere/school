import { useState } from 'react'
import { Plus, Trash2, Edit2, Clock, Sparkles, Coffee, BookOpen } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import Input from '../common/Input'
import Badge from '../common/Badge'
import ConfirmDialog from '../common/ConfirmDialog'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'

function PeriodManagerModal({ open, onClose, periods = [], onRefresh, onOpenSettings }) {
  const { showToast } = useToast()
  const [editingPeriod, setEditingPeriod] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formValues, setFormValues] = useState({
    name: '',
    periodNumber: '',
    startTime: '08:00',
    endTime: '08:45',
    isBreak: false,
    sortOrder: 1,
  })

  const openAddForm = () => {
    setEditingPeriod(null)
    const nextSort = (periods.length ? Math.max(...periods.map((p) => p.sortOrder || 1)) + 1 : 1)
    const nextNum = periods.filter((p) => !p.isBreak).length + 1
    setFormValues({
      name: `Period ${nextNum}`,
      periodNumber: nextNum,
      startTime: '08:00',
      endTime: '08:45',
      isBreak: false,
      sortOrder: nextSort,
    })
    setIsFormOpen(true)
  }

  const openEditForm = (p) => {
    setEditingPeriod(p)
    setFormValues({
      name: p.name,
      periodNumber: p.periodNumber ?? '',
      startTime: p.startTime,
      endTime: p.endTime,
      isBreak: p.isBreak || false,
      sortOrder: p.sortOrder ?? 1,
    })
    setIsFormOpen(true)
  }

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSavePeriod = async (e) => {
    e.preventDefault()
    if (!formValues.name.trim()) {
      showToast('Period name is required', 'error')
      return
    }
    if (formValues.startTime >= formValues.endTime) {
      showToast('Start time must be before end time', 'error')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: formValues.name.trim(),
        periodNumber: formValues.isBreak ? null : (Number(formValues.periodNumber) || null),
        startTime: formValues.startTime,
        endTime: formValues.endTime,
        isBreak: Boolean(formValues.isBreak),
        sortOrder: Number(formValues.sortOrder) || 1,
      }

      if (editingPeriod) {
        await api.updatePeriod(editingPeriod.id, payload)
        showToast('Period updated successfully', 'success')
      } else {
        await api.addPeriod(payload)
        showToast('Period created successfully', 'success')
      }
      setIsFormOpen(false)
      onRefresh?.()
    } catch (err) {
      showToast(err?.message || 'Failed to save period', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSubmitting(true)
    try {
      await api.deletePeriod(deleteTarget.id)
      showToast('Period deleted successfully', 'success')
      setDeleteTarget(null)
      onRefresh?.()
    } catch (err) {
      showToast(err?.message || 'Failed to delete period', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Period Management"
        description="Reusable daily class lecture periods & breaks for all classes."
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              leftIcon={Sparkles}
              size="sm"
              onClick={() => {
                onClose()
                onOpenSettings?.()
              }}
            >
              Configure in Settings
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              <Button variant="primary" leftIcon={Plus} onClick={openAddForm}>
                Add Period
              </Button>
            </div>
          </div>
        }
      >
        {isFormOpen ? (
          <form onSubmit={handleSavePeriod} className="space-y-4 p-1">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="text-sm font-bold text-slate-800">
                {editingPeriod ? 'Edit Period' : 'Add New Period'}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Period Name"
                name="name"
                value={formValues.name}
                onChange={handleFormChange}
                placeholder="e.g. Period 1 or Morning Break"
                required
              />
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer select-none p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100">
                  <input
                    type="checkbox"
                    name="isBreak"
                    checked={formValues.isBreak}
                    onChange={handleFormChange}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    This is a Recess / Break Slot
                  </span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Start Time"
                type="time"
                name="startTime"
                value={formValues.startTime}
                onChange={handleFormChange}
                required
              />
              <Input
                label="End Time"
                type="time"
                name="endTime"
                value={formValues.endTime}
                onChange={handleFormChange}
                required
              />
              <Input
                label="Display Order"
                type="number"
                name="sortOrder"
                value={formValues.sortOrder}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" type="button" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={submitting}>
                Save Period
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            {periods.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed rounded-xl border-slate-200">
                <Clock className="mx-auto text-slate-300 mb-2" size={36} />
                <p className="text-sm font-semibold text-slate-700">No periods defined yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Click 'Add Period' or configure School Timetable Settings to auto-generate standard periods.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <Button variant="outline" size="sm" leftIcon={Plus} onClick={openAddForm}>
                    Add First Period
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Order</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Time Range</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {periods.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-2.5 px-3 text-slate-500 font-mono">#{p.sortOrder}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-2">
                          {p.isBreak ? (
                            <Coffee size={14} className="text-amber-500" />
                          ) : (
                            <BookOpen size={14} className="text-indigo-500" />
                          )}
                          {p.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-medium">
                          {p.startTime} – {p.endTime}
                        </td>
                        <td className="py-2.5 px-3">
                          {p.isBreak ? (
                            <Badge variant="warning" size="sm">
                              Break
                            </Badge>
                          ) : (
                            <Badge variant="info" size="sm">
                              Period {p.periodNumber || p.sortOrder}
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditForm(p)}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                              title="Edit period"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(p)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Delete period"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Period"
        message={`Are you sure you want to delete ${deleteTarget?.name}? Existing timetable records scheduled for this period will retain their start and end times.`}
        confirmText="Delete Period"
        variant="danger"
        loading={submitting}
      />
    </>
  )
}

export default PeriodManagerModal
