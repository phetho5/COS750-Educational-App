/* The key under a graph: what each vertex and edge style means. */
import styles from './GraphLegend.module.css'

interface GraphLegendProps {
  showChecking?: boolean
  showCandidates?: boolean
  showPath?: boolean
  showSelected?: boolean
}

export function GraphLegend({ showChecking, showCandidates, showPath, showSelected }: GraphLegendProps) {
  return (
    <ul aria-label="Legend" className={styles.legend}>
      <li>
        <span className={styles.unvisited} aria-hidden="true" />
        Unvisited
      </li>
      <li>
        <span className={styles.current} aria-hidden="true" />
        Current
      </li>
      <li>
        <svg viewBox="0 0 22 22" width="22" height="22" aria-hidden="true">
          <circle cx="11" cy="11" r="11" fill="var(--color-blue)" />
          <path d="m6.5 11.5 3 3 6-6.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Visited
      </li>
      {showCandidates && (
        <li>
          <span className={styles.candidate} aria-hidden="true" />
          Candidate vertex
        </li>
      )}
      {showSelected && (
        <li>
          <span className={styles.selected} aria-hidden="true" />
          Your choice
        </li>
      )}
      {showChecking && (
        <li>
          <span className={styles.checking} aria-hidden="true" />
          Edge being checked
        </li>
      )}
      {showPath && (
        <li>
          <span className={styles.path} aria-hidden="true" />
          Shortest path so far
        </li>
      )}
    </ul>
  )
}
