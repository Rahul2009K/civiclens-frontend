# Billshelf (website)

**Live:** https://civiclens-frontend-gilt.vercel.app

Billshelf explains the 100 newest bills in the U.S. Congress in plain English, for high school students and anyone without a civics or legal background. Every bill gets a short summary, its key provisions, who it affects, why it matters to a young person, and where it stands in the lawmaking process.

This repo is the website. The data pipeline and API live in the [backend repo](https://github.com/Rahul2009K/CivicLens).

## Features

- **Bookcase of the newest bills.** The ten newest bills stand spine-out in a wooden bookcase in clashing jacket colors. Hover pulls one forward; clicking plays an animation where the book flies forward, opens, and riffles its pages.
- **Every bill is a book.** Each topic has its own flat illustration (a courthouse, a globe with a handshake, a chart, a classroom, a family arriving home, a heartbeat, mountains, an AI chip, protest signs, a debate podium) drawn in SVG, with small animations. Hovering a book slowly spins it to show the back cover summary.
- **Bill pages** with the plain-English summary, key provisions, "why it matters to you", the sponsor, dates, a five-step progress tracker with a "how a bill becomes a law" explainer, and a link to the official text.
- **Source labels.** Each summary says whether it was written from the official Congressional Research Service summary, the full bill text, or the title only.
- **Search** by keyword or bill number, **filter** by topic, **sort** by newest or most liked.
- **Google sign-in** to save bills to a watchlist and vote. Firestore rules allow one vote per account per bill.
- **Effects:** click sparkles everywhere, and synthesized sound effects (page turns, books opening and closing, chimes) with a mute button. No audio files; everything is generated with the Web Audio API.
- Light and dark themes, works on phones, respects the "reduce motion" accessibility setting.

## How it works

```
Congress.gov API --> generate_cache.py --> Claude (structured JSON) --> bills_cache.json
                                                                          |
                     public/bills.json (instant first load) <-------------+
                     Flask API on Render (/bills) <-----------------------+
                                   |
                    this React site on Vercel -- Firebase (sign-in, votes, watchlist)
```

The site renders from the bundled `public/bills.json` immediately, then swaps in the live API response. That way the free Render server's cold start never blocks a visitor.

## Tech

React 19, Vite, Motion (animation), Phosphor icons, self-hosted Newsreader and Geist fonts, Firebase Auth and Firestore. The particle Capitol and the 3D books are written from scratch with Canvas 2D and CSS 3D transforms. No 3D library is used.

## Project layout

```
src/
  App.jsx              routing, data loading, auth, votes, the book-opening animation
  pages/               Home, BillPage, Watchlist, About
  components/          Header, Bookshelf, Book, BookOpener, BillIndex, BillTile,
                       ParticleCapitol, CoverIllustration, ClickSparks, StageTracker, ...
  lib/bills.js         bill numbers, stages, sponsors, dates, topic palettes
  lib/useHashRoute.js  tiny hash router (#/bill/<id>, #/about, ...)
  lib/sfx.js           synthesized sound effects (Web Audio API)
  content/about.js     About page copy
  firebase.js          auth, watchlist and vote helpers
firestore.rules        security rules (one vote per account per bill)
public/bills.json      snapshot written by the backend's generate_cache.py
```

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173 (expects the API on http://localhost:5000)
npm test           # unit tests (Vitest)
npm run lint
npm run build
```

Set `VITE_BACKEND_URL` to point at a different API. Production uses `.env.production`.

Deploy Firestore rules with `npx firebase-tools deploy --only firestore:rules`.

## Credits

Bill data: [Congress.gov API](https://api.congress.gov/). Summaries: Claude by Anthropic. All cover illustrations are original SVG drawings in `src/components/CoverIllustration.jsx`.
