import { ArrowRightIcon } from '@phosphor-icons/react'
import ParticleCapitol from '../components/ParticleCapitol'
import BillStack from '../components/BillStack'
import BillIndex from '../components/BillIndex'
import Reveal from '../components/Reveal'

export default function Home({ bills, loading, error, onRetry, theme, ctx }) {
  const newest = bills.slice(0, 6)

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">119th Congress</p>
            <h1 className="hero-title">
              Congress, in <em>plain English.</em>
            </h1>
            <p className="hero-sub">
              New bills from the 119th Congress, rewritten by Claude so anyone can follow what lawmakers are proposing.
            </p>
            <div className="hero-ctas">
              <a href="#/bills" className="btn btn-primary btn-lg">
                Browse bills <ArrowRightIcon weight="bold" />
              </a>
              <a href="#/how" className="btn btn-ghost btn-lg">How it works</a>
            </div>
          </div>
          <div className="hero-visual">
            <ParticleCapitol theme={theme} />
          </div>
        </div>
      </section>

      <section className="section stack-section" aria-labelledby="stack-heading">
        <div className="container stack-layout">
          <Reveal className="stack-copy">
            <h2 id="stack-heading" className="section-title">Just in from Congress.</h2>
            <p className="section-lede">
              The six newest bills on the docket. Pick one off the stack to read it.
            </p>
          </Reveal>
          <div className="stack-holder">
            {loading || error || newest.length === 0 ? (
              <div className="stack-placeholder" aria-hidden="true" />
            ) : (
              <BillStack bills={newest} />
            )}
          </div>
        </div>
      </section>

      <section id="bills" className="section bills-section" aria-labelledby="bills-heading">
        <div className="container">
          <Reveal>
            <h2 id="bills-heading" className="section-title">Every bill, decoded.</h2>
            <p className="section-lede">
              Search by keyword or bill number, filter by topic, and open any bill for the full breakdown.
            </p>
          </Reveal>
          <BillIndex bills={bills} loading={loading} error={error} onRetry={onRetry} ctx={ctx} />
        </div>
      </section>

      <section id="how" className="section how-section" aria-labelledby="how-heading">
        <div className="container how-layout">
          <Reveal className="how-copy">
            <p className="eyebrow">How it works</p>
            <h2 id="how-heading" className="section-title section-title-lg">
              From legal text to a two‑minute read.
            </h2>
          </Reveal>
          <ol className="pipeline">
            <Reveal as="li" delay={0}>
              <span className="pipeline-source mono">Congress.gov</span>
              <p>We pull the newest bills, their official summaries and latest actions straight from the Library of Congress.</p>
            </Reveal>
            <Reveal as="li" delay={0.08}>
              <span className="pipeline-source mono">Claude</span>
              <p>Claude rewrites each one for a reader with no legal background: what it does, who it affects, where it stands.</p>
            </Reveal>
            <Reveal as="li" delay={0.16}>
              <span className="pipeline-source mono">You</span>
              <p>Read, save bills to your watchlist, and give a thumbs up or down to the ones you care about.</p>
            </Reveal>
          </ol>
        </div>
      </section>
    </>
  )
}
