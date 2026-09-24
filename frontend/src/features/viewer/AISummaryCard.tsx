import type { Note } from '../../lib/auth'
import { Card } from '../../components/ui'
import { BookOpen } from 'lucide-react'

export interface AISummaryCardProps {
  note: Note
}

export function AISummaryCard({ note }: AISummaryCardProps) {
  return (
    <Card className="p-5 border-brand-100 bg-white">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-brand-600" />
        <h3 className="text-sm font-semibold text-slate-900">Study overview</h3>
      </div>
      <p className="text-sm leading-relaxed text-slate-600">{note.summary || note.description || 'No overview was provided for this note.'}</p>
      {note.keyConcepts && note.keyConcepts.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">Key concepts</h4>
          <ul className="space-y-1.5 text-xs text-slate-600">
            {note.keyConcepts.map((concept) => <li key={concept} className="flex gap-2"><span className="text-brand-500">•</span>{concept}</li>)}
          </ul>
        </div>
      )}
    </Card>
  )
}
