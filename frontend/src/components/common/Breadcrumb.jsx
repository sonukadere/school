import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

function Breadcrumb({ items = [] }) {
  // If the first breadcrumb is Dashboard, avoid redundant "Home > Dashboard"
  const filteredItems = items.filter(
    (item, index) => !(index === 0 && (item.href === '/dashboard' || item.label?.toLowerCase() === 'dashboard'))
  )

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
      <Link
        to="/dashboard"
        aria-label="Home"
        className="flex items-center gap-1 text-slate-500 transition hover:text-slate-800"
      >
        <Home size={13} className="text-slate-500" />
        <span className="hidden sm:inline">Home</span>
      </Link>
      {filteredItems.map((item, index) => {
        const isLast = index === filteredItems.length - 1
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
