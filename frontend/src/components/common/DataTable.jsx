import { useEffect, useMemo, useState } from 'react'
import Loader from './Loader'
import EmptyState from './EmptyState'
import Pagination from './Pagination'
import SearchBar from './SearchBar'
import { cn } from '../../utils/helpers'

function DataTable({
  columns,
  data,
  loading = false,
  pageSize = 8,
  searchPlaceholder = 'Search...',
  toolbar,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  rowKey,
  onRowClick,
  className,
}) {
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const searchableColumns = useMemo(
    () => columns.filter((column) => column.searchable !== false),
    [columns],
  )

  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return data
    return data.filter((row) =>
      searchableColumns.some((column) => {
        const rawValue = column.searchValue ? column.searchValue(row) : row[column.key]
        return String(rawValue ?? '').toLowerCase().includes(term)
      }),
    )
  }, [data, search, searchableColumns])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, data])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * pageSize
  const pageRows = filteredData.slice(startIndex, startIndex + pageSize)

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_6px_24px_0_rgba(15,23,42,0.05)]', className)}>
      {(toolbar || searchPlaceholder) && (
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/60 to-transparent p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">{toolbar}</div>
          <SearchBar value={search} onChange={setSearch} placeholder={searchPlaceholder} />
        </div>
      )}
      <div className="overflow-x-auto">
        {loading ? (
          <Loader label="Loading data..." />
        ) : filteredData.length === 0 ? (
          <EmptyState
            title={emptyTitle || 'No matching records'}
            description={emptyDescription || 'Try adjusting your search or filters.'}
            icon={emptyIcon}
          />
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50/80">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      'px-5 py-3.5 text-xs font-bold tracking-wider text-slate-500 uppercase',
                      column.className,
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {pageRows.map((row, index) => (
                <tr
                  key={rowKey ? rowKey(row) : row.id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors',
                    onRowClick ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-slate-50/60',
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn('px-5 py-3.5 text-sm text-slate-700', column.className)}
                    >
                      {column.render ? column.render(row, index) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {!loading && filteredData.length > 0 && (
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredData.length}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}

export default DataTable
