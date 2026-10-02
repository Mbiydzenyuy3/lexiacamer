import React, { useState, useEffect, lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import ErrorBoundary from './ErrorBoundary'
import Landing from './Landing'
import { retryPendingTester, retryPendingFeedback } from './lib/supabase'
import './index.css'

/**
 * Entry point, and the gate that decides what to download.
 *
 * The gate lives HERE rather than inside App on purpose. Cameroon has a lot of
 * places with weak and very poor network, and a visitor arriving from the
 * Facebook link is on the worst connection they will ever use this on. If App
 * owned the decision, importing it would drag in every game screen, the word
 * lists, the speech engine and the Supabase client before the landing page
 * could paint — a couple of hundred kilobytes to render some text.
 *
 * Split this way, a first visit downloads React, the landing page and the
 * stylesheet, and nothing else. The app is fetched in the background while
 * they read, so the button is instant when they press it.
 *
 * Landing is a STATIC import, unlike the app: it is what almost everyone
 * sees first, and making it lazy would only buy a second round trip before the
 * first paint. On a high-latency connection a round trip costs more than the
 * 6KB it saves.
 */

// AppRoot, not App: it wraps the app in parent sign-in (see AppRoot.jsx).
const App = lazy(() => import('./AppRoot'))

/** Shown only while a chunk is in flight. Deliberately tiny and instant. */
function Splash() {
  return (
    <div className="boot" role="status" aria-live="polite">
      <img src="/pwa-192x192.png" alt="" className="boot-logo" width="56" height="56" />
      <span className="boot-dots" aria-hidden="true"><i /><i /><i /></span>
      <span className="sr-only">Loading LexiaCamer</span>
    </div>
  )
}

// Set the first time someone presses Start, so every later visit on this
// device opens the app directly. The key is still 'lexia_tester' because the
// early testers already have it: renaming it would show them the landing page
// again.
const STARTED_KEY = 'lexia_tester'

function Root() {
  const [started, setStarted] = useState(() => {
    try { return Boolean(localStorage.getItem(STARTED_KEY)) } catch { return false }
  })

  // /early-tester was the signup page, and the link is still on Facebook.
  // There is no signup any more, so it shows the landing page under its real
  // address.
  useEffect(() => {
    if (window.location.pathname.replace(/\/$/, '') === '/early-tester') {
      window.history.replaceState({}, '', '/')
    }
  }, [])

  const start = () => {
    try { localStorage.setItem(STARTED_KEY, JSON.stringify({ at: Date.now() })) } catch { /* private browsing: they see the landing page next time */ }
    setStarted(true)
    window.scrollTo(0, 0)
  }

  // A signup or a feedback message stranded by a bad connection goes out on
  // the next load. This downloads nothing unless something is actually
  // waiting to be sent.
  useEffect(() => { retryPendingTester(); retryPendingFeedback() }, [])

  // Fetch the app in the background while someone reads the landing page, so
  // pressing the button costs nothing. requestIdleCallback keeps it off the
  // critical path on a slow phone; the timeout is the fallback for Safari.
  useEffect(() => {
    if (started) return undefined
    let cancelled = false
    const warm = () => {
      if (!cancelled) import('./AppRoot').catch(() => { })
    }
    const ric = window.requestIdleCallback && window.cancelIdleCallback
      ? window.requestIdleCallback : null
    const handle = ric ? ric(warm, { timeout: 4000 }) : setTimeout(warm, 2500)
    return () => {
      cancelled = true
      if (ric) window.cancelIdleCallback(handle)
      else clearTimeout(handle)
    }
  }, [started])

  return (
    <Suspense fallback={<Splash />}>
      {started ? <App /> : <Landing onStart={start} />}
    </Suspense>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </React.StrictMode>,
)
