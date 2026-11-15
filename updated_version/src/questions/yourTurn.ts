/*
  The rules for "Your turn" (learning path step 5): the app visits the first
  vertices, then the student chooses each next vertex and types the new
  distances of its neighbours, pressing Check after each step.

  Every answer is checked against an engine run (CLAUDE.md: never mark a
  wrong answer as correct). The student's progress is a position in the
  engine's visit order, so the table shown is always one of the engine's own
  tables. Nothing is worked out twice.

  Pure functions: each takes the state and returns a new one.
*/
import { dijkstra, type DijkstraResult, type DistanceTable, type Graph, type VertexId, type VisitStep } from '../engine'
import { yourTurnText as t } from '../content/yourTurnText'
import { normalizeDistanceInput } from './answers'

export interface YourTurnState {
  readonly result: DijkstraResult
  /** How many vertices of the visit order are done (visited and updated). */
  readonly done: number
  /** 'pick': choose the next vertex. 'update': type its neighbours' distances. */
  readonly phase: 'pick' | 'update' | 'done'
  /** The table the student sees right now. */
  readonly table: DistanceTable
  /** Vertices whose distance changed in the last update, with their old distance. */
  readonly changed: Readonly<Record<VertexId, number>>
}

export interface YourTurnFeedback {
  readonly ok: boolean
  readonly text: string
}

export interface YourTurnMove {
  readonly state: YourTurnState
  readonly feedback: YourTurnFeedback
}

/** The visit step for the (n + 1)th vertex in the visit order. */
function visitStep(result: DijkstraResult, n: number): VisitStep {
  const visits = result.steps.filter((s): s is VisitStep => s.kind === 'visit')
  return visits[n]
}

/**
 * The engine's table once the first n vertices have been visited and all
 * their edges checked: the step just before the next visit (or the finish).
 */
export function tableAfterVisits(result: DijkstraResult, n: number): DistanceTable {
  const next = visitStep(result, n)
  if (!next) return result.finalTable
  return result.steps[result.steps.indexOf(next) - 1].table
}

/** Starts Your turn with the first `alreadyDone` vertices visited by the app (A and D in the brief). */
export function startYourTurn(graph: Graph, start: VertexId, alreadyDone = 2): YourTurnState {
  const result = dijkstra(graph, start)
  const done = Math.min(alreadyDone, result.visitOrder.length)
  return {
    result,
    done,
    phase: done === result.visitOrder.length ? 'done' : 'pick',
    table: tableAfterVisits(result, done),
    changed: {},
  }
}

/** The vertex being updated (in the update phase), or null. */
export function currentVertex(state: YourTurnState): VertexId | null {
  return state.phase === 'update' ? state.result.visitOrder[state.done] : null
}

// The neighbours the student must update now (empty unless in the update phase). 
export function neighboursToUpdate(state: YourTurnState): readonly VertexId[] {
  return state.phase === 'update' ? visitStep(state.result, state.done).neighboursToCheck : []
}

/** Vertices that are visited and finished (the current vertex isn't included). */
export function visitedSoFar(state: YourTurnState): readonly VertexId[] {
  return state.result.visitOrder.slice(0, state.done)
}

/** The student chooses the next vertex to visit. */
export function pickVertex(state: YourTurnState, chosen: VertexId): YourTurnMove {
  if (state.phase !== 'pick') throw new Error('Your turn: a vertex can only be picked in the pick phase.')
  const step = visitStep(state.result, state.done)
  const expected = step.vertex

  if (chosen !== expected) {
    const distance = state.table[chosen].distance
    const text =
      distance === Infinity
        ? t.pickUnreached(chosen)
        : distance === step.distance
          ? t.pickTie(chosen, expected)
          : t.pickBigger(chosen, distance)
    return { state, feedback: { ok: false, text } }
  }

  const neighbours = step.neighboursToCheck
  const feedback = { ok: true, text: t.pickRight(expected, step.distance, neighbours) }
  if (neighbours.length === 0) {
    // Nothing to update, so this vertex is finished straight away.
    return { state: finishVertex(state), feedback }
  }
  return { state: { ...state, phase: 'update', table: step.table, changed: {} }, feedback }
}

/** Moves past the current vertex, showing the engine's table after all its checks. */
function finishVertex(state: YourTurnState): YourTurnState {
  const done = state.done + 1
  const before = state.table
  const table = tableAfterVisits(state.result, done)
  const changed: Record<VertexId, number> = {}
  for (const v of Object.keys(table)) {
    if (table[v].distance !== before[v].distance) changed[v] = before[v].distance
  }
  const phase = done === state.result.visitOrder.length ? 'done' : 'pick'
  return { ...state, done, table, changed, phase }
}

/**
 * The student has typed new distances for the current vertex's neighbours.
 * An empty box means "keep the current distance". Checks the boxes in the
 * engine's order and gives feedback on the first one that's wrong.
 */
export function submitDistances(state: YourTurnState, typed: Readonly<Record<VertexId, string>>): YourTurnMove {
  if (state.phase !== 'update') throw new Error('Your turn: distances can only be submitted in the update phase.')
  const u = currentVertex(state)!
  const after = tableAfterVisits(state.result, state.done + 1)
  const current = state.table[u].distance

  for (const v of neighboursToUpdate(state)) {
    const old = state.table[v].distance
    const raw = (typed[v] ?? '').trim()
    const value = raw === '' ? String(old) : normalizeDistanceInput(raw)
    if (value === null) return { state, feedback: { ok: false, text: t.notANumber(v) } }

    const expected = after[v].distance
    if (Number(value) === expected) continue

    const weight = edgeWeight(state, u, v)
    const text =
      Number(value) === weight && weight !== expected
        ? t.edgeOnly(u, v, weight)
        : expected === old
          ? t.shouldKeep(u, v, current, weight, old)
          : t.shouldChange(u, v, old)
    return { state, feedback: { ok: false, text } }
  }

  const next = finishVertex(state)
  const changes = Object.keys(next.changed)
    .sort()
    .map((v) => ({ vertex: v, distance: next.table[v].distance, via: next.table[v].previous ?? u }))
  return { state: next, feedback: { ok: true, text: t.updateRight(changes, next.phase === 'done') } }
}

function edgeWeight(state: YourTurnState, u: VertexId, v: VertexId): number {
  const step = state.result.steps.find((s) => s.kind === 'check-edge' && s.vertex === u && s.neighbour === v)
  if (!step || step.kind !== 'check-edge') throw new Error(`Your turn: no check of edge ${u}-${v} in the engine run.`)
  return step.weight
}
