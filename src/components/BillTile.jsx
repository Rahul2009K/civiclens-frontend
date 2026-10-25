import { forwardRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import Book from './Book'
import StageTracker from './StageTracker'
import { SaveButton, VoteButtons } from './Actions'
import { billFacts, clean, formatDate, stageOf } from '../lib/bills'
import { billHref } from '../lib/useHashRoute'
import { openOnClick } from '../lib/openBook'

const BillTile = forwardRef(function BillTile({ bill, index = 0, ctx }, ref) {
  const reduce = useReducedMotion()
  const facts = billFacts(bill)
  const date = formatDate(bill.latest_action_date)

  return (
    <motion.article
      ref={ref}
      className="tile"
      layout={!reduce}
      exit={reduce ? undefined : { opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
      onViewportEnter={() => ctx.requestVotes(bill.id)}
      viewport={{ margin: '200px 0px' }}
    >
      <a
        href={billHref(bill.id)}
        className="tile-link"
        data-spin-host
        onClick={(e) => openOnClick(e, bill, ctx)}
      >
        {/* Pops back into place every time it scrolls into view */}
        <motion.div
          className="tile-book"
          initial={reduce ? false : { opacity: 0, scale: 0.8, rotateY: -55, y: 36 }}
          whileInView={{ opacity: 1, scale: 1, rotateY: 0, y: 0 }}
          viewport={{ once: false, amount: 0.35 }}
          transition={{ type: 'spring', stiffness: 210, damping: 16, mass: 0.9, delay: reduce ? 0 : (index % 4) * 0.05 }}
        >
          <Book bill={bill} />
        </motion.div>
        <span className="tile-meta">
          <span className="mono">{facts.label}</span>
          <span className="tile-chamber">{facts.chamber}</span>
          {date && <span className="tile-date">{date}</span>}
        </span>
        <span className="tile-title">{clean(bill.plain_title)}</span>
      </a>
      <div className="tile-foot">
        <StageTracker stage={stageOf(bill)} compact />
        <div className="tile-actions">
          <VoteButtons
            billId={bill.id}
            votes={ctx.votes[bill.id]}
            userVote={ctx.userVotes[bill.id]}
            user={ctx.user}
            onVote={ctx.onVote}
            onRequireSignIn={ctx.onRequireSignIn}
          />
          <SaveButton
            bill={bill}
            isSaved={ctx.savedIds.has(bill.id)}
            user={ctx.user}
            onSave={ctx.onSave}
            onUnsave={ctx.onUnsave}
            onRequireSignIn={ctx.onRequireSignIn}
          />
        </div>
      </div>
    </motion.article>
  )
})

export default BillTile

export function TileSkeleton() {
  return (
    <div className="tile tile-skeleton" aria-hidden="true">
      <div className="skeleton-book shimmer" />
      <div className="skeleton-line shimmer" style={{ width: '38%' }} />
      <div className="skeleton-line shimmer" style={{ width: '92%' }} />
      <div className="skeleton-line shimmer" style={{ width: '70%' }} />
    </div>
  )
}
