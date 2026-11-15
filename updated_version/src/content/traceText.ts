/*
  Every sentence a student sees in a trace question.

  The question generator fills in the numbers. The wording lives here so the
  group can review and edit it in one place. Rules from CLAUDE.md: plain
  South African English, no em-dashes, edges written with a hyphen (A-B).

  Level 2 hints ("what went wrong") explain the specific mistake but don't
  give away the answer, so the student still has something to work out.
*/
import { edgeName, formatDistance, hasOrHave, listText } from './format'

/** Set to true once the group has reviewed this file's wording. */
export const TRACE_TEXT_REVIEWED = false

const d = formatDistance

// ---------- Next vertex: "Which vertex does Dijkstra visit next?" ----------

export interface UnvisitedDistance {
  readonly vertex: string
  readonly distance: number
}

export const nextVertexText = {
  lead(visited: readonly string[], unvisited: readonly UnvisitedDistance[], showDistances: boolean): string {
    const first = `${hasOrHave(visited)} been visited.`
    if (!showDistances) return `${first} Use the distance labels on the graph.`
    const list = listText(unvisited.map((u) => `${u.vertex} ${d(u.distance)}`))
    return `${first} The unvisited distances are ${list}.`
  },

  promptChoice: "Which vertex does Dijkstra's algorithm visit next?",
  promptSelect: "Select the vertex Dijkstra's algorithm visits next.",

  correct(vertex: string, distance: number): string {
    return `${vertex} has the smallest distance (${d(distance)}), so it's visited next.`
  },

  alphabetical(chosen: string, chosenDistance: number): string {
    return `Dijkstra's algorithm doesn't go in alphabetical order. It always visits the unvisited vertex with the smallest distance. ${chosen}'s distance is ${d(chosenDistance)}. Compare it with the others.`
  },

  discoveryOrder(chosen: string, chosenDistance: number): string {
    return `${chosen} was reached early, but the order vertices were found in doesn't matter. Dijkstra's algorithm visits the unvisited vertex with the smallest distance, and ${chosen}'s is ${d(chosenDistance)}. Is there a smaller one?`
  },

  lightestEdge(chosen: string, chosenDistance: number, lastVisited: string): string {
    return `${chosen} is at the end of the lightest edge from ${lastVisited}, but Dijkstra's algorithm compares total distances from the start, not single edges. ${chosen}'s total distance is ${d(chosenDistance)}. Is there a smaller one?`
  },

  /** For a wrong answer that isn't one of the known misconceptions. */
  other(chosen: string, chosenDistance: number): string {
    if (chosenDistance === Infinity) {
      return `${chosen} hasn't been reached yet. Its distance is still ∞, so it can't be the closest.`
    }
    return `${chosen}'s distance is ${d(chosenDistance)}. Is there an unvisited vertex with a smaller distance?`
  },

  fallback: 'Look at the distances of the vertices that haven\'t been visited yet. Which is the smallest?',

  nudge: "Ignore the letters. Compare the distances of the vertices that haven't been visited yet.",

  workedExample(visited: readonly string[], unvisited: readonly UnvisitedDistance[], answer: string, distance: number): string {
    const list = listText(unvisited.map((u) => `${u.vertex} ${d(u.distance)}`))
    return `A similar step: once ${listText(visited)} had been visited, the unvisited distances were ${list}. The smallest is ${answer} (${d(distance)}), so ${answer} was visited next, whatever its letter.`
  },

  /** Used when the graph has no other suitable step to show. From the sample graph. */
  sampleWorkedExample:
    'A similar step: after A is visited, B is 4 and D is 2. The smallest is D (2), so D is visited next, even though B comes first in the alphabet and was found first.',

  subStepUnvisited: {
    prompt: "Which vertices haven't been visited yet?",
    explanation(visited: readonly string[], unvisited: readonly string[]): string {
      return `${hasOrHave(visited)} been visited, so ${listText(unvisited)} ${unvisited.length === 1 ? 'is' : 'are'} left.`
    },
  },

  subStepSmallest: {
    prompt: 'Which of the unvisited vertices has the smallest distance?',
    option(vertex: string, distance: number): string {
      return `${vertex}, at ${d(distance)}`
    },
    explanation(vertex: string, distance: number): string {
      return `${d(distance)} is the smallest unvisited distance, so ${vertex} is visited next.`
    },
  },
}

// ---------- Edge checks: "new distance" (fill in) and "predict" ----------

export interface EdgeCheckNumbers {
  readonly current: string
  readonly neighbour: string
  readonly currentDistance: number
  readonly weight: number
  readonly oldDistance: number
  readonly candidate: number
  readonly updated: boolean
}

function describeEdgeCheck(n: EdgeCheckNumbers): string {
  return `We are visiting ${n.current} (distance ${d(n.currentDistance)}). Edge ${edgeName(n.current, n.neighbour)} has weight ${n.weight}. ${n.neighbour}'s distance is currently ${d(n.oldDistance)}.`
}

