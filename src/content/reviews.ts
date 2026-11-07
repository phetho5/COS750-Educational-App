/*
  The short review after scoring below 80% on a module check (CLAUDE.md:
  "extra explanation and easier practice"). One per module (handoff D59):
  another way to see the idea, two rules, and two easy practice questions.
  The student answers both correctly before retrying the check (the design).

  Module 4's review is the design's. The others follow the same pattern.
  Every sample-graph fact is checked in reviews.test.ts.
*/
import type { ModuleId } from '../questions'

/** Set to true once the group has reviewed every review below. */
export const REVIEWS_REVIEWED = false

export interface PracticeQuestion {
  readonly prompt: string
  readonly options: readonly string[]
  readonly correctIndex: number
  /** Shown when the student picks the right option. */
  readonly why: string
}

export interface Review {
  readonly anotherWay: string
  readonly rules: readonly [string, string]
  readonly practice: readonly [PracticeQuestion, PracticeQuestion]
}

export const reviewUiText = {
  eyebrow: 'Module check result',
  title: "Let's review before moving on",
  score: (correct: number, total: number) =>
    `You got ${correct} of ${total} right on the first try. You need 80% to unlock the next part. That's fine. A short review comes first.`,
  nextLocked: (what: string) => `${what}. Opens when you pass the check.`,
  nextLockedFor: (moduleId: ModuleId) => (moduleId === 5 ? 'Final check' : `Module ${moduleId + 1}`),
  anotherWayTitle: 'Another way to see it',
  practiceTitle: 'Easier practice',
  retryTitle: 'Try the check again',
  retryReady: "Nice work. You'll get fresh questions of the same types.",
  retryLocked: 'Finish both practice questions to unlock this.',
  startCheck: 'Start the check',
  right: 'Correct.',
  wrong: 'Not quite.',
  tryOther: 'Try the other option. Think about the two rules above.',
  rule: (n: number) => `Rule ${n}.`,
  noReviewDue: "There's no review waiting for this module. You can start its check from the module page.",
  backToModule: 'Back to the module',
  rereadModule: 'Read the module again',
}

export const REVIEWS: Record<ModuleId, Review> = {
  1: {
    anotherWay:
      'Think of a graph as a map of places and roads. The places are vertices and the roads are edges. The number on a road, like its length or the time it takes, is its weight. If every road is two-way, the graph is undirected. If roads are one-way, it is directed.',
    rules: ['A vertex is a point. An edge joins two vertices.', 'A weight is the number on an edge.'],
    practice: [
      { prompt: 'How many edges touch vertex A in our example graph?', options: ['4', '2', '1'], correctIndex: 1, why: 'A-B and A-D both touch A.' },
      { prompt: 'An edge can be used in both directions. Is it directed or undirected?', options: ['Undirected', 'Directed'], correctIndex: 0, why: 'Undirected edges work both ways.' },
    ],
  },
  2: {
    anotherWay:
      "The matrix is like a distance chart in a road atlas: find the row for one town and the column for another, and read the number where they meet. The list is like each town's own page, which names only the towns it connects to directly.",
    rules: ['Matrix: row = from, column = to, and 0 means no edge.', 'List: each vertex lists its neighbours with the weights.'],
    practice: [
      { prompt: 'In the matrix of our example graph, what is in row D, column B?', options: ['0', '4', '1'], correctIndex: 2, why: 'Edge D-B has weight 1.' },
      { prompt: "Which vertices are in C's adjacency list?", options: ['D, E and F', 'D and E', 'A and B'], correctIndex: 0, why: 'C is joined to D, E and F.' },
    ],
  },
  3: {
    anotherWay:
      "Imagine the weights are taxi fares. The cheapest trip isn't always the one with the fewest stops: two short, cheap rides can cost less than one long, expensive ride.",
    rules: ["A path's length is the sum of its edge weights.", 'Shortest means the smallest total, not the fewest edges.'],
    practice: [
      { prompt: 'What is the length of the path A, B, F?', options: ['5', '9', '2'], correctIndex: 1, why: '4 + 5 = 9.' },
      {
        prompt: 'A, B, F has length 9 and A, D, B, F has length 8. Which is the shortest path from A to F?',
        options: ['A, B, F', 'A, D, B, F'],
        correctIndex: 1,
        why: '8 is less than 9, even though the path has more edges.',
      },
    ],
  },
  4: {
    anotherWay:
      'Think of each distance as the best offer you have so far. Dijkstra always deals with the cheapest offer first. Nothing cheaper can turn up later, because every edge adds to the cost. When it visits a vertex, it asks each neighbour: "Would going through me be cheaper than your current offer?" If yes, the offer is replaced. If not, it stays.',
    rules: ['Visit the unvisited vertex with the smallest distance.', 'Only replace a distance with a smaller one.'],
    practice: [
      {
        prompt: 'B has distance 4 and D has distance 2. Neither is visited. Which one does Dijkstra visit next?',
        options: ['D', 'B'],
        correctIndex: 0,
        why: 'D, because 2 is the smaller distance.',
      },
      {
        prompt: "Going through D, B would cost 3. B's current distance is 4. Should B change?",
        options: ['Yes, to 3', 'No, keep 4'],
        correctIndex: 0,
        why: '3 is smaller than 4, so the new path wins.',
      },
    ],
  },
  5: {
    anotherWay:
      'Tracing is the same two steps again and again: choose, then update. Choose the unvisited vertex with the smallest distance. Then update each unvisited neighbour, but only if going through the chosen vertex is cheaper.',
    rules: ["New distance = the current vertex's distance + the edge weight.", 'Only update when the new distance is smaller.'],
    practice: [
      {
        prompt: "We are visiting F (distance 8). Edge F-E has weight 6 and E's distance is ∞. What is E's new distance?",
        options: ['6', '14', '8'],
        correctIndex: 1,
        why: '8 + 6 = 14, which is smaller than ∞.',
      },
      {
        prompt: "We are visiting F (distance 8). Edge F-C has weight 3 and C's distance is 10. What happens to C?",
        options: ['C changes to 11', 'C stays at 10'],
        correctIndex: 1,
        why: "8 + 3 = 11, which isn't smaller than 10.",
      },
    ],
  },
}
