import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../lib/theme'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export function ThemeToggle({
  className = '',
  showLabel = false,
  size = 'md',
}: ThemeToggleProps) {
  const { theme, isDark, toggleTheme } = useTheme()

  const buttonSizeClasses = size === 'sm' ? 'p-1.5 text-xs' : 'p-2 text-sm'
  const iconSizeClasses = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group relative inline-flex items-center gap-2 rounded-xl border border-stone-200/80 bg-white/80 dark:border-white/10 dark:bg-zinc-900/80 backdrop-blur-md text-stone-600 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white hover:border-brand-400/60 dark:hover:border-brand-500/50 shadow-2xs hover:shadow-xs transition-all duration-200 active:scale-95 ${buttonSizeClasses} ${className}`}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative flex items-center justify-center">
        {isDark ? (
          <Sun className={`${iconSizeClasses} text-amber-400 group-hover:rotate-45 group-hover:scale-110 transition-transform duration-300`} />
        ) : (
          <Moon className={`${iconSizeClasses} text-brand-600 group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-300`} />
        )}
      </div>

      {showLabel && (
        <span className="font-semibold text-xs capitalize tracking-tight">
          {theme} Mode
        </span>
      )}
    </button>
  )
}
