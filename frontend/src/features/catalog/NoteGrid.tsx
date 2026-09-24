import type { Note } from '../../lib/auth'
import { NoteCard } from './NoteCard'
import { Skeleton, Empty } from '../../components/ui'
import { BookOpen } from 'lucide-react'

export interface NoteGridProps {
  notes: Note[]
  isLoading?: boolean
  view?: 'grid' | 'list'
  emptyTitle?: string
  emptyHint?: string
  onResetFilters?: () => void
}

export function NoteGrid({
  notes,
  isLoading = false,
  view = 'grid',
  emptyTitle = 'No study notes found',
  emptyHint = 'Try adjusting your search query, clearing course filters, or upload your own notes.',
  onResetFilters,
}: NoteGridProps) {
  if (isLoading) {
    return <Skeleton rows={6} />
  }

  if (notes.length === 0) {
    return (
      <Empty title={emptyTitle} hint={emptyHint} icon={BookOpen}>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline"
          >
            Clear all filters
          </button>
        )}
      </Empty>
    )
  }

  if (view === 'list') {
    return (
      <div className="flex flex-col gap-3">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  )
}
