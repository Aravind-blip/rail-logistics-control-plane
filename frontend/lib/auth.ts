import { User } from '@/types'

const TOKEN_KEY = 'rl_token'
const USER_KEY = 'rl_user'
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api'

export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Login failed' }))
    throw new Error(err.detail || 'Login failed')
  }

  const data = await res.json()
  const token: string = data.access_token || data.token
  const user: User = data.user

  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }

  return { token, user }
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    window.location.href = '/login'
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return !!getToken() && !!getCurrentUser()
}

export function isAdmin(): boolean {
  const user = getCurrentUser()
  return user?.role === 'admin'
}

export function isOperator(): boolean {
  const user = getCurrentUser()
  return user?.role === 'admin' || user?.role === 'operator'
}

export function canMutate(): boolean {
  return isOperator()
}
