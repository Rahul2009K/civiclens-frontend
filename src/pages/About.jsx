import { ArrowUpRightIcon } from '@phosphor-icons/react'
import Reveal from '../components/Reveal'
import { ScalesMark } from '../components/Brand'
import { ABOUT } from '../content/about'

export default function About({ billCount }) {
  return (
    <article className="about">
      <section className="about-hero">
        <div className="container about-hero-inner">
          <Reveal className="about-hero-copy">
            <p className="eyebrow">About CivicLens</p>
            <h1 className="about-title">{ABOUT.headline}</h1>
            <p className="about-intro">{ABOUT.intro}</p>
          </Reveal>
          <Reveal className="about-card" delay={0.1}>
            <ScalesMark className="about-card-mark" />
            <dl className="about-stats">
              <div><dt>Bills explained</dt><dd className="mono">{billCount || 100}</dd></div>
              <div><dt>Congress</dt><dd className="mono">119th</dd></div>
              <div><dt>Reading level</dt><dd>High school</dd></div>
              <div><dt>Cost to use</dt><dd>Free</dd></div>
            </dl>
          </Reveal>
        </div>
      </section>

      <div className="container about-body">
        {ABOUT.story.map((block) => (
          <Reveal as="section" className="about-row" key={block.heading}>
            <h2>{block.heading}</h2>
            <div className="about-prose">
              {block.paragraphs.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
            </div>
          </Reveal>
        ))}

        <Reveal as="section" className="about-row">
          <h2>How it stays accurate</h2>
          <ul className="about-list">
            {ABOUT.accuracy.map((t) => <li key={t.slice(0, 24)}>{t}</li>)}
          </ul>
        </Reveal>

        <Reveal as="section" className="about-row">
          <h2>Your privacy</h2>
          <ul className="about-list">
            {ABOUT.privacy.map((t) => <li key={t.slice(0, 24)}>{t}</li>)}
          </ul>
        </Reveal>

        <Reveal as="section" className="about-row">
          <h2>Built with</h2>
          <dl className="about-stack">
            {ABOUT.builtWith.map(([name, what]) => (
              <div key={name}><dt>{name}</dt><dd>{what}</dd></div>
            ))}
          </dl>
        </Reveal>

        <Reveal as="section" className="about-row" id="credits">
          <h2>Photo credits</h2>
          <ul className="about-credits">
            {ABOUT.credits.map(([what, who, where, url]) => (
              <li key={what}>
                <span className="about-credit-what">{what}</span>
                <a href={url} target="_blank" rel="noreferrer">{who}, {where} <ArrowUpRightIcon /></a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </article>
  )
}
