import { Link } from 'react-router-dom'
import { AuthCard } from '../features/auth/AuthCard'
import { ArrowLeft, BookOpen } from 'lucide-react'

export default function AuthPage({ signup = false }: { signup?: boolean }) {
  return (
    <div className="min-h-screen bg-[#f7f8fb] flex flex-col justify-between py-8 px-4">
      <header className="max-w-md w-full mx-auto flex items-center justify-between pb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
          <span className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5" />
          </span>
          <span>NoteVault</span>
        </div>
      </header>

      <main className="w-full my-auto">
        <AuthCard mode={signup ? 'signup' : 'login'} />
      </main>

      <footer className="text-center text-xs text-slate-400 pt-8">
        NoteVault · Verified peer study platform
      </footer>
    </div>
  )
}
