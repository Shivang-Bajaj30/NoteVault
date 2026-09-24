import React, { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Home,
  Files,
  Layers,
  Bookmark,
  Upload,
  ShieldCheck,
  Menu,
  Search,
  ChevronDown,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { api, isDemoMode } from '../lib/api'
import { useQuery } from '@tanstack/react-query'
import { useWorkspace } from '../lib/workspace'
import { Avatar, Modal, Button, TrustBadge } from '../components/ui'
import { DemoPersonaBar } from '../features/auth/DemoPersonaBar'

export function Logo() {
  return (
    <Link className="flex items-center gap-2.5 font-bold tracking-tight text-base select-none group" to="/">
      <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-sm group-hover:bg-brand-700 transition-colors">
        <BookOpen className="w-4 h-4" />
      </span>
      <span className="text-base font-bold tracking-tight text-slate-900 font-heading">
        NoteVault
      </span>
    </Link>
  )
}

export default function AppLayout() {
  const { user, logout, switchPersona, isTrusted } = useAuth()
  const { saved } = useWorkspace()
  const [drawer, setDrawer] = useState(false)
  const [accountModal, setAccountModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const backendHealth = useQuery({
    queryKey: ['backend-health'],
    queryFn: async () => (await api.get('/health')).data as { status: string },
    retry: false,
    refetchInterval: 15000,
  })

  const navLinks = [
    { to: '/home', label: 'Overview', icon: Home },
    { to: '/notes', label: 'Browse Notes', icon: Files },
    { to: '/classes', label: 'Courses', icon: Layers },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/saved', label: 'Saved Bookshelf', icon: Bookmark, count: saved.length },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f8fb] text-slate-900 relative overflow-x-hidden selection:bg-brand-100 selection:text-brand-800">
      <DemoPersonaBar />
      {backendHealth.isError && <div role="status" className="px-4 py-2 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3">
        <span>The backend is unreachable. Live data and write actions are unavailable until the API reconnects.</span>
        <button className="font-semibold underline underline-offset-2 shrink-0" onClick={() => void backendHealth.refetch()}>Retry connection</button>
      </div>}

      <header className="sticky top-0 z-40 h-14 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle navigation menu"
            onClick={() => setDrawer(!drawer)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <Logo />
        </div>

        <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes, courses, or concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 focus:bg-white transition-all"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] text-slate-500" title={backendHealth.isError ? 'Backend is unreachable' : 'Backend health endpoint responded'}>
            <span className={`w-1.5 h-1.5 rounded-full ${backendHealth.isError ? 'bg-rose-500' : backendHealth.isSuccess ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            {backendHealth.isError ? 'Backend offline' : backendHealth.isSuccess ? 'Backend connected' : 'Connecting'}
          </span>
          <button
            type="button"
            onClick={() => setAccountModal(true)}
            className="flex items-center gap-2 p-1 pl-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
          >
            <div className="hidden sm:block text-right">
              <span className="text-xs font-semibold text-slate-900 block leading-tight">
                {user?.name || 'Guest'}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                {user?.role || 'not signed in'}
              </span>
            </div>
            <Avatar name={user?.name || 'Guest'} size="sm" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        {drawer && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
            onClick={() => setDrawer(false)}
          />
        )}

        <aside
          className={`fixed lg:sticky top-[calc(3.5rem+2.5rem)] h-[calc(100vh-3.5rem-2.5rem)] w-60 z-40 flex flex-col justify-between border-r border-slate-200 bg-white px-3 py-4 transition-transform duration-200 ${
            drawer ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="space-y-4">
            <div className="px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Campus workspace
              </span>
              <span className="font-semibold text-slate-900 truncate block mt-0.5">
                {user?.university || 'Sign in to access your workspace'}
              </span>
            </div>

            <nav className="space-y-0.5">
              {navLinks.map(({ to, label, icon: Icon, count }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setDrawer(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </div>
                  {count !== undefined && count > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {count}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="pt-3 border-t border-slate-100 space-y-0.5">
              <span className="px-3 text-[10px] font-semibold tracking-wider uppercase text-slate-400 block mb-1">
                Contributor tools
              </span>

              <NavLink
                to="/upload"
                onClick={() => setDrawer(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-50 text-amber-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Upload className="w-4 h-4" />
                  <span>Upload Notes</span>
                </div>
                {user?.role === 'moderator' && (
                  <span className="text-[10px] font-mono text-amber-700">
                    {user?.isTrusted ? 'TRUSTED' : '2/5'}
                  </span>
                )}
              </NavLink>

              <NavLink
                to="/admin"
                onClick={() => setDrawer(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-violet-50 text-violet-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Console</span>
                </div>
              </NavLink>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Trust status
                </span>
                <TrustBadge
                  isTrusted={isTrusted}
                  cleanCount={user?.cleanUploadCount ?? (isTrusted ? 5 : 0)}
                  threshold={5}
                />
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {isTrusted
                  ? 'Auto-publishing is enabled for your uploads.'
                  : 'New submissions are reviewed until 5 clean approvals.'}
              </p>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      <Modal
        open={accountModal}
        onClose={() => setAccountModal(false)}
        title="Account"
        description="Session and demo persona controls."
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <Avatar name={user?.name || 'User'} size="lg" />
            <div>
              <p className="text-sm font-bold text-slate-900">{user?.name}</p>
              <p className="text-slate-500">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-brand-50 text-brand-700 border border-brand-100">
                  {user?.role}
                </span>
                <span className="text-slate-500 text-[11px]">{user?.university}</span>
              </div>
            </div>
          </div>

          {isDemoMode && <div className="space-y-2">
            <span className="font-semibold text-slate-700 block text-xs">Switch demo persona</span>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => { switchPersona('student'); setAccountModal(false) }}>
                Student (Alex)
              </Button>
              <Button variant="outline" size="sm" onClick={() => { switchPersona('diego'); setAccountModal(false) }}>
                Diego (2/5 Mod)
              </Button>
              <Button variant="outline" size="sm" onClick={() => { switchPersona('aisha'); setAccountModal(false) }}>
                Aisha (Trusted)
              </Button>
              <Button variant="outline" size="sm" onClick={() => { switchPersona('admin'); setAccountModal(false) }}>
                Admin (Sarah)
              </Button>
            </div>
          </div>}

          <div className="pt-3 border-t border-slate-100 flex justify-between">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                logout()
                setAccountModal(false)
                navigate('/login')
              }}
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
            >
              Sign Out
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAccountModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
