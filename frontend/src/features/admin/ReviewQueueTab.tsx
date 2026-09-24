import { useState } from 'react'
import { useAllNotesAdmin, useReviewNote } from '../../api/useNotesApi'
import { Table, Button, Modal, Input, Badge } from '../../components/ui'
import { CheckCircle2, XCircle, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

export function ReviewQueueTab() {
  const { data: allNotes = [] } = useAllNotesAdmin()
  const reviewMutation = useReviewNote()

  const pendingNotes = allNotes.filter((n) => n.status === 'pending')

  const [selectedNote, setSelectedNote] = useState<any | null>(null)
  const [decision, setDecision] = useState<'approve' | 'reject'>('approve')
  const [reason, setReason] = useState('')

  const handleOpenReview = (note: any, action: 'approve' | 'reject') => {
    setSelectedNote(note)
    setDecision(action)
    setReason('')
  }

  const handleConfirmReview = async () => {
    if (!selectedNote) return
    await reviewMutation.mutateAsync({
      id: selectedNote.id,
      decision,
      reason: reason.trim() || undefined,
    })
    setSelectedNote(null)
  }

  const columns = [
    {
      key: 'title',
      label: 'Note Document',
      render: (val: string, item: any) => (
        <div className="flex items-center gap-2 max-w-sm">
          <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div className="min-w-0">
            <Link
              to={`/notes/${item.id}`}
              className="font-semibold text-stone-900 dark:text-zinc-100 hover:underline truncate block"
            >
              {val}
            </Link>
            <span className="text-[10px] text-stone-400 dark:text-zinc-500 block truncate">
              {item.description}
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
      key: 'uploadedByName',
      label: 'Contributor',
      render: (val: string) => (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-stone-800 dark:text-zinc-200">{val}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Submitted',
      render: (val?: string) => (
        <span className="text-stone-500 dark:text-zinc-400 text-xs">
          {val ? new Date(val).toLocaleDateString() : 'Just now'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Moderation Actions',
      sortable: false,
      render: (_: any, item: any) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenReview(item, 'approve')}
            className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Approve
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenReview(item, 'reject')}
            className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            leftIcon={<XCircle className="w-3.5 h-3.5" />}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-amber-100 dark:border-zinc-800">
        <div>
          <h3 className="text-base font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Pending Submissions Triage
          </h3>
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
            Notes submitted by unproven moderators awaiting quality and academic integrity verification.
          </p>
        </div>
        <Badge tone={pendingNotes.length > 0 ? 'warning' : 'success'}>
          {pendingNotes.length} Pending Review
        </Badge>
      </div>

      <Table
        columns={columns}
        data={pendingNotes}
        searchPlaceholder="Filter pending notes by title, author, or subject..."
        emptyTitle="Review queue is clear"
        emptyMessage="All submitted notes have been reviewed. Outstanding uploads will populate here in real-time."
      />

      {/* Review Action Confirmation Modal */}
      <Modal
        open={!!selectedNote}
        onClose={() => setSelectedNote(null)}
        title={
          decision === 'approve' ? (
            <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              Approve Note & Award Reputation
            </span>
          ) : (
            <span className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <XCircle className="w-5 h-5" />
              Reject Note
            </span>
          )
        }
        description={
          decision === 'approve'
            ? 'Approving publishes this note to the student catalog and awards the contributor +1 clean approval toward the 5-approval threshold.'
            : 'Rejecting prevents publication and records an audit log entry.'
        }
      >
        <div className="flex flex-col gap-4 text-xs">
          <div className="p-3 rounded-lg bg-stone-50 dark:bg-zinc-800/60 border border-stone-200 dark:border-zinc-700">
            <p className="text-stone-500 dark:text-zinc-400 text-[11px]">Note Title:</p>
            <p className="font-semibold text-stone-800 dark:text-zinc-200 mt-0.5">
              {selectedNote?.title}
            </p>
            <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-1">
              Contributor: <strong>{selectedNote?.uploadedByName}</strong>
            </p>
          </div>

          <Input
            label="Decision Rationale / Feedback (Optional)"
            placeholder="e.g. Well-structured equations and clear citation of textbook chapters."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-zinc-800">
            <Button variant="ghost" size="sm" onClick={() => setSelectedNote(null)}>
              Cancel
            </Button>
            <Button
              variant={decision === 'approve' ? 'primary' : 'danger'}
              size="sm"
              isLoading={reviewMutation.isPending}
              onClick={handleConfirmReview}
            >
              Confirm {decision === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
