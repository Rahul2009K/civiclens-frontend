import { useState, useEffect } from 'react'
import './App.css'
import { auth, signInWithGoogle, signOutUser, saveBill, unsaveBill, getSavedBills } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'

function BillDetail({ bill, onBack, user, savedIds, onSave, onUnsave }) {
  const isSaved = savedIds.has(bill.id)

  return (
    <div className="detail-page">
      <button className="back-btn" onClick={onBack}>← Back to all bills</button>
      <div className="topic-tags">
        {bill.topics?.map((topic) => (
          <span key={topic} className="tag">{topic}</span>
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

function BillCard({ bill, onClick, user, savedIds, onSave, onUnsave }) {
  const isSaved = savedIds.has(bill.id)

  return (
    <div className="bill-card">
      <div className="bill-card-header" onClick={() => onClick(bill)}>
        <div className="topic-tags">
          {bill.topics?.map((topic) => (
            <span key={topic} className="tag">{topic}</span>
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
    </div>
  )
}

function App() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedBill, setSelectedBill] = useState(null)
  const [user, setUser] = useState(null)
  const [savedIds, setSavedIds] = useState(new Set())
  const [showWatchlist, setShowWatchlist] = useState(false)
  const [savedBills, setSavedBills] = useState([])

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

  const allTopics = ['All', ...new Set(bills.flatMap((b) => b.topics || []))]

  const filteredBills = activeFilter === 'All'
    ? bills
    : bills.filter((b) => b.topics?.includes(activeFilter))

  if (selectedBill) {
    return (
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
    )
  }

  return (
    <div className="app">
      <h1>CivicLens</h1>
      <p className="tagline">Congress, explained in plain English</p>

      <div className="auth-bar">
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
            <p style={{color:'#777'}}>No saved bills yet — browse bills and click ☆ Save to add them here.</p>
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
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="filters">
            {allTopics.map((topic) => (
              <button
                key={topic}
                className={topic === activeFilter ? 'filter active' : 'filter'}
                onClick={() => setActiveFilter(topic)}
              >
                {topic}
              </button>
            ))}
          </div>

          {loading && <p>Loading bills...</p>}

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
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default App