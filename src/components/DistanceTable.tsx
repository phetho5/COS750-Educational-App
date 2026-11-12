/*
  The distance table: vertex, distance, previous vertex and (optionally)
  visited. Used by the walkthrough, fill-in questions and Your turn.

  Some distance cells can be inputs: the student types a number there.
*/
import type { DistanceTable as Table, VertexId } from '../engine'
import { formatDistance } from '../content/format'
import { VisitedTick } from './Icon'
import { cx } from './classNames'
import styles from './DistanceTable.module.css'

export interface EditableCell {
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  placeholder?: string
  /** Colours the border after a check. The feedback text says the same in words. */
  mark?: 'right' | 'wrong' | null
}

interface DistanceTableProps {
  table: Table
  vertices: readonly VertexId[]
  caption?: string
  showVisited?: boolean
  /** The vertex being visited: its row is tinted and its visited cell says "Current". */
  current?: VertexId | null
  /** Vertices whose distance just changed, with the distance they had before. */
  changed?: Readonly<Record<VertexId, number>>
  /** Unvisited neighbours currently being considered from the current vertex. */
  candidates?: readonly VertexId[]
  /** The candidate whose edge is being checked right now. */
  checking?: VertexId | null
  /** Distance cells the student fills in, by vertex. */
  editable?: Readonly<Record<VertexId, EditableCell>>
  /** Replaces what the previous column shows for a vertex (e.g. "?" until a fill-in is answered). */
  previousText?: Readonly<Record<VertexId, string>>
}

export function DistanceTable(props: DistanceTableProps) {
  const { table, vertices, caption, showVisited = false, current = null, changed = {}, candidates = [], checking = null, editable = {}, previousText = {} } = props

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        {caption && <caption className={styles.caption}>{caption}</caption>}
        <thead>
          <tr>
            <th scope="col">Vertex</th>
            <th scope="col">Distance</th>
            <th scope="col">Previous</th>
            {showVisited && <th scope="col">Visited</th>}
          </tr>
        </thead>
        <tbody>
          {vertices.map((v) => {
            const row = table[v]
            const cell = editable[v]
            const was = changed[v]
            const isCandidate = candidates.includes(v)
            const marker = was !== undefined ? 'Updated' : checking === v ? 'Checking' : 'Candidate'
            return (
              <tr
                key={v}
                className={cx(
                  v === current && styles.currentRow,
                  isCandidate && was === undefined && styles.candidateRow,
                  was !== undefined && styles.updatedRow,
                )}
              >
                <th scope="row" className={styles.vertex}>
                  {v}
                  {isCandidate && (
                    <span
                      className={cx(
                        styles.candidateTag,
                        checking === v && was === undefined && styles.checkingTag,
                        was !== undefined && styles.updatedTag,
                      )}
                    >
                      {marker}
                    </span>
                  )}
                </th>
                <td className={cx(styles.distance, was !== undefined && styles.changed)}>
                  {cell ? (
                    <input
                      className={cx(styles.input, cell.mark === 'right' && styles.inputRight, cell.mark === 'wrong' && styles.inputWrong)}
                      value={cell.value}
                      onChange={(e) => cell.onChange(e.target.value)}
                      aria-label={cell.ariaLabel}
                      placeholder={cell.placeholder ?? '?'}
                      inputMode="numeric"
                      autoComplete="off"
                    />
                  ) : (
                    <span className={styles.distanceValue}>
                      <strong>{formatDistance(row.distance)}</strong>
                      {was !== undefined && (
                        <span className={styles.was}>
                          <span className="visually-hidden">was </span>
                          <s>{formatDistance(was)}</s>
                        </span>
                      )}
                    </span>
                  )}
                </td>
                <td className={styles.previous}>{previousText[v] ?? row.previous ?? 'None'}</td>
                {showVisited && (
                  <td className={styles.visited}>
                    <VisitedCell isCurrent={v === current} isVisited={row.visited} />
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function VisitedCell({ isCurrent, isVisited }: { isCurrent: boolean; isVisited: boolean }) {
  if (isCurrent) {
    return (
      <span className={styles.state}>
        <span className={styles.currentRing} aria-hidden="true" />
        Current
      </span>
    )
  }
  if (isVisited) {
    return (
      <span className={styles.state}>
        <VisitedTick />
        Yes
      </span>
    )
  }
  return <span className={styles.no}>No</span>
}
