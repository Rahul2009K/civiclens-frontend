import { AnimatePresence } from 'motion/react'
import { GoogleLogoIcon } from '@phosphor-icons/react'
import BillTile from '../components/BillTile'

export default function Watchlist({ bills, savedBills, ctx }) {
  // Prefer the freshest copy from the current batch; fall back to the saved snapshot.
  const byId = new Map(bills.map((b) => [b.id, b]))
  const list = savedBills.map((b) => byId.get(b.id) || b)

  return (
    <section className="section watchlist">
      <div className="container">
        <h1 className="section-title section-title-lg">Your watchlist.</h1>
        {!ctx.user ? (
          <div className="empty">
            <p>Sign in to save bills and come back to them later.</p>
            <button type="button" className="btn btn-primary" onClick={ctx.onRequireSignIn}>
              <GoogleLogoIcon weight="bold" /> Sign in with Google
            </button>
          </div>
        ) : list.length === 0 ? (
          <div className="empty">
            <p>Nothing saved yet. Tap the bookmark on any bill to keep it here.</p>
            <a href="#/bills" className="btn btn-primary">Browse bills</a>
          </div>
        ) : (
          <>
            <p className="section-lede">{list.length} saved {list.length === 1 ? 'bill' : 'bills'}</p>
            <div className="grid">
              <AnimatePresence mode="popLayout" initial={false}>
                {list.map((bill, i) => (
                  <BillTile key={bill.id} bill={bill} index={i} ctx={ctx} />
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
