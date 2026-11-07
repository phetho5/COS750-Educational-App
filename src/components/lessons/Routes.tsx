/*
  Module 3: what "shortest" means.
  - Watch: three routes from A to E are added up one at a time, then the
    shortest is shown.
  - Try: choose the shortest of three routes from A to F. The route with
    the fewest edges is a trap: it isn't the cheapest.
  Every total is added up in code from the graph's weights.
*/
import { useState } from 'react'
import { SAMPLE_GRAPH, type VertexId } from '../../engine'
import { layoutById } from '../../questions'
import { lessonUiText as ui_t, routesText as t } from '../../content/lessons'
import { cx } from '../classNames'
import type { EdgePair } from '../graphHelpers'
import { GraphView } from '../GraphView'
import { Button, Card, Feedback } from '../ui'
import { useStepPlayer } from '../useStepPlayer'
import ui from '../ui.module.css'
import { cheapestRoute, routeCost, routeFeedback, type ActivityFeedback } from './lessonLogic'
import styles from './lessons.module.css'

const layout = layoutById('sample')

function edgesOf(route: readonly VertexId[]): EdgePair[] {
  return route.slice(1).map((v, i) => [route[i], v] as const)
}

const watchCosts = t.watchRoutes.map((r) => routeCost(SAMPLE_GRAPH, r))
const watchBest = cheapestRoute(watchCosts)

export function RoutesWatch() {
  // One step per route, then a last step that shows the winner.
  const player = useStepPlayer(watchCosts.length + 1, 3000)
  const showingBest = player.step === watchCosts.length
  const shown = showingBest ? watchBest : player.step
  const route = watchCosts[shown]

  return (
    <div className={ui.columns}>
      <div className={ui.mainColumn}>
        <Card>
          <GraphView
            graph={SAMPLE_GRAPH}
            wide={layout.wide}
            narrow={layout.narrow}
            label={`Route ${route.route.join(', ')}`}
            pathEdges={edgesOf(route.route)}
          />
        </Card>
      </div>
      <div className={ui.sideColumn}>
        <ol className={styles.routes}>
          {watchCosts.map((c, i) => (
            <li key={i} className={cx(styles.route, i === shown && styles.routeOn, i > player.step && styles.routeLater)}>
              <strong>{t.routeTitle(i + 1)}</strong> <span className={ui.muted}>({t.edges(c.route.length - 1)})</span>
              <br />
              {i <= player.step ? t.routeCost(c.route, c.weights, c.total) : c.route.join(', ')}
            </li>
          ))}
        </ol>
        <p aria-live="polite" className={styles.caption}>
          {showingBest ? t.watchConclusion(route.route, route.total) : t.routeCost(route.route, route.weights, route.total)}
        </p>
        <div className={ui.row}>
          <Button variant="secondary" icon="chevronLeft" onClick={player.back} disabled={player.atStart}>
            Back
          </Button>
          <Button icon={player.playing ? 'pause' : 'play'} onClick={player.playing ? player.togglePlay : player.playFromStart}>
            {player.playing ? ui_t.pause : ui_t.playFromStart}
          </Button>
          <Button variant="secondary" iconAfter="chevronRight" onClick={player.next} disabled={player.atEnd}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

const tryCosts = t.tryRoutes.map((r) => routeCost(SAMPLE_GRAPH, r))

export function RoutesTry() {
  const [chosen, setChosen] = useState<number | null>(null)
  const [result, setResult] = useState<ActivityFeedback | null>(null)
  const shownRoute = chosen === null ? null : tryCosts[chosen].route

  return (
    <div className={ui.columns}>
      <div className={ui.mainColumn}>
        <Card>
          <GraphView
            graph={SAMPLE_GRAPH}
            wide={layout.wide}
            narrow={layout.narrow}
            label="Example graph"
            pathEdges={shownRoute ? edgesOf(shownRoute) : []}
          />
        </Card>
      </div>
      <div className={ui.sideColumn}>
        <h2 className={styles.taskTitle}>{t.tryQuestion(t.tryTarget)}</h2>
        <p className={ui.muted}>{t.tryInstruction}</p>
        <div role="radiogroup" aria-label="Routes" className={styles.choices}>
          {tryCosts.map((c, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={chosen === i}
              className={cx(styles.choice, chosen === i && styles.choiceOn)}
              onClick={() => {
                setChosen(i)
                setResult(null)
              }}
            >
              {c.route.join(', ')}
            </button>
          ))}
        </div>
        <div aria-live="polite">{result && <Feedback kind={result.ok ? 'correct' : 'wrong'}>{result.text}</Feedback>}</div>
        <Button spread iconAfter="check" disabled={chosen === null} onClick={() => setResult(routeFeedback(tryCosts, chosen!))}>
          {ui_t.check}
        </Button>
      </div>
    </div>
  )
}
