import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { CheckCircle2, Clock, XCircle, ShieldCheck, ShieldAlert, Radio } from 'lucide-react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent' | 'academic' | 'stream'
  size?: 'sm' | 'md'
  icon?: React.ReactNode
}

export function Badge({
  className,
  tone = 'neutral',
  size = 'md',
  icon,
  children,
  ...props
}: BadgeProps) {
  const tones = {
    neutral:
      'bg-slate-100/90 text-slate-700 dark:bg-obsidian-850 dark:text-slate-300 border-slate-200 dark:border-white/10 shadow-2xs',
    success:
      'bg-emerald-50/90 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800/70 shadow-2xs shadow-emerald-500/10 font-semibold',
    warning:
      'bg-amber-50/90 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300/80 dark:border-amber-800/70 shadow-2xs shadow-amber-500/10 font-semibold',
    danger:
      'bg-rose-50/90 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-300/80 dark:border-rose-800/70 shadow-2xs shadow-rose-500/10 font-semibold',
    accent:
      'bg-brand-50/90 text-brand-800 dark:bg-brand-950/50 dark:text-brand-300 border-brand-300/80 dark:border-brand-800/70 shadow-2xs shadow-brand-500/10 font-semibold',
    academic:
      'bg-gradient-to-r from-amber-100/90 via-orange-50/80 to-amber-100/70 text-amber-950 dark:bg-zinc-800 dark:text-amber-200 border-amber-300/90 dark:border-stone-700 shadow-2xs font-semibold',
    stream:
      'bg-amber-50/90 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300/80 dark:border-amber-800/70 shadow-2xs shadow-amber-500/10 font-semibold',
  }

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  }

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center font-medium rounded-full border transition-colors select-none',
          tones[tone],
          sizes[size],
          className,
        ),
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  switch (normalized) {
    case 'approved':
    case 'valid':
    case 'active':
    case 'healthy':
      return (
        <Badge tone="success" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
          {normalized === 'approved' ? 'Approved' : normalized === 'valid' ? 'Report Valid' : 'Healthy'}
        </Badge>
      )
    case 'pending':
    case 'open':
      return (
        <Badge tone="warning" icon={<Clock className="w-3.5 h-3.5" />}>
          {normalized === 'open' ? 'Open' : 'Pending Review'}
        </Badge>
      )
    case 'rejected':
    case 'dismissed':
      return (
        <Badge tone="danger" icon={<XCircle className="w-3.5 h-3.5" />}>
          {normalized === 'dismissed' ? 'Dismissed' : 'Rejected'}
        </Badge>
      )
    default:
      return <Badge tone="neutral">{status}</Badge>
  }
}

export function TrustBadge({
  isTrusted,
  cleanCount = 0,
  threshold = 5,
}: {
  isTrusted?: boolean
  cleanCount?: number
  threshold?: number
}) {
  if (isTrusted) {
    return (
      <Badge
        tone="success"
        className="font-semibold shadow-xs bg-emerald-100/80 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700"
        icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
      >
        Trusted Contributor
      </Badge>
    )
  }

  return (
    <Badge
      tone="warning"
      className="border-amber-300 dark:border-amber-800"
      icon={<ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
    >
      Unproven ({cleanCount}/{threshold})
    </Badge>
  )
}

export function KafkaTopicBadge({ topic }: { topic: string }) {
  return (
    <Badge
      tone="stream"
      className="font-mono text-[10px] tracking-tight uppercase"
      icon={<Radio className="w-3 h-3 text-amber-600 dark:text-amber-400 animate-pulse" />}
    >
      {topic}
    </Badge>
  )
}
