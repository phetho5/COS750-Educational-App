import { Card } from './ui'
import styles from './DijkstraCommonMistakes.module.css'

const mistakes = [
  {
    mistakenIdea: 'Choose alphabetically or choose the vertex reached first.',
    correction: 'Compare the tentative distances of all unvisited vertices. Visit the one with the smallest total distance, whatever its letter or discovery order.',
  },
  {
    mistakenIdea: 'Choose the edge with the smallest weight.',
    correction: 'Choose using total distance from the start. A route can use more edges and still cost less: A-D-B costs 2 + 1 = 3, less than the direct A-B edge of 4.',
  },
  {
    mistakenIdea: 'The new distance is just the edge weight.',
    correction: 'Add the current vertex distance to the edge weight. For D-B, that is 2 + 1 = 3, not 1.',
  },
  {
    mistakenIdea: 'Update the neighbour every time an edge is checked.',
    correction: 'Compare the candidate total with its current distance. Keep the smaller value: checking F-C gives 8 + 3 = 11, so C keeps 10.',
  },
  {
    mistakenIdea: 'A distance is final as soon as a vertex is reached.',
    correction: 'A distance stays tentative until its vertex is chosen as the unvisited vertex with the smallest distance. B can change from 4 to 3 before it is visited.',
  },
] as const

export function DijkstraCommonMistakes() {
  return (
    <Card className={styles.card}>
      <section aria-labelledby="common-mistakes-title" className={styles.section}>
        <div>
          <h2 id="common-mistakes-title" className={styles.title}>Common mistakes</h2>
          <p>Try to spot the mistaken idea before opening its correction.</p>
        </div>
        <div className={styles.list}>
          {mistakes.map(({ mistakenIdea, correction }) => (
            <details className={styles.item} key={mistakenIdea}>
              <summary>{mistakenIdea}</summary>
              <p><strong>Better rule:</strong> {correction}</p>
            </details>
          ))}
        </div>
      </section>
    </Card>
  )
}
