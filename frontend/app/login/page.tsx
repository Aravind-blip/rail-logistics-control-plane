'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Train, Zap } from 'lucide-react'
import { login, isAuthenticated } from '@/lib/auth'
import Button from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/dashboard')
    }
  }, [router])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      router.replace('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#374151 1px, transparent 1px), linear-gradient(90deg, #374151 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-3">
            <div className="bg-blue-600 p-2.5 rounded-xl">
              <Zap className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Rail Logistics</h1>
          <p className="text-sm text-gray-500 mt-1">Control Plane — Operator Access</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-gray-100 mb-1">Sign in to your account</h2>
          <p className="text-xs text-gray-500 mb-6">Enterprise authentication required</p>

          {error && (
            <div className="mb-5 bg-red-900/30 border border-red-700/50 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="user@railops.local"
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            <Button type="submit" loading={loading} className="w-full mt-2" size="md">
              {loading ? 'Authenticating…' : 'Sign in'}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-gray-800/60 border border-gray-700/50 rounded-lg">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Demo credentials</p>
            <div className="space-y-1.5 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <span className="bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase">Admin</span>
                <code className="text-gray-300">admin@railops.local / admin123</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase">Operator</span>
                <code className="text-gray-300">operator@railops.local / operator123</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-gray-500/20 text-gray-400 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase">Viewer</span>
                <code className="text-gray-300">viewer@railops.local / viewer123</code>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">
          Rail Logistics Platform &copy; 2025 — Restricted Access
        </p>
      </div>
    </div>
  )
}
