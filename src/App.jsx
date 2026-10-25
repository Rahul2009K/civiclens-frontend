import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { onAuthStateChanged } from 'firebase/auth'
import {
  auth, signInWithGoogle, signOutUser, saveBill, unsaveBill,
  getSavedBills, getBillVotes, getUserVote, castVote,
} from './firebase'
import Header from './components/Header'
import Footer from './components/Footer'
import BookOpener from './components/BookOpener'
import ClickSparks from './components/ClickSparks'
import AmbientBackground from './components/AmbientBackground'
import Home from './pages/Home'
import BillPage from './pages/BillPage'
import Watchlist from './pages/Watchlist'
import About from './pages/About'
import { clean, primaryTopic } from './lib/bills'
import { billHref, useHashRoute } from './lib/useHashRoute'
import { sfx } from './lib/sfx'

// Accept the backend URL with or without "/bills" on the end
const API_BASE = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000')
  .replace(/\/+$/, '')
  .replace(/\/bills$/, '')

const HOME_SECTIONS = ['new', 'bills', 'how']

function initialTheme() {
  try {
    const saved = localStorage.getItem('civiclens-theme')
    if (saved === 'dark' || saved === 'light') return saved
  } catch { /* storage blocked */ }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

async function getJSON(url, ms) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`${url} responded ${res.status}`)
    const data = await res.json()
    if (!Array.isArray(data)) throw new Error('Unexpected response format')
    return data
  } finally {
    clearTimeout(t)
  }
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
  const [opening, setOpening] = useState(null)
  const [section, setSection] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  const homeScroll = useRef(0)
  const sentinel = useRef(null)

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#121011' : '#f2f1ee')
    try { localStorage.setItem('civiclens-theme', theme) } catch { /* storage blocked */ }
  }, [theme])

  // Bills: show the bundled snapshot instantly, then upgrade to the live API.
  // The free API host sleeps when idle, so the snapshot keeps first loads fast.
  useEffect(() => {
    let cancelled = false
    let haveData = false
    let haveSnapshot = false
    getJSON('/bills.json', 8000)
      .then((data) => {
        if (cancelled || haveData) return
        haveSnapshot = true
        setBills(data)
        setLoadError(false) // the API may have failed first; the snapshot still counts
        setLoading(false)
      })
      .catch(() => { /* no snapshot in local dev is fine */ })
    getJSON(`${API_BASE}/bills`, 70000)
      .then((data) => {
        if (cancelled) return
        haveData = true
        setBills(data)
        setLoadError(false)
        setLoading(false)
      })
      .catch((err) => {
        console.warn('Live API unavailable, using snapshot:', err.message)
        if (cancelled) return
        if (!haveSnapshot) setLoadError(true)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [attempt])

  const retry = useCallback(() => {
    setLoading(true)
    setLoadError(false)
    setAttempt((n) => n + 1)
  }, [])

  // Votes load lazily for bills that scroll into view, batched into one round
  const requested = useRef(new Set())
  const queue = useRef(new Set())
  const flushTimer = useRef(0)
  const userRef = useRef(null)
  useEffect(() => { userRef.current = user }, [user])

  const flushVotes = useCallback(() => {
    flushTimer.current = 0
    const ids = [...queue.current]
    queue.current.clear()
    if (ids.length === 0) return
    Promise.all(ids.map(async (id) => [id, await getBillVotes(id)]))
      .then((entries) => setVotes((prev) => ({ ...prev, ...Object.fromEntries(entries) })))
      .catch((err) => console.error('Failed to fetch votes:', err))
    const u = userRef.current
    if (u) {
      Promise.all(ids.map(async (id) => [id, await getUserVote(u.uid, id)]))
        .then((entries) => setUserVotes((prev) => ({ ...prev, ...Object.fromEntries(entries) })))
        .catch((err) => console.error('Failed to fetch your votes:', err))
    }
  }, [])

  const requestVotes = useCallback((ids) => {
    for (const id of Array.isArray(ids) ? ids : [ids]) {
      if (requested.current.has(id)) continue
      requested.current.add(id)
      queue.current.add(id)
    }
    if (queue.current.size && !flushTimer.current) flushTimer.current = setTimeout(flushVotes, 60)
  }, [flushVotes])

  // When someone signs in, fetch their votes for everything already on screen
  useEffect(() => {
    if (!user || requested.current.size === 0) return
    const ids = [...requested.current]
    Promise.all(ids.map(async (id) => [id, await getUserVote(user.uid, id)]))
      .then((entries) => setUserVotes(Object.fromEntries(entries)))
      .catch((err) => console.error('Failed to fetch your votes:', err))
  }, [user])

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

  // Header state: shrink once the page scrolls, highlight the section in view
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (route.name !== 'home') return
    const els = HOME_SECTIONS.map((id) => document.getElementById(id)).filter(Boolean)
    const visible = new Map()
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) visible.set(e.target.id, e.isIntersecting)
      setSection(HOME_SECTIONS.find((id) => visible.get(id)) || null)
    }, { rootMargin: '-45% 0px -45% 0px' })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [route.name, loading])

  const active = route.name === 'home' ? section
    : route.name === 'bill' ? 'bills'
    : route.name

  // Remember where the visitor was on the home page before opening a bill,
  // and make same-hash section links (#/bills twice) still scroll.
  useEffect(() => {
    function onClick(e) {
      const a = e.target.closest?.('a[href^="#/"]')
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
      const href = a.getAttribute('href')
      if (route.name === 'home' && href.startsWith('#/bill/')) homeScroll.current = window.scrollY
      if (href === window.location.hash) {
        const id = href.match(/^#\/(new|bills|how)$/)?.[1]
        if (id) {
          e.preventDefault()
          document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
        }
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [route.name, reduce])

  // Book click: play the opening animation, then navigate
  const openBook = useCallback((bill, rect, palette) => {
    if (route.name === 'home') homeScroll.current = window.scrollY
    if (reduce) {
      sfx.pageTurn()
      window.location.hash = billHref(bill.id)
      return
    }
    setOpening({ bill, rect, palette, key: Date.now() })
  }, [reduce, route.name])

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
        window.scrollTo(0, 0)
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
    } else if (route.name === 'about') {
      document.title = 'About | CivicLens'
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
    user, votes, userVotes, savedIds, requestVotes, openBook,
    onVote: handleVote, onSave: handleSave, onUnsave: handleUnsave, onRequireSignIn: requireSignIn,
  }), [user, votes, userVotes, savedIds, requestVotes, openBook, handleVote, handleSave, handleUnsave, requireSignIn])

  let page
  let scene = 'home'
  if (route.name === 'bill') {
    const b = bills.find((x) => x.id === route.id) || savedBills.find((x) => x.id === route.id)
    scene = b ? primaryTopic(b) : 'Other'
    page = <BillPage id={route.id} bills={bills} savedBills={savedBills} loading={loading} ctx={ctx} />
  } else if (route.name === 'watchlist') {
    page = <Watchlist bills={bills} savedBills={savedBills} ctx={ctx} />
  } else if (route.name === 'about') {
    page = <About billCount={bills.length} />
  } else {
    page = <Home bills={bills} loading={loading} error={loadError} onRetry={retry} theme={theme} ctx={ctx} />
  }

  return (
    <div className="app">
      <AmbientBackground scene={scene} theme={theme} />
      <div ref={sentinel} className="scroll-sentinel" aria-hidden="true" />
      <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus() }}>
        Skip to content
      </a>
      <Header
        active={active}
        scrolled={scrolled}
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
      <Footer user={user} bills={bills} />
      {opening && (
        <BookOpener
          key={opening.key}
          opening={opening}
          onNavigate={() => { window.location.hash = billHref(opening.bill.id) }}
          onDone={() => setOpening(null)}
        />
      )}
      <div className="toast-region" aria-live="polite">
        {toast && <div className="toast" key={toast.key}>{toast.message}</div>}
      </div>
      <ClickSparks />
      <div className="grain" aria-hidden="true" />
    </div>
  )
}
