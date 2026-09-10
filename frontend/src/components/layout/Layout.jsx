import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import Footer from './Footer'
import { cn } from '../../utils/helpers'

function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Automatically close mobile sidebar when navigating to a new route
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setMobileOpen((open) => !open)
    } else {
      setCollapsed((value) => !value)
    }
  }

  return (
    <div className="flex h-screen h-[100dvh] overflow-hidden bg-slate-50 font-sans">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-50">
        <Navbar collapsed={collapsed} onToggleSidebar={toggleSidebar} />
        <main
          className={cn(
            'relative flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7 touch-scroll',
            'bg-slate-50/60',
            'transition-all duration-300',
          )}
        >
          {/* Subtle modern ambient background glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center overflow-hidden"
          >
            <div className="h-72 w-[80rem] max-w-full flex-none bg-gradient-to-r from-indigo-500/10 via-sky-500/10 to-purple-500/10 blur-3xl opacity-70" />
          </div>

          <div
            key={location.pathname}
            className="w-full max-w-[1600px] mx-auto animate-fade-in pb-8 sm:pb-12 min-w-0"
          >
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}

export default Layout
