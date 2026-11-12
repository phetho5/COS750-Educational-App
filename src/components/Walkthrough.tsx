/*
  The Dijkstra walkthrough (learning path step 4): the graph, the distance
  table, a plain-language explanation of each step, collapsible pseudocode
  with the current lines highlighted, and controls (back, next, play/pause,
  speed, restart). The arrow keys also move between steps.

  Every step comes from the engine (D22), so going back just shows an
  earlier step. Nothing has to be undone.
*/
import { useEffect, useMemo, useState } from 'react'
import { dijkstra, SAMPLE_GRAPH, SAMPLE_START, type DijkstraStep, type Graph, type VertexId } from '../engine'
import { layoutById, type LayoutSize } from '../questions'
import { PSEUDOCODE, pseudocodeLines, stepExplanation, stepTitle } from '../content/walkthroughText'
import { DistanceTable } from './DistanceTable'
import { GraphLegend } from './GraphLegend'
import { pathEdges, statesFrom } from './graphHelpers'
import { GraphView } from './GraphView'
import { Icon } from './Icon'
import { Button, Card } from './ui'
import { SPEEDS, useStepPlayer, type Speed } from './useStepPlayer'
import ui from './ui.module.css'
import styles from './Walkthrough.module.css'

interface WalkthroughProps {
  graph?: Graph
  start?: VertexId
  wide?: LayoutSize
  narrow?: LayoutSize
}

const sampleLayout = layoutById('sample')

/** Which vertex is being visited at this step, if any. */
function currentVertex(step: DijkstraStep): VertexId | null {
  return step.kind === 'visit' || step.kind === 'check-edge' ? step.vertex : null
}

export function Walkthrough({
  graph = SAMPLE_GRAPH,
  start = SAMPLE_START,
  wide = sampleLayout.wide,
  narrow = sampleLayout.narrow,
}: WalkthroughProps) {
  const result = useMemo(() => dijkstra(graph, start), [graph, start])
  const player = useStepPlayer(result.steps.length)
  const [codeOpen, setCodeOpen] = useState(true)

  // Arrow keys move between steps, unless the student is typing or another control used the key.
  const { next, back } = player
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      // Another control (like the Watch/Read/Try tabs) already used this key.
      if (event.defaultPrevented) return
      const tag = (event.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (event.key === 'ArrowRight') next()
      if (event.key === 'ArrowLeft') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, back])

  const step = result.steps[player.step]
  const current = currentVertex(step)
  const visited = graph.vertices.filter((v) => step.table[v].visited && v !== current)
  const activeVisit =
    step.kind === 'check-edge'
      ? result.steps.find((candidateStep) => candidateStep.kind === 'visit' && candidateStep.vertex === step.vertex)
      : null
  const candidates =
    step.kind === 'visit'
      ? step.neighboursToCheck
      : activeVisit?.kind === 'visit'
        ? activeVisit.neighboursToCheck
        : []
  const checking = step.kind === 'check-edge' ? step.neighbour : null
  const distances = Object.fromEntries(graph.vertices.map((v) => [v, step.table[v].distance]))
  const changed = step.kind === 'check-edge' && step.updated ? step.neighbour : null
  const text = stepExplanation(step, result)
  const lines = pseudocodeLines(step)

  return (
    <div className={styles.walkthrough}>
      <p className={styles.stepCount} aria-live="off">
        Step {player.step + 1} of {player.total} <span className={styles.stepTitle}>· {stepTitle(step)}</span>
      </p>

      <div className={ui.columns}>
        <div className={ui.mainColumn}>
          <Card>
            <GraphView
              graph={graph}
              wide={wide}
              narrow={narrow}
              start={start}
              label={`Graph at step ${player.step + 1}`}
              description={`${text} Visited: ${visited.join(', ') || 'none'}.`}
              states={statesFrom(graph.vertices, visited, current, null, candidates, checking)}
              distances={distances}
              checkingEdge={step.kind === 'check-edge' ? [step.vertex, step.neighbour] : null}
              pathEdges={pathEdges(step.table)}
              changed={changed}
            />
          </Card>
          <GraphLegend showChecking showCandidates showPath />
        </div>

        <div className={ui.sideColumn}>
          <Card>
            <div className={styles.explain} aria-live="polite">
              <h2 className={ui.sectionTitle}>What's happening</h2>
              <p>{text}</p>
            </div>
          </Card>

          <DistanceTable
            caption="Distance table"
            table={step.table}
            vertices={graph.vertices}
            showVisited
            current={current}
            changed={changed && step.kind === 'check-edge' ? { [changed]: step.oldDistance } : {}}
            candidates={candidates}
            checking={checking}
          />

          <Card flush>
            <button
              type="button"
              className={styles.codeToggle}
              aria-expanded={codeOpen}
              onClick={() => setCodeOpen(!codeOpen)}
            >
              <span className={ui.sectionTitle}>Pseudocode</span>
              <span className={styles.codeToggleLabel}>
                {codeOpen ? 'Hide' : 'Show'}
                <Icon name="chevronDown" style={{ transform: codeOpen ? 'rotate(180deg)' : 'none' }} />
              </span>
            </button>
            {codeOpen && (
              <ol className={styles.code} aria-label="Dijkstra pseudocode">
                {PSEUDOCODE.map((line, i) => {
                  const on = lines.includes(i + 1)
                  return (
                    <li key={i} className={on ? styles.codeLineOn : styles.codeLine} aria-current={on ? 'step' : undefined}>
                      <span className={styles.lineNumber} aria-hidden="true">
                        {i + 1}
                      </span>
                      <span className={styles.lineText}>{line}</span>
                    </li>
                  )
                })}
              </ol>
            )}
          </Card>
        </div>
      </div>

      <div role="toolbar" aria-label="Walkthrough controls" className={ui.stickyBar}>
        <div className={`${ui.stickyBarInner} ${styles.controls}`}>
          <Button variant="text" icon="restart" onClick={player.restart}>
            Restart
          </Button>
          <Button variant="secondary" icon="chevronLeft" onClick={player.back} disabled={player.atStart} title="Previous step (left arrow key)">
            Back
          </Button>
          <Button className={styles.play} icon={player.playing ? 'pause' : 'play'} onClick={player.togglePlay}>
            {player.playing ? 'Pause' : 'Play'}
          </Button>
          <Button variant="secondary" iconAfter="chevronRight" onClick={player.next} disabled={player.atEnd} title="Next step (right arrow key)">
            Next
          </Button>
          <label className={styles.speed}>
            Speed
            <select value={player.speed} onChange={(e) => player.setSpeed(Number(e.target.value) as Speed)}>
              {SPEEDS.map((s) => (
                <option key={s} value={s}>
                  {s}×
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  )
}
