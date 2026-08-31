import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import Footer from './Footer'
import { cn } from '../../utils/helpers'

function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setMobileOpen((open) => !open)
    } else {
      setCollapsed((value) => !value)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar collapsed={collapsed} onToggleSidebar={toggleSidebar} />
        <main
          className={cn(
            'flex-1 overflow-y-auto px-4 py-7 sm:px-6 lg:px-8',
            'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/25 via-slate-50/60 to-slate-100/60',
            'transition-all duration-300',
          )}
        >
          <div className="mx-auto max-w-7xl animate-fade-in pb-10">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}

export default Layout
