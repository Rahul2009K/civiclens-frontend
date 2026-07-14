import { useState, useEffect } from 'react'
import './App.css'
import { auth, signInWithGoogle, signOutUser, saveBill, unsaveBill, getSavedBills, getBillVotes, getUserVote, castVote } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'

const TOPIC_COLORS = {
  'Education': 'topic-blue',
  'Immigration': 'topic-coral',
  'Healthcare': 'topic-teal',
  'Climate': 'topic-green',
  'Economy': 'topic-amber',
  'Civil Rights': 'topic-purple',
  'Criminal Justice': 'topic-red',
  'Technology': 'topic-pink',
  'Foreign Policy': 'topic-gray',
  'Other': 'topic-gray',
}

function getTopicClass(topic) {
  return TOPIC_COLORS[topic] || 'topic-gray'
}

function ScalesIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M32 6c-4.5 0-7.8 2.4-7.8 2.4S28 11.4 32 11.4s7.8-2.6 7.8-2.6S36.5 6 32 6Z" fill="currentColor" />
      <path d="M32 6v46" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M13 15h38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="32" cy="15" r="3.2" fill="currentColor" />
      <g strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M13 15 4 34" />
        <path d="M13 15l9 19" />
        <path d="M3 34c0 5 4.5 9 10 9s10-4 10-9" />
        <path d="M51 15l-9 19" />
        <path d="M51 15l9 19" />
        <path d="M41 34c0 5 4.5 9 10 9s10-4 10-9" />
      </g>
      <path d="M20 57h24M32 52v5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M21.5 51h21l-3 6h-15Z" fill="currentColor" />
    </svg>
  )
}

function Masthead() {
  return (
    <header className="site-masthead">
      <div className="site-masthead-inner">
        <ScalesIcon className="masthead-icon" />
        <div className="masthead-text">
          <h1>CivicLens</h1>
          <p className="tagline">Congress, explained in plain English</p>
        </div>
      </div>
    </header>
  )
}

function BackgroundEmblems() {
  return (
    <>
      <ScalesIcon className="bg-scales bg-scales-1" />
      <ScalesIcon className="bg-scales bg-scales-2" />
    </>
  )
}

function VoteButtons({ bill, user, votes, userVote, onVote }) {
  return (
    <div className="vote-buttons">
      <button
        className={userVote === 'like' ? 'vote-btn liked' : 'vote-btn'}
        onClick={(e) => { e.stopPropagation(); user && onVote(bill.id, 'like') }}
        disabled={!user}
        title={user ? '' : 'Sign in to vote'}
      >
        👍 {votes.likes || 0}
      </button>
      <button
        className={userVote === 'dislike' ? 'vote-btn disliked' : 'vote-btn'}
        onClick={(e) => { e.stopPropagation(); user && onVote(bill.id, 'dislike') }}
        disabled={!user}
        title={user ? '' : 'Sign in to vote'}
      >
        👎 {votes.dislikes || 0}
      </button>
    </div>
  )
}

