/*
  The plain-language explanation of each walkthrough step (handoff D14), and
  the pseudocode with the lines each step runs (D28).

  Every number comes from the engine's step, so the text can never disagree
  with the algorithm. Wording rules: plain South African English, no
  em-dashes, edges written with a hyphen.
*/
import { shortestPath, type CheckEdgeStep, type DijkstraResult, type DijkstraStep, type FinishStep, type VisitStep } from '../engine'
import { edgeName, formatDistance, listText } from './format'

/** Set to true once the group has reviewed this file's wording. */
export const WALKTHROUGH_TEXT_REVIEWED = false

const d = formatDistance

/** The pseudocode shown under the walkthrough, numbered from 1. */
export const PSEUDOCODE: readonly string[] = [
  'for each vertex v:',
  '    dist[v] ← ∞;  prev[v] ← none',
  'dist[start] ← 0',
  'while some vertex is unvisited:',
  '    u ← unvisited vertex with smallest dist',
  '    mark u as visited',
  '    for each unvisited neighbour v of u:',
  '        alt ← dist[u] + weight(u, v)',
  '        if alt < dist[v]:',
  '            dist[v] ← alt;  prev[v] ← u',
  'return dist, prev',
]

/** The pseudocode lines (numbered from 1) that a step carries out. */
export function pseudocodeLines(step: DijkstraStep): number[] {
  switch (step.kind) {
    case 'start':
      return [1, 2, 3]
    case 'visit':
      return [5, 6]
    case 'check-edge':
      return step.updated ? [8, 9, 10] : [8, 9]
    case 'finish':
      return [11]
  }
}

/** A short title for the step, e.g. "Visit D" or "Visit D: check D-B". */
export function stepTitle(step: DijkstraStep): string {
  switch (step.kind) {
    case 'start':
      return 'Set up'
    case 'visit':
      return `Visit ${step.vertex}`
    case 'check-edge':
      return `Visit ${step.vertex}: check ${edgeName(step.vertex, step.neighbour)}`
    case 'finish':
      return 'Finished'
  }
}

/** What's happening at this step, in a sentence or three. */
export function stepExplanation(step: DijkstraStep, result: DijkstraResult): string {
  switch (step.kind) {
    case 'start':
      return `We start at ${step.start}. Its distance is 0, because it costs nothing to get there. Every other vertex starts at ∞, which means "not reached yet".`
    case 'visit':
      return visitText(step, result.start)
    case 'check-edge':
      return checkText(step)
    case 'finish':
      return finishText(step, result.start)
  }
}

function visitText(step: VisitStep, start: string): string {
  const first =
    step.vertex === start
      ? `${step.vertex} has the smallest distance (0), so we visit it first.`
      : `${step.vertex} has the smallest unvisited distance (${d(step.distance)}), so we visit it next. Its distance is now final.`
  const tie =
    step.tiedWith.length > 0
      ? ` ${listText(step.tiedWith)} also had ${d(step.distance)}, and ties go in alphabetical order.`
      : ''
  const next =
    step.neighboursToCheck.length === 0
      ? ' All of its neighbours are already visited, so there is nothing left to check.'
      : ` Next we check its unvisited ${step.neighboursToCheck.length === 1 ? 'neighbour' : 'neighbours'}: ${listText(step.neighboursToCheck)}.`
  return first + tie + next
}

function checkText(step: CheckEdgeStep): string {
  const { vertex: u, neighbour: v, weight, candidate, oldDistance, updated } = step
  const current = candidate - weight
  const cost = `Going through ${u}, ${v} costs ${d(current)} + ${weight} = ${d(candidate)}.`
  if (!updated) {
    return `${cost} That's not less than ${v}'s current ${d(oldDistance)}, so ${v} keeps ${d(oldDistance)}. Nothing changes.`
  }
  if (oldDistance === Infinity) {
    return `${cost} ${v} hadn't been reached yet (∞), so we set ${v} to ${d(candidate)} and record ${u} as its previous vertex.`
  }
  return `${cost} That's less than ${v}'s current ${d(oldDistance)}, so we update ${v} to ${d(candidate)} and record ${u} as its previous vertex.`
}

function finishText(step: FinishStep, start: string): string {
  const parts = [`Every vertex we can reach has been visited, so we're done. The table now holds the shortest distance from ${start} to every vertex.`]

  // Show how to read a route, using the vertex visited last (the furthest one).
  const target = step.visitOrder[step.visitOrder.length - 1]
  const route = target === undefined ? null : shortestPath(step.table, target)
  if (route && route.length > 1) {
    const backwards = [...route].reverse()
    const links = backwards.slice(0, -1).map((v, i) => `${v} came from ${backwards[i + 1]}`)
    parts.push(
      `To read a route, follow the Previous column backwards from ${target}: ${listText(links)}. So the shortest route to ${target} is ${route.join(', ')}, and it costs ${d(step.table[target].distance)}.`,
    )
  }
  if (step.unreachable.length > 0) {
    parts.push(`${listText(step.unreachable)} can't be reached from ${start}, so the distance stays ∞.`)
  }
  return parts.join(' ')
}
