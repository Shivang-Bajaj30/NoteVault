import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Note } from '../../lib/auth'
import { useWorkspace } from '../../lib/workspace'
import { Button, Card, TrustBadge } from '../../components/ui'
import { AISummaryCard } from './AISummaryCard'
import { ReportDialog } from './ReportDialog'
import { api, getApiErrorMessage } from '../../lib/api'
import {
  ArrowLeft,
  Download,
  Bookmark,
  Flag,
  FileText,
} from 'lucide-react'

export interface NoteViewerProps {
  note: Note
}

export function NoteViewer({ note }: NoteViewerProps) {
  const { saved, toggleSave } = useWorkspace()
  const isSaved = saved.includes(note.id)

  const [isReportOpen, setIsReportOpen] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const handleDownload = async () => {
    setDownloadError(null)
    if (!note.fileUrl) {
      setDownloadError('The original document is unavailable for this note.')
      return
    }
    try {
      const response = await api.get<Blob>(note.fileUrl, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = note.fileName || `${note.title}.pdf`
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setDownloadSuccess(true)
      window.setTimeout(() => setDownloadSuccess(false), 2500)
    } catch (error) {
      setDownloadError(getApiErrorMessage(error, 'Could not download the original document.'))
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80 dark:border-zinc-800">
        <Link
          to="/notes"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant={isSaved ? 'primary' : 'outline'}
            size="sm"
            onClick={() => toggleSave(note.id)}
            leftIcon={<Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />}
          >
            {isSaved ? 'Saved to Bookshelf' : 'Save for Later'}
          </Button>

          <Button
            variant="academic"
            size="sm"
            onClick={handleDownload}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            {downloadSuccess ? 'Downloaded!' : 'Download Notes'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsReportOpen(true)}
            className="text-stone-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400"
            title="Report accuracy or integrity issue"
          >
            <Flag className="w-3.5 h-3.5 mr-1" />
            Report
          </Button>
        </div>
      </div>

      {downloadError && <p className="text-xs text-rose-700" role="alert">{downloadError}</p>}

      {/* Main Grid: Viewer + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Document Reader Canvas */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card className="overflow-hidden bg-slate-50">
            <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 text-xs">
              <div className="flex items-center gap-2 truncate pr-2">
                <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">
                  {note.fileName || `${note.title}.pdf`}
                </span>
                <span className="text-slate-400 text-[11px] hidden sm:inline">
                  {note.pages ? `(${note.pages} pages)` : ''}
                </span>
              </div>

            </div>

            <div className="min-h-[360px] p-8 flex flex-col items-center justify-center text-center">
              <FileText className="w-10 h-10 text-brand-500 mb-4" />
              <h2 className="text-lg font-semibold text-slate-900">Original study document</h2>
              <p className="max-w-md mt-2 text-sm text-slate-500">{note.description}</p>
              <p className="mt-4 text-xs text-slate-400">Download the original file to view its pages.</p>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: AI Study Assistant & Metadata */}
        <div className="flex flex-col gap-5">
          {/* AI Companion Card */}
          <AISummaryCard note={note} />

          {/* Note Metadata Details Card */}
          <Card className="p-5 border-stone-200/80 dark:border-zinc-800">
            <h4 className="text-xs font-semibold text-stone-900 dark:text-zinc-100 uppercase tracking-wider mb-3">
              Document Credentials
            </h4>

            <div className="flex items-center gap-3 pb-3 mb-3 border-b border-stone-100 dark:border-zinc-800">
              <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-950/80 flex items-center justify-center font-bold text-brand-700 dark:text-brand-300 text-sm">
                {(note.uploadedByName || 'U')[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-stone-800 dark:text-zinc-200 truncate">
                  {note.uploadedByName}
                </p>
                <div className="mt-0.5">
                  <TrustBadge isTrusted={note.trusted} cleanCount={5} />
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-y-3 text-xs">
              <div>
                <dt className="text-stone-400 dark:text-zinc-500 text-[11px]">Subject</dt>
                <dd className="font-medium text-stone-800 dark:text-zinc-200 mt-0.5">{note.subject}</dd>
              </div>

              <div>
                <dt className="text-stone-400 dark:text-zinc-500 text-[11px]">Course Code</dt>
                <dd className="font-medium text-stone-800 dark:text-zinc-200 mt-0.5">
                  {note.classId?.toUpperCase() || 'General'}
                </dd>
              </div>

              <div>
                <dt className="text-stone-400 dark:text-zinc-500 text-[11px]">Published</dt>
                <dd className="font-medium text-stone-800 dark:text-zinc-200 mt-0.5">
                  {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Recent'}
                </dd>
              </div>

              <div>
                <dt className="text-stone-400 dark:text-zinc-500 text-[11px]">Downloads</dt>
                <dd className="font-medium text-stone-800 dark:text-zinc-200 mt-0.5">
                  {note.downloads || 0} students
                </dd>
              </div>
            </dl>

            {note.tags && note.tags.length > 0 && (
              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-zinc-800">
                <span className="text-[11px] text-stone-400 dark:text-zinc-500 block mb-2">
                  Topic Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {note.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 text-[11px]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Report Modal */}
      <ReportDialog
        open={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        noteId={note.id}
        noteTitle={note.title}
      />
    </div>
  )
}
