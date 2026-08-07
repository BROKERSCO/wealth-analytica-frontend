'use client'
// src/lib/auth-context.tsx

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import Cookies from 'js-cookie'
import { authApi } from './api'
import { User } from '@/types'

interface AuthContextType {
  user:    User | null
  loading: boolean
  login:   (email: string, senha: string) => Promise<void>
  logout:  () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('access_token')
    if (token) {
      authApi.me()
        .then(r => setUser(r.data.user))
        .catch(() => {
          Cookies.remove('access_token')
          Cookies.remove('refresh_token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, senha: string) => {
    const { data } = await authApi.login(email, senha)
    Cookies.set('access_token',  data.accessToken,  { expires: 1 })
    Cookies.set('refresh_token', data.refreshToken, { expires: 7 })
    setUser(data.user)
  }

  const logout = async () => {
    await authApi.logout().catch(() => {})
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
