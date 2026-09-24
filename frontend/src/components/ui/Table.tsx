import React, { useState } from 'react'
import { ArrowUpDown, Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { Button } from './Button'

export interface Column<T = any> {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => React.ReactNode
}

export interface TableProps<T = any> {
  columns: Column<T>[]
  data: T[]
  searchPlaceholder?: string
  pageSize?: number
  emptyTitle?: string
  emptyMessage?: string
  filterKey?: string
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = 'Filter records...',
  pageSize = 8,
  emptyTitle = 'No records found',
  emptyMessage = 'There are no items matching your criteria.',
  filterKey,
}: TableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortAsc, setSortAsc] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  const filteredData = data.filter((item) => {
    if (!search.trim()) return true
    const query = search.toLowerCase()
    if (filterKey && item[filterKey]) {
      return String(item[filterKey]).toLowerCase().includes(query)
    }
    return Object.values(item).some((val) => {
      if (typeof val === 'string' || typeof val === 'number') {
        return String(val).toLowerCase().includes(query)
      }
      return false
    })
  })

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortKey) return 0
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    if (aVal === bVal) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1
    const res = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
    return sortAsc ? res : -res
  })

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="flex flex-col gap-3">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 px-1">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-zinc-800/70 border border-indigo-200/80 dark:border-zinc-700/80 rounded-xl text-stone-800 dark:text-zinc-200 placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/25 focus:border-indigo-400 shadow-2xs transition-all"
          />
        </div>
        <span className="text-xs font-medium text-stone-500 dark:text-zinc-400 self-end sm:self-center">
          Showing {paginatedData.length} of {filteredData.length} records
        </span>
      </div>

      {/* Table Container */}
      <div className="border border-indigo-100/90 dark:border-zinc-800 rounded-2xl overflow-hidden bg-gradient-to-b from-white via-white to-indigo-50/15 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900/90 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700 dark:text-zinc-300">
            <thead className="bg-gradient-to-r from-slate-50/90 via-indigo-50/40 to-purple-50/40 dark:from-zinc-800/80 dark:via-indigo-950/20 dark:to-zinc-800/80 border-b border-indigo-100/80 dark:border-zinc-800 text-stone-600 dark:text-zinc-300 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="py-3.5 px-4 font-bold">
                    {col.sortable !== false ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className="inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors"
                      >
                        {col.label}
                        <ArrowUpDown className="w-3 h-3 text-stone-400 dark:text-zinc-500" />
                      </button>
                    ) : (
                      <span>{col.label}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50/60 dark:divide-zinc-800/60">
              {paginatedData.length > 0 ? (
                paginatedData.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="py-3.5 px-4">
                        {col.render ? col.render(item[col.key], item) : item[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-stone-400 dark:text-zinc-500">
                    <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-xs text-stone-600 dark:text-zinc-300">{emptyTitle}</p>
                    <p className="text-[11px] mt-0.5">{emptyMessage}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredData.length > pageSize && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-stone-100 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-900 text-xs text-stone-500 dark:text-zinc-400">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Prev
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                Next <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
