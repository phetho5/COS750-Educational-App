/*
  Module 1, Watch: the example graph appears in four parts (vertices, edges,
  weights, directed or not), from the design. Play runs through them; the
  numbered buttons jump to a part.
*/
import { SAMPLE_GRAPH } from '../../engine'
import { layoutById } from '../../questions'
import { GRAPH_PARTS, lessonUiText as t } from '../../content/lessons'
import { cx } from '../classNames'
import { GraphView } from '../GraphView'
import { Button, Card } from '../ui'
import { useStepPlayer } from '../useStepPlayer'
import ui from '../ui.module.css'
import styles from './lessons.module.css'

const layout = layoutById('sample')
const DIRECTED = { ...SAMPLE_GRAPH, directed: true }

export function GraphPartsWatch() {
  const player = useStepPlayer(GRAPH_PARTS.length, 2600)
  const part = GRAPH_PARTS[player.step]
  const reveal = Math.min(3, player.step + 1) as 1 | 2 | 3
  const showArrows = player.step === GRAPH_PARTS.length - 1

  return (
    <div className={ui.columns}>
      <div className={ui.mainColumn}>
        <Card>
          <GraphView
            graph={showArrows ? DIRECTED : SAMPLE_GRAPH}
            wide={layout.wide}
            narrow={layout.narrow}
            start={null}
            reveal={reveal}
            label="Animated example graph"
            description={part.caption}
          />
        </Card>
      </div>
      <div className={ui.sideColumn}>
        <p className={styles.partTitle}>{t.partOf(player.step + 1, GRAPH_PARTS.length, part.title)}</p>
        <p aria-live="polite" className={styles.caption}>
          {part.caption}
        </p>
        <div className={ui.row}>
          {GRAPH_PARTS.map((p, i) => (
            <button
              key={p.title}
              type="button"
              className={cx(styles.dot, i === player.step && styles.dotOn)}
              aria-label={`Part ${i + 1}: ${p.title}`}
              aria-current={i === player.step ? 'step' : undefined}
              onClick={() => player.goTo(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <Button icon={player.playing ? 'pause' : 'play'} className={styles.selfStart} onClick={player.playing ? player.togglePlay : player.playFromStart}>
          {player.playing ? t.pause : t.playFromStart}
        </Button>
      </div>
    </div>
  )
}
