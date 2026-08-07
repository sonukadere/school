import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

function Breadcrumb({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-500">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 transition hover:text-indigo-600"
      >
        <Home size={15} />
        <span className="hidden sm:inline">Home</span>
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={item.label} className="flex items-center gap-1.5">
            <ChevronRight size={14} className="text-slate-300" />
            {item.href && !isLast ? (
              <Link to={item.href} className="transition hover:text-indigo-600">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'font-medium text-slate-800' : ''}>{item.label}</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}

export default Breadcrumb
