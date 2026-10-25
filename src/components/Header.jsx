import { GoogleLogoIcon, MoonIcon, SignOutIcon, SunIcon } from '@phosphor-icons/react'
import { Wordmark } from './Brand'

export default function Header({ route, user, savedCount, theme, onToggleTheme, onSignIn, onSignOut }) {
  const onWatchlist = route.name === 'watchlist'
  return (
    <header className="site-header">
      <div className="progress" aria-hidden="true" />
      <div className="container header-inner">
        <a href="#/" className="home-link" aria-label="CivicLens home">
          <Wordmark />
        </a>

        <nav className="header-nav" aria-label="Main">
          <a href="#/bills" className="nav-link">Bills</a>
          <a href="#/how" className="nav-link nav-hide-sm">How it works</a>
          {user && (
            <a href="#/watchlist" className={`nav-link${onWatchlist ? ' is-active' : ''}`} aria-current={onWatchlist ? 'page' : undefined}>
              Watchlist<span className="nav-count">{savedCount}</span>
            </a>
          )}
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={onToggleTheme}
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
              <span className="account-name">{user.displayName?.split(' ')[0]}</span>
              <button type="button" className="icon-btn" onClick={onSignOut} aria-label="Sign out" title="Sign out">
                <SignOutIcon />
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onSignIn}>
              <GoogleLogoIcon weight="bold" />
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
