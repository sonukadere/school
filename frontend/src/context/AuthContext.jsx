import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { apiClient, tokenStorage } from '../services/apiClient'

const AuthContext = createContext(null)

/**
 * Normalize backend user payload into standard frontend session format
 */
export function normalizeUser(rawUser) {
  if (!rawUser) return null

  // Normalize role to Title Case for UI consistency (SUPER_ADMIN -> Super Admin, ADMIN -> Admin)
  let role = rawUser.role || 'Admin'
  if (role.toUpperCase() === 'SUPER_ADMIN' || role === 'Super Admin') role = 'Super Admin'
  else if (role.toUpperCase() === 'ADMIN' || role === 'Administrator') role = 'Admin'
  else if (role.toUpperCase() === 'TEACHER') role = 'Teacher'
  else if (role.toUpperCase() === 'STUDENT') role = 'Student'
  else if (role.toUpperCase() === 'PARENT') role = 'Parent'
  else if (role.toUpperCase() === 'STAFF') role = 'Staff'

  return {
    id: rawUser.id,
    name: rawUser.name || (rawUser.firstName ? `${rawUser.firstName} ${rawUser.lastName || ''}`.trim() : 'User'),
    email: rawUser.email,
    username: rawUser.username,
    role,
    rawRole: rawUser.role,
    isSuperAdmin: role === 'Super Admin' || rawUser.role === 'SUPER_ADMIN',
    isAdmin: ['Admin', 'Super Admin', 'Administrator'].includes(role) || ['ADMIN', 'SUPER_ADMIN'].includes(rawUser.role),
    avatar: rawUser.avatar || null,
    teacherId: rawUser.teacher?.id || rawUser.teacherId || null,
    studentId: rawUser.student?.id || rawUser.studentId || null,
    parentId: rawUser.parent?.id || rawUser.parentId || null,
    staffId: rawUser.staff?.id || rawUser.staffId || null,
    classId: rawUser.student?.classId || null,
  }
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useLocalStorage('sms_user', null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  const setUser = useCallback((userData) => {
    const normalized = normalizeUser(userData)
    setUserState(normalized)
  }, [setUserState])

  // Validate session on mount with backend profile endpoint
  useEffect(() => {
    let isMounted = true
    const verifySession = async () => {
      const token = tokenStorage.get()
      if (token) {
        try {
          const profile = await apiClient.get('/auth/profile')
          if (isMounted && profile) {
            setUser(profile)
          }
        } catch (error) {
          console.warn('[AuthContext] Session expired or invalid:', error.message)
          if (isMounted) {
            tokenStorage.clear()
            setUserState(null)
          }
        }
      } else {
        if (isMounted && user) {
          // No token found, clear state
          setUserState(null)
        }
      }
      if (isMounted) setInitializing(false)
    }

    verifySession()
    return () => {
      isMounted = false
    }
  }, [])

  /**
   * Real backend JWT login
   */
  const login = async (email, password) => {
    setLoading(true)
    try {
      const response = await apiClient.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      })

      if (response && response.token) {
        tokenStorage.set(response.token)
        const normalized = normalizeUser(response.user)
        setUserState(normalized)
        setLoading(false)
        return { ok: true, user: normalized }
      }

      throw new Error('Invalid response structure from authentication server.')
    } catch (error) {
      setLoading(false)
      const errorMsg = error.message || 'Invalid email or password'
      return { ok: false, error: errorMsg }
    }
  }

  /**
   * Logout and invalidate session
   */
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Ignore logout network errors
    } finally {
      tokenStorage.clear()
      setUserState(null)
    }
  }

  /**
   * Update profile via backend
   */
  const updateProfile = async (updates) => {
    try {
      const updated = await apiClient.put('/me/profile', updates)
      if (updated) {
        setUser(updated)
        return { ok: true, user: normalizeUser(updated) }
      }
    } catch (error) {
      // Fallback local update if offline
      setUserState((prev) => ({ ...prev, ...updates }))
      return { ok: false, error: error.message }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        initializing,
        login,
        logout,
        updateProfile,
        isAuthenticated: Boolean(user && tokenStorage.get()),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export default AuthContext
