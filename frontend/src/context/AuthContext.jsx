import { createContext, useContext, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { ADMIN_USER } from '../utils/constants'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useLocalStorage('sms_user', null)
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setLoading(false)
    if (email.toLowerCase() === ADMIN_USER.email && password === ADMIN_USER.password) {
      const session = { email: ADMIN_USER.email, name: ADMIN_USER.name, role: ADMIN_USER.role }
      setUser(session)
      return { ok: true, user: session }
    }
    return { ok: false, error: 'Invalid email or password' }
  }

  const logout = () => {
    setUser(null)
  }

  const updateProfile = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
