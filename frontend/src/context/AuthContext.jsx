import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useSessionStorage } from '../hooks/useSessionStorage'
import { apiClient, tokenStorage } from '../services/apiClient'

const AuthContext = createContext(null)

export const DEFAULT_ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    'dashboard.view', 'profile.view', 'profile.update', 'users.manage', 'roles.manage',
    'settings.manage', 'reports.view', 'students.view', 'students.create', 'students.update',
    'students.delete', 'students.manage', 'promotion.manage', 'teachers.view', 'teachers.create',
    'teachers.update', 'teachers.delete', 'teachers.manage', 'classes.view', 'classes.create',
    'classes.update', 'classes.delete', 'classes.manage', 'subjects.view', 'subjects.create',
    'subjects.update', 'subjects.delete', 'subjects.manage', 'attendance.view', 'attendance.mark',
    'attendance.update', 'attendance.manage', 'teacherAttendance.view', 'teacherAttendance.manage',
    'fees.view', 'fees.create', 'fees.update', 'fees.delete', 'fees.manage', 'payments.view',
    'payments.create', 'payments.update', 'payments.delete', 'payments.manage', 'receipts.view',
    'receipts.generate', 'receipts.download', 'reports.fees.view', 'payroll.view', 'payroll.manage',
    'salary.view', 'salary.manage', 'exams.view', 'exams.create', 'exams.manage', 'marks.view',
    'marks.create', 'marks.update', 'marks.manage', 'results.view', 'marksheets.view',
    'marksheets.generate', 'questions.view', 'questions.create', 'questions.manage',
    'timetables.view', 'timetables.manage', 'homework.view', 'homework.create', 'homework.manage',
    'assignments.view', 'assignments.create', 'assignments.manage', 'documents.view',
    'documents.upload', 'tc.view', 'tc.generate', 'tc.approve', 'tc.manage', 'notices.view',
    'notices.manage', 'events.view', 'events.manage', 'holidays.view', 'holidays.manage',
    'notifications.view', 'leave.view', 'leave.create', 'leave.manage'
  ],
  ADMIN: [
    'dashboard.view', 'profile.view', 'profile.update', 'users.manage', 'roles.manage',
    'settings.manage', 'reports.view', 'students.view', 'students.create', 'students.update',
    'students.delete', 'students.manage', 'promotion.manage', 'teachers.view', 'teachers.create',
    'teachers.update', 'teachers.delete', 'teachers.manage', 'classes.view', 'classes.create',
    'classes.update', 'classes.delete', 'classes.manage', 'subjects.view', 'subjects.create',
    'subjects.update', 'subjects.delete', 'subjects.manage', 'attendance.view', 'attendance.mark',
    'attendance.update', 'attendance.manage', 'teacherAttendance.view', 'teacherAttendance.manage',
    'fees.view', 'fees.create', 'fees.update', 'fees.delete', 'fees.manage', 'payments.view',
    'payments.create', 'payments.update', 'payments.delete', 'payments.manage', 'receipts.view',
    'receipts.generate', 'receipts.download', 'reports.fees.view', 'payroll.view', 'payroll.manage',
    'salary.view', 'salary.manage', 'exams.view', 'exams.create', 'exams.manage', 'marks.view',
    'marks.create', 'marks.update', 'marks.manage', 'results.view', 'marksheets.view',
    'marksheets.generate', 'questions.view', 'questions.create', 'questions.manage',
    'timetables.view', 'timetables.manage', 'homework.view', 'homework.create', 'homework.manage',
    'assignments.view', 'assignments.create', 'assignments.manage', 'documents.view',
    'documents.upload', 'tc.view', 'tc.generate', 'tc.approve', 'tc.manage', 'notices.view',
    'notices.manage', 'events.view', 'events.manage', 'holidays.view', 'holidays.manage',
    'notifications.view', 'leave.view', 'leave.create', 'leave.manage'
  ],
  TEACHER: [
    'dashboard.view', 'profile.view', 'profile.update', 'students.view', 'classes.view',
    'subjects.view', 'attendance.view', 'attendance.mark', 'attendance.update', 'attendance.manage',
    'timetables.view', 'homework.view', 'homework.create', 'homework.update', 'homework.delete',
    'homework.manage', 'assignments.view', 'assignments.create', 'assignments.update',
    'assignments.grade', 'assignments.manage', 'documents.view', 'documents.upload',
    'leave.view', 'leave.create', 'events.view', 'holidays.view', 'exams.view', 'questions.view',
    'questions.create', 'marks.view', 'marks.create', 'marks.update', 'marks.manage',
    'results.view', 'marksheets.view', 'marksheets.generate', 'notices.view', 'notifications.view'
  ],
  STUDENT: [
    'dashboard.view', 'profile.view', 'profile.update', 'own.view', 'subjects.view',
    'timetables.view', 'attendance.view', 'fees.view', 'payments.view', 'payments.download',
    'receipts.view', 'receipts.download', 'homework.view', 'assignments.view', 'documents.view',
    'exams.view', 'exams.digital.attempt', 'results.view', 'marks.view', 'notices.view',
    'events.view', 'notifications.view'
  ],
  PARENT: [
    'dashboard.view', 'profile.view', 'profile.update', 'own.view', 'fees.view',
    'payments.view', 'payments.download', 'receipts.view', 'receipts.download',
    'homework.view', 'assignments.view', 'exams.view', 'results.view', 'notices.view',
    'events.view', 'notifications.view'
  ],
  ACCOUNTANT: [
    'dashboard.view', 'profile.view', 'profile.update', 'students.view', 'classes.view',
    'fees.view', 'fees.manage', 'fees.create', 'fees.update', 'fees.delete', 'payments.view',
    'payments.create', 'payments.update', 'payments.delete', 'payments.download', 'payments.export',
    'receipts.view', 'receipts.generate', 'receipts.download', 'reports.fees.view',
    'reports.fees.export', 'reports.view', 'notices.view', 'events.view', 'holidays.view',
    'notifications.view'
  ],
  RECEPTIONIST: [
    'dashboard.view', 'profile.view', 'profile.update', 'crm.view', 'crm.manage',
    'crm.create', 'crm.update', 'crm.delete', 'crm.convert', 'students.view',
    'students.manage', 'parents.view', 'parents.manage', 'classes.view', 'notices.view',
    'events.view', 'holidays.view', 'notifications.view'
  ],
  STAFF: [
    'dashboard.view', 'profile.view', 'profile.update', 'notices.view', 'events.view',
    'notifications.view'
  ],
}

