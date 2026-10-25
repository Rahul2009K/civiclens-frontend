// The Billshelf scales mark.
export function ScalesMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M32 6c-4.5 0-7.8 2.4-7.8 2.4S28 11.4 32 11.4s7.8-2.6 7.8-2.6S36.5 6 32 6Z" fill="currentColor" />
      <path d="M32 6v46" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M13 15h38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="15" r="3.2" fill="currentColor" />
      <g strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 15 4 34M13 15l9 19M3 34c0 5 4.5 9 10 9s10-4 10-9" />
        <path d="M51 15l-9 19M51 15l9 19M41 34c0 5 4.5 9 10 9s10-4 10-9" />
      </g>
      <path d="M20 57h24M32 52v5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M21.5 51h21l-3 6h-15Z" fill="currentColor" />
    </svg>
  )
}

export function Wordmark() {
  return (
    <span className="wordmark">
      <ScalesMark className="wordmark-mark" />
      <span className="wordmark-text">Billshelf</span>
    </span>
  )
}
