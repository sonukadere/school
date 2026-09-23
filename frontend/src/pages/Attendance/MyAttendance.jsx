import { useEffect, useMemo, useState } from 'react'
import {
  CalendarCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import EmptyState from '../../components/common/EmptyState'
import { attendanceApi } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { cn, formatDate } from '../../utils/helpers'

const STATUS_META = {
  PRESENT: { label: 'Present', variant: 'success', color: 'bg-emerald-500' },
  ABSENT: { label: 'Absent', variant: 'danger', color: 'bg-rose-500' },
  LEAVE: { label: 'Leave', variant: 'warning', color: 'bg-amber-500' },
  LATE: { label: 'Late', variant: 'info', color: 'bg-sky-500' },
  HALF_DAY: { label: 'Half Day', variant: 'default', color: 'bg-violet-500' },
}

function normalizeRecord(record) {
  const statusKey = (record.status || '').toUpperCase()
  const meta = STATUS_META[statusKey] || { label: statusKey || '—', variant: 'default', color: 'bg-slate-400' }
  return {
    ...record,
    statusKey,
    date: record.date ? String(record.date).slice(0, 10) : '',
    label: meta.label,
    variant: meta.variant,
    color: meta.color,
  }
}

function ProgressRing({ percentage }) {
  const size = 148
  const stroke = 13
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference
  const color = percentage >= 75 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#f43f5e'

  return (
    <div className="relative h-[148px] w-[148px]">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-extrabold text-slate-900" style={{ color }}>
          {percentage}%
        </span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Overall
        </span>
      </div>
    </div>
  )
}

function MyAttendance() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await attendanceApi.getMyAttendance()
        if (!mounted) return
        const records = Array.isArray(result?.records)
          ? result.records.map(normalizeRecord)
          : []
        setData({ summary: result?.summary || null, records })
      } catch (err) {
        console.error('[MyAttendance] Error loading attendance:', err)
        if (mounted) {
          setError(err.message || 'Failed to load your attendance records.')
          showToast('Failed to load attendance records', 'error')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [showToast])

  const summary = data?.summary || null
  const records = data?.records || []

  const last14Days = useMemo(() => {
    const latest = [...records].sort((a, b) => (b.date < a.date ? -1 : 1)).slice(0, 14)
    return latest.reverse()
  }, [records])

  const presentCount = summary?.present ?? records.filter((r) => r.statusKey === 'PRESENT').length
  const absentCount = summary?.absent ?? records.filter((r) => r.statusKey === 'ABSENT').length
  const leaveCount = summary?.leave ?? records.filter((r) => r.statusKey === 'LEAVE').length
  const total = summary?.total ?? records.length
  const percentage = summary?.percentage ?? (total > 0 ? Math.round((presentCount / total) * 100) : 0)

  const STAT_CARDS = [
    { label: 'Present Days', value: presentCount, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Absent Days', value: absentCount, icon: XCircle, color: 'bg-rose-50 text-rose-600' },
    { label: 'Leave Days', value: leaveCount, icon: Clock, color: 'bg-amber-50 text-amber-600' },
    { label: 'Total Days', value: total, icon: CalendarCheck2, color: 'bg-indigo-50 text-indigo-600' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Attendance"
        description="View your personal attendance history and overall performance"
        breadcrumb={[
          { label: 'Attendance', href: '/attendance' },
          { label: 'My Attendance' },
        ]}
      />

      {loading ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <p className="text-sm font-medium text-slate-700">Loading your attendance...</p>
            <p className="text-xs text-slate-500">Fetching records from the school database</p>
          </div>
        </Card>
      ) : error && !data ? (
        <Card>
          <EmptyState
            title="Could not load attendance"
            description={error}
            icon={AlertCircle}
          />
        </Card>
      ) : records.length === 0 ? (
        <Card>
          <EmptyState
            title="No attendance records yet"
            description="Your attendance history will appear here as soon as the school starts recording it."
            icon={CalendarCheck2}
          />
        </Card>
      ) : (
        <>
          {/* Summary: Progress ring + stat cards */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
                <ProgressRing percentage={percentage} />
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-sm font-bold tracking-wide uppercase text-slate-500">
                    Attendance Summary
                  </h3>
                  <p className="mt-2 text-3xl font-extrabold text-slate-900">
                    {percentage}%
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Recorded over {total} {total === 1 ? 'day' : 'days'}.
                  </p>
                  <span
                    className={cn(
                      'mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                      percentage >= 75
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700',
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {percentage >= 75 ? 'Satisfactory' : 'Needs Improvement'}
                  </span>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4 lg:col-span-3 lg:grid-cols-2 xl:grid-cols-4">
              {STAT_CARDS.map((card) => {
                const Icon = card.icon
                return (
                  <div
                    key={card.label}
                    className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {card.label}
                      </span>
                      <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', card.color)}>
                        <Icon size={18} />
                      </div>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Last 14 days strip */}
          <Card
            title="Last 14 Days"
            subtitle="Your most recent attendance at a glance"
            icon={Sparkles}
          >
            <div className="grid grid-cols-7 gap-2">
              {last14Days.map((record) => {
                const day = new Date(record.date)
                const dayNum = !Number.isNaN(day.getTime()) ? day.getDate() : '—'
                return (
                  <div
                    key={record.id || record.date}
                    className={cn(
                      'flex flex-col items-center rounded-xl border py-2 text-center',
                      record.statusKey === 'PRESENT'
                        ? 'border-emerald-200 bg-emerald-50/70'
                        : record.statusKey === 'ABSENT'
                        ? 'border-rose-200 bg-rose-50/70'
                        : record.statusKey === 'LEAVE'
                        ? 'border-amber-200 bg-amber-50/70'
                        : 'border-slate-200 bg-slate-50/70',
                    )}
                  >
                    <span className="text-sm font-bold text-slate-800">{dayNum}</span>
                    <span className={cn('mt-1.5 h-2 w-2 rounded-full', record.color)} />
                    <span className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                      {record.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Full history table */}
          <Card
            title="Attendance History"
            subtitle={`${records.length} recent records, newest first`}
            icon={CalendarCheck2}
            className="overflow-hidden"
            bodyClassName="p-0"
          >
            <div className="overflow-x-auto touch-scroll">
              <table className="min-w-[520px] w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-3.5 py-2.5 sm:px-5 sm:py-3 text-[10px] sm:text-xs font-semibold tracking-wider text-slate-500 uppercase whitespace-nowrap">
                      Date
                    </th>
                    <th className="px-3.5 py-2.5 sm:px-5 sm:py-3 text-[10px] sm:text-xs font-semibold tracking-wider text-slate-500 uppercase whitespace-nowrap">
                      Day
                    </th>
                    <th className="px-3.5 py-2.5 sm:px-5 sm:py-3 text-[10px] sm:text-xs font-semibold tracking-wider text-slate-500 uppercase whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-3.5 py-2.5 sm:px-5 sm:py-3 text-[10px] sm:text-xs font-semibold tracking-wider text-slate-500 uppercase whitespace-nowrap">
                      Remark
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {records.map((record) => {
                    const dayName = record.date
                      ? new Date(`${record.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' })
                      : '—'
                    return (
                      <tr key={record.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="px-3.5 py-3 sm:px-5 sm:py-3.5 text-xs sm:text-sm font-semibold text-slate-800 whitespace-nowrap">
                          {formatDate(record.date)}
                        </td>
                        <td className="px-3.5 py-3 sm:px-5 sm:py-3.5 text-xs text-slate-500 whitespace-nowrap">
                          {dayName}
                        </td>
                        <td className="px-3.5 py-3 sm:px-5 sm:py-3.5 whitespace-nowrap">
                          <Badge variant={record.variant} dot>
                            {record.label}
                          </Badge>
                        </td>
                        <td className="px-3.5 py-3 sm:px-5 sm:py-3.5 text-xs text-slate-500">
                          {record.remark || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

export default MyAttendance