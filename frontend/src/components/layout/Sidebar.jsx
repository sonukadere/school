import { useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LogOut, X } from 'lucide-react'
import { MENU_ITEMS } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { cn } from '../../utils/helpers'

function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  const { user, logout, hasPermission, hasAnyPermission, initializing } = useAuth()
  const { settings } = useSettings()

  const filteredMenuItems = useMemo(() => {
    if (!user) return []

    return MENU_ITEMS.map((group) => {
      const items = group.items
        .map((item) => {
          // If item has children/subitems, filter children by permission
          let authorizedChildren = null
          if (item.children && item.children.length > 0) {
            authorizedChildren = item.children.filter((child) => {
              if (child.permission) return hasPermission(child.permission)
              if (child.anyPermissions) return hasAnyPermission(child.anyPermissions)
              return true
            })
            // If item has children defined and user has 0 child permissions, hide parent
            if (authorizedChildren.length === 0) {
              return null
            }
          }

          // Check required permission
          if (item.permission && !hasPermission(item.permission)) {
            return null
          }

          // Check anyPermissions if defined
          if (item.anyPermissions && item.anyPermissions.length > 0 && !hasAnyPermission(item.anyPermissions)) {
            return null
          }

          // Check role exclusions
          if (item.excludeRoles && item.excludeRoles.length > 0) {
            const roleUpper = (user?.role || '').toUpperCase().replace(/\s+/g, '_')
            if (item.excludeRoles.includes(roleUpper) || (user?.isStudent && item.excludeRoles.includes('STUDENT'))) {
              return null
            }
          }

          // Check allowed roles if specified
          if (item.roles && item.roles.length > 0) {
            const roleUpper = (user?.role || '').toUpperCase().replace(/\s+/g, '_')
            if (!item.roles.includes(roleUpper)) return null
          }

          // Dynamic friendly label for Student / Parent
          let label = item.label
          let path = item.path
          if (user?.role === 'Student' || user?.isStudent) {
            if (item.path === '/fees') label = 'My Fees'
            if (item.path === '/marks') { label = 'My Results'; path = '/marks/results' }
            if (item.path === '/subjects') label = 'My Subjects'
            if (item.path === '/timetable') label = 'My Timetable'
            if (item.path === '/attendance') label = 'My Attendance'
            if (item.path === '/exams') label = 'My Exams'
          } else if (user?.role === 'Parent' || user?.isParent) {
            if (item.path === '/fees') label = 'Fee Payments'
            if (item.path === '/marks') { label = 'Child Results'; path = '/marks/results' }
            if (item.path === '/timetable') label = 'Class Timetable'
          }

          return { ...item, label, path, children: authorizedChildren }
        })
        .filter(Boolean)

      return { ...group, items }
    }).filter((group) => group.items.length > 0)
  }, [user, hasPermission, hasAnyPermission])

  const { activeStyle, indicatorColor } = useMemo(() => {
    const roleUpper = (user?.role || '').toUpperCase()
    let style = 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-md shadow-indigo-900/50 ring-1 ring-indigo-400/30'
    let color = 'bg-indigo-300'

    if (user?.isSuperAdmin || roleUpper === 'SUPER_ADMIN' || roleUpper === 'SUPER ADMIN') {
      style = 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-md shadow-purple-900/50 ring-1 ring-purple-400/30'
      color = 'bg-purple-300'
    } else if (user?.isAccountant || roleUpper === 'ACCOUNTANT') {
      style = 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-semibold shadow-md shadow-emerald-900/50 ring-1 ring-emerald-400/30'
      color = 'bg-emerald-300'
    } else if (user?.isReceptionist || roleUpper === 'RECEPTIONIST') {
      style = 'bg-gradient-to-r from-pink-600 to-rose-700 text-white font-semibold shadow-md shadow-pink-900/50 ring-1 ring-pink-400/30'
      color = 'bg-pink-300'
    } else if (user?.isTeacher || roleUpper === 'TEACHER') {
      style = 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-md shadow-emerald-900/50 ring-1 ring-emerald-400/30'
      color = 'bg-emerald-300'
    } else if (user?.isStudent || roleUpper === 'STUDENT') {
      style = 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-md shadow-blue-900/50 ring-1 ring-blue-400/30'
      color = 'bg-blue-300'
    } else if (user?.isParent || roleUpper === 'PARENT') {
      style = 'bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold shadow-md shadow-amber-900/50 ring-1 ring-amber-400/30'
      color = 'bg-amber-300'
    } else if (user?.isStaff || roleUpper === 'STAFF') {
      style = 'bg-gradient-to-r from-sky-600 to-blue-600 text-white font-semibold shadow-md shadow-sky-900/50 ring-1 ring-sky-400/30'
      color = 'bg-sky-300'
    }

    return { activeStyle: style, indicatorColor: color }
  }, [user?.role, user?.isSuperAdmin, user?.isAccountant, user?.isReceptionist, user?.isTeacher, user?.isStudent, user?.isParent, user?.isStaff])

  const location = useLocation()
  const currentPath = location.pathname

  const allPaths = useMemo(() => {
    return filteredMenuItems.flatMap((group) => group.items.map((item) => item.path))
  }, [filteredMenuItems])

  const activePath = useMemo(() => {
    const matchingPaths = allPaths.filter(
      (path) => currentPath === path || currentPath.startsWith(`${path}/`)
    )
    if (matchingPaths.length === 0) return null
    return [...matchingPaths].sort((a, b) => b.length - a.length)[0]
  }, [allPaths, currentPath])

  const renderLink = (item) => {
    const Icon = item.icon
    const isActive = activePath === item.path
    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={onCloseMobile}
        aria-label={item.label}
        className={cn(
          'group relative flex items-center gap-3 py-2.5 text-sm font-medium transition-all duration-150',
          collapsed && !mobileOpen ? 'justify-center px-0 w-11 h-11 mx-auto rounded-xl' : 'px-3.5 rounded-xl',
          isActive
            ? activeStyle
            : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100',
        )}
        title={collapsed && !mobileOpen ? item.label : undefined}
      >
        {isActive && (!collapsed || mobileOpen) && (
          <span
            className={cn(
              'absolute left-0 top-2 bottom-2 w-1 rounded-r-full shadow-xs',
              indicatorColor,
            )}
          />
        )}
        <Icon
          size={18}
          className={cn(
            'shrink-0 transition-transform duration-150 group-hover:scale-105',
            collapsed && !mobileOpen && 'mx-auto',
            isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200',
          )}
        />
        {(!collapsed || mobileOpen) && (
          <span className="truncate text-xs font-medium tracking-tight">{item.label}</span>
        )}
      </NavLink>
    )
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 transition-all duration-300 shadow-2xl shrink-0 h-full max-h-[100dvh]',
          'lg:static lg:z-auto lg:shadow-none lg:translate-x-0',
          mobileOpen
            ? 'w-72 max-w-[85vw] translate-x-0'
            : '-translate-x-full w-72 max-w-[85vw]',
          collapsed && !mobileOpen ? 'lg:w-20' : 'lg:w-64',
        )}
      >
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-slate-800 transition-all duration-300',
            collapsed && !mobileOpen ? 'justify-center px-2' : 'justify-between px-4',
          )}
        >
          <div className={cn('flex items-center gap-3 min-w-0', collapsed && !mobileOpen && 'justify-center')}>
            <img
              src="/logo.svg"
              alt={settings.schoolName || 'Daily Day Academy Logo'}
              width="36"
              height="36"
              className="h-9 w-9 shrink-0 rounded-lg"
            />
            {(!collapsed || mobileOpen) && (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{settings.schoolName}</p>
                <p className="truncate text-[11px] text-slate-400">School Management</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {initializing || !user ? (
          <div className="flex-1 space-y-3 p-4 animate-pulse">
            <div className="h-2.5 w-16 bg-slate-800 rounded mb-2" />
            <div className="h-9 w-full bg-slate-800/50 rounded-xl" />
            <div className="h-2.5 w-24 bg-slate-800 rounded mt-4 mb-2" />
            <div className="h-9 w-full bg-slate-800/50 rounded-xl" />
            <div className="h-9 w-full bg-slate-800/50 rounded-xl" />
            <div className="h-9 w-full bg-slate-800/50 rounded-xl" />
          </div>
        ) : (
          <nav className={cn('flex-1 overflow-y-auto py-4 touch-scroll', collapsed && !mobileOpen ? 'px-2' : 'px-3')}>
            {filteredMenuItems.map((group) => (
              <div key={group.heading} className={cn(collapsed && !mobileOpen ? 'mb-2' : 'mb-4')}>
                {(!collapsed || mobileOpen) && (
                  <p className="mb-2 px-3 text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
                    {group.heading}
                  </p>
                )}
                <div className="flex flex-col gap-1">{group.items.map(renderLink)}</div>
              </div>
            ))}
          </nav>
        )}

        <div className={cn('shrink-0 border-t border-slate-800 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2', collapsed && !mobileOpen ? 'p-2' : 'p-3')}>
          <button
            type="button"
            onClick={logout}
            aria-label="Logout"
            className={cn(
              'flex w-full items-center gap-3 rounded-lg py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-rose-600/10 hover:text-rose-400',
              collapsed && !mobileOpen ? 'justify-center px-0' : 'px-3',
            )}
            title={collapsed && !mobileOpen ? 'Logout' : undefined}
          >
            <LogOut size={20} className="shrink-0" />
            {(!collapsed || mobileOpen) && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
