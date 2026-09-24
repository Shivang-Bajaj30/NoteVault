import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useNotes } from '../api/useNotesApi'
import { useClasses } from '../api/useClassesApi'
import { useAuth } from '../lib/auth'
import { useWorkspace } from '../lib/workspace'
import { NoteCard } from '../features/catalog/NoteCard'
import { CatalogFilters } from '../features/catalog/CatalogFilters'
import { NoteGrid } from '../features/catalog/NoteGrid'
import { Card, Badge, TrustBadge, Skeleton } from '../components/ui'
import {
  Files,
  Upload,
  ShieldCheck,
  Sparkles,
  BookOpen,
  ArrowRight,
  ArrowUpRight,
  Layers,
} from 'lucide-react'

export function DashboardPage() {
  const { user, isTrusted, isModerator } = useAuth()
  const { data: notes = [], isLoading } = useNotes()
  const { data: classes = [] } = useClasses()
  const [selectedClass, setSelectedClass] = useState<string>('')

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const filteredNotes = selectedClass
    ? notes.filter((n) => n.classId === selectedClass)
    : notes

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600">
            Study workspace
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
            {greeting}, {user?.name.split(' ')[0] || 'Scholar'}.
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Continue with peer-reviewed notes from your courses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isModerator ? (
            <Link
              to="/upload"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Course Notes
            </Link>
          ) : (
            <Link
              to="/notes"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Explore All Notes
            </Link>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Files className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Notes in catalog</span>
            <span className="text-xl font-bold text-slate-900">{notes.length} verified</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Active courses</span>
            <span className="text-xl font-bold text-slate-900">{classes.length} registered</span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Reputation</span>
            <div className="mt-0.5">
              <TrustBadge
                isTrusted={isTrusted}
                cleanCount={user?.cleanUploadCount ?? (isTrusted ? 5 : 0)}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and discovery banner */}
      <div className="p-6 rounded-xl border border-brand-100 bg-brand-50/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-brand-100 text-[11px] font-semibold tracking-wide text-brand-700">
            <Sparkles className="w-3.5 h-3.5" />
            Search the study library
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading tracking-tight text-slate-900">
            Find the formula or proof, not just a filename.
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Search by concept. NoteVault retrieves matching notes and generates study summaries and flashcards.
          </p>
          <div className="pt-2">
            <Link
              to="/search"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 shadow-sm"
            >
              Search notes <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="hidden lg:block bg-white border border-slate-200 p-4 rounded-xl text-xs space-y-2 max-w-xs shadow-sm">
          <span className="text-[10px] uppercase tracking-wider text-slate-400">Example query</span>
          <p className="font-medium text-slate-800">
            How do red-black tree rotations keep logarithmic search depth?
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span>CS 201</span>
            <span className="text-emerald-700 font-semibold">94% match</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Notes + Community Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Notes Column (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Latest verified notes</h3>
              <p className="text-xs text-slate-500">Peer-reviewed materials recently approved for your courses.</p>
            </div>
            <Link
              to="/notes"
              className="text-xs font-semibold text-brand-600 hover:underline inline-flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Course Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedClass('')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !selectedClass
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              All Courses
            </button>
            {classes.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedClass(c.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedClass === c.id
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {isLoading ? (
            <Skeleton rows={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredNotes.slice(0, 4).map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Activity & Habit (1 col) */}
        <div className="space-y-6">
          {/* Study Corner Card */}
          <Card className="p-5 bg-amber-50/40">
            <div className="flex items-center gap-2 text-amber-800 mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Study tip</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">The Feynman technique</h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Explain each proof as if teaching a first-year student. Gaps in that explanation are the concepts to revise first.
            </p>
            <div className="pt-2 border-t border-amber-100 text-[11px] text-amber-800 font-medium">
              Peer-reviewed notes retain knowledge longer.
            </div>
          </Card>

          <Card className="p-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Recent activity
            </h4>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center font-bold text-[10px] text-brand-700 shrink-0 mt-0.5">
                  AC
                </div>
                <div>
                  <p className="text-slate-800 leading-snug">
                    <strong>Aisha Chen</strong> uploaded notes in <em>CS 201</em>
                  </p>
                  <span className="text-[10px] text-slate-400">12 minutes ago · Auto-published</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center font-bold text-[10px] text-amber-700 shrink-0 mt-0.5">
                  DR
                </div>
                <div>
                  <p className="text-slate-800 leading-snug">
                    <strong>Diego Ramirez</strong> earned +1 clean approval in <em>MA 202</em>
                  </p>
                  <span className="text-[10px] text-slate-400">1 hour ago · Trust: 2/5</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-violet-50 flex items-center justify-center font-bold text-[10px] text-violet-700 shrink-0 mt-0.5">
                  SC
                </div>
                <div>
                  <p className="text-slate-800 leading-snug">
                    <strong>Sarah Connor</strong> verified 2 moderator requests
                  </p>
                  <span className="text-[10px] text-slate-400">3 hours ago · Audit logged</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function BrowsePage({ savedOnly = false }: { savedOnly?: boolean }) {
  const { saved } = useWorkspace()
  const { data: rawNotes = [], isLoading } = useNotes()
  const { data: classes = [] } = useClasses()
  const [params] = useSearchParams()

  const [search, setSearch] = useState(params.get('q') || '')
  const [selectedClass, setSelectedClass] = useState(params.get('class') || '')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [sort, setSort] = useState('popular')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const subjects = [...new Set(rawNotes.map((n) => n.subject).filter(Boolean))]

  const notes = rawNotes
    .filter((n) => {
      if (savedOnly && !saved.includes(n.id)) return false
      if (selectedClass && n.classId !== selectedClass) return false
      if (selectedSubject && n.subject !== selectedSubject) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const text = `${n.title} ${n.description} ${n.subject} ${(n.tags || []).join(' ')}`.toLowerCase()
        return text.includes(q)
      }
      return true
    })
    .sort((a, b) => {
      if (sort === 'popular') return (b.downloads || 0) - (a.downloads || 0)
      if (sort === 'title') return a.title.localeCompare(b.title)
      return Date.parse(b.createdAt || '') - Date.parse(a.createdAt || '')
    })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600">
            {savedOnly ? 'Bookshelf' : 'Catalog'}
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            {savedOnly ? 'Saved study notes' : 'Course study notes'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {savedOnly
              ? 'Bookmarks you saved for exam prep and revision.'
              : 'Browse vetted lecture notes, summaries, and problem sets.'}
          </p>
        </div>

        <Badge tone="accent">
          {notes.length} note{notes.length === 1 ? '' : 's'} available
        </Badge>
      </div>

      {/* Filters Toolbar */}
      <CatalogFilters
        search={search}
        onSearchChange={setSearch}
        selectedClass={selectedClass}
        onClassChange={setSelectedClass}
        selectedSubject={selectedSubject}
        onSubjectChange={setSelectedSubject}
        sort={sort}
        onSortChange={setSort}
        view={view}
        onViewChange={setView}
        classes={classes}
        subjects={subjects}
      />

      {/* Notes Grid */}
      <NoteGrid
        notes={notes}
        isLoading={isLoading}
        view={view}
        emptyTitle={savedOnly ? 'Your bookshelf is empty' : 'No matching notes found'}
        emptyHint={
          savedOnly
            ? 'Bookmark any note in the catalog by clicking its bookmark icon to keep it handy.'
            : 'Try refining your search keyword, clearing course filters, or upload your own.'
        }
        onResetFilters={() => {
          setSearch('')
          setSelectedClass('')
          setSelectedSubject('')
        }}
      />
    </div>
  )
}

export function ClassesPage() {
  const { data: classes = [], isLoading } = useClasses()

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="pb-4 border-b border-slate-200">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600">Courses</span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">Registered study courses</h1>
        <p className="text-sm text-slate-500 mt-1">
          Curriculum organized by course codes and departments.
        </p>
      </div>

      {isLoading ? (
        <Skeleton rows={4} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((c) => (
            <Card key={c.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge tone="accent" className="font-mono font-bold">
                    {c.name}
                  </Badge>
                  <span className="text-xs text-slate-500">{c.noteCount ?? 12} documents</span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{c.subject}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{c.description}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Curated by trusted peers</span>
                <Link
                  to={`/notes?class=${c.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  Browse Course <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
