import { useState, useEffect } from 'react'
import { Clock, Calendar, Save, Sparkles } from 'lucide-react'
import Modal from '../common/Modal'
import Input from '../common/Input'
import Button from '../common/Button'
import { useSettings } from '../../context/SettingsContext'
import { useToast } from '../../context/ToastContext'
import { api } from '../../services/api'

const ALL_DAYS = [
  { key: 'MONDAY', label: 'Monday' },
  { key: 'TUESDAY', label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY', label: 'Thursday' },
  { key: 'FRIDAY', label: 'Friday' },
  { key: 'SATURDAY', label: 'Saturday' },
  { key: 'SUNDAY', label: 'Sunday' },
]

function TimetableSettingsModal({ open, onClose, onPeriodsGenerated }) {
  const { settings, updateSettings } = useSettings()
  const { showToast } = useToast()

  const [values, setValues] = useState({
    timetableStartTime: '08:00',
    timetableEndTime: '14:00',
    periodDuration: 45,
    totalPeriods: 7,
    breakStartTime: '10:15',
    breakEndTime: '10:30',
    workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
  })
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (open && settings) {
      setValues({
        timetableStartTime: settings.timetableStartTime || '08:00',
        timetableEndTime: settings.timetableEndTime || '14:00',
        periodDuration: settings.periodDuration || 45,
        totalPeriods: settings.totalPeriods || 7,
        breakStartTime: settings.breakStartTime || '10:15',
        breakEndTime: settings.breakEndTime || '10:30',
        workingDays: settings.workingDays?.length
          ? settings.workingDays
          : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
      })
    }
  }, [open, settings])

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const toggleDay = (dayKey) => {
    setValues((prev) => {
      const current = prev.workingDays || []
      const exists = current.includes(dayKey)
      const nextDays = exists ? current.filter((d) => d !== dayKey) : [...current, dayKey]
      // Keep natural weekday order
      const sortedDays = ALL_DAYS.map((d) => d.key).filter((k) => nextDays.includes(k))
      return { ...prev, workingDays: sortedDays }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSettings({
        timetableStartTime: values.timetableStartTime,
        timetableEndTime: values.timetableEndTime,
        periodDuration: Number(values.periodDuration),
        totalPeriods: Number(values.totalPeriods),
        breakStartTime: values.breakStartTime,
        breakEndTime: values.breakEndTime,
        workingDays: values.workingDays,
      })
      showToast('Timetable settings saved successfully.', 'success')
      onClose()
    } catch (err) {
      showToast(err?.message || 'Failed to save timetable settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleGeneratePeriods = async () => {
    setGenerating(true)
    try {
      await updateSettings({
        timetableStartTime: values.timetableStartTime,
        timetableEndTime: values.timetableEndTime,
        periodDuration: Number(values.periodDuration),
        totalPeriods: Number(values.totalPeriods),
        breakStartTime: values.breakStartTime,
        breakEndTime: values.breakEndTime,
        workingDays: values.workingDays,
      })
      await api.generatePeriods({
        schoolStartTime: values.timetableStartTime,
        periodDuration: Number(values.periodDuration),
        totalPeriods: Number(values.totalPeriods),
        breakStartTime: values.breakStartTime,
        breakEndTime: values.breakEndTime,
      })
      showToast('Periods generated successfully according to timetable settings.', 'success')
      onPeriodsGenerated?.()
      onClose()
    } catch (err) {
      showToast(err?.message || 'Failed to generate periods', 'error')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="School Timetable Settings"
      description="Configure global daily timetable parameters, period duration, breaks, and working days."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            leftIcon={Sparkles}
            loading={generating}
            onClick={handleGeneratePeriods}
            title="Saves settings and regenerates standard periods"
          >
            Save & Generate Periods
          </Button>
          <Button
            variant="primary"
            leftIcon={Save}
            loading={saving}
            onClick={handleSave}
          >
            Save Settings
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="School Start Time"
            type="time"
            name="timetableStartTime"
            value={values.timetableStartTime}
            onChange={handleChange}
            leftIcon={Clock}
            required
          />
          <Input
            label="School End Time"
            type="time"
            name="timetableEndTime"
            value={values.timetableEndTime}
            onChange={handleChange}
            leftIcon={Clock}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Period Duration (minutes)"
            type="number"
            min="15"
            max="120"
            name="periodDuration"
            value={values.periodDuration}
            onChange={handleChange}
            helper="Recommended: 40 - 50 minutes"
            required
          />
          <Input
            label="Total Periods per Day"
            type="number"
            min="1"
            max="15"
            name="totalPeriods"
            value={values.totalPeriods}
            onChange={handleChange}
            helper="Number of teaching lecture slots"
            required
          />
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <Clock size={14} /> Lunch & Recess Break
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Break Start Time"
              type="time"
              name="breakStartTime"
              value={values.breakStartTime}
              onChange={handleChange}
              required
            />
            <Input
              label="Break End Time"
              type="time"
              name="breakEndTime"
              value={values.breakEndTime}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            Working Days
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ALL_DAYS.map((day) => {
              const active = values.workingDays?.includes(day.key)
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => toggleDay(day.key)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition text-left ${
                    active
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    readOnly
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                  />
                  <span>{day.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default TimetableSettingsModal
