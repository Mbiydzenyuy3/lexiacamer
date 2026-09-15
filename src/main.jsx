import React, { useState, useEffect, lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import ErrorBoundary from './ErrorBoundary'
import Landing from './Landing'
import { retryPendingTester } from './lib/supabase'
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
 * Landing is a STATIC import, unlike the other two: it is what almost everyone
 * sees first, and making it lazy would only buy a second round trip before the
 * first paint. On a high-latency connection a round trip costs more than the
 * 6KB it saves.
 */

const EarlyTester = lazy(() => import('./EarlyTester'))
const App = lazy(() => import('./App'))

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

function Root() {
  // Remembered per device, so a tester is never asked twice: once they have
  // joined, every later visit opens the app directly.
  const [isTester, setIsTester] = useState(() => {
    try { return Boolean(localStorage.getItem('lexia_tester')) } catch { return false }
  })

  // /early-tester skips the landing page and opens the gate directly, so the
  // link already shared on Facebook keeps working and lands where it promised.
  const [showGate, setShowGate] = useState(
    () => window.location.pathname.replace(/\/$/, '') === '/early-tester'
  )

  // A signup stranded by a bad connection goes out on the next load. This
  // downloads nothing unless something is actually waiting to be sent.
  useEffect(() => { retryPendingTester() }, [])

  // Fetch the app in the background while someone reads the landing page, so
  // pressing the button costs nothing. requestIdleCallback keeps it off the
  // critical path on a slow phone; the timeout is the fallback for Safari.
  useEffect(() => {
    if (isTester) return undefined
    let cancelled = false
    const warm = () => {
      if (cancelled) return
      import('./EarlyTester')
      import('./App')
    }
    const ric = window.requestIdleCallback
    const handle = ric ? ric(warm, { timeout: 4000 }) : setTimeout(warm, 2500)
    return () => {
      cancelled = true
      if (ric && window.cancelIdleCallback) window.cancelIdleCallback(handle)
      else clearTimeout(handle)
    }
  }, [isTester])

  let view
  if (!isTester) {
    view = showGate
      ? (
        <EarlyTester
          onStart={() => setIsTester(true)}
          onBack={() => { setShowGate(false); window.scrollTo(0, 0) }}
        />
      )
      : <Landing onStart={() => { setShowGate(true); window.scrollTo(0, 0) }} />
  } else {
    view = <App />
  }

  return <Suspense fallback={<Splash />}>{view}</Suspense>
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </React.StrictMode>,
)
