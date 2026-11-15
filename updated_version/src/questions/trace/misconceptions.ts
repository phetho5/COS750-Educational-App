/*
  The wrong answers a student would give if they held each misconception.

  The brief's rule: only use a misconception as a wrong option if it gives a
  different answer from the correct one. So every function here drops answers
  that equal the correct one, and drops repeats (if two misconceptions give
  the same wrong answer, the first one in the list keeps it).
*/
import type { VertexId } from '../../engine'
import { compareVertices, neighboursOf } from '../../engine'
import type { EdgeCheckCase, NextVertexCase } from './cases'

// ---------- Next vertex ----------

export type NextVertexMisconception = 'next-alphabetical' | 'next-discovery-order' | 'next-lightest-edge'

export interface NextVertexMistake {
  readonly misconception: NextVertexMisconception
  readonly vertex: VertexId
}

/** "Choosing alphabetically": the first unvisited vertex in the alphabet. */
function alphabeticalChoice(c: NextVertexCase): VertexId | null {
  return c.unvisited[0] ?? null
}

/**
 * "Choosing in the order vertices were first given a distance": the
 * unvisited vertex that was reached (moved off ∞) earliest.
 */
function discoveryOrderChoice(c: NextVertexCase): VertexId | null {
  for (const step of c.result.steps.slice(0, c.stepIndex)) {
    if (step.kind !== 'check-edge' || !step.updated || step.oldDistance !== Infinity) continue
    if (c.unvisited.includes(step.neighbour)) return step.neighbour
  }
  return null
}

/**
 * "Choosing the unvisited neighbour with the lightest edge from the vertex
 * just visited". Ties go alphabetically. Null if it has no unvisited neighbours.
 */
function lightestEdgeChoice(c: NextVertexCase): VertexId | null {
  const options = neighboursOf(c.graph, c.lastVisited).filter((n) => c.unvisited.includes(n.vertex))
  if (options.length === 0) return null
  const sorted = [...options].sort((a, b) => a.weight - b.weight || compareVertices(a.vertex, b.vertex))
  return sorted[0].vertex
}

export function nextVertexMistakes(c: NextVertexCase): NextVertexMistake[] {
  const candidates: [NextVertexMisconception, VertexId | null][] = [
    ['next-alphabetical', alphabeticalChoice(c)],
    ['next-discovery-order', discoveryOrderChoice(c)],
    ['next-lightest-edge', lightestEdgeChoice(c)],
  ]
  const mistakes: NextVertexMistake[] = []
  for (const [misconception, vertex] of candidates) {
    if (vertex === null || vertex === c.answer) continue
    if (mistakes.some((m) => m.vertex === vertex)) continue
    mistakes.push({ misconception, vertex })
  }
  return mistakes
}

// ---------- Edge checks (new distance and predict) ----------

export type EdgeCheckMisconception = 'dist-keep-old' | 'dist-edge-only' | 'dist-always-update' | 'dist-own-distance'

export interface EdgeCheckMistake {
  readonly misconception: EdgeCheckMisconception
  /** The distance the student would end up with. */
  readonly value: number
}

/**
 * The misconceptions that count as wrong options (the brief's two, plus
 * "always update" from docs/handoff.md D5).
 */
export function edgeCheckMistakes(c: EdgeCheckCase): EdgeCheckMistake[] {
  return distinctMistakes(c, [
    ['dist-keep-old', c.oldDistance], // didn't update when it should have
    ['dist-edge-only', c.weight], // used the edge weight on its own
    ['dist-always-update', c.candidate], // updated even though it wasn't shorter
  ])
}

/**
 * "Typed the current vertex's own distance". Recognised for feedback on
 * fill-in answers only, never offered as an option (D5).
 */
export function ownDistanceMistake(c: EdgeCheckCase): EdgeCheckMistake | null {
  const taken = edgeCheckMistakes(c).map((m) => m.value)
  if (c.currentDistance === c.answer || taken.includes(c.currentDistance)) return null
  return { misconception: 'dist-own-distance', value: c.currentDistance }
}

function distinctMistakes(c: EdgeCheckCase, candidates: [EdgeCheckMisconception, number][]): EdgeCheckMistake[] {
  const mistakes: EdgeCheckMistake[] = []
  for (const [misconception, value] of candidates) {
    if (value === c.answer || mistakes.some((m) => m.value === value)) continue
    mistakes.push({ misconception, value })
  }
  return mistakes
}

/** Questions need at least two different wrong answers (CLAUDE.md, question generation). */
export const MIN_MISTAKES = 2
