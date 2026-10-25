import { useState } from 'react'
import { BookmarkSimpleIcon, ThumbsDownIcon, ThumbsUpIcon } from '@phosphor-icons/react'
import { sfx } from '../lib/sfx'

// Like / dislike. Signed-out clicks ask the visitor to sign in instead of
// silently doing nothing.
export function VoteButtons({ billId, votes, userVote, user, onVote, onRequireSignIn, size = 'sm' }) {
  const [pending, setPending] = useState(false)
  const likes = votes?.likes ?? 0
  const dislikes = votes?.dislikes ?? 0

  async function vote(type) {
    if (!user) return onRequireSignIn()
    if (pending) return
    sfx.pop()
    setPending(true)
    try {
      await onVote(billId, type)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className={`votes votes-${size}`} role="group" aria-label="Rate this bill" data-sfx="custom">
      <button
        type="button"
        className={`chip-btn${userVote === 'like' ? ' is-on' : ''}`}
        aria-pressed={userVote === 'like'}
        aria-label={`Like (${likes})`}
        onClick={() => vote('like')}
        disabled={pending}
      >
        <ThumbsUpIcon weight={userVote === 'like' ? 'fill' : 'regular'} />
        <span className="num">{likes}</span>
      </button>
      <button
        type="button"
        className={`chip-btn${userVote === 'dislike' ? ' is-on' : ''}`}
        aria-pressed={userVote === 'dislike'}
        aria-label={`Dislike (${dislikes})`}
        onClick={() => vote('dislike')}
        disabled={pending}
      >
        <ThumbsDownIcon weight={userVote === 'dislike' ? 'fill' : 'regular'} />
        <span className="num">{dislikes}</span>
      </button>
    </div>
  )
}

export function SaveButton({ bill, isSaved, user, onSave, onUnsave, onRequireSignIn, withLabel = false }) {
  const [pending, setPending] = useState(false)

  async function toggle() {
    if (!user) return onRequireSignIn()
    if (pending) return
    if (isSaved) sfx.bookClose()
    else sfx.chime()
    setPending(true)
    try {
      if (isSaved) await onUnsave(bill.id)
      else await onSave(bill)
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      className={`chip-btn save-btn${isSaved ? ' is-on' : ''}${withLabel ? ' with-label' : ''}`}
      data-sfx="custom"
      aria-pressed={isSaved}
      aria-label={isSaved ? 'Remove from watchlist' : 'Save to watchlist'}
      onClick={toggle}
      disabled={pending}
    >
      <BookmarkSimpleIcon weight={isSaved ? 'fill' : 'regular'} />
      {withLabel && <span>{isSaved ? 'Saved' : 'Save'}</span>}
    </button>
  )
}
