import { useAllNotesAdmin, useDeleteNote } from '../../api/useNotesApi'
import { useAuth } from '../../lib/auth'
import { Table, StatusBadge, Button } from '../../components/ui'
import { Trash2, ExternalLink, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

export function UploadHistoryTable() {
  const { user } = useAuth()
  const { data: allNotes = [] } = useAllNotesAdmin()
  const deleteNote = useDeleteNote()

  // Filter to notes by current user or show recent demo contributions
  const userNotes = allNotes.filter(
    (n) => n.uploadedBy === user?.id || n.uploadedByName === user?.name || user?.role === 'admin',
  )

  const columns = [
    {
      key: 'title',
      label: 'Document Title',
      render: (val: string, item: any) => (
        <div className="flex items-center gap-2 max-w-xs">
          <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div className="min-w-0">
            <Link
              to={`/notes/${item.id}`}
              className="font-semibold text-stone-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 truncate block text-xs"
            >
              {val}
            </Link>
            <span className="text-[10px] text-stone-400 dark:text-zinc-500 truncate block">
              {item.fileName || 'document.pdf'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'subject',
      label: 'Subject / Course',
      render: (val: string, item: any) => (
        <div>
          <span className="font-medium text-stone-800 dark:text-zinc-200">{val}</span>
          <span className="text-[10px] text-stone-400 dark:text-zinc-500 block uppercase font-mono">
            {item.classId}
          </span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date Uploaded',
      render: (val?: string) => (
        <span className="text-stone-500 dark:text-zinc-400 text-xs">
          {val ? new Date(val).toLocaleDateString() : 'Recent'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Review Status',
      render: (val: string) => <StatusBadge status={val} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_: any, item: any) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Link
            to={`/notes/${item.id}`}
            className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200"
            title="View note"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm('Delete this upload permanently?')) {
                deleteNote.mutate(item.id)
              }
            }}
            className="p-1 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400"
            title="Delete upload"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-purple-100 dark:border-zinc-800">
        <div>
          <h4 className="text-base font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            Your Upload History & Trust Audit
          </h4>
          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
            Monitor the verification progression and moderation lifecycle of your submitted study materials.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0 self-start sm:self-auto">
          {userNotes.length} upload{userNotes.length === 1 ? '' : 's'} on record
        </span>
      </div>

      <Table
        columns={columns}
        data={userNotes}
        searchPlaceholder="Filter your uploaded notes..."
        emptyTitle="No uploads yet"
        emptyMessage="Upload your first study document above to start building community trust."
      />
    </div>
  )
}
