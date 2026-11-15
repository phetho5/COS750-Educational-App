/*
  Welcome: the hook, the estimated time, the learning objectives and a Start
  button (CLAUDE.md). The graph shows the finished sample graph: the student
  will be able to work out every number on it by the end.
*/
import { dijkstra, SAMPLE_GRAPH, SAMPLE_START } from '../engine'
import { layoutById } from '../questions'
import { OBJECTIVES } from '../content/modules'
import { welcomeText as t } from '../content/welcomeText'
import { navigate } from '../routing/router'
import { paths } from '../routing/routes'
import { pathEdges } from '../components/graphHelpers'
import { GraphView } from '../components/GraphView'
import { Button } from '../components/ui'
import ui from '../components/ui.module.css'
import styles from './WelcomeScreen.module.css'

const layout = layoutById('sample')
const finished = dijkstra(SAMPLE_GRAPH, SAMPLE_START).finalTable

export function WelcomeScreen() {
  return (
    <div className={`${ui.page} ${styles.welcome}`}>
      <div className={styles.hero}>
        <div className={styles.intro}>
          <p className={ui.eyebrow}>{t.eyebrow}</p>
          <h1 className={ui.pageTitle}>{t.title}</h1>
          <p className={styles.hook}>{t.hook}</p>
          <dl className={styles.facts}>
            {t.facts.map((f) => (
              <div key={f.term}>
                <dt>{f.term}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
          <Button large spread iconAfter="arrowRight" className={styles.start} onClick={() => navigate(paths.map)}>
            {t.start}
          </Button>
        </div>
        <figure className={`${ui.card} ${styles.figure}`}>
          <GraphView
            graph={SAMPLE_GRAPH}
            wide={layout.wide}
            narrow={layout.narrow}
            label="Example graph with the shortest distance from A to every vertex"
            states={Object.fromEntries(SAMPLE_GRAPH.vertices.map((v) => [v, 'visited' as const]))}
            distances={Object.fromEntries(SAMPLE_GRAPH.vertices.map((v) => [v, finished[v].distance]))}
            pathEdges={pathEdges(finished)}
          />
          <figcaption className={`${ui.small} ${ui.muted}`}>{t.graphCaption}</figcaption>
        </figure>
      </div>

      <section className={styles.objectives} aria-labelledby="objectives-title">
        <h2 id="objectives-title" className={styles.objectivesTitle}>
          {t.objectivesTitle}
        </h2>
        <ol className={styles.objectiveList}>
          {OBJECTIVES.map((o) => (
            <li key={o.id} className={ui.card}>
              <span className={styles.number} aria-hidden="true">
                {o.id}
              </span>
              <span>{o.text}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
