import { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { CalendarCheck, Info } from 'lucide-react'
import { Link } from 'react-router-dom'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const present = payload.find((p) => p.dataKey === 'Present')?.value || 0
    const absent = payload.find((p) => p.dataKey === 'Absent')?.value || 0
    const leave = payload.find((p) => p.dataKey === 'Leave')?.value || 0
    const total = present + absent + leave
    const rate = total > 0 ? Math.round((present / total) * 100) : 0

    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 mb-2">
          <span className="text-xs font-bold text-slate-800">{label}</span>
          <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
            {rate}% Attendance
          </span>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-indigo-600" />
              Present
            </span>
            <span className="font-bold text-slate-900">{present}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Absent
            </span>
            <span className="font-bold text-slate-900">{absent}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              On Leave
            </span>
            <span className="font-bold text-slate-900">{leave}</span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

const DEFAULT_DAYS = [
  { date: 'Mon', Present: 42, Absent: 3, Leave: 1 },
  { date: 'Tue', Present: 45, Absent: 1, Leave: 0 },
  { date: 'Wed', Present: 44, Absent: 2, Leave: 1 },
  { date: 'Thu', Present: 43, Absent: 3, Leave: 2 },
  { date: 'Fri', Present: 46, Absent: 1, Leave: 1 },
  { date: 'Sat', Present: 38, Absent: 5, Leave: 3 },
]

function AttendanceChart({ data = [] }) {
  const [period, setPeriod] = useState('7d')

  // Check if real data exists with non-zero values
  const hasRealData = Array.isArray(data) && data.length > 0 && data.some((d) => (d.Present || 0) + (d.Absent || 0) > 0)
  const chartData = hasRealData ? data : DEFAULT_DAYS
  const isSimulated = !hasRealData

  const totalPresent = chartData.reduce((acc, curr) => acc + (curr.Present || 0), 0)
  const totalStudents = chartData.reduce((acc, curr) => acc + (curr.Present || 0) + (curr.Absent || 0) + (curr.Leave || 0), 0)
  const avgAttendance = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 94

  return (
    <div className="w-full space-y-4">
      {/* Top Header / Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Avg Attendance: {avgAttendance}%
          </span>
          {isSimulated && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <Info size={13} />
              Sample preview
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
            Present
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            Absent
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            Leave
          </span>
        </div>
      </div>

      {/* Recharts Container */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={4} barCategoryGap="25%">
            <defs>
              <linearGradient id="modernPresentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#4338ca" />
              </linearGradient>
              <linearGradient id="modernAbsentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb7185" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>
              <linearGradient id="modernLeaveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fcd34d" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
              dy={6}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              dx={-6}
            />
            <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.6)', radius: 8 }} content={<CustomTooltip />} />
            <Bar dataKey="Present" fill="url(#modernPresentGradient)" radius={[6, 6, 0, 0]} maxBarSize={22} />
            <Bar dataKey="Absent" fill="url(#modernAbsentGradient)" radius={[6, 6, 0, 0]} maxBarSize={22} />
            <Bar dataKey="Leave" fill="url(#modernLeaveGradient)" radius={[6, 6, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {isSimulated && (
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-xs text-slate-500 border border-slate-100">
          <span>No student attendance logged today yet.</span>
          <Link
            to="/attendance/students"
            className="font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            Take Attendance &rarr;
          </Link>
        </div>
      )}
    </div>
  )
}

export default AttendanceChart
