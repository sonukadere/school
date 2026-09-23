import { useAuth } from '../../context/AuthContext'

/**
 * Declarative authorization component.
 * Conditionally renders children if the authenticated user possesses the required permission(s).
 *
 * Usage:
 * <Can permission="students.create">
 *   <Button leftIcon={Plus}>Add Student</Button>
 * </Can>
 *
 * <Can anyPermissions={['fees.create', 'fees.manage']}>
 *   <Button>Assign Fee</Button>
 * </Can>
 */
export default function Can({ permission, anyPermissions, allPermissions, fallback = null, children }) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth()

  if (permission && !hasPermission(permission)) {
    return fallback
  }

  if (anyPermissions && anyPermissions.length > 0 && !hasAnyPermission(anyPermissions)) {
    return fallback
  }

  if (allPermissions && allPermissions.length > 0 && !hasAllPermissions(allPermissions)) {
    return fallback
  }

  return <>{children}</>
}
