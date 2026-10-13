import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { WifiOff } from 'lucide-react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useData } from '../../context/DataContext'

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const { error, refresh } = useData()

  // Jump to the top of the page on navigation (the mobile drawer closes via Sidebar's onNavigate).
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="app">
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}
      <div className="main">
        <Topbar onMenu={() => setMenuOpen(true)} />
        {error && (
          <div className="connectivity-banner" role="alert">
            <WifiOff size={16} aria-hidden="true" />
            <span>{error}</span>
            <button className="btn btn--sm" onClick={() => refresh()}>
              Retry
            </button>
          </div>
        )}
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
