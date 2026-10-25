import { STAGES, STAGE_HELP } from '../lib/bills'

// How far a bill has travelled: introduced through signed into law.
export default function StageTracker({ stage, compact = false }) {
  if (compact) {
    return (
      <span className="stage-compact" title={`Step ${stage + 1} of ${STAGES.length}: ${STAGES[stage]}. ${STAGE_HELP[stage]}`}>
        <span className="stage-pips" aria-hidden="true">
          {STAGES.map((s, i) => (
            <i key={s} className={i <= stage ? 'on' : ''} />
          ))}
        </span>
        {STAGES[stage]}
      </span>
    )
  }

  return (
    <div className="stage-wrap">
      <ol className="stage-track" aria-label="Legislative progress">
        {STAGES.map((s, i) => (
          <li
            key={s}
            className={i < stage ? 'done' : i === stage ? 'current' : ''}
            aria-current={i === stage ? 'step' : undefined}
          >
            <span className="stage-node" aria-hidden="true" />
            <span className="stage-name">{s}</span>
          </li>
        ))}
      </ol>
      <details className="civics">
        <summary>How does a bill become a law?</summary>
        <dl>
          {STAGES.map((s, i) => (
            <div key={s} className={i === stage ? 'is-current' : ''}>
              <dt>{s}</dt>
              <dd>{STAGE_HELP[i]}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  )
}
