import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon, FileTextIcon, InfoIcon } from '@phosphor-icons/react'
import Book from '../components/Book'
import StageTracker from '../components/StageTracker'
import Reveal from '../components/Reveal'
import { SaveButton, VoteButtons } from '../components/Actions'
import { billFacts, clean, formatDate, paletteFor, sponsorName, stageOf, TOPIC_PALETTES } from '../lib/bills'
import { billHref } from '../lib/useHashRoute'

const SOURCE_NOTE = {
  official_summary: 'Written from the official summary by the Congressional Research Service.',
  bill_text: 'Congress has not published an official summary yet, so this was written from the full text of the bill.',
  title_only: 'Congress has not published a summary or the bill text yet, so this is based on the title alone. Treat it as a preview.',
}

export default function BillPage({ id, bills, savedBills, loading, ctx }) {
  const index = bills.findIndex((b) => b.id === id)
  const bill = index >= 0 ? bills[index] : savedBills.find((b) => b.id === id)

  if (!bill) {
    return (
      <section className="section">
        <div className="container narrow">
          <a href="#/bills" className="back-link"><ArrowLeftIcon /> All bills</a>
          {loading ? (
            <div className="bill-loading" aria-live="polite">
              <div className="skeleton-line shimmer" style={{ width: '30%' }} />
              <div className="skeleton-title shimmer" />
              <div className="skeleton-line shimmer" style={{ width: '85%' }} />
              <div className="skeleton-line shimmer" style={{ width: '70%' }} />
            </div>
          ) : (
            <div className="empty">
              <h1 className="section-title">We couldn’t find that bill.</h1>
              <p>It may have dropped out of the latest batch. Browse the current bills instead.</p>
              <a href="#/bills" className="btn btn-primary">Browse bills</a>
            </div>
          )}
        </div>
      </section>
    )
  }

  const facts = billFacts(bill)
  const palette = paletteFor(bill)
  const stage = stageOf(bill)
  const prev = index > 0 ? bills[index - 1] : null
  const next = index >= 0 && index < bills.length - 1 ? bills[index + 1] : null
  const source = bill.source || (bill.title_only ? 'title_only' : null)
  const sponsor = sponsorName(bill.sponsor)
  const facts2 = [
    ['Sponsor', sponsor],
    ['Introduced', formatDate(bill.introduced_date)],
    ['Latest action', formatDate(bill.latest_action_date)],
    ['Cosponsors', bill.cosponsor_count !== undefined ? String(bill.cosponsor_count) : null],
  ].filter(([, v]) => v)

  return (
    <article className="bill-page" style={{ '--tint': palette.bg }}>
      <div className="bill-band" aria-hidden="true" />
      <div className="container">
        <a href="#/bills" className="back-link"><ArrowLeftIcon /> All bills</a>

        <div className="bill-grid">
          <div className="bill-visual">
            <Book bill={bill} size="lg" />
          </div>

          <div className="bill-body">
            <p className="bill-kicker mono">{facts.label} · {facts.chamber} {facts.kind.toLowerCase()}</p>
            <h1 className="bill-title">{clean(bill.plain_title)}</h1>
            <div className="bill-topics">
              {bill.topics?.map((t) => (
                <span key={t} className="topic-tag" style={{ '--swatch': (TOPIC_PALETTES[t] || TOPIC_PALETTES.Other).bg }}>
                  <span className="swatch" aria-hidden="true" />{t}
                </span>
              ))}
            </div>
            <p className="bill-lede">{clean(bill.plain_summary)}</p>

            {source && (
              <p className={`source-note source-${source}`}>
                {source === 'title_only' ? <InfoIcon weight="bold" /> : <FileTextIcon weight="bold" />}
                {SOURCE_NOTE[source]}
              </p>
            )}

            {facts2.length > 0 && (
              <dl className="bill-facts">
                {facts2.map(([k, v]) => (
                  <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
            )}

            <div className="bill-actions">
              <SaveButton
                bill={bill}
                isSaved={ctx.savedIds.has(bill.id)}
                user={ctx.user}
                onSave={ctx.onSave}
                onUnsave={ctx.onUnsave}
                onRequireSignIn={ctx.onRequireSignIn}
                withLabel
              />
              <VoteButtons
                billId={bill.id}
                votes={ctx.votes[bill.id]}
                userVote={ctx.userVotes[bill.id]}
                user={ctx.user}
                onVote={ctx.onVote}
                onRequireSignIn={ctx.onRequireSignIn}
                size="lg"
              />
              <a className="btn btn-ghost" href={facts.url} target="_blank" rel="noreferrer">
                Official text <ArrowUpRightIcon weight="bold" />
              </a>
            </div>

            <Reveal as="section" className="bill-section">
              <h2>What it does</h2>
              <ol className="provisions">
                {bill.key_provisions?.map((p, i) => (
                  <li key={i}>
                    <span className="provision-num mono">{String(i + 1).padStart(2, '0')}</span>
                    <span>{clean(p)}</span>
                  </li>
                ))}
              </ol>
            </Reveal>

            {bill.why_it_matters && (
              <Reveal as="section" className="bill-section why">
                <h2>Why it matters to you</h2>
                <p className="why-text">{clean(bill.why_it_matters)}</p>
              </Reveal>
            )}

            <Reveal as="section" className="bill-section">
              <h2>Who it affects</h2>
              <p className="bill-prose">{clean(bill.who_it_affects)}</p>
            </Reveal>

            <Reveal as="section" className="bill-section">
              <h2>Where it stands</h2>
              <StageTracker stage={stage} />
              <p className="bill-prose">{clean(bill.status_plain_english)}</p>
              {bill.latest_action_text && (
                <p className="official-action">
                  <span className="mono">Official record{bill.latest_action_date ? `, ${formatDate(bill.latest_action_date)}` : ''}:</span> {bill.latest_action_text}
                </p>
              )}
            </Reveal>

            {bill.original_title && (
              <Reveal as="section" className="bill-section official">
                <h2>Official title</h2>
                <p>{bill.original_title}</p>
              </Reveal>
            )}
          </div>
        </div>

        {(prev || next) && (
          <nav className="pager" aria-label="More bills">
            {prev ? (
              <a href={billHref(prev.id)} className="pager-link">
                <span className="pager-dir"><ArrowLeftIcon /> Newer</span>
                <span className="pager-title">{clean(prev.plain_title)}</span>
              </a>
            ) : <span />}
            {next && (
              <a href={billHref(next.id)} className="pager-link pager-next">
                <span className="pager-dir">Older <ArrowRightIcon /></span>
                <span className="pager-title">{clean(next.plain_title)}</span>
              </a>
            )}
          </nav>
        )}
      </div>
    </article>
  )
}
