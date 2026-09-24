import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { getApiErrorMessage, isDemoMode } from '../../lib/api'
import { Button, Input, Textarea, Card } from '../../components/ui'
import { BookOpen, ArrowRight, Eye, EyeOff } from 'lucide-react'

export interface AuthCardProps {
  mode: 'login' | 'signup'
}

export function AuthCard({ mode }: AuthCardProps) {
  const isSignup = mode === 'signup'
  const { login, signup } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [university, setUniversity] = useState('')
  const [role, setRole] = useState<'student' | 'moderator'>('student')
  const [reason, setReason] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (isSignup) {
        if (!name.trim()) throw new Error('Please enter your full name')
        if (!email.trim() || !email.includes('@')) throw new Error('Please enter a valid academic email')
        if (password.length < 6) throw new Error('Password must be at least 6 characters')

        await signup({
          name,
          email,
          password,
          university,
          role,
          reason: role === 'moderator' ? reason : undefined,
        })
      } else {
        await login(email, password)
      }
      navigate('/home')
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Authentication failed. Please check your credentials.'))
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCreds = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('password123')
  }

  return (
    <Card className="max-w-md w-full mx-auto p-8 shadow-md">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto mb-3">
          <BookOpen className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {isSignup ? 'Create your NoteVault account' : 'Welcome back'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isSignup
            ? 'Join students and contributors sharing verified study materials.'
            : 'Sign in to notes, courses, and contributor tools.'}
        </p>
      </div>

      {isSignup && (
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg mb-5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`py-2 rounded-md transition-all ${
              role === 'student' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setRole('moderator')}
            className={`py-2 rounded-md transition-all ${
              role === 'moderator' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Moderator
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isSignup && (
          <Input
            label="Full Name"
            placeholder="e.g. Alex Morgan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        <Input
          label="Academic or Personal Email"
          type="email"
          placeholder="e.g. alex@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {isSignup && (
          <Input
            label="University or College (Optional)"
            placeholder="e.g. Stanford University"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
          />
        )}

        {isSignup && role === 'moderator' && (
          <Textarea
            label="Why would you like to contribute as a moderator?"
            placeholder="e.g. Teaching Assistant for CS 201; I maintain verified revision notes..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            helperText="New moderators start as unproven (require 5 approved uploads for auto-publish)."
          />
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="mt-2 w-full"
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          {isSignup ? 'Complete Registration' : 'Sign In'}
        </Button>
      </form>

      {!isSignup && isDemoMode && (
        <div className="mt-5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
          <p className="font-semibold text-slate-800 mb-1.5">
            Demo accounts (password: <code>password123</code>)
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => fillDemoCreds('admin@notevault.com')} className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800">
              Admin
            </button>
            <button type="button" onClick={() => fillDemoCreds('aisha@notevault.com')} className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800">
              Aisha (Trusted)
            </button>
            <button type="button" onClick={() => fillDemoCreds('diego@notevault.com')} className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-800">
              Diego (Unproven)
            </button>
            <button type="button" onClick={() => fillDemoCreds('student@notevault.com')} className="px-2 py-0.5 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-800">
              Student
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-xs text-slate-500">
        {isSignup ? (
          <p>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:underline">Sign in</Link>
          </p>
        ) : (
          <p>
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-indigo-600 hover:underline">Create an account</Link>
          </p>
        )}
      </div>
    </Card>
  )
}
