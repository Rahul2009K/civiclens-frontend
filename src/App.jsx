import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTopic, setSelectedTopic] = useState('All')
  const [topics, setTopics] = useState([])

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL || 'http://localhost:5000/bills')
      .then((res) => res.json())
      .then((data) => {
        setBills(data)

        const uniqueTopics = new Set()
        data.forEach((bill) => {
          if (bill.topic) {
            uniqueTopics.add(bill.topic)
          }
        })
        setTopics(Array.from(uniqueTopics).sort())
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching bills:', error)
        setLoading(false)
      })
  }, [])

  const filteredBills = selectedTopic === 'All'
    ? bills
    : bills.filter((bill) => bill.topic === selectedTopic)

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>CivicLens</h1>
      </header>

      {loading ? (
        <div className="loading">Loading bills...</div>
      ) : (
        <>
          <div className="filter-section">
            <button
              className={`filter-btn ${selectedTopic === 'All' ? 'active' : ''}`}
              onClick={() => setSelectedTopic('All')}
            >
              All
            </button>
            {topics.map((topic) => (
              <button
                key={topic}
                className={`filter-btn ${selectedTopic === topic ? 'active' : ''}`}
                onClick={() => setSelectedTopic(topic)}
              >
                {topic}
              </button>
            ))}
          </div>

          <div className="bills-grid">
            {filteredBills.map((bill) => (
              <div key={bill.id} className="bill-card">
                <h2 className="bill-title">{bill.plain_title}</h2>
                <p className="bill-summary">{bill.plain_summary}</p>
                <div className="bill-meta">
                  <span className={`bill-status status-${bill.status_plain_english.toLowerCase()}`}>
                    {bill.status_plain_english}
                  </span>
                  {bill.topic && (
                    <span className="bill-topic">{bill.topic}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default App
