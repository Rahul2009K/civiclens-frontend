import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { onAuthStateChanged } from 'firebase/auth'
import {
  auth, signInWithGoogle, signOutUser, saveBill, unsaveBill,
  getSavedBills, getBillVotes, getUserVote, castVote,
} from './firebase'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import BillPage from './pages/BillPage'
import Watchlist from './pages/Watchlist'
import { clean } from './lib/bills'
import { useHashRoute } from './lib/useHashRoute'

// Accept the backend URL with or without "/bills" on the end
const API_BASE = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000')
  .replace(/\/+$/, '')
  .replace(/\/bills$/, '')

function initialTheme() {
  try {
    const saved = localStorage.getItem('civiclens-theme')
    if (saved === 'dark' || saved === 'light') return saved
  } catch { /* storage blocked */ }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export default function App() {
  const route = useHashRoute()
  const reduce = useReducedMotion()

  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const [user, setUser] = useState(null)
  const [savedBills, setSavedBills] = useState([])
  const [votes, setVotes] = useState({})
  const [userVotes, setUserVotes] = useState({})
  const [theme, setTheme] = useState(initialTheme)
  const [toast, setToast] = useState(null)

  const homeScroll = useRef(0)

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#121011' : '#f2f1ee')
    try { localStorage.setItem('civiclens-theme', theme) } catch { /* storage blocked */ }
  }, [theme])

  // Bills
  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE}/bills`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Unexpected response format')
        if (cancelled) return
        setBills(data)
        setLoadError(false)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch bills:', err)
        if (cancelled) return
        setLoadError(true)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [attempt])

  const retry = useCallback(() => {
    setLoading(true)
    setLoadError(false)
    setAttempt((n) => n + 1)
  }, [])

  // Vote totals
  useEffect(() => {
    if (bills.length === 0) return
    Promise.all(bills.map(async (b) => [b.id, await getBillVotes(b.id)]))
      .then((entries) => setVotes(Object.fromEntries(entries)))
      .catch((err) => console.error('Failed to fetch votes:', err))
  }, [bills])

  // This user's own votes
  useEffect(() => {
    if (!user || bills.length === 0) return
    Promise.all(bills.map(async (b) => [b.id, await getUserVote(user.uid, b.id)]))
      .then((entries) => setUserVotes(Object.fromEntries(entries)))
      .catch((err) => console.error('Failed to fetch user votes:', err))
  }, [user, bills])

  // Auth + watchlist
  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (!currentUser) {
        setUserVotes({})
        setSavedBills([])
        return
      }
      try {
        setSavedBills(await getSavedBills(currentUser.uid))
      } catch (err) {
        console.error('Failed to load watchlist:', err)
      }
    })
  }, [])

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3600)
    return () => clearTimeout(t)
  }, [toast])

  const notify = useCallback((message) => setToast({ message, key: Date.now() }), [])

  // Remember where the visitor was on the home page before opening a bill,
  // and make same-hash section links (#/bills twice) still scroll.
  useEffect(() => {
    function onClick(e) {
      const a = e.target.closest?.('a[href^="#/"]')
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
      const href = a.getAttribute('href')
      if (route.name === 'home' && href.startsWith('#/bill/')) homeScroll.current = window.scrollY
      if (href === window.location.hash) {
        const section = href.match(/^#\/(bills|how)$/)?.[1]
        if (section) {
          e.preventDefault()
          document.getElementById(section)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
        }
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [route.name, reduce])

  // Scroll position on navigation
  const routeKey = route.name === 'bill' ? `bill:${route.id}` : route.name
  useLayoutEffect(() => {
    if (route.name === 'home') {
      // Coming back from a bill: return to the exact spot the visitor left
      if (homeScroll.current > 0) {
        window.scrollTo(0, homeScroll.current)
        homeScroll.current = 0
      } else if (route.section) {
        requestAnimationFrame(() =>
          document.getElementById(route.section)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
        )
      } else {
        window.scrollTo(0, homeScroll.current)
        homeScroll.current = 0
      }
    } else {
      window.scrollTo(0, 0)
    }
  }, [routeKey, route.section]) // eslint-disable-line react-hooks/exhaustive-deps

  // Document title
  useEffect(() => {
    const base = 'CivicLens: Congress in plain English'
    if (route.name === 'bill') {
      const b = bills.find((x) => x.id === route.id) || savedBills.find((x) => x.id === route.id)
      document.title = b ? `${clean(b.plain_title)} | CivicLens` : base
    } else if (route.name === 'watchlist') {
      document.title = 'Your watchlist | CivicLens'
    } else {
      document.title = base
    }
  }, [route, bills, savedBills])

  const handleSignIn = useCallback(async () => {
    try {
      await signInWithGoogle()
    } catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        console.error('Sign-in failed:', err)
        notify('Sign-in didn’t go through. Please try again.')
      }
    }
  }, [notify])

  const requireSignIn = useCallback(() => {
    notify('Sign in to vote and save bills.')
    handleSignIn()
  }, [handleSignIn, notify])

  const handleSave = useCallback(async (bill) => {
    if (!user) return
    try {
      await saveBill(user.uid, bill)
      setSavedBills((prev) => (prev.some((b) => b.id === bill.id) ? prev : [...prev, bill]))
    } catch (err) {
      console.error('Failed to save bill:', err)
      notify('Couldn’t save that bill. Please try again.')
    }
  }, [user, notify])

  const handleUnsave = useCallback(async (billId) => {
    if (!user) return
    try {
      await unsaveBill(user.uid, billId)
      setSavedBills((prev) => prev.filter((b) => b.id !== billId))
    } catch (err) {
      console.error('Failed to remove bill:', err)
      notify('Couldn’t remove that bill. Please try again.')
    }
  }, [user, notify])

  const handleVote = useCallback(async (billId, voteType) => {
    if (!user) return
    try {
      const result = await castVote(user.uid, billId, voteType)
      setVotes((prev) => ({ ...prev, [billId]: { likes: result.likes, dislikes: result.dislikes } }))
      setUserVotes((prev) => ({ ...prev, [billId]: result.userVote }))
    } catch (err) {
      console.error('Failed to cast vote:', err)
      notify('Your vote didn’t go through. Please try again.')
    }
  }, [user, notify])

  const savedIds = useMemo(() => new Set(savedBills.map((b) => b.id)), [savedBills])

  const ctx = useMemo(() => ({
    user, votes, userVotes, savedIds,
    onVote: handleVote, onSave: handleSave, onUnsave: handleUnsave, onRequireSignIn: requireSignIn,
  }), [user, votes, userVotes, savedIds, handleVote, handleSave, handleUnsave, requireSignIn])

  let page
  if (route.name === 'bill') {
    page = <BillPage id={route.id} bills={bills} savedBills={savedBills} loading={loading} ctx={ctx} />
  } else if (route.name === 'watchlist') {
    page = <Watchlist bills={bills} savedBills={savedBills} ctx={ctx} />
  } else {
    page = <Home bills={bills} loading={loading} error={loadError} onRetry={retry} theme={theme} ctx={ctx} />
  }

  return (
    <div className="app">
      <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus() }}>
        Skip to content
      </a>
      <Header
        route={route}
        user={user}
        savedCount={savedIds.size}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onSignIn={handleSignIn}
        onSignOut={() => signOutUser()}
      />
      <motion.main
        id="main"
        tabIndex={-1}
        key={routeKey}
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {page}
      </motion.main>
      <Footer user={user} />
      <div className="toast-region" aria-live="polite">
        {toast && <div className="toast" key={toast.key}>{toast.message}</div>}
      </div>
      <div className="grain" aria-hidden="true" />
    </div>
  )
}
