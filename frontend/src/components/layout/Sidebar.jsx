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
    const items = group.items.filter((item) => {
      if (user?.role === 'Teacher') {
        const forbidden = ['/teachers', '/fees', '/settings']
        return !forbidden.some((path) => item.path.startsWith(path))
      }
      return true
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
            'group relative flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-all duration-200',
            collapsed && !mobileOpen ? 'justify-center px-0' : 'px-3',
            isActive
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/40'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white',
          )
        }
        title={collapsed && !mobileOpen ? item.label : undefined}
      >
        <Icon
          size={20}
          className={cn(
            'shrink-0 transition-transform duration-200 group-hover:scale-110',
            collapsed && !mobileOpen && 'mx-auto',
          )}
        />
        {(!collapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
        {(!collapsed || mobileOpen) && (
          <span className="ml-auto text-[10px] font-semibold text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
            &rarr;
          </span>
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
