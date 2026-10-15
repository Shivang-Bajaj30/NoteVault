import React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}: ModalProps) {
  const maxW = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200" />
        <DialogPrimitive.Content
          className={twMerge(
            clsx(
              'fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border border-stone-200 bg-white p-6 shadow-xl duration-200 animate-in fade-in-0 zoom-in-95 dark:border-zinc-800 dark:bg-zinc-900 rounded-2xl',
              maxW[maxWidth],
            ),
          )}
        >
          <div className="flex flex-col space-y-1.5 text-left pr-6">
            <DialogPrimitive.Title className="text-lg font-semibold tracking-tight text-stone-900 dark:text-zinc-100">
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="text-xs text-stone-500 dark:text-zinc-400">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>

          <div className="mt-1">{children}</div>

          <DialogPrimitive.Close
            aria-label="Close dialog"
            className="absolute right-4 top-4 rounded-md p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
