import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { toast } from './toast'

type WorkspaceContextValue = {
  saved: string[]
  toggleSave: (id: string, title?: string) => void
  isSaved: (id: string) => boolean
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

const STORAGE_KEY = 'notevault_saved'

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as string[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  }, [saved])

  const toggleSave = (id: string, title?: string) => {
    setSaved((current) => {
      const exists = current.includes(id)
      if (exists) {
        toast.info(title ? `Removed "${title}" from bookshelf.` : 'Removed from saved bookshelf.')
        return current.filter((item) => item !== id)
      } else {
        toast.success(title ? `Saved "${title}" to your bookshelf!` : 'Saved to bookshelf!')
        return [...current, id]
      }
    })
  }

  const isSaved = (id: string) => saved.includes(id)

  const value = useMemo<WorkspaceContextValue>(
    () => ({ saved, toggleSave, isSaved }),
    [saved],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error('useWorkspace must be used inside WorkspaceProvider')
  }
  return ctx
}
