/*
  Your turn (learning path step 5): the app has visited A and D. The student
  chooses each next vertex on the graph, types the new distances of its
  neighbours into the table, and presses Check after each step.

  All the rules are in src/questions/yourTurn.ts (checked against the
  engine). This component only shows the state and passes on what the
  student does.
*/
import { useState, type ReactNode } from 'react'
import { SAMPLE_GRAPH, SAMPLE_START, type VertexId } from '../engine'
import {
  currentVertex,
  layoutById,
  neighboursToUpdate,
  pickVertex,
  startYourTurn,
  submitDistances,
  visitedSoFar,
  type YourTurnFeedback,
} from '../questions'
import { yourTurnText as t } from '../content/yourTurnText'
import { DistanceTable, type EditableCell } from './DistanceTable'
import { GraphLegend } from './GraphLegend'
import { pathEdges, statesFrom } from './graphHelpers'
import { GraphView } from './GraphView'
import { Button, Card, Feedback } from './ui'
import ui from './ui.module.css'
import styles from './YourTurn.module.css'

const layout = layoutById('sample')
const fresh = () => startYourTurn(SAMPLE_GRAPH, SAMPLE_START)

export function YourTurn({ doneAction }: { doneAction?: ReactNode }) {
  const [state, setState] = useState(fresh)
  const [selected, setSelected] = useState<VertexId | null>(null)
  const [typed, setTyped] = useState<Record<VertexId, string>>({})
  const [feedback, setFeedback] = useState<YourTurnFeedback | null>(null)

  const current = currentVertex(state)
  const neighbours = neighboursToUpdate(state)
  const visited = visitedSoFar(state)
  const unvisited = SAMPLE_GRAPH.vertices.filter((v) => !visited.includes(v) && v !== current)
  const canCheck = state.phase === 'pick' ? selected !== null : state.phase === 'update'

  function check() {
    const move = state.phase === 'pick' ? pickVertex(state, selected!) : submitDistances(state, typed)
    setFeedback(move.feedback)
    if (move.feedback.ok) {
      setState(move.state)
      setSelected(null)
      setTyped({})
    }
  }

  function startOver() {
    setState(fresh())
    setSelected(null)
    setTyped({})
    setFeedback(null)
  }

  const editable: Record<VertexId, EditableCell> = {}
  for (const v of neighbours) {
    editable[v] = {
      value: typed[v] ?? '',
      onChange: (value) => setTyped((x) => ({ ...x, [v]: value })),
      ariaLabel: `New distance for ${v}`,
      placeholder: String(state.table[v].distance === Infinity ? '∞' : state.table[v].distance),
    }
  }

  const label = state.phase === 'pick' ? t.pickLabel : state.phase === 'update' ? t.updateLabel(current!) : t.doneLabel
  const instruction =
    state.phase === 'pick'
      ? selected
        ? t.pickChosen(selected)
        : t.pickInstruction
      : state.phase === 'update'
        ? t.updateInstruction(current!, neighbours)
        : t.doneInstruction
  const distances = Object.fromEntries(SAMPLE_GRAPH.vertices.map((v) => [v, state.table[v].distance]))
  const changedVertex = Object.keys(state.changed)[0] ?? null

  return (
    <div className={styles.yourTurn}>
      <p className={ui.lead}>{t.intro(visitedSoFar(fresh()))}</p>

      <div className={ui.columns}>
        <div className={ui.mainColumn}>
          <Card>
            <GraphView
              graph={SAMPLE_GRAPH}
              wide={layout.wide}
              narrow={layout.narrow}
              label="Your turn graph"
              states={statesFrom(SAMPLE_GRAPH.vertices, visited, current, selected)}
              distances={distances}
              pathEdges={pathEdges(state.table)}
              changed={changedVertex}
              onVertex={
                state.phase === 'pick'
                  ? (v) => {
                      setSelected(v)
                      setFeedback(null)
                    }
                  : undefined
              }
              selectable={unvisited}
            />
          </Card>
          <GraphLegend showSelected showPath />
          <p className={styles.order}>
            {t.orderSoFar} <strong>{visited.join(', ')}</strong>
          </p>
        </div>

        <div className={ui.sideColumn}>
          <Card>
            <div className={styles.instruction}>
              <p className={styles.stepLabel}>{label}</p>
              <p className={styles.task}>{instruction}</p>
            </div>
          </Card>

          <div aria-live="polite">{feedback && <Feedback kind={feedback.ok ? 'correct' : 'wrong'}>{feedback.text}</Feedback>}</div>

          <DistanceTable
            caption="Distance table"
            table={state.table}
            vertices={SAMPLE_GRAPH.vertices}
            showVisited
            current={current}
            changed={state.phase === 'update' ? {} : state.changed}
            editable={editable}
          />
          {state.phase === 'update' && <p className={`${ui.small} ${ui.muted}`}>{t.updateNote}</p>}

          {state.phase === 'done' && (
            <Card>
              <div className={styles.done}>
                <h2 className={ui.sectionTitle}>{t.doneTitle}</h2>
                <p>
                  {t.doneSummary(
                    visited,
                    SAMPLE_GRAPH.vertices.map((v) => ({ vertex: v, distance: state.table[v].distance })),
                  )}
                </p>
                {doneAction}
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className={ui.stickyBar}>
        <div className={`${ui.stickyBarInner} ${styles.bar}`}>
          <Button variant="text" icon="restart" onClick={startOver}>
            {t.startOver}
          </Button>
          {state.phase !== 'done' && (
            <Button spread iconAfter="check" onClick={check} disabled={!canCheck} className={styles.check}>
              Check
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
