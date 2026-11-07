/*
  Everything a student reads on the Your turn screen (learning path step 5).
  The numbers are filled in from the engine.
*/
import { edgeName, formatDistance, listText } from './format'

/** Set to true once the group has reviewed this file's wording. */
export const YOUR_TURN_TEXT_REVIEWED = false

const d = formatDistance

export const yourTurnText = {
  eyebrow: 'Module 5 · Your turn',
  title: 'Trace the rest yourself',
  intro: (done: readonly string[]) =>
    `We've already visited ${listText(done)}. You do the rest: pick the next vertex, update its neighbours, then press Check after each step.`,

  pickLabel: 'Step 1 of 2 · Choose',
  updateLabel: (u: string) => `Step 2 of 2 · Update ${u}'s neighbours`,
  doneLabel: 'All done',
  pickInstruction: 'Which vertex does Dijkstra visit next? Select it on the graph.',
  pickChosen: (v: string) => `You've chosen ${v}. Press Check when you're sure.`,
  updateInstruction: (u: string, neighbours: readonly string[]) =>
    `Type the new distance for ${listText(neighbours)}. Use ${u}'s distance plus the edge weight, but only if it's smaller.`,
  updateNote: 'Leave a box empty to keep its current distance. The previous vertex fills in for you.',
  doneInstruction: 'Every vertex is visited.',

  // Feedback after choosing a vertex
  pickRight: (v: string, distance: number, neighbours: readonly string[]) =>
    neighbours.length === 0
      ? `${v} has the smallest distance (${d(distance)}), so it's visited next. It has no unvisited neighbours, so there's nothing to update.`
      : `${v} has the smallest distance (${d(distance)}), so it's visited next. Now update its unvisited ${neighbours.length === 1 ? 'neighbour' : 'neighbours'}: ${listText(neighbours)}.`,
  pickUnreached: (v: string) =>
    `${v} hasn't been reached yet. Its distance is still ∞. Look at the Distance column. Which unvisited vertex has the smallest number?`,
  pickTie: (v: string, other: string) =>
    `${v} and ${other} have the same distance. When there's a tie, we take the one that comes first in the alphabet.`,
  pickBigger: (v: string, distance: number) =>
    `${v} has distance ${d(distance)}. Look at the Distance column. Is there an unvisited vertex with a smaller number?`,

  // Feedback after updating distances
  updateRight: (changes: readonly { vertex: string; distance: number; via: string }[], finished: boolean) => {
    const changed =
      changes.length === 0 ? 'No distances changed this time.' : `${listText(changes.map((c) => `${c.vertex} is now ${d(c.distance)} via ${c.via}`))}.`
    return finished ? `${changed} That was the last vertex.` : `${changed} Now pick the next vertex.`
  },
  edgeOnly: (u: string, v: string, weight: number) =>
    `Look at ${v} again. ${weight} is only the weight of edge ${edgeName(u, v)}. A distance counts the whole path from the start, so add ${u}'s distance to it.`,
  shouldKeep: (u: string, v: string, current: number, weight: number, old: number) =>
    `Look at ${v} again. Going through ${u} costs ${d(current)} + ${weight} = ${d(current + weight)}. Is that smaller than ${v}'s current ${d(old)}? Only change a distance when the new path is shorter.`,
  shouldChange: (u: string, v: string, old: number) =>
    `Look at ${v} again. Add ${u}'s distance to the weight of edge ${edgeName(u, v)}, then compare it with ${v}'s current ${d(old)}.`,
  notANumber: (v: string) => `The box for ${v} needs a whole number, like 7. Type ∞ or "inf" for a vertex that hasn't been reached.`,

  doneTitle: "Well done. You traced Dijkstra's algorithm.",
  doneSummary: (order: readonly string[], distances: readonly { vertex: string; distance: number }[]) =>
    `Visit order: ${order.join(', ')}. Final distances: ${distances.map((x) => `${x.vertex} ${d(x.distance)}`).join(', ')}.`,
  startOver: 'Start over',
  orderSoFar: 'Visit order so far:',
}
