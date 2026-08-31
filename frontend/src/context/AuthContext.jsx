import { createContext, useContext, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { ADMIN_USER, TEACHER_USER } from '../utils/constants'
import { teachers } from '../services/mockData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useLocalStorage('sms_user', null)
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setLoading(false)
    
    const emailLower = email.toLowerCase()

    if (emailLower === ADMIN_USER.email && password === ADMIN_USER.password) {
      const session = { email: ADMIN_USER.email, name: ADMIN_USER.name, role: ADMIN_USER.role }
      setUser(session)
      return { ok: true, user: session }
    }

    if (emailLower === TEACHER_USER.email && password === TEACHER_USER.password) {
      const session = { email: TEACHER_USER.email, name: TEACHER_USER.name, role: TEACHER_USER.role }
      setUser(session)
      return { ok: true, user: session }
    }

    const matchedTeacher = teachers.find((t) => t.email.toLowerCase() === emailLower)
    if (matchedTeacher && password === 'teacher123') {
      const session = {
        email: matchedTeacher.email,
        name: matchedTeacher.name,
        role: 'Teacher',
        teacherId: matchedTeacher.id,
      }
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
