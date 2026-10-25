import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { GoogleLogoIcon, ListIcon, MoonIcon, SignOutIcon, SpeakerHighIcon, SpeakerSlashIcon, SunIcon, XIcon } from '@phosphor-icons/react'
import { ScalesMark } from './Brand'
import { isMuted, onMuteChange, setMuted, sfx } from '../lib/sfx'

function navItems(user, savedCount) {
  const items = [
    { key: 'new', label: 'Just in', href: '#/new' },
    { key: 'bills', label: 'Bills', href: '#/bills' },
    { key: 'how', label: 'How it works', href: '#/how' },
    { key: 'about', label: 'About', href: '#/about' },
  ]
  if (user) items.push({ key: 'watchlist', label: 'Watchlist', href: '#/watchlist', count: savedCount })
  return items
}

export default function Header({ active, scrolled, user, savedCount, theme, onToggleTheme, onSignIn, onSignOut }) {
  const reduce = useReducedMotion()
  const [menuOpen, setMenuOpen] = useState(false)
  const [muted, setMutedState] = useState(isMuted)
  useEffect(() => onMuteChange(setMutedState), [])
  const items = navItems(user, savedCount)

  // Close the mobile menu after navigating
  useEffect(() => {
    const close = () => setMenuOpen(false)
    window.addEventListener('hashchange', close)
    return () => window.removeEventListener('hashchange', close)
  }, [])

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="header-capsule">
        <div className="progress" aria-hidden="true" />
        <a href="#/" className="brand" aria-label="Billshelf home">
          <span className="brand-mark"><ScalesMark /></span>
          <span className="brand-text">
            <span className="brand-name">Billshelf</span>
            <span className="brand-tag">Congress, decoded</span>
          </span>
        </a>

        <nav className="header-nav" aria-label="Main">
          {items.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className={`nav-link${active === item.key ? ' is-active' : ''}`}
              aria-current={active === item.key ? 'page' : undefined}
            >
              {active === item.key && (
                <motion.span
                  layoutId="nav-pill"
                  className="nav-pill"
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="nav-label">{item.label}</span>
              {item.count !== undefined && <span className="nav-count">{item.count}</span>}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="icon-btn"
            data-sfx="custom"
            onClick={() => { const next = !muted; setMuted(next); if (!next) sfx.chime() }}
            aria-pressed={!muted}
            aria-label={muted ? 'Turn sound effects on' : 'Turn sound effects off'}
            title={muted ? 'Sound off' : 'Sound on'}
          >
            {muted ? <SpeakerSlashIcon /> : <SpeakerHighIcon />}
          </button>
          <button
            type="button"
            className="icon-btn"
            data-sfx="custom"
            onClick={() => { sfx.toggle(); onToggleTheme() }}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          {user ? (
            <div className="account">
              {user.photoURL ? (
                <img className="avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
              ) : (
                <span className="avatar avatar-fallback" aria-hidden="true">{(user.displayName || '?')[0]}</span>
              )}
              <button type="button" className="icon-btn" onClick={onSignOut} aria-label="Sign out" title="Sign out">
                <SignOutIcon />
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-primary btn-sm signin-btn" onClick={onSignIn}>
              <GoogleLogoIcon weight="bold" />
              <span>Sign in</span>
            </button>
          )}
          <button
            type="button"
            className="icon-btn menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <XIcon /> : <ListIcon />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            id="mobile-menu"
            className="mobile-menu"
            aria-label="Main"
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {items.map((item) => (
              <a key={item.key} href={item.href} className={active === item.key ? 'is-active' : ''}>
                {item.label}
                {item.count !== undefined && <span className="nav-count">{item.count}</span>}
              </a>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
