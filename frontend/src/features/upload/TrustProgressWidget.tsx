import { useAuth } from '../../lib/auth'
import { Card, ProgressBar, TrustBadge } from '../../components/ui'

export function TrustProgressWidget() {
  const { user, isTrusted } = useAuth()
  const cleanCount = user?.cleanUploadCount ?? (isTrusted ? 5 : 0)
  const threshold = user?.trustThreshold ?? 5
  const remaining = Math.max(0, threshold - cleanCount)

  return (
    <Card className="p-6 border-amber-200/80 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/40 via-white to-emerald-50/30 dark:from-amber-950/20 dark:via-zinc-900 dark:to-emerald-950/20 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-bold text-stone-900 dark:text-zinc-100">
              Moderator Reputation Status
            </span>
            <TrustBadge isTrusted={isTrusted} cleanCount={cleanCount} threshold={threshold} />
          </div>
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 px-3 py-1 rounded-md border border-emerald-300/60 dark:border-emerald-800/60 inline-flex items-center gap-1.5 shadow-2xs">
            {isTrusted
              ? '✨ Trusted Contributor: Your uploads publish immediately without manual queue gating.'
              : `🎯 Progress to Trusted: ${remaining} more approved upload${remaining === 1 ? '' : 's'} to unlock instant auto-publishing.`}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border-2 border-indigo-200 dark:border-indigo-800 text-xs font-bold shrink-0 shadow-xs">
          <span className="font-mono text-indigo-600 dark:text-indigo-400 text-sm">{cleanCount}</span>
          <span className="text-stone-300 dark:text-zinc-600">/</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">{threshold}</span>
          <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 ml-1">Approvals</span>
        </div>
      </div>

      {/* Progress Bar */}
      <ProgressBar
        value={cleanCount}
        max={threshold}
        tone={isTrusted ? 'emerald' : 'amber'}
        size="md"
        className="mb-5 shadow-xs"
      />

      {/* Trust Rules Guide - Colorful Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-amber-200/50 dark:border-zinc-800 text-xs">
        <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            1
          </div>
          <div>
            <strong className="text-amber-900 dark:text-amber-200 font-bold block text-xs">
              Unproven Tier
            </strong>
            <p className="text-amber-800/90 dark:text-amber-300/90 font-medium text-[11px] mt-0.5 leading-snug">
              Submissions route directly to the Admin Review Queue for safety check.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            2
          </div>
          <div>
            <strong className="text-emerald-900 dark:text-emerald-200 font-bold block text-xs">
              5 Clean Approvals
            </strong>
            <p className="text-emerald-800/90 dark:text-emerald-300/90 font-medium text-[11px] mt-0.5 leading-snug">
              Flipping to Trusted enables instant, frictionless publication.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            3
          </div>
          <div>
            <strong className="text-rose-900 dark:text-rose-200 font-bold block text-xs">
              Reputation Safety Net
            </strong>
            <p className="text-rose-800/90 dark:text-rose-300/90 font-medium text-[11px] mt-0.5 leading-snug">
              Any verified valid report against a note resets trust back to 0.
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
