// Plain left-clicks on a book play the opening animation; modified clicks
// (cmd/ctrl/shift, middle button) keep normal link behaviour, like new tabs.
export function openOnClick(e, bill, ctx) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
  const book = e.currentTarget.querySelector('.book')
  if (!book || !ctx.openBook) return
  e.preventDefault()
  ctx.openBook(bill, book.getBoundingClientRect())
}