function outcome(n: EdgeCheckNumbers): string {
  const sum = `${d(n.currentDistance)} + ${n.weight} = ${n.candidate}`
  return n.updated
    ? `${sum}, which is smaller than ${d(n.oldDistance)}, so ${n.neighbour} becomes ${n.candidate} with ${n.current} as its previous vertex.`
    : `${sum}, which isn't smaller than ${d(n.oldDistance)}, so ${n.neighbour} keeps ${d(n.oldDistance)}.`
}

/** Feedback shared by fill-in and predict questions, one per misconception. */
export const edgeCheckMistakeText = {
  keepOld(n: EdgeCheckNumbers): string {
    return `${d(n.oldDistance)} is ${n.neighbour}'s old distance. Going through ${n.current} costs ${d(n.currentDistance)} + ${n.weight}. Is that smaller than ${d(n.oldDistance)}?`
  },

  edgeOnly(n: EdgeCheckNumbers): string {
    return `${n.weight} is only the weight of edge ${edgeName(n.current, n.neighbour)}. A distance counts the whole path from the start, so add ${n.current}'s distance to it.`
  },

  alwaysUpdate(n: EdgeCheckNumbers): string {
    return `You worked out ${d(n.currentDistance)} + ${n.weight} = ${n.candidate} correctly. But ${n.candidate} isn't smaller than ${d(n.oldDistance)}, and Dijkstra's algorithm only changes a distance when the new path is shorter.`
  },

  ownDistance(n: EdgeCheckNumbers): string {
    return `${d(n.currentDistance)} is ${n.current}'s own distance. Add the weight of edge ${edgeName(n.current, n.neighbour)} to it, then compare with ${d(n.oldDistance)}.`
  },

  fallback(n: EdgeCheckNumbers): string {
    return `Work out ${n.current}'s distance plus the weight of edge ${edgeName(n.current, n.neighbour)}. Then keep whichever is smaller: that, or ${n.neighbour}'s current ${d(n.oldDistance)}.`
  },
}

export const newDistanceText = {
  lead: describeEdgeCheck,
  prompt(n: EdgeCheckNumbers): string {
    return `Type ${n.neighbour}'s distance after checking edge ${edgeName(n.current, n.neighbour)}.`
  },
  correct: outcome,
  nudge: 'A distance always counts the whole path from the start, not just the last edge.',
}

export const predictText = {
  lead: describeEdgeCheck,
  prompt: 'What happens next?',
  stays(n: EdgeCheckNumbers): string {
    return `${n.neighbour} stays at ${d(n.oldDistance)}`
  },
  changesTo(n: EdgeCheckNumbers, value: number): string {
    return `${n.neighbour} changes to ${d(value)}`
  },
  correct: outcome,
  nudge(n: EdgeCheckNumbers): string {
    return `Two steps: work out what the path through ${n.current} costs, then compare it with ${n.neighbour}'s current distance.`
  },
}

export const edgeCheckExampleText = {
  workedExample(n: EdgeCheckNumbers): string {
    return `A similar step: visiting ${n.current} (distance ${d(n.currentDistance)}), edge ${edgeName(n.current, n.neighbour)} has weight ${n.weight} and ${n.neighbour} is ${d(n.oldDistance)}. ${outcome(n)}`
  },

  /** Used when the graph has no other suitable step to show. From the sample graph. */
  sampleWorkedExample:
    'A similar step: visiting D (distance 2), edge D-B has weight 1 and B is 4. 2 + 1 = 3, which is smaller than 4, so B becomes 3 with D as its previous vertex.',

  subStepCurrentDistance: {
    prompt(n: EdgeCheckNumbers): string {
      return `What is ${n.current}'s distance?`
    },
    explanation(n: EdgeCheckNumbers): string {
      return `The table shows ${n.current} at ${d(n.currentDistance)}.`
    },
  },

  subStepPathCost: {
    prompt(n: EdgeCheckNumbers): string {
      return `What does the path to ${n.neighbour} through ${n.current} cost?`
    },
    explanation(n: EdgeCheckNumbers): string {
      return `${n.current}'s distance plus the edge weight: ${d(n.currentDistance)} + ${n.weight} = ${n.candidate}.`
    },
  },

  subStepCompare: {
    prompt(n: EdgeCheckNumbers): string {
      return `Is ${n.candidate} smaller than ${n.neighbour}'s current distance, ${d(n.oldDistance)}?`
    },
    yes: 'Yes',
    no: 'No',
    explanation(n: EdgeCheckNumbers): string {
      return n.updated
        ? `Yes, so ${n.neighbour} changes to ${n.candidate}.`
        : `No, so ${n.neighbour} keeps ${d(n.oldDistance)}.`
    },
  },
}
