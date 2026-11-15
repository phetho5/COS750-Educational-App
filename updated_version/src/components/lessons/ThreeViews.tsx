/*
  Module 2: one graph, three views (the drawing, the adjacency matrix and
  the adjacency list). Selecting an edge in one view highlights it in the
  others (CLAUDE.md, learning path step 2).

  - Watch: steps through every edge on its own (or with Back and Next).
  - Try: the student is asked to find a given edge in the matrix or list.

  The matrix and list are built from the graph, so they can't disagree
  with the drawing.
*/
import { useState } from 'react'
import { neighboursOf, SAMPLE_GRAPH, type VertexId } from '../../engine'
import { createRng, layoutById, randomSeed } from '../../questions'
import { lessonUiText as ui_t, threeViewsText as t } from '../../content/lessons'
import { cx } from '../classNames'
import { edgeKey, type EdgePair } from '../graphHelpers'
import { GraphView } from '../GraphView'
import { Button, Feedback } from '../ui'
import { useStepPlayer } from '../useStepPlayer'
import ui from '../ui.module.css'
import { weightBetween } from './lessonLogic'
import styles from './lessons.module.css'

const graph = SAMPLE_GRAPH
const layout = layoutById('sample')
const EDGES: EdgePair[] = graph.edges.map((e) => [e.from, e.to])

export function ThreeViewsWatch() {
  const player = useStepPlayer(EDGES.length, 3000)
  const edge = EDGES[player.step]
  return (
    <div className={styles.views}>
      <EdgeSummary edge={edge} />
      <div className={ui.row}>
        <Button variant="secondary" icon="chevronLeft" onClick={player.back} disabled={player.atStart}>
          Back
        </Button>
        <Button icon={player.playing ? 'pause' : 'play'} onClick={player.togglePlay}>
          {player.playing ? ui_t.pause : 'Play'}
        </Button>
        <Button variant="secondary" iconAfter="chevronRight" onClick={player.next} disabled={player.atEnd}>
          Next
        </Button>
        <span className={`${ui.small} ${ui.muted}`}>
          Edge {player.step + 1} of {EDGES.length}
        </span>
      </div>
      <Views selected={edge} />
    </div>
  )
}

export function ThreeViewsTry() {
  const [rng] = useState(() => createRng(randomSeed()))
  const [target, setTarget] = useState<EdgePair>(() => rng.pick(EDGES))
  const [selected, setSelected] = useState<EdgePair | null>(null)

  const right = selected !== null && edgeKey(...selected) === edgeKey(...target)
  const weight = (e: EdgePair) => weightBetween(graph, e[0], e[1])!

  function nextTask() {
    const others = EDGES.filter((e) => edgeKey(...e) !== edgeKey(...target))
    setTarget(rng.pick(others))
    setSelected(null)
  }

  return (
    <div className={styles.views}>
      <h2 className={styles.taskTitle}>{t.task(target[0], target[1])}</h2>
      <div aria-live="polite">
        {selected &&
          (right ? (
            <Feedback
              kind="correct"
              action={
                <Button variant="secondary" className={styles.selfStart} onClick={nextTask}>
                  {t.nextTask}
                </Button>
              }
            >
              {t.taskRight(target[0], target[1], weight(target))}
            </Feedback>
          ) : (
            <Feedback kind="wrong">{t.taskWrong(selected[0], selected[1])}</Feedback>
          ))}
      </div>
      <Views selected={selected} onSelect={setSelected} />
    </div>
  )
}

function EdgeSummary({ edge }: { edge: EdgePair }) {
  return (
    <div aria-live="polite" className={styles.edgeSummary}>
      <p className={styles.edgeTitle}>{t.edgeTitle(edge[0], edge[1], weightBetween(graph, edge[0], edge[1])!)}</p>
      <p>{t.edgeExplain(edge[0], edge[1])}</p>
    </div>
  )
}

/** The three views side by side. `onSelect` makes every edge, cell and list item selectable. */
function Views({ selected, onSelect }: { selected: EdgePair | null; onSelect?: (e: EdgePair) => void }) {
  const selectedKey = selected ? edgeKey(...selected) : null
  const touches = (v: VertexId) => selected !== null && selected.includes(v)

  return (
    <div className={ui.columns}>
      <section className={`${ui.card} ${styles.drawing}`}>
        <h2 className={ui.sectionTitle}>{t.drawing}</h2>
        <GraphView
          graph={graph}
          wide={layout.wide}
          narrow={layout.narrow}
          start={null}
          label={onSelect ? 'Graph drawing. Select an edge.' : 'Graph drawing'}
          highlightEdge={selected}
          onEdge={onSelect}
        />
      </section>

      <section className={`${ui.card} ${styles.matrix}`}>
        <h2 className={ui.sectionTitle}>{t.matrix}</h2>
        <table className={styles.matrixTable}>
          <thead>
            <tr>
              <td />
              {graph.vertices.map((c) => (
                <th key={c} scope="col" className={cx(touches(c) && styles.headOn)}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {graph.vertices.map((r) => (
              <tr key={r}>
                <th scope="row" className={cx(touches(r) && styles.headOn)}>
                  {r}
                </th>
                {graph.vertices.map((c) => {
                  const w = r === c ? null : weightBetween(graph, r, c)
                  if (w === null) {
                    return (
                      <td key={c}>
                        <span className={styles.zero}>0</span>
                      </td>
                    )
                  }
                  const on = edgeKey(r, c) === selectedKey
                  return (
                    <td key={c}>
                      {onSelect ? (
                        <button
                          type="button"
                          aria-pressed={on}
                          aria-label={t.cellLabel(r, c, w)}
                          className={cx(styles.cell, on && styles.on)}
                          onClick={() => onSelect([r, c])}
                        >
                          {w}
                        </button>
                      ) : (
                        <span className={cx(styles.cell, on && styles.on)}>{w}</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className={`${ui.small} ${ui.muted}`}>{t.matrixNote}</p>
      </section>

      <section className={`${ui.card} ${styles.list}`}>
        <h2 className={ui.sectionTitle}>{t.list}</h2>
        <ul className={styles.adjList}>
          {graph.vertices.map((v) => (
            <li key={v}>
              <span className={styles.listVertex}>{v}</span>
              {neighboursOf(graph, v).map((n) => {
                const on = edgeKey(v, n.vertex) === selectedKey
                const label = `${n.vertex} · ${n.weight}`
                return onSelect ? (
                  <button
                    key={n.vertex}
                    type="button"
                    aria-pressed={on}
                    aria-label={t.listLabel(v, n.vertex, n.weight)}
                    className={cx(styles.listItem, on && styles.on)}
                    onClick={() => onSelect([v, n.vertex])}
                  >
                    {label}
                  </button>
                ) : (
                  <span key={n.vertex} className={cx(styles.listItem, on && styles.on)}>
                    {label}
                  </span>
                )
              })}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
