import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Radio,
  GraduationCap,
  Search,
  FileCheck2,
} from 'lucide-react'
import { Badge } from '../components/ui'
import { useAuth } from '../lib/auth'
import { isDemoMode } from '../lib/api'

export default function LandingPage() {
  const { switchPersona } = useAuth()
  const navigate = useNavigate()

  const launchAs = async (persona: 'student' | 'diego' | 'aisha' | 'admin', path: string) => {
    try {
      await switchPersona(persona)
      navigate(path)
    } catch {
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[480px] rounded-full bg-brand-50/80 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:40px_40px] opacity-70" />
      </div>

      <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 lg:px-16 flex items-center justify-between sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2.5 group select-none">
          <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-sm group-hover:bg-brand-700 transition-colors">
            <BookOpen className="w-4 h-4" />
          </span>
          <span className="font-heading font-bold text-lg tracking-tight text-slate-900">NoteVault</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
          <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
          <Link to="/notes" className="hover:text-slate-900 transition-colors">Catalog</Link>
          <a href="#stats" className="hover:text-slate-900 transition-colors">Platform</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium px-3 py-1.5 text-slate-600 hover:text-slate-900">
            Sign in
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm transition-all"
          >
            Get started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <section className="px-6 lg:px-16 pt-16 pb-20 lg:pt-24 lg:pb-28 max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-7 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 text-xs font-semibold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Peer-reviewed academic notes
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold font-heading tracking-tight text-slate-950 leading-[1.12]">
            Trusted course notes for serious students.
          </h1>

          <p className="text-base text-slate-600 leading-relaxed">
            NoteVault is a verified study library. Contributors earn publishing trust after five clean approvals,
            Search course materials, check contributor trust, and help keep shared study resources accurate through peer review.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition-all"
            >
              Start studying
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/notes"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all"
            >
              Browse catalog
            </Link>
          </div>

          {isDemoMode && <div className="pt-5 border-t border-slate-100 space-y-3">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
              Try a demo role
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => launchAs('student', '/home')}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-brand-500" />
                Student
              </button>
              <button type="button" onClick={() => launchAs('diego', '/upload')}
                className="px-3 py-1.5 rounded-md border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-medium">
                Moderator (2/5)
              </button>
              <button type="button" onClick={() => launchAs('aisha', '/upload')}
                className="px-3 py-1.5 rounded-md border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Trusted moderator
              </button>
              <button type="button" onClick={() => launchAs('admin', '/admin')}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium">
                Admin
              </button>
            </div>
          </div>}
        </div>

        <div className="w-full max-w-md lg:ml-auto">
          <div className="rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-400 font-mono text-[11px] ml-3">cs201_trees.pdf</span>
              </div>
              <Badge tone="success" className="text-[11px]">
                <ShieldCheck className="w-3 h-3" />
                Trusted
              </Badge>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-brand-600 uppercase">
                  CS 201 · Data Structures
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1 font-heading leading-snug">
                  Algorithmic Complexity: Master Guide
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Binary search trees, Dijkstra traversal, and amortized complexity proofs.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-brand-50/70 border border-brand-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  Key concepts
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Self-balancing trees keep O(log n) via constant-time rotations. Dijkstra scales to O((V + E) log V) with binary heaps.
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-slate-400 text-[11px]">342 downloads · 28 pages</span>
                <Link to="/notes/1" className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700">
                  Open viewer <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="stats" className="border-y border-slate-200 bg-slate-50 py-10 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '5', label: 'Clean approvals to trusted status' },
            { value: '3', label: 'Core user roles' },
            { value: '1', label: 'Shared study library' },
            { value: '24/7', label: 'Access to reviewed notes' },
          ].map(({ value, label }) => (
            <div key={label} className="space-y-1">
              <span className="text-2xl lg:text-3xl font-extrabold font-heading block text-brand-700">{value}</span>
              <span className="text-xs font-medium text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="px-6 lg:px-16 py-20 bg-white">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-block text-xs font-semibold text-brand-600 uppercase tracking-widest bg-brand-50 px-3 py-1 rounded-full">
              How NoteVault works
            </span>
            <h2 className="text-3xl font-extrabold font-heading tracking-tight text-slate-900">
              Discovery, reputation, and operations in one platform.
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Built for students, trusted contributors, and campus administrators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-xl border border-slate-200 bg-white hover:border-brand-200 hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center mb-5">
                <Search className="w-5 h-5 text-brand-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2 font-heading">Study discovery</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Find course notes by subject and topic, review contributor trust, and report issues for moderation.
              </p>
            </div>

            <div className="p-7 rounded-xl border border-slate-200 bg-white hover:border-amber-200 hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center mb-5">
                <FileCheck2 className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2 font-heading">Reputation moderation</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                New moderators start unproven. After 5 approved uploads they become Trusted and can auto-publish.
              </p>
            </div>

            <div className="p-7 rounded-xl border border-slate-200 bg-white hover:border-teal-200 hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center mb-5">
                <Radio className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2 font-heading">Admin observability</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Review queues, integrity reports, audit records, and event activity keep the catalog accountable.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-slate-200 py-8 px-6 lg:px-16 bg-slate-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2.5 font-semibold text-slate-800">
            <span className="w-6 h-6 rounded-md bg-brand-600 text-white flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5" />
            </span>
            NoteVault
          </div>
          <div className="flex items-center gap-8 font-medium">
            <Link to="/notes" className="hover:text-slate-800">Catalog</Link>
            <Link to="/upload" className="hover:text-slate-800">Contribute</Link>
            <Link to="/admin" className="hover:text-slate-800">Admin</Link>
          </div>
          <span className="text-[11px]">Verified peer study platform</span>
        </div>
      </footer>
    </div>
  )
}
