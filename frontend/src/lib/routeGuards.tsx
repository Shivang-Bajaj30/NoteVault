import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './auth'
import { isDemoMode } from './api'
import type { Role } from './auth'
import { ShieldAlert, UserCheck } from 'lucide-react'
import { Button, Card } from '../components/ui'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: Role | Role[]
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, switchPersona } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    const hasRole = roles.includes(user.role)

    if (!hasRole) {
      const suggestedPersona = roles.includes('admin')
        ? 'admin'
        : roles.includes('moderator')
        ? 'aisha'
        : 'student'

      return (
        <div className="max-w-md mx-auto my-16 px-4">
          <Card className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900/60 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-300 mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-100">
              Restricted Area ({roles.join(' or ')} only)
            </h2>
            <p className="text-xs text-stone-600 dark:text-zinc-400 mt-1 mb-5">
              Your active account (<strong>{user.email}</strong>, role: <em>{user.role}</em>) does not have permission to view this page.
            </p>

            <div className="flex flex-col gap-2">
              {isDemoMode ? <Button
                variant="primary"
                onClick={() => { void switchPersona(suggestedPersona) }}
                leftIcon={<UserCheck className="w-4 h-4" />}
              >
                Sign in as {suggestedPersona.toUpperCase()} demo user
              </Button> : <p className="text-xs text-slate-500">Sign in with an account that has the required role.</p>}
              <Button variant="ghost" onClick={() => window.history.back()}>
                Go Back
              </Button>
            </div>
          </Card>
        </div>
      )
    }
  }

  return <>{children}</>
}