function BillDetail({ bill, onBack, user, savedIds, onSave, onUnsave }) {
  const isSaved = savedIds.has(bill.id)

  return (
    <div className="detail-page">
      <button className="back-btn" onClick={onBack}>← Back to all bills</button>
      <div className="topic-tags">
        {bill.topics?.map((topic) => (
          <span key={topic} className={`tag ${getTopicClass(topic)}`}>{topic}</span>
        ))}
      </div>
      <h1>{bill.plain_title}</h1>

      {user && (
        <button
          className={isSaved ? 'save-btn saved' : 'save-btn'}
          onClick={() => isSaved ? onUnsave(bill.id) : onSave(bill)}
        >
          {isSaved ? '★ Saved' : '☆ Save this bill'}
        </button>
      )}

      <p className="summary">{bill.plain_summary}</p>

      <div className="detail-section">
        <h3>Key Provisions</h3>
        <ul>
          {bill.key_provisions?.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>

      <div className="detail-section">
        <h3>Who It Affects</h3>
        <p>{bill.who_it_affects}</p>
      </div>

      <div className="detail-section">
        <h3>Current Status</h3>
        <p className="status">{bill.status_plain_english}</p>
      </div>
    </div>
  )
}

function BillCard({ bill, onClick, user, savedIds, onSave, onUnsave, votes, userVote, onVote }) {
  const isSaved = savedIds.has(bill.id)

  return (
    <div className="bill-card">
      <div className="bill-card-header" onClick={() => onClick(bill)}>
        <div className="topic-tags">
          {bill.topics?.map((topic) => (
            <span key={topic} className={`tag ${getTopicClass(topic)}`}>{topic}</span>
          ))}
        </div>
        <h2>{bill.plain_title}</h2>
        <p className="summary">{bill.plain_summary}</p>
        <p className="status">{bill.status_plain_english}</p>
        <p className="read-more">Read more →</p>
      </div>
      {user && (
        <button
          className={isSaved ? 'save-btn-small saved' : 'save-btn-small'}
          onClick={(e) => {
            e.stopPropagation()
            isSaved ? onUnsave(bill.id) : onSave(bill)
          }}
        >
          {isSaved ? '★ Saved' : '☆ Save'}
        </button>
      )}
      <VoteButtons
        bill={bill}
        user={user}
        votes={votes || { likes: 0, dislikes: 0 }}
        userVote={userVote}
        onVote={onVote}
      />
    </div>
  )
}

function App() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBill, setSelectedBill] = useState(null)
  const [user, setUser] = useState(null)
  const [savedIds, setSavedIds] = useState(new Set())
  const [showWatchlist, setShowWatchlist] = useState(false)
  const [savedBills, setSavedBills] = useState([])
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('civiclens-theme') === 'dark'
  })
  const [votes, setVotes] = useState({})
  const [userVotes, setUserVotes] = useState({})

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('civiclens-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    if (bills.length === 0) return
    Promise.all(bills.map(async (b) => [b.id, await getBillVotes(b.id)]))
      .then((entries) => setVotes(Object.fromEntries(entries)))
      .catch((err) => console.error('Failed to fetch votes:', err))
  }, [bills])

  useEffect(() => {
    if (!user || bills.length === 0) {
      setUserVotes({})
      return
    }
    Promise.all(bills.map(async (b) => [b.id, await getUserVote(user.uid, b.id)]))
      .then((entries) => setUserVotes(Object.fromEntries(entries)))
      .catch((err) => console.error('Failed to fetch user votes:', err))
  }, [user, bills])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        const saved = await getSavedBills(currentUser.uid)
        setSavedBills(saved)
        setSavedIds(new Set(saved.map(b => b.id)))
      } else {
        setSavedBills([])
        setSavedIds(new Set())
      }
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL || 'http://localhost:5000/bills')
      .then((res) => res.json())
      .then((data) => {
        setBills(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch bills:', err)
        setLoading(false)
      })
  }, [])

  async function handleSave(bill) {
    if (!user) return
    await saveBill(user.uid, bill)
    setSavedIds(prev => new Set([...prev, bill.id]))
    setSavedBills(prev => [...prev, bill])
  }

  async function handleUnsave(billId) {
    if (!user) return
    await unsaveBill(user.uid, billId)
    setSavedIds(prev => {
      const next = new Set(prev)
      next.delete(billId)
      return next
    })
    setSavedBills(prev => prev.filter(b => b.id !== billId))
  }

  async function handleVote(billId, voteType) {
    if (!user) return
    try {
      const result = await castVote(user.uid, billId, voteType)
      setVotes(prev => ({ ...prev, [billId]: { likes: result.likes, dislikes: result.dislikes } }))
      setUserVotes(prev => ({ ...prev, [billId]: result.userVote }))
    } catch (err) {
      console.error('Failed to cast vote:', err)
    }
  }

  const allTopics = ['All', ...new Set(bills.flatMap((b) => b.topics || []))]

  const filteredBills = bills.filter((b) => {
    const matchesTopic = activeFilter === 'All' || b.topics?.includes(activeFilter)
    const query = searchQuery.trim().toLowerCase()
    const matchesSearch = query === '' ||
      b.plain_title?.toLowerCase().includes(query) ||
      b.plain_summary?.toLowerCase().includes(query)
    return matchesTopic && matchesSearch
  })

  if (selectedBill) {
    return (
      <div className="page">
        <Masthead />
        <BackgroundEmblems />
        <div className="app">
          <BillDetail
            bill={selectedBill}
            onBack={() => setSelectedBill(null)}
            user={user}
            savedIds={savedIds}
            onSave={handleSave}
            onUnsave={handleUnsave}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Masthead />
      <BackgroundEmblems />
      <div className="app">
      <div className="auth-bar">
        <button
          className="theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
          style={{marginBottom: '0.75rem'}}
        >
          {darkMode ? '☀ Light mode' : '🌙 Dark mode'}
        </button>
        {user ? (
          <div className="auth-bar-inner">
            <span>Signed in as {user.displayName}</span>
            <button
              onClick={() => setShowWatchlist(!showWatchlist)}
              className="auth-btn"
            >
              {showWatchlist ? 'Browse bills' : `My watchlist (${savedIds.size})`}
            </button>
            <button onClick={signOutUser} className="auth-btn">Sign out</button>
          </div>
        ) : (
          <button onClick={signInWithGoogle} className="auth-btn">
            Sign in with Google
          </button>
        )}
      </div>

      {showWatchlist ? (
        <div>
          <h2 style={{fontSize:'1.1rem', margin:'1.5rem 0 1rem'}}>My Watchlist</h2>
          {savedBills.length === 0 ? (
            <p style={{color:'var(--text-secondary)'}}>No saved bills yet — browse bills and click ☆ Save to add them here.</p>
          ) : (
            <div className="bill-list">
              {savedBills.map((bill) => (
                <BillCard
                  key={bill.id}
                  bill={bill}
                  onClick={setSelectedBill}
                  user={user}
                  savedIds={savedIds}
                  onSave={handleSave}
                  onUnsave={handleUnsave}
                  votes={votes[bill.id]}
                  userVote={userVotes[bill.id]}
                  onVote={handleVote}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <input
            type="text"
            className="search-input"
            placeholder="Search bills by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="filters">
            {allTopics.map((topic) => (
              <button
                key={topic}
                className={
                  topic === activeFilter
                    ? 'filter active'
                    : `filter ${topic === 'All' ? '' : getTopicClass(topic)}`
                }
                onClick={() => setActiveFilter(topic)}
              >
                {topic}
              </button>
            ))}
          </div>

          {loading && <p>Loading bills...</p>}

          {!loading && filteredBills.length === 0 && (
            <p style={{color:'var(--text-secondary)'}}>No bills match your search.</p>
          )}

          <div className="bill-list">
            {filteredBills.map((bill) => (
              <BillCard
                key={bill.id}
                bill={bill}
                onClick={setSelectedBill}
                user={user}
                savedIds={savedIds}
                onSave={handleSave}
                onUnsave={handleUnsave}
                votes={votes[bill.id]}
                userVote={userVotes[bill.id]}
                onVote={handleVote}
              />
            ))}
          </div>
        </>
      )}
      </div>
    </div>
  )
}

export default App