/**
 * Normalize backend user payload into standard frontend session format
 */
export function normalizeUser(rawUser) {
  if (!rawUser) return null

  // Normalize role to Title Case for UI consistency (SUPER_ADMIN -> Super Admin, ADMIN -> Admin)
  let role = rawUser.role || 'Admin'
  if (role.toUpperCase() === 'SUPER_ADMIN' || role === 'Super Admin') role = 'Super Admin'
  else if (role.toUpperCase() === 'ADMIN' || role === 'Administrator') role = 'Admin'
  else if (role.toUpperCase() === 'ACCOUNTANT') role = 'Accountant'
  else if (role.toUpperCase() === 'RECEPTIONIST') role = 'Receptionist'
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
    isSchoolAdmin: role === 'Admin' || rawUser.role === 'ADMIN',
    isAccountant: role === 'Accountant' || rawUser.role === 'ACCOUNTANT',
    isReceptionist: role === 'Receptionist' || rawUser.role === 'RECEPTIONIST',
    isTeacher: role === 'Teacher' || rawUser.role === 'TEACHER',
    isStudent: role === 'Student' || rawUser.role === 'STUDENT',
    isParent: role === 'Parent' || rawUser.role === 'PARENT',
    isStaff: role === 'Staff' || rawUser.role === 'STAFF',
    avatar: rawUser.avatar || null,
    teacherId: rawUser.teacher?.id || rawUser.teacherId || null,
    teacherNumber: rawUser.teacher?.teacherId || null,
    studentId: rawUser.student?.id || rawUser.studentId || null,
    studentNumber: rawUser.student?.studentId || null,
    parentId: rawUser.parent?.id || rawUser.parentId || null,
    parentNumber: rawUser.parent?.parentId || null,
    parent: rawUser.parent || null,
    children: rawUser.parent?.children || [],
    staffId: rawUser.staff?.id || rawUser.staffId || null,
    classId: rawUser.student?.classId || null,
    mustChangePassword: Boolean(rawUser.mustChangePassword),
    permissions: Array.isArray(rawUser.permissions) && rawUser.permissions.length > 0
      ? rawUser.permissions
      : (DEFAULT_ROLE_PERMISSIONS[(rawUser.role || '').toUpperCase().replace(/\s+/g, '_')] || []),
  }
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useSessionStorage('sms_user', null)
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
   * Real backend JWT login with optional role-based enforcement
   */
  const login = useCallback(async (identifier, password, expectedRole = null) => {
    setLoading(true)
    try {
      const response = await apiClient.post('/auth/login', {
        email: (identifier || '').trim(),
        password,
      })

      if (response && response.token) {
        const normalized = normalizeUser(response.user)

        // Role-Based Access Control check against selected login role
        if (expectedRole) {
          const userRole = normalized.role
          const roleMap = {
            SUPER_ADMIN: ['Super Admin'],
            ADMIN: ['Admin', 'Super Admin'],
            ACCOUNTANT: ['Accountant'],
            RECEPTIONIST: ['Receptionist'],
            TEACHER: ['Teacher'],
            STUDENT: ['Student'],
            PARENT: ['Parent'],
            STAFF: ['Staff', 'Accountant', 'Receptionist'],
          }
          const allowed = roleMap[expectedRole] || []
          if (!allowed.includes(userRole)) {
            setLoading(false)
            return {
              ok: false,
              error: `Access Denied: Your account is assigned role "${userRole}". Please select "${userRole}" in the role dropdown to sign in.`,
            }
          }
        }

        tokenStorage.set(response.token)
        setUserState(normalized)
        setLoading(false)
        return { ok: true, user: normalized }
      }

      throw new Error('Invalid response structure from authentication server.')
    } catch (error) {
      setLoading(false)
      const errorMsg = error.message || 'Invalid credentials'
      return { ok: false, error: errorMsg }
    }
  }, [setUserState])

  /**
   * Logout and invalidate session
   */
  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Ignore logout network errors
    } finally {
      tokenStorage.clear()
      setUserState(null)
    }
  }, [setUserState])

  /**
   * Change password for authenticated user (required on first login if mustChangePassword is true)
   */
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    setLoading(true)
    try {
      const response = await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      })

      if (response && response.token) {
        tokenStorage.set(response.token)
        const normalized = normalizeUser(response.user)
        setUserState(normalized)
        setLoading(false)
        return { ok: true, user: normalized }
      }

      throw new Error('Invalid response from server')
    } catch (error) {
      setLoading(false)
      const errorMsg = error.message || 'Failed to change password'
      return { ok: false, error: errorMsg }
    }
  }, [setUserState])

  /**
   * Update profile via backend
   */
  const updateProfile = useCallback(async (updates) => {
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
  }, [setUser, setUserState])

  const hasPermission = useCallback((permission) => {
    if (!permission) return true
    if (!user) return false
    const perms = user.permissions || []
    return perms.includes(permission)
  }, [user])

  const hasAnyPermission = useCallback((permissions = []) => {
    if (!permissions || permissions.length === 0) return true
    if (!user) return false
    const perms = user.permissions || []
    return permissions.some((p) => perms.includes(p))
  }, [user])

  const hasAllPermissions = useCallback((permissions = []) => {
    if (!permissions || permissions.length === 0) return true
    if (!user) return false
    const perms = user.permissions || []
    return permissions.every((p) => perms.includes(p))
  }, [user])

  const contextValue = useMemo(
    () => ({
      user,
      setUser,
      loading,
      initializing,
      login,
      logout,
      changePassword,
      updateProfile,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      isAuthenticated: Boolean(user && tokenStorage.get()),
    }),
    [user, setUser, loading, initializing, login, logout, changePassword, updateProfile, hasPermission, hasAnyPermission, hasAllPermissions]
  )

  return (
    <AuthContext.Provider value={contextValue}>
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
