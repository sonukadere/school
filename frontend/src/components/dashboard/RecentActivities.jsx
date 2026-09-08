import { GraduationCap, Wallet, FileText, Bell, Users, CalendarCheck, Clock, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const TYPE_CONFIG = {
  Student: {
    icon: GraduationCap,
    gradient: 'from-indigo-500 to-indigo-600',
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    link: '/students',
  },
  Fee: {
    icon: Wallet,
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    link: '/fees',
  },
  Exam: {
    icon: FileText,
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50 text-violet-700 border-violet-100',
    link: '/exams',
  },
  Notice: {
    icon: Bell,
    gradient: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50 text-amber-700 border-amber-100',
    link: '/notices',
  },
  Teacher: {
    icon: Users,
    gradient: 'from-sky-500 to-blue-600',
    bg: 'bg-sky-50 text-sky-700 border-sky-100',
    link: '/teachers',
  },
  Event: {
    icon: CalendarCheck,
    gradient: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50 text-rose-700 border-rose-100',
    link: '/events',
  },
  Attendance: {
    icon: CalendarCheck,
    gradient: 'from-teal-500 to-emerald-600',
    bg: 'bg-teal-50 text-teal-700 border-teal-100',
    link: '/attendance',
  },
}

function timeAgo(isoString) {
  if (!isoString) return 'Just now'
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function RecentActivities({ activities = [] }) {
  const safeActivities = Array.isArray(activities) ? activities : []

  if (safeActivities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
          <Clock size={20} />
        </div>
        <p className="text-sm font-semibold text-slate-700">No recent activities</p>
        <p className="text-xs text-slate-400 mt-1">Campus activity updates will appear here automatically.</p>
      </div>
    )
  }

  return (
    <div className="relative pl-2">
      {/* Subtle vertical timeline bar */}
      <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-slate-100" />

      <ul className="space-y-3">
        {safeActivities.slice(0, 5).map((activity) => {
          const typeKey =
            Object.keys(TYPE_CONFIG).find(
              (k) => k.toLowerCase() === String(activity.type || '').toLowerCase(),
            ) || 'Notice'
          const conf = TYPE_CONFIG[typeKey]
          const Icon = conf.icon

          return (
            <li
              key={activity.id || activity.text}
              className="relative flex items-center justify-between gap-3 rounded-xl p-2 transition-all hover:bg-slate-50/80 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${conf.gradient} text-white shadow-xs z-10 transition-transform group-hover:scale-105`}
                >
                  <Icon size={16} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {activity.text}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider border ${conf.bg}`}
                    >
                      {activity.type || 'Update'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {timeAgo(activity.time)}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                to={conf.link}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-indigo-600 transition-all"
                title="View details"
              >
                <ArrowRight size={14} />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default RecentActivities
