import { Link } from 'react-router-dom'
import type { Note } from '../../lib/auth'
import { useWorkspace } from '../../lib/workspace'
import { TrustBadge, StatusBadge } from '../../components/ui'
import { Download, Bookmark, FileText, ArrowUpRight } from 'lucide-react'

export interface NoteCardProps {
  note: Note
}

export function NoteCard({ note }: NoteCardProps) {
  const { saved, toggleSave } = useWorkspace()
  const isSaved = saved.includes(note.id)

  const coverPalette: Record<string, string> = {
    lavender: 'bg-indigo-50 border-indigo-100 text-indigo-900',
    peach: 'bg-amber-50 border-amber-100 text-amber-900',
    mint: 'bg-emerald-50 border-emerald-100 text-emerald-900',
    blue: 'bg-sky-50 border-sky-100 text-sky-900',
    sand: 'bg-slate-50 border-slate-200 text-slate-800',
    rose: 'bg-rose-50 border-rose-100 text-rose-900',
  }

  const selectedCover = coverPalette[note.color || 'lavender'] || coverPalette.lavender

  return (
    <div className="group relative flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">
      <div className={`relative h-32 p-4 border-b flex flex-col justify-between ${selectedCover}`}>
        <div className="flex items-center justify-between z-10">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white text-[10px] font-semibold tracking-wider uppercase shadow-sm">
            <FileText className="w-3 h-3 text-slate-500" />
            {note.classId?.toUpperCase() || note.subject}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              toggleSave(note.id)
            }}
            aria-label={isSaved ? 'Remove from saved' : 'Save note'}
            className={`p-1.5 rounded-full transition-colors ${
              isSaved ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] font-medium text-slate-600 z-10">
          <span>{note.pages ? `${note.pages} pages` : 'Synthesis'}</span>
          <span className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {note.downloads || 0}
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <TrustBadge isTrusted={note.trusted} cleanCount={5} />
            {note.status !== 'approved' && <StatusBadge status={note.status} />}
          </div>

          <Link to={`/notes/${note.id}`} className="block group-hover:text-indigo-600 transition-colors">
            <h4 className="text-sm font-semibold tracking-tight text-slate-900 line-clamp-2 leading-snug">
              {note.title}
            </h4>
          </Link>

          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{note.description}</p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 truncate pr-2">
            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-700 shrink-0">
              {(note.uploadedByName || 'C')[0]}
            </span>
            <span className="text-[11px] truncate">{note.uploadedByName || 'Contributor'}</span>
          </div>

          <Link
            to={`/notes/${note.id}`}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 shrink-0"
          >
            Open <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
