import React, { useState } from 'react'
import { Modal, Button, Textarea } from '../../components/ui'
import { useCreateReport } from '../../api/useReportsApi'
import { useAuth } from '../../lib/auth'
import { Flag, ShieldAlert } from 'lucide-react'

export interface ReportDialogProps {
  open: boolean
  onClose: () => void
  noteId: string
  noteTitle: string
}

export function ReportDialog({ open, onClose, noteId, noteTitle }: ReportDialogProps) {
  const { user } = useAuth()
  const createReport = useCreateReport()

  const [category, setCategory] = useState('Inaccurate Academic Content')
  const [reason, setReason] = useState('')
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return

    setErrorMessage(null)
    try {
      await createReport.mutateAsync({
        noteId,
        noteTitle,
        reportedByName: user?.name || 'Anonymous Student',
        reason: `[${category}] ${reason.trim()}`,
      })
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setReason('')
        onClose()
      }, 1800)
    } catch {
      setErrorMessage('The report could not be saved. Sign in and check the backend connection, then try again.')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
          <Flag className="w-5 h-5" />
          <span>Report Study Note</span>
        </div>
      }
      description="Help uphold NoteVault's high academic standards. Reports are reviewed by administrators."
    >
      {success ? (
        <div className="py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-3">
            <Flag className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
            Report Submitted for Review
          </h4>
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
            Thank you for helping keep our peer study library verified and accurate.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          {errorMessage && <p className="text-xs text-rose-700" role="alert">{errorMessage}</p>}
          <div className="p-3 rounded-lg bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/80 dark:border-zinc-700/80">
            <span className="text-[11px] text-stone-500 dark:text-zinc-400 font-medium">Reporting:</span>
            <p className="font-semibold text-stone-800 dark:text-zinc-200 mt-0.5">{noteTitle}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-stone-700 dark:text-zinc-300">
              Primary Concern
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-800 border border-stone-300 dark:border-zinc-700 rounded-lg text-stone-900 dark:text-zinc-100 focus:ring-1 focus:ring-rose-500 focus:outline-none"
            >
              <option value="Inaccurate Academic Content">Inaccurate / Erroneous Equations or Definitions</option>
              <option value="Plagiarism or Copyright">Plagiarism or Missing Attribution</option>
              <option value="Low Quality / Illegible">Low Quality / Illegible Scan</option>
              <option value="Duplicate Upload">Duplicate of an Existing Note</option>
              <option value="Inappropriate Content">Inappropriate / Off-Topic Material</option>
            </select>
          </div>

          <Textarea
            label="Specific Details & Page Numbers"
            placeholder="Please detail where the error occurs (e.g. Page 3, equation 4 has an incorrect sign)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            required
            helperText="Provide enough detail for administrators to inspect the problem quickly."
          />

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2 text-amber-800 dark:text-amber-300">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Reputation Safeguard:</strong> If an administrator verifies this report as valid, the contributor's trust score will be reset to zero to protect student study accuracy.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-zinc-800">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              type="submit"
              isLoading={createReport.isPending}
              disabled={!reason.trim()}
            >
              Submit Report
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
