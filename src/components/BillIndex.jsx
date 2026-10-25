import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { ArrowClockwiseIcon, MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react'
import BillTile, { TileSkeleton } from './BillTile'
import { billFacts, TOPIC_PALETTES } from '../lib/bills'

function matches(bill, q) {
  if (!q) return true
  const facts = billFacts(bill)
  const hay = [
    bill.plain_title, bill.plain_summary, bill.original_title, bill.who_it_affects,
    facts.label, facts.label.replace(/\./g, ''), ...(bill.topics || []), ...(bill.key_provisions || []),
  ].join(' ').toLowerCase()
  return q.split(/\s+/).every((word) => hay.includes(word))
}

export default function BillIndex({ bills, loading, error, onRetry, ctx }) {
  const [topic, setTopic] = useState('All')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')
  const q = useDeferredValue(query.trim().toLowerCase())
  const [slow, setSlow] = useState(false)

  // The free backend sleeps when idle; say so if the first load drags on
  useEffect(() => {
    if (!loading) return
    const t = setTimeout(() => setSlow(true), 4000)
    return () => { clearTimeout(t); setSlow(false) }
  }, [loading])

  const topics = useMemo(() => {
    const counts = new Map()
    for (const b of bills) for (const t of b.topics || []) counts.set(t, (counts.get(t) || 0) + 1)
    // Biggest topics first; the catch-all "Other" always goes last
    return [...counts.entries()].sort((a, b) => (a[0] === 'Other') - (b[0] === 'Other') || b[1] - a[1])
  }, [bills])

  // "Most liked" needs every bill's vote count, not just the ones on screen
  const { requestVotes } = ctx
  useEffect(() => {
    if (sort === 'liked') requestVotes(bills.map((b) => b.id))
  }, [sort, bills, requestVotes])

  const shown = useMemo(() => {
    const list = bills.filter((b) => (topic === 'All' || b.topics?.includes(topic)) && matches(b, q))
    if (sort === 'liked') {
      const score = (b) => (ctx.votes[b.id]?.likes || 0) - (ctx.votes[b.id]?.dislikes || 0)
      return [...list].sort((a, b) => score(b) - score(a))
    }
    return list
  }, [bills, topic, q, sort, ctx.votes])

  return (
    <div className="index">
      <div className="index-controls">
        <div className="field">
          <label htmlFor="bill-search" className="field-label">Search bills</label>
          <div className="search">
            <MagnifyingGlassIcon className="search-icon" aria-hidden="true" />
            <input
              id="bill-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try “student loans” or H.R. 5744"
              autoComplete="off"
            />
            {query && (
              <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="Clear search">
                <XIcon />
              </button>
            )}
          </div>
        </div>
        <div className="field">
          <span className="field-label" id="sort-label">Sort</span>
          <div className="segmented" role="group" aria-labelledby="sort-label">
            <button type="button" className={sort === 'newest' ? 'is-on' : ''} aria-pressed={sort === 'newest'} onClick={() => setSort('newest')}>Newest</button>
            <button type="button" className={sort === 'liked' ? 'is-on' : ''} aria-pressed={sort === 'liked'} onClick={() => setSort('liked')}>Most liked</button>
          </div>
        </div>
      </div>

      {bills.length > 0 && <div className="topic-row" role="group" aria-label="Filter by topic">
        <button
          type="button"
          className={`topic-pill${topic === 'All' ? ' is-on' : ''}`}
          aria-pressed={topic === 'All'}
          onClick={() => setTopic('All')}
        >
          All <span className="num">{bills.length}</span>
        </button>
        {topics.map(([t, n]) => (
          <button
            key={t}
            type="button"
            className={`topic-pill${topic === t ? ' is-on' : ''}`}
            aria-pressed={topic === t}
            style={{ '--swatch': (TOPIC_PALETTES[t] || TOPIC_PALETTES.Other).bg }}
            onClick={() => setTopic(topic === t ? 'All' : t)}
          >
            <span className="swatch" aria-hidden="true" />
            {t} <span className="num">{n}</span>
          </button>
        ))}
      </div>}

      <p className="index-status" aria-live="polite">
        {loading && slow && 'Waking up the server. The first load can take up to a minute.'}
        {!loading && !error && (
          shown.length === bills.length
            ? `${bills.length} bills`
            : `${shown.length} of ${bills.length} bills`
        )}
      </p>

      {error ? (
        <div className="empty">
          <h3>Couldn’t load bills right now.</h3>
          <p>The server may be waking up. Give it a moment and try again.</p>
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            <ArrowClockwiseIcon weight="bold" /> Try again
          </button>
        </div>
      ) : loading ? (
        <div className="grid">
          {Array.from({ length: 8 }, (_, i) => <TileSkeleton key={i} />)}
        </div>
      ) : shown.length === 0 ? (
        <div className="empty">
          <h3>No bills match that.</h3>
          <p>Try a broader word, or clear the topic filter.</p>
          <button type="button" className="btn btn-ghost" onClick={() => { setQuery(''); setTopic('All') }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid">
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((bill, i) => (
              <BillTile key={bill.id} bill={bill} index={i} ctx={ctx} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
