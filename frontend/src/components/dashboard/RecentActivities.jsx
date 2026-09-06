import { GraduationCap, Wallet, FileText, Bell, Users, CalendarCheck } from 'lucide-react'

const TYPE_STYLES = {
  student: { icon: GraduationCap, classes: 'bg-indigo-100 text-indigo-600' },
  fee: { icon: Wallet, classes: 'bg-emerald-100 text-emerald-600' },
  exam: { icon: FileText, classes: 'bg-violet-100 text-violet-600' },
  notice: { icon: Bell, classes: 'bg-amber-100 text-amber-600' },
  teacher: { icon: Users, classes: 'bg-sky-100 text-sky-600' },
  attendance: { icon: CalendarCheck, classes: 'bg-teal-100 text-teal-600' },
}

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  return `${Math.floor(hours / 24)} days ago`
}

function RecentActivities({ activities = [] }) {
  const safeActivities = Array.isArray(activities) ? activities : []

  if (safeActivities.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-sm text-slate-400">
        No recent activities recorded yet.
      </div>
    )
  }

  return (
    <ul className="divide-y divide-slate-100">
      {safeActivities.map((activity) => {
        const style = TYPE_STYLES[activity.type] || TYPE_STYLES.notice
        const Icon = style.icon
        return (
          <li key={activity.id} className="flex items-start gap-3 py-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.classes}`}
            >
              <Icon size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-700">{activity.text}</p>
              <p className="mt-0.5 text-xs text-slate-400">{timeAgo(activity.time)}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default RecentActivities
