import { Search, LayoutGrid, List } from 'lucide-react'
import type { StudyClass } from '../../lib/auth'

export interface CatalogFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  selectedClass: string
  onClassChange: (value: string) => void
  selectedSubject: string
  onSubjectChange: (value: string) => void
  sort: string
  onSortChange: (value: string) => void
  view: 'grid' | 'list'
  onViewChange: (value: 'grid' | 'list') => void
  classes: StudyClass[]
  subjects: string[]
}

export function CatalogFilters({
  search,
  onSearchChange,
  selectedClass,
  onClassChange,
  selectedSubject,
  onSubjectChange,
  sort,
  onSortChange,
  view,
  onViewChange,
  classes,
  subjects,
}: CatalogFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter notes by topic, concept, or keyword..."
          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedClass}
          onChange={(e) => onClassChange(e.target.value)}
          aria-label="Filter by course"
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 cursor-pointer"
        >
          <option value="">All Courses</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.subject})
            </option>
          ))}
        </select>

        <select
          value={selectedSubject}
          onChange={(e) => onSubjectChange(e.target.value)}
          aria-label="Filter by subject"
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 cursor-pointer"
        >
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          aria-label="Sort order"
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 cursor-pointer"
        >
          <option value="popular">Most Popular</option>
          <option value="recent">Most Recent</option>
          <option value="title">Title (A-Z)</option>
        </select>

        <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
          <button
            type="button"
            onClick={() => onViewChange('grid')}
            aria-label="Grid view"
            className={`p-1.5 rounded-md transition-colors ${
              view === 'grid' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange('list')}
            aria-label="List view"
            className={`p-1.5 rounded-md transition-colors ${
              view === 'list' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
