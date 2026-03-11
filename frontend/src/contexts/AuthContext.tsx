'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import type { AuthResponse } from '@/types'

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [bootstrapAuth] = useState(() => {
    if (typeof window === 'undefined') {
      return { user: null as User | null, token: null as string | null }
    }

    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (!storedToken || !storedUser) {
      return { user: null as User | null, token: null as string | null }
    }

    try {
      const parsedUser = JSON.parse(storedUser) as User
      return { user: parsedUser, token: storedToken }
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return { user: null as User | null, token: null as string | null }
    }
  })

  const [user, setUser] = useState<User | null>(bootstrapAuth.user)
  const [token, setToken] = useState<string | null>(bootstrapAuth.token)
  const [isLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (bootstrapAuth.token) {
      apiClient.setToken(bootstrapAuth.token)
    }
  }, [bootstrapAuth.token])

  const persistAuth = (auth: AuthResponse) => {
    setUser(auth.user)
    setToken(auth.token)
    localStorage.setItem('token', auth.token)
    localStorage.setItem('user', JSON.stringify(auth.user))
  }

  const login = async (email: string, password: string) => {
    try {
      const auth = await apiClient.login(email, password)
      persistAuth(auth)
      router.push('/dashboard')
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Login failed')
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const auth = await apiClient.register(name, email, password)
      persistAuth(auth)
      router.push('/dashboard')
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed')
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
