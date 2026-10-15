import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Sparkles, ArrowUpRight, BookOpen } from 'lucide-react'
import { useNotes } from '../api/useNotesApi'
import { Button, Badge, Card, Empty, Skeleton } from '../components/ui'

export default function SearchPage() {
  const { data: notes = [], isLoading } = useNotes()
  const [params, setParams] = useSearchParams()

  const [input, setInput] = useState(params.get('q') || '')
  const query = params.get('q') || ''

  const handleSearch = (searchTerm: string) => {
    setInput(searchTerm)
    if (searchTerm.trim()) {
      setParams({ q: searchTerm.trim() })
    } else {
      setParams({})
    }
  }

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)

  const results = notes
    .map((note) => {
      if (!terms.length) return { ...note, score: 0.85 }
      const text = `${note.title} ${note.description} ${note.subject} ${(note.tags || []).join(' ')}`.toLowerCase()
      let matches = 0
      for (const t of terms) {
        if (text.includes(t)) matches++
      }
      const score = matches > 0 ? Math.min(0.98, 0.6 + (matches / terms.length) * 0.38) : 0
      return { ...note, score }
    })
    .filter((n) => (terms.length ? n.score > 0 : true))
    .sort((a, b) => b.score - a.score)

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="text-center py-4 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          AI concept search
        </div>

        <h1 className="text-3xl font-bold font-heading tracking-tight text-slate-900">
          Search by idea, not filename
        </h1>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Query an algorithm, equation, or proof. NoteVault ranks matching notes and shows AI study insights.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSearch(input)
          }}
          className="max-w-2xl mx-auto pt-2"
        >
          <div className="relative flex items-center shadow-sm rounded-xl bg-white border border-slate-200 p-1.5 focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:border-brand-400">
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Dijkstra heaps, BCNF, Maxwell equations..."
              className="w-full px-3 py-2.5 text-sm bg-transparent border-0 focus:outline-none text-slate-900 placeholder-slate-400"
            />
            <Button type="submit" variant="primary" size="md">
              Search
            </Button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="text-[11px] text-slate-400">Try:</span>
          {[
            'Data structures algorithms',
            'Eigenvalues linear algebra',
            'Relational normalization BCNF',
            'Maxwell equations flux',
            'Cellular respiration Krebs cycle',
          ].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => handleSearch(sample)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white border border-slate-200 hover:border-brand-200 hover:text-brand-700 text-slate-600"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <span className="text-xs font-semibold text-slate-900">
            {query ? `Results for “${query}”` : 'All study documents'}
          </span>
          <Badge tone="accent">
            {results.length} result{results.length === 1 ? '' : 's'}
          </Badge>
        </div>

        {isLoading ? (
          <Skeleton rows={4} />
        ) : results.length === 0 ? (
          <Empty
            title="No matching notes"
            hint="Try broader academic terms, or browse by course."
            icon={BookOpen}
          />
        ) : (
          <div className="space-y-4">
            {results.map((note) => (
              <Card key={note.id} className="p-5 hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-50 text-brand-700">
                        {note.classId?.toUpperCase() || note.subject}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{note.subject}</span>
                    </div>

                    <Link to={`/notes/${note.id}`}>
                      <h3 className="text-base font-bold text-slate-900 leading-snug hover:text-brand-700">
                        {note.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-slate-600 leading-relaxed">{note.description}</p>

                    {note.summary && (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 mb-0.5">
                          <Sparkles className="w-3 h-3" />
                          AI insight
                        </div>
                        <p className="line-clamp-2 text-[11px]">{note.summary}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400">Relevance</span>
                        <span className="font-mono text-xs font-bold text-emerald-700">
                          {Math.round(note.score * 100)}%
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {(note.tags || []).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-500">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Link to={`/notes/${note.id}`}>
                      <Button variant="secondary" size="sm" rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}>
                        Open note
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
