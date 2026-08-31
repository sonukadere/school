import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bell, Menu, PanelLeftClose, PanelLeftOpen, ChevronDown, LogOut, UserCircle, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { PAGE_TITLES } from '../../utils/constants'
import { cn } from '../../utils/helpers'

function Navbar({ collapsed, onToggleSidebar }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const notificationRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const resolveTitle = (pathname) => {
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
    const prefixes = Object.keys(PAGE_TITLES)
      .filter((key) => key.includes(':') || pathname.startsWith(`${key}/`))
      .sort((a, b) => b.length - a.length)
    for (const prefix of prefixes) {
      if (prefix.includes(':') || pathname.startsWith(`${prefix}/`)) return PAGE_TITLES[prefix]
    }
    return 'Dashboard'
  }

  const currentTitle = resolveTitle(location.pathname)

  const toggleProfile = () => {
    setProfileOpen((open) => !open)
    setNotificationsOpen(false)
  }

  const toggleNotifications = () => {
    setNotificationsOpen((open) => !open)
    setProfileOpen(false)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:inline-flex"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <p className="hidden text-sm font-semibold text-slate-800 sm:block">{currentTitle}</p>
          <p className="text-xs text-slate-500 sm:hidden">{currentTitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={toggleNotifications}
            className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>
          {notificationsOpen && (
            <div className="animate-scale-in absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">Notifications</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {[
                  { text: 'Mid-Term exam schedule published', time: '2 hours ago' },
                  { text: 'Fee payment of $4,800 received', time: '5 hours ago' },
                  { text: 'Attendance pending for Class 7 - B', time: 'Yesterday' },
                  { text: 'New notice: Science Exhibition', time: '2 days ago' },
                ].map((notice, index) => (
                  <div
                    key={notice.text}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50',
                      index !== 0 && 'border-t border-slate-50',
                    )}
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                    <div>
                      <p className="text-sm text-slate-700">{notice.text}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{notice.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={toggleProfile}
            className="flex items-center gap-2.5 rounded-lg p-1.5 transition hover:bg-slate-100"
            aria-label="Profile menu"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm leading-tight font-semibold text-slate-800">{user?.name}</p>
              <p className="text-xs leading-tight text-slate-500">{user?.role}</p>
            </div>
            <ChevronDown size={16} className="hidden text-slate-400 md:block" />
          </button>
          {profileOpen && (
            <div className="animate-scale-in absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <Link
                to="/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <UserCircle size={16} className="text-slate-400" /> My Profile
              </Link>
              <Link
                to="/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <Settings size={16} className="text-slate-400" /> Settings
              </Link>
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-rose-600 transition hover:bg-rose-50"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
