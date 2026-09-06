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
        if (user?.role === 'Teacher') {
          const forbidden = ['/teachers', '/fees', '/settings']
          return !forbidden.some((path) => item.path.startsWith(path))
        }
        if (user?.role === 'Student' || user?.isStudent) {
          const forbidden = [
            '/students',
            '/teachers',
            '/classes',
            '/subjects',
            '/attendance',
            '/settings',
          ]
          return !forbidden.some((path) => item.path.startsWith(path))
        }
        if (user?.role === 'Parent' || user?.isParent) {
          const forbidden = [
            '/students',
            '/teachers',
            '/classes',
            '/subjects',
            '/attendance',
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
        return item
      })
    return { ...group, items }
  }).filter((group) => group.items.length > 0)

  const renderLink = (item) => {
    const Icon = item.icon
    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={onCloseMobile}
        className={({ isActive }) =>
          cn(
            'group relative flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-all duration-150',
            collapsed && !mobileOpen ? 'justify-center px-0' : 'px-3',
            isActive
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200',
          )
        }
        title={collapsed && !mobileOpen ? item.label : undefined}
      >
        <Icon
          size={18}
          className={cn(
            'shrink-0 transition-transform duration-150 group-hover:scale-105',
            collapsed && !mobileOpen && 'mx-auto',
          )}
        />
        {(!collapsed || mobileOpen) && <span className="truncate text-xs font-medium">{item.label}</span>}
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
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 transition-all duration-300 lg:static lg:z-auto lg:translate-x-0',
          collapsed && !mobileOpen ? 'lg:w-20' : 'lg:w-64',
          mobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-4">
          <div className={cn('flex items-center gap-3', collapsed && !mobileOpen && 'lg:justify-center')}>
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

        {(!collapsed || mobileOpen) && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Active Role</span>
              <span className="text-xs font-bold text-white truncate block">{user?.name}</span>
            </div>
            <span className={cn(
              'px-2 py-0.5 text-[10px] font-bold rounded-md shrink-0 uppercase tracking-wide',
              user?.isSuperAdmin ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40' :
              user?.isTeacher ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40' :
              user?.isStudent ? 'bg-blue-900/60 text-blue-300 border border-blue-500/40' :
              user?.isParent ? 'bg-amber-900/60 text-amber-300 border border-amber-500/40' :
              'bg-indigo-900/60 text-indigo-300 border border-indigo-500/40'
            )}>
              {user?.role || 'Admin'}
            </span>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {filteredMenuItems.map((group) => (
            <div key={group.heading} className="mb-4">
              {(!collapsed || mobileOpen) && (
                <p className="mb-2 px-3 text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
                  {group.heading}
                </p>
              )}
              <div className="flex flex-col gap-1">{group.items.map(renderLink)}</div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-slate-800 p-3">
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
