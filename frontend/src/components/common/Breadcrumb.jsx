import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

function Breadcrumb({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-500 shadow-xs border border-slate-200/60 backdrop-blur-xs">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 text-slate-500 transition hover:text-indigo-600"
      >
        <Home size={13} className="text-slate-400" />
        <span className="hidden sm:inline">Home</span>
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={item.label} className="flex items-center gap-1.5">
            <ChevronRight size={12} className="text-slate-300" />
            {item.href && !isLast ? (
              <Link to={item.href} className="text-slate-500 transition hover:text-indigo-600">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'font-semibold text-slate-900' : ''}>{item.label}</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}

export default Breadcrumb
