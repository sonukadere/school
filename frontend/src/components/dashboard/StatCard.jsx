import { Link } from 'react-router-dom'
import { ArrowUpRight, TrendingDown } from 'lucide-react'
import { cn } from '../../utils/helpers'

const ACCENTS = {
  indigo: {
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    bar: 'from-indigo-500 to-violet-500',
    iconBg: 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-sm shadow-indigo-200',
    hoverBorder: 'hover:border-indigo-200',
  },
  emerald: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    bar: 'from-emerald-500 to-teal-500',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-200',
    hoverBorder: 'hover:border-emerald-200',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-700 border-amber-100',
    bar: 'from-amber-500 to-orange-500',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-200',
    hoverBorder: 'hover:border-amber-200',
  },
  rose: {
    badge: 'bg-rose-50 text-rose-700 border-rose-100',
    bar: 'from-rose-500 to-pink-500',
    iconBg: 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-sm shadow-rose-200',
    hoverBorder: 'hover:border-rose-200',
  },
  sky: {
    badge: 'bg-sky-50 text-sky-700 border-sky-100',
    bar: 'from-sky-500 to-blue-500',
    iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm shadow-sky-200',
    hoverBorder: 'hover:border-sky-200',
  },
  violet: {
    badge: 'bg-violet-50 text-violet-700 border-violet-100',
    bar: 'from-violet-500 to-purple-500',
    iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm shadow-violet-200',
    hoverBorder: 'hover:border-violet-200',
  },
}

function StatCard({ title, value, icon: Icon, accent = 'indigo', trend, trendLabel, link, subtitle }) {
  const currentAccent = ACCENTS[accent] || ACCENTS.indigo

  return (
    <Link
      to={link || '#'}
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
        currentAccent.hoverBorder,
      )}
    >
      {/* Top accent glowing bar */}
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          currentAccent.bar,
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {value}
            </span>
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400 truncate">{subtitle}</p>
          )}
        </div>

        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3',
            currentAccent.iconBg,
          )}
        >
          <Icon size={20} strokeWidth={2.2} />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold text-[11px] border',
              currentAccent.badge,
            )}
          >
            <ArrowUpRight size={13} />
            {trend}
          </span>
          <span className="truncate text-slate-400">{trendLabel}</span>
        </div>
      )}
    </Link>
  )
}

export default StatCard
