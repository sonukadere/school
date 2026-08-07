import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/helpers'

function Pagination({ currentPage, totalPages, onPageChange, totalItems, pageSize }) {
  if (totalPages <= 1) return null

  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  const getPages = () => {
    const pages = []
    const showFirst = currentPage > 3
    const showLast = currentPage < totalPages - 2
    let from = Math.max(1, currentPage - 2)
    const to = Math.min(totalPages, currentPage + 2)
    if (showFirst) pages.push(1)
    if (showFirst && from > 2) pages.push('...')
    for (let i = from; i <= to; i += 1) pages.push(i)
    if (showLast && to < totalPages - 1) pages.push('...')
    if (showLast) pages.push(totalPages)
    return pages
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row">
      <p className="text-sm text-slate-500">
        Showing <span className="font-semibold text-slate-700">{start}</span> to{' '}
        <span className="font-semibold text-slate-700">{end}</span> of{' '}
        <span className="font-semibold text-slate-700">{totalItems}</span> entries
      </p>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {getPages().map((page, index) =>
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-sm text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition',
                page === currentPage
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'border border-slate-300 text-slate-600 hover:bg-slate-50',
              )}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </nav>
    </div>
  )
}

export default Pagination
