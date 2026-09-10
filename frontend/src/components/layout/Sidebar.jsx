import { NavLink } from 'react-router-dom'
import { LogOut, X } from 'lucide-react'
import { MENU_ITEMS } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { cn } from '../../utils/helpers'

function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth()
  const { settings } = useSettings()

  const filteredMenuItems = MENU_ITEMS.map((group) => {
    const items = group.items
      .filter((item) => {
        const roleUpper = (user?.role || '').toUpperCase()
        if (roleUpper === 'TEACHER') {
          const forbidden = ['/teachers', '/fees', '/payroll', '/settings']
          return !forbidden.some((path) => item.path.startsWith(path))
        }
        if (user?.role === 'Student' || user?.isStudent) {
          const forbidden = [
            '/students',
            '/teachers',
            '/classes',
            '/attendance',
            '/settings',
            '/questions',
            '/payroll',
          ]
          return !forbidden.some((path) => item.path.startsWith(path))
        }
        if (user?.role === 'Parent' || user?.isParent) {
          const forbidden = [
            '/students',
            '/teachers',
            '/classes',
            '/attendance',
            '/settings',
            '/questions',
            '/payroll',
          ]
          return !forbidden.some((path) => item.path.startsWith(path))
        }
        if (roleUpper === 'STAFF' || user?.isStaff) {
          const forbidden = [
            '/students',
            '/teachers',
            '/classes',
            '/subjects',
            '/attendance',
            '/exams',
            '/questions',
            '/marks',
            '/certificates',
            '/fees',
            '/payroll',
            '/settings',
          ]
          return !forbidden.some((path) => item.path.startsWith(path))
        }
        return true
      })
      .map((item) => {
        if ((user?.role === 'Student' || user?.isStudent) && item.path === '/marks') {
          return { ...item, label: 'My Results', path: '/marks/results' }
        }
        if ((user?.role === 'Parent' || user?.isParent) && item.path === '/marks') {
          return { ...item, label: 'Child Results', path: '/marks/results' }
        }
        if ((user?.role === 'Student' || user?.isStudent) && item.path === '/subjects') {
          return { ...item, label: 'My Subjects' }
        }
        if ((user?.role === 'Student' || user?.isStudent) && item.path === '/timetable') {
          return { ...item, label: 'My Timetable' }
        }
        if ((user?.role === 'Parent' || user?.isParent) && item.path === '/timetable') {
          return { ...item, label: 'Class Timetable' }
        }
        return item
      })
    return { ...group, items }
  }).filter((group) => group.items.length > 0)

  const roleUpper = (user?.role || '').toUpperCase()
  const activeStyle = user?.isSuperAdmin || roleUpper === 'SUPER_ADMIN' || roleUpper === 'SUPER ADMIN'
    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-md shadow-purple-900/50 ring-1 ring-purple-400/30'
    : user?.isTeacher || roleUpper === 'TEACHER'
    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-md shadow-emerald-900/50 ring-1 ring-emerald-400/30'
    : user?.isStudent || roleUpper === 'STUDENT'
    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-md shadow-blue-900/50 ring-1 ring-blue-400/30'
    : user?.isParent || roleUpper === 'PARENT'
    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold shadow-md shadow-amber-900/50 ring-1 ring-amber-400/30'
    : user?.isStaff || roleUpper === 'STAFF'
    ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white font-semibold shadow-md shadow-sky-900/50 ring-1 ring-sky-400/30'
    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-md shadow-indigo-900/50 ring-1 ring-indigo-400/30'

  const indicatorColor = user?.isSuperAdmin || roleUpper === 'SUPER_ADMIN' || roleUpper === 'SUPER ADMIN'
    ? 'bg-purple-300'
    : user?.isTeacher || roleUpper === 'TEACHER'
    ? 'bg-emerald-300'
    : user?.isStudent || roleUpper === 'STUDENT'
    ? 'bg-blue-300'
    : user?.isParent || roleUpper === 'PARENT'
    ? 'bg-amber-300'
    : user?.isStaff || roleUpper === 'STAFF'
    ? 'bg-sky-300'
    : 'bg-indigo-300'

  const renderLink = (item) => {
    const Icon = item.icon
    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={onCloseMobile}
        className={({ isActive }) =>
          cn(
            'group relative flex items-center gap-3 py-2.5 text-sm font-medium transition-all duration-150',
            collapsed && !mobileOpen ? 'justify-center px-0 w-11 h-11 mx-auto rounded-xl' : 'px-3.5 rounded-xl',
            isActive
              ? activeStyle
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100',
          )
        }
        title={collapsed && !mobileOpen ? item.label : undefined}
      >
        {({ isActive }) => (
          <>
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
          </>
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
              alt={settings.schoolName}
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
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

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

        <div className={cn('shrink-0 border-t border-slate-800 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2', collapsed && !mobileOpen ? 'p-2' : 'p-3')}>
          <button
            type="button"
            onClick={logout}
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
