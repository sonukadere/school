import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  LogOut,
  UserCircle,
  Settings,
  GraduationCap,
  Plus,
  Users,
  FilePlus2,
  CalendarCheck,
  Wallet,
  Megaphone,
  ClipboardList,
  Zap,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { PAGE_TITLES } from '../../utils/constants'
import { cn } from '../../utils/helpers'

const QUICK_ACTIONS = [
  { label: 'Add Student', to: '/students/add', icon: GraduationCap, color: 'text-indigo-600 bg-indigo-50' },
  { label: 'Add Teacher', to: '/teachers/add', icon: Users, color: 'text-emerald-600 bg-emerald-50' },
  { label: 'Create Exam', to: '/exams/create', icon: FilePlus2, color: 'text-violet-600 bg-violet-50' },
  { label: 'Mark Attendance', to: '/attendance/students', icon: CalendarCheck, color: 'text-amber-600 bg-amber-50' },
  { label: 'Collect Fees', to: '/fees', icon: Wallet, color: 'text-rose-600 bg-rose-50' },
  { label: 'Post Notice', to: '/notices/create', icon: Megaphone, color: 'text-sky-600 bg-sky-50' },
]

const STUDENT_QUICK_ACTIONS = [
  { label: 'View Results', to: '/marks/results', icon: ClipboardList, color: 'text-emerald-600 bg-emerald-50' },
  { label: 'View Notices', to: '/notices', icon: Bell, color: 'text-sky-600 bg-sky-50' },
  { label: 'My Profile', to: '/profile', icon: UserCircle, color: 'text-indigo-600 bg-indigo-50' },
]

