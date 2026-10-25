import { forwardRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import Book from './Book'
import StageTracker from './StageTracker'
import { SaveButton, VoteButtons } from './Actions'
import { billFacts, clean, stageOf } from '../lib/bills'
import { billHref } from '../lib/useHashRoute'

const BillTile = forwardRef(function BillTile({ bill, index = 0, ctx }, ref) {
  const reduce = useReducedMotion()
  const facts = billFacts(bill)

  return (
    <motion.article
      ref={ref}
      className="tile"
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      exit={reduce ? undefined : { opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 120, damping: 22, delay: reduce ? 0 : (index % 4) * 0.06 }}
    >
      <a href={billHref(bill.id)} className="tile-link">
        <Book bill={bill} />
        <span className="tile-meta">
          <span className="mono">{facts.label}</span>
          <span className="tile-chamber">{facts.chamber}</span>
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
