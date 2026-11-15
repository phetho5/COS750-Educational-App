/*
  The app shell: the header, and the screen for the current URL.
  Progress is shared with every screen through <ProgressProvider>.
*/
import { useEffect } from 'react'
import { unlockForDemo } from './progress'
import { useCurrentPath } from './routing/router'
import { parseRoute, paths, type Route } from './routing/routes'
import { Header } from './components/Header'
import { useProgress } from './components/progressContext'
import { ProgressProvider } from './components/ProgressProvider'
import { CheckScreen } from './screens/CheckScreen'
import { MapScreen } from './screens/MapScreen'
import { ModuleScreen } from './screens/ModuleScreen'
import { NotFoundScreen } from './screens/NotFoundScreen'
import { ReviewScreen } from './screens/ReviewScreen'
import { SummaryScreen } from './screens/SummaryScreen'
import { WelcomeScreen } from './screens/WelcomeScreen'

export default function App() {
  return (
    <ProgressProvider>
      <Shell />
    </ProgressProvider>
  )
}

function Shell() {
  const path = useCurrentPath()
  const route = parseRoute(path)
  useDemoSwitch()

  // Each new page starts at the top, like a normal website.
  // The braces matter: an effect may only return a clean-up function, and newer
  // browsers return a Promise from scrollTo (handoff B11).
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [path])

  return (
    <>
      <Header />
      <main id="main">
        <Screen key={path} route={route} />
      </main>
    </>
  )
}

function Screen({ route }: { route: Route }) {
  switch (route.page) {
    case 'welcome':
      return <WelcomeScreen />
    case 'map':
      return <MapScreen />
    case 'module':
      return <ModuleScreen moduleId={route.moduleId} />
    case 'check':
      return <CheckScreen checkId={route.checkId} />
    case 'review':
      return <ReviewScreen checkId={route.checkId} />
    case 'summary':
      return <SummaryScreen />
    case 'not-found':
      return <NotFoundScreen />
  }
}

/**
 * The hidden demo switch (handoff D6): opening /map?demo=unlock opens every
 * module for the live demo. The query is then removed from the address bar,
 * so it isn't bookmarked or shared by accident.
 */
function useDemoSwitch() {
  const { update } = useProgress()
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('demo') !== 'unlock') return
    update(unlockForDemo)
    window.history.replaceState(null, '', window.location.pathname || paths.map)
  }, [update])
}
