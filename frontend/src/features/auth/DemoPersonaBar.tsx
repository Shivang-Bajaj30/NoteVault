import { useAuth, DEMO_USERS } from '../../lib/auth'
import { ShieldCheck, ShieldAlert, User, FlaskConical } from 'lucide-react'
import { isDemoMode } from '../../lib/api'

export function DemoPersonaBar() {
  const { user, switchPersona } = useAuth()

  if (!isDemoMode) return null

  return (
    <div className="bg-white text-slate-700 border-b border-slate-200 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2.5">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 font-semibold text-slate-700 uppercase tracking-wide">
          <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
          Demo roles
        </span>
        <span className="text-slate-400 hidden md:inline">
          Switch personas to preview student, moderator, and admin workflows.
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => switchPersona('student')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
            user?.role === 'student'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Student
        </button>

        <button
          type="button"
          onClick={() => switchPersona('diego')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
            user?.email === DEMO_USERS.diego.email
              ? 'bg-amber-500 text-white border-amber-500'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
          title="Unproven moderator: uploads require admin review."
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Diego 2/5
        </button>

        <button
          type="button"
          onClick={() => switchPersona('aisha')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
            user?.email === DEMO_USERS.aisha.email
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
          title="Trusted moderator: uploads auto-publish."
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Aisha Trusted
        </button>

        <button
          type="button"
          onClick={() => switchPersona('admin')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
            user?.role === 'admin'
              ? 'bg-violet-600 text-white border-violet-600'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Admin
        </button>
      </div>
    </div>
  )
}
