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
    <div className={cn('overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs', className)}>
      {(toolbar || searchPlaceholder) && (
        <div className="flex flex-col gap-3 border-b border-slate-200/70 bg-white px-3.5 py-3 sm:px-5 sm:py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar value={search} onChange={setSearch} placeholder={searchPlaceholder} />
          <div className="flex flex-1 flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto sm:justify-end">
            {toolbar ? (
              toolbar
            ) : (
              <span className="text-xs font-medium text-slate-500">
                Total: <span className="font-semibold text-slate-800">{filteredData.length}</span> {filteredData.length === 1 ? 'entry' : 'entries'}
              </span>
            )}
          </div>
        </div>
      )}
      <div className="overflow-x-auto touch-scroll">
        {loading ? (
          <Loader label="Loading data..." />
        ) : filteredData.length === 0 ? (
          <EmptyState
            title={emptyTitle || 'No matching records'}
            description={emptyDescription || 'Try adjusting your search or filters.'}
            icon={emptyIcon}
          />
        ) : (
          <table className="min-w-full divide-y divide-slate-200/80 text-left">
            <thead className="bg-slate-50/75">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      'px-3.5 py-2.5 sm:px-5 sm:py-3 text-[10px] sm:text-[11px] font-semibold tracking-wider text-slate-500 uppercase whitespace-nowrap',
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
                    'transition-colors duration-150',
                    onRowClick ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-slate-50/70',
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn('px-3.5 py-3 sm:px-5 sm:py-3.5 text-xs sm:text-sm text-slate-700 align-middle', column.className)}
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
