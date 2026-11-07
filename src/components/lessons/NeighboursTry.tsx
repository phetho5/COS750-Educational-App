/*
  Module 1, Try: select every neighbour of A on the graph, then Check.
  The right answer comes from the graph itself (neighboursOf), not from a
  hand-written list.
*/
import { useState } from 'react'
import { SAMPLE_GRAPH, type VertexId } from '../../engine'
import { layoutById } from '../../questions'
import { lessonUiText as t, neighboursTryText as text } from '../../content/lessons'
import { GraphView } from '../GraphView'
import { Button, Card, Feedback } from '../ui'
import ui from '../ui.module.css'
import { neighboursFeedback, type ActivityFeedback } from './lessonLogic'
import styles from './lessons.module.css'

const layout = layoutById('sample')
const target = text.vertex

export function NeighboursTry() {
  const [selected, setSelected] = useState<VertexId[]>([])
  const [result, setResult] = useState<ActivityFeedback | null>(null)

  function toggle(v: VertexId) {
    setResult(null)
    setSelected((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v].sort()))
  }

  return (
    <div className={ui.columns}>
      <div className={ui.mainColumn}>
        <Card>
          <GraphView
            graph={SAMPLE_GRAPH}
            wide={layout.wide}
            narrow={layout.narrow}
            start={null}
            label={`Select the neighbours of ${target}`}
            states={Object.fromEntries(selected.map((v) => [v, 'selected' as const]))}
            onVertex={toggle}
            selectable={SAMPLE_GRAPH.vertices.filter((v) => v !== target)}
          />
        </Card>
      </div>
      <div className={ui.sideColumn}>
        <h2 className={styles.taskTitle}>{text.question(target)}</h2>
        <p className={ui.muted}>{text.instruction}</p>
        <p>
          {t.selected} <strong>{selected.length ? selected.join(', ') : t.nothingYet}</strong>
        </p>
        <div aria-live="polite">{result && <Feedback kind={result.ok ? 'correct' : 'wrong'}>{result.text}</Feedback>}</div>
        <div className={ui.row}>
          <Button spread iconAfter="check" onClick={() => setResult(neighboursFeedback(SAMPLE_GRAPH, target, selected))}>
            {t.check}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setSelected([])
              setResult(null)
            }}
          >
            {t.clear}
          </Button>
        </div>
      </div>
    </div>
  )
}
