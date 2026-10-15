import React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
}

export function Tooltip({ content, children, side = 'top', align = 'center' }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={4}
            className={twMerge(
              clsx(
                'z-50 overflow-hidden rounded-md bg-stone-900 px-2.5 py-1 text-xs text-stone-100 shadow-md animate-in fade-in-0 zoom-in-95 dark:bg-zinc-100 dark:text-zinc-900 select-none max-w-xs',
              ),
            )}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-stone-900 dark:fill-zinc-100" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
