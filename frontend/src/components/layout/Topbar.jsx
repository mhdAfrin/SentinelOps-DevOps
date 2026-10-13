import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, Menu, Moon, Search, Settings, Sun } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useTheme } from '../../context/ThemeContext'
import { initials } from '../../utils/format'

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth()
  const { servers, apps, incidents, openAlerts } = useData()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const searchRef = useRef(null)
  const inputRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    const onDown = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    const onKey = (e) => {
      const typing = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)
      if (e.key === '/' && !typing) {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const results = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (term.length < 2) return []
    const q = encodeURIComponent
    const s = servers
      .filter((x) => `${x.name} ${x.ip}`.toLowerCase().includes(term))
      .slice(0, 3)
      .map((x) => ({ key: x.id, label: x.name, meta: 'Server', to: `/infrastructure?q=${q(x.name)}` }))
    const a = apps
      .filter((x) => x.name.toLowerCase().includes(term))
      .slice(0, 3)
      .map((x) => ({ key: x.id, label: x.name, meta: 'Application', to: `/applications?q=${q(x.name)}` }))
    const i = incidents
      .filter((x) => `${x.id} ${x.title}`.toLowerCase().includes(term))
      .slice(0, 3)
      .map((x) => ({ key: x.id, label: x.title, meta: x.id, to: `/incidents?q=${q(x.id)}` }))
    return [...s, ...a, ...i]
  }, [query, servers, apps, incidents])

  function go(to) {
    navigate(to)
    setQuery('')
    setSearchOpen(false)
  }

  return (
    <header className="topbar">
      <button className="icon-btn topbar__menu" onClick={onMenu} aria-label="Open navigation">
        <Menu size={20} />
      </button>

      <div className="topbar__search" ref={searchRef}>
        <Search size={17} aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSearchOpen(true)
          }}
          onFocus={() => setSearchOpen(true)}
          onKeyDown={(e) => e.key === 'Enter' && results[0] && go(results[0].to)}
          placeholder="Search servers, applications, incidents..."
          aria-label="Search servers, applications, incidents"
        />
        <kbd aria-hidden="true">/</kbd>
        {searchOpen && query.trim().length >= 2 && (
          <ul className="search-results">
            {results.length === 0 && <li className="search-results__empty">No matches for “{query}”</li>}
            {results.map((r) => (
              <li key={r.meta + r.key}>
                <button type="button" onClick={() => go(r.to)}>
                  <span>{r.label}</span>
                  <small>{r.meta}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="topbar__right">
        <button
          className="icon-btn"
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        <Link to="/alerts" className="icon-btn" aria-label={`Alerts, ${openAlerts.length} open`}>
          <Bell size={19} />
          {openAlerts.length > 0 && <span className="icon-btn__badge">{openAlerts.length}</span>}
        </Link>

        <div className="usermenu" ref={menuRef}>
          <button className="usermenu__btn" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen}>
            <span className="avatar">{initials(user.name)}</span>
            <span className="usermenu__text">
              <strong>{user.name}</strong>
              <small>{user.role}</small>
            </span>
            <ChevronDown size={16} aria-hidden="true" />
          </button>
          {menuOpen && (
            <div className="usermenu__panel">
              <Link to="/settings" onClick={() => setMenuOpen(false)}>
                <Settings size={16} /> Settings
              </Link>
              <button onClick={logout}>
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
