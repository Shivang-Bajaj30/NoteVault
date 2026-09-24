import React from 'react'
import { BookOpen } from 'lucide-react'

export * from './Button'
export * from './Badge'
export * from './Card'
export * from './Modal'
export * from './Tabs'
export * from './Table'
export * from './Input'
export * from './ProgressBar'
export * from './Tooltip'
export * from './ThemeToggle'

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const sizes = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold bg-brand-50 text-brand-800 select-none border border-brand-100 ${sizes[size]}`}
      aria-label={name}
    >
      {initials}
    </span>
  )
}

export function Empty({
  title,
  hint,
  children,
  icon: Icon = BookOpen,
}: {
  title: string
  hint?: string
  children?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-white">
      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3.5">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {hint && (
        <p className="text-xs text-slate-500 mt-1 max-w-sm mb-4 leading-relaxed">
          {hint}
        </p>
      )}
      {children}
    </div>
  )
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse" aria-label="Loading...">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-64 rounded-xl border border-slate-200 bg-slate-100"
        />
      ))}
    </div>
  )
}
