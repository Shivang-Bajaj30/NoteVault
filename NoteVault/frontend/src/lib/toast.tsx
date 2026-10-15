import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
}

interface ToastContextValue {
  toasts: ToastItem[]
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void
  removeToast: (id: string) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

// Global imperative handle so non-hook code (e.g. axios interceptors) can fire toasts
let globalShowToast: ((type: ToastType, message: string, title?: string, duration?: number) => void) | null = null

export const toast = {
  success: (message: string, title?: string) => globalShowToast?.('success', message, title),
  error: (message: string, title?: string) => globalShowToast?.('error', message, title),
  warning: (message: string, title?: string) => globalShowToast?.('warning', message, title),
  info: (message: string, title?: string) => globalShowToast?.('info', message, title),
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 4500) => {
      const id = 'toast_' + Math.random().toString(36).substring(2, 9)
      const newToast: ToastItem = { id, type, title, message, duration }

      setToasts((prev) => [...prev.slice(-4), newToast]) // keep max 5 visible

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  // Attach global handle
  globalShowToast = showToast

  const value: ToastContextValue = {
    toasts,
    showToast,
    removeToast,
    success: (msg, title) => showToast('success', msg, title),
    error: (msg, title) => showToast('error', msg, title),
    warning: (msg, title) => showToast('warning', msg, title),
    info: (msg, title) => showToast('info', msg, title),
  }

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-brand-500 shrink-0" />,
  }

  const borderStyles = {
    success: 'border-emerald-200 dark:border-emerald-800 bg-white dark:bg-zinc-900 shadow-emerald-500/10',
    error: 'border-rose-200 dark:border-rose-800 bg-white dark:bg-zinc-900 shadow-rose-500/10',
    warning: 'border-amber-200 dark:border-amber-800 bg-white dark:bg-zinc-900 shadow-amber-500/10',
    info: 'border-brand-200 dark:border-brand-800 bg-white dark:bg-zinc-900 shadow-brand-500/10',
  }

  const titleStyles = {
    success: 'text-emerald-950 dark:text-emerald-200',
    error: 'text-rose-950 dark:text-rose-200',
    warning: 'text-amber-950 dark:text-amber-200',
    info: 'text-brand-950 dark:text-brand-200',
  }

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Floating Toast Portal Container */}
      <div
        aria-live="assertive"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 backdrop-blur-md ${
              borderStyles[t.type]
            }`}
          >
            <div className="mt-0.5">{icons[t.type]}</div>
            <div className="flex-1 text-xs">
              {t.title && (
                <h4 className={`font-bold mb-0.5 ${titleStyles[t.type]}`}>{t.title}</h4>
              )}
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {t.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Graceful fallback if invoked outside provider
    return {
      toasts: [],
      showToast: (type: ToastType, message: string, title?: string) =>
        toast[type](message, title),
      removeToast: () => {},
      success: (msg: string, title?: string) => toast.success(msg, title),
      error: (msg: string, title?: string) => toast.error(msg, title),
      warning: (msg: string, title?: string) => toast.warning(msg, title),
      info: (msg: string, title?: string) => toast.info(msg, title),
    }
  }
  return ctx
}
