import { useState, useEffect, useCallback } from 'react'
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Sparkles,
  Award,
  Sun,
  X,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Loader from '../../components/common/Loader'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { apiClient } from '../../services/apiClient'

export default function SchoolCalendarPage() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [holidays, setHolidays] = useState([])

  const [currentDate, setCurrentDate] = useState(new Date())

  // Add Event Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    location: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const canManage = user?.isAdmin || user?.isSuperAdmin

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [eventsRes, holidaysRes] = await Promise.all([
        apiClient.get('/events', { limit: 100 }),
        apiClient.get('/holidays', { limit: 100 }),
      ])
      setEvents(eventsRes?.data || [])
      setHolidays(holidaysRes?.data || [])
    } catch (err) {
      showToast('Failed to load school calendar items', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.date) {
      showToast('Event title and date are required.', 'error')
      return
    }

    try {
      setSubmitting(true)
      await apiClient.post('/events', formData)
      showToast('School event scheduled!', 'success')
      setModalOpen(false)
      setFormData({
        title: '',
        description: '',
        date: new Date().toISOString().slice(0, 10),
        location: '',
      })
      fetchData()
    } catch (err) {
      showToast(err.message || 'Failed to schedule event', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Calendar calculations
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  // Group events & holidays by date string 'YYYY-MM-DD'
  const itemsByDate = {}

  for (const ev of events) {
    if (ev.date) {
      const dStr = new Date(ev.date).toISOString().slice(0, 10)
      if (!itemsByDate[dStr]) itemsByDate[dStr] = []
      itemsByDate[dStr].push({ ...ev, itemType: 'EVENT' })
    }
  }

  for (const hol of holidays) {
    if (hol.date) {
      const dStr = new Date(hol.date).toISOString().slice(0, 10)
      if (!itemsByDate[dStr]) itemsByDate[dStr] = []
      itemsByDate[dStr].push({ ...hol, itemType: 'HOLIDAY' })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Academic Calendar"
        description="Official school schedule, holidays, exam dates, competitions, and sports events"
        action={
          canManage && (
            <Button
              onClick={() => setModalOpen(true)}
              icon={Plus}
            >
              Add Event
            </Button>
          )
        }
      />

      {/* Calendar Header / Navigator */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="text-lg font-bold text-slate-800">
            {monthNames[month]} {year}
          </h3>
          <button
            onClick={handleNextMonth}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-indigo-700">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> School Event
          </span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Public Holiday
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader size="lg" />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-xs overflow-hidden">
          {/* Days of week */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/75 text-center text-xs font-bold text-slate-500 uppercase py-3">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[500px]">
            {/* Blank leading days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`blank-${i}`} className="bg-slate-50/30 p-2 min-h-[100px]" />
            ))}

            {/* Days in month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1
              const dayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
              const dayItems = itemsByDate[dayDateStr] || []
              const isToday =
                new Date().toDateString() === new Date(year, month, dayNum).toDateString()

              return (
                <div
                  key={`day-${dayNum}`}
                  className={`p-2 min-h-[100px] flex flex-col justify-between transition hover:bg-slate-50/50 ${
                    isToday ? 'bg-indigo-50/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isToday ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700'
                      }`}
                    >
                      {dayNum}
                    </span>
                  </div>

                  <div className="mt-1 space-y-1 overflow-y-auto max-h-20">
                    {dayItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold truncate ${
                          item.itemType === 'HOLIDAY'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                        title={item.title || item.name}
                      >
                        {item.title || item.name}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Upcoming Events List */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
        <h4 className="text-base font-bold text-slate-800 mb-4">Upcoming Events & School Holidays</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.slice(0, 4).map((ev) => (
            <div
              key={ev.id}
              className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 bg-slate-50/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <Sparkles size={20} />
              </div>
              <div>
                <h5 className="font-bold text-slate-800 text-sm">{ev.title}</h5>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>{new Date(ev.date).toLocaleDateString()}</span>
                  {ev.location && <span>• {ev.location}</span>}
                </p>
                {ev.description && <p className="text-xs text-slate-600 mt-1">{ev.description}</p>}
              </div>
            </div>
          ))}

          {holidays.slice(0, 4).map((hol) => (
            <div
              key={hol.id}
              className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 bg-amber-50/40"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Sun size={20} />
              </div>
              <div>
                <h5 className="font-bold text-slate-800 text-sm">{hol.name}</h5>
                <p className="text-xs text-amber-700 mt-0.5">
                  Holiday • {new Date(hol.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Event Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Schedule School Event</h3>
                <p className="text-xs text-slate-500">Publish celebration or activity to academic calendar</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <Input
                label="Event Title *"
                placeholder="e.g. Annual Sports Meet"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date *"
                  type="date"
                  icon={CalendarIcon}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
                <Input
                  label="Location"
                  placeholder="e.g. Main Ground"
                  icon={MapPin}
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Details</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details regarding event schedule and participants..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <Button type="submit" loading={submitting}>
                  Schedule Event
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
