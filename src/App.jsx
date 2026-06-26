import { useState, useEffect } from 'react'
import './App.css'

function BillDetail({ bill, onBack }) {
  return (
    <div className="detail-page">
      <button className="back-btn" onClick={onBack}>← Back to all bills</button>
      <div className="topic-tags">
        {bill.topics?.map((topic) => (
          <span key={topic} className="tag">{topic}</span>
        ))}
      </div>
      <h1>{bill.plain_title}</h1>
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

function BillCard({ bill, onClick }) {
  return (
    <div className="bill-card" onClick={() => onClick(bill)}>
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
  )
}

function App() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedBill, setSelectedBill] = useState(null)

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

  const allTopics = ['All', ...new Set(bills.flatMap((b) => b.topics || []))]

  const filteredBills = activeFilter === 'All'
    ? bills
    : bills.filter((b) => b.topics?.includes(activeFilter))

  if (selectedBill) {
    return (
      <div className="app">
        <BillDetail bill={selectedBill} onBack={() => setSelectedBill(null)} />
      </div>
    )
  }

  return (
    <div className="app">
      <h1>CivicLens</h1>
      <p className="tagline">Congress, explained in plain English</p>

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
          />
        ))}
      </div>
    </div>
  )
}

export default App