function Navbar({ collapsed, onToggleSidebar }) {
  const { user, login, logout } = useAuth()
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    sendTestNotification,
    requestPermissionAndRegister,
    permission,
  } = useNotifications()
  const location = useLocation()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)

  const handleSwitchRole = async (role) => {
    let credentials
    if (role === 'Super Admin' || role === 'Super Administrator') {
      credentials = { email: 'superadmin@school.com', password: 'superadmin123' }
    } else if (role === 'Admin' || role === 'Administrator') {
      credentials = { email: 'admin@school.com', password: 'admin123' }
    } else if (role === 'Teacher') {
      credentials = { email: 'teacher@school.com', password: 'teacher123' }
    } else if (role === 'Student') {
      credentials = { email: 'student@school.com', password: 'student123' }
    }

    if (credentials) {
      setProfileOpen(false)
      setSwitcherOpen(false)
      setQuickActionsOpen(false)
      await login(credentials.email, credentials.password)
      navigate('/dashboard')
    }
  }

  const notificationRef = useRef(null)
  const profileRef = useRef(null)
  const quickActionsRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
        setSwitcherOpen(false)
      }
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target)) {
        setQuickActionsOpen(false)
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

  const filteredQuickActions = user?.role === 'Student'
    ? STUDENT_QUICK_ACTIONS
    : QUICK_ACTIONS.filter((action) => {
        if (user?.role === 'Teacher') {
          const forbidden = ['/students/add', '/classes/add', '/teachers/add', '/fees']
          return !forbidden.includes(action.to)
        }
        return true
      })

  const toggleProfile = () => {
    setProfileOpen((open) => !open)
    setNotificationsOpen(false)
    setSwitcherOpen(false)
    setQuickActionsOpen(false)
  }

  const toggleNotifications = () => {
    setNotificationsOpen((open) => !open)
    setProfileOpen(false)
    setSwitcherOpen(false)
    setQuickActionsOpen(false)
  }

  const toggleQuickActions = () => {
    setQuickActionsOpen((open) => !open)
    setProfileOpen(false)
    setSwitcherOpen(false)
    setNotificationsOpen(false)
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 backdrop-blur-md sm:px-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
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

        {location.pathname !== '/dashboard' && location.pathname !== '/' && (
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-slate-50/90 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-indigo-600 hover:border-indigo-200 shadow-2xs shrink-0"
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}

        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-slate-800 truncate max-w-[125px] xs:max-w-[190px] sm:max-w-xs md:max-w-md">
            {currentTitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <div className="relative" ref={quickActionsRef}>
          <button
            type="button"
            onClick={toggleQuickActions}
            className={cn(
              "relative flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50/80 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100/80 hover:text-slate-900 shadow-2xs",
              quickActionsOpen && "bg-slate-100 ring-2 ring-indigo-500/20 border-indigo-300"
            )}
            title="Quick Actions"
            aria-label="Quick Actions"
          >
            <Zap size={14} className={cn(quickActionsOpen ? "fill-amber-500 text-amber-500" : "text-amber-500")} />
            <span className="hidden sm:inline">Quick Actions</span>
          </button>
          {quickActionsOpen && (
            <div className="animate-scale-in absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl z-50">
              <div className="border-b border-slate-100 px-4 py-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Actions</p>
              </div>
              <div className="py-1">
                {filteredQuickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <Link
                      key={action.label}
                      to={action.to}
                      onClick={() => setQuickActionsOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", action.color)}>
                        <Icon size={14} />
                      </span>
                      <span className="font-medium text-slate-700">{action.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={toggleNotifications}
            className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notificationsOpen && (
            <div className="animate-scale-in absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-84 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl z-50">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">Notifications</p>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={sendTestNotification}
                    className="rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-100 transition"
                    title="Send a live test push notification"
                  >
                    ⚡ Test Push
                  </button>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-800 transition"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {permission !== 'granted' && (
                <div className="border-b border-amber-100 bg-amber-50/80 px-4 py-2 text-xs text-amber-800 flex items-center justify-between">
                  <span>Enable push alerts on this device?</span>
                  <button
                    type="button"
                    onClick={requestPermissionAndRegister}
                    className="rounded bg-amber-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-amber-700"
                  >
                    Enable
                  </button>
                </div>
              )}

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <Bell size={24} className="mx-auto mb-2 text-slate-300" />
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 cursor-pointer transition hover:bg-slate-50',
                        !n.isRead ? 'bg-indigo-50/30' : 'opacity-75'
                      )}
                    >
                      <span
                        className={cn(
                          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                          !n.isRead ? 'bg-indigo-600 ring-4 ring-indigo-100' : 'bg-slate-300'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 line-clamp-1">{n.title}</p>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{n.body}</p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center justify-center gap-1.5"
                >
                  View all notifications <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={toggleProfile}
            className="flex items-center gap-2.5 rounded-lg p-1 transition hover:bg-slate-100"
            aria-label="Profile menu"
          >
            <div className="relative flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-2xs">
              {user?.name?.charAt(0) || 'A'}
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="hidden text-left md:block">
              <p className="text-xs leading-tight font-semibold text-slate-800">{user?.name}</p>
              <p className="text-[11px] leading-tight text-slate-400 capitalize">{user?.role?.toLowerCase()?.replace('_', ' ')}</p>
            </div>
            <ChevronDown size={14} className="hidden text-slate-400 md:block" />
          </button>
          {profileOpen && (
            <div className="animate-scale-in absolute right-0 mt-2 w-60 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl z-50">
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
              <button
                type="button"
                onClick={() => setSwitcherOpen(!switcherOpen)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 border-y border-slate-100"
              >
                <span className="flex items-center gap-3">
                  <GraduationCap size={16} className="text-slate-400" /> Portal Switcher (Demo)
                </span>
                <ChevronDown size={14} className={cn("text-slate-400 transition-transform duration-200", switcherOpen && "rotate-180")} />
              </button>
              
              {switcherOpen && (
                <div className="bg-slate-50 border-b border-slate-100 py-1">
                  <button
                    type="button"
                    onClick={() => handleSwitchRole('Super Admin')}
                    className={cn(
                      "flex w-full items-center gap-3 px-8 py-2 text-xs font-semibold transition hover:bg-purple-50",
                      user?.role === 'Super Admin' ? "text-purple-600 font-bold bg-purple-50/50" : "text-slate-600"
                    )}
                  >
                    🌟 Super Admin Portal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchRole('Admin')}
                    className={cn(
                      "flex w-full items-center gap-3 px-8 py-2 text-xs font-semibold transition hover:bg-indigo-50",
                      (user?.role === 'Admin' || user?.role === 'Administrator') ? "text-indigo-600 font-bold bg-indigo-50/50" : "text-slate-600"
                    )}
                  >
                    👑 Admin Portal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchRole('Teacher')}
                    className={cn(
                      "flex w-full items-center gap-3 px-8 py-2 text-xs font-semibold transition hover:bg-emerald-50",
                      user?.role === 'Teacher' ? "text-emerald-600 font-bold bg-emerald-50/50" : "text-slate-600"
                    )}
                  >
                    👩‍🏫 Teacher Portal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchRole('Student')}
                    className={cn(
                      "flex w-full items-center gap-3 px-8 py-2 text-xs font-semibold transition hover:bg-sky-50",
                      user?.role === 'Student' ? "text-sky-600 font-bold bg-sky-50/50" : "text-slate-600"
                    )}
                  >
                    🎓 Student Portal
                  </button>
                </div>
              )}

              {['Super Admin', 'Admin', 'Administrator'].includes(user?.role) && (
                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <Settings size={16} className="text-slate-400" /> Settings
                </Link>
              )}
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
