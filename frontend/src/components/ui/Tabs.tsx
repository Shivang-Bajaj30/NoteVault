import React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const Tabs = TabsPrimitive.Root

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={twMerge(
      clsx(
        'inline-flex items-center justify-start border-b border-stone-200 dark:border-zinc-800 w-full gap-2 px-1 overflow-x-auto scrollbar-none',
        className,
      ),
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={twMerge(
      clsx(
        'inline-flex items-center justify-center whitespace-nowrap py-3 px-3.5 text-xs font-medium text-stone-500 hover:text-stone-900 border-b-2 border-transparent transition-all disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 dark:text-zinc-400 dark:hover:text-zinc-200 dark:data-[state=active]:border-indigo-400 dark:data-[state=active]:text-indigo-400',
        className,
      ),
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={twMerge(
      clsx(
        'mt-4 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 dark:ring-offset-zinc-950',
        className,
      ),
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName
