import { twMerge } from 'tailwind-merge'

export interface ProgressBarProps {
  value: number // 0 to 100 or current count
  max?: number // default 100 or threshold like 5
  tone?: 'indigo' | 'emerald' | 'amber' | 'rose'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
  className?: string
}

export function ProgressBar({
  value,
  max = 100,
  tone = 'indigo',
  size = 'md',
  showLabel = false,
  label,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  const tones = {
    indigo: 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 shadow-xs shadow-indigo-500/30',
    emerald: 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 shadow-xs shadow-emerald-500/30',
    amber: 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 shadow-xs shadow-amber-500/30',
    rose: 'bg-gradient-to-r from-rose-500 via-rose-600 to-pink-500 shadow-xs shadow-rose-500/30',
  }

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }

  return (
    <div className={twMerge('w-full flex flex-col gap-1.5', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center text-xs font-medium text-stone-600 dark:text-zinc-300">
          <span>{label}</span>
          <span className="font-mono text-[11px] text-stone-500 dark:text-zinc-400">
            {value} / {max} ({Math.round(percentage)}%)
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={twMerge(
          'w-full overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800',
          heights[size],
        )}
      >
        <div
          className={twMerge('h-full transition-all duration-300 ease-out rounded-full', tones[tone])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
