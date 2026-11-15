/*
  Module 4: Dijkstra's algorithm (objective 4)
  Explain step by step how Dijkstra's algorithm finds shortest paths.
  Includes "is this distance final?" (CLAUDE.md, concept questions).

  Misconception ids shared with trace questions (next-alphabetical,
  dist-keep-old and so on) are reused here on purpose, so the pre-lecture
  summary can group the same mistake wherever it shows up.

  DRAFT: every version is reviewed: false until the group has checked it.
*/
import { choiceVersion, right, sub, wrong } from './build'
import type { ConceptGroup } from './types'

// ---------- Starting values ----------

const startHints = {
  nudge: "At the start, the algorithm only knows how to reach the start vertex: you're already there.",
  workedExample: 'For example, starting at A: A gets 0 because getting there costs nothing. B, C, D, E and F get ∞ because no route to them has been found yet.',
  subSteps: [
    sub('What does it cost to get from A to A?', '0', ['∞', '4'], "You're already there, so it costs nothing."),
    sub('Before any edges are checked, has the algorithm found a route to B?', 'No', ['Yes'], 'No, so B starts at ∞, meaning not reached yet.'),
  ],
}

const startValues: ConceptGroup = {
  id: 'm4-start-values',
  module: 4,
  objective: 4,
  about: 'The start vertex is 0 and every other vertex starts at ∞.',
  versions: [
    choiceVersion({
      id: 'm4-start-zero',
      prompt: "Dijkstra's algorithm starts at A. What is A's distance set to?",
      options: [
        right('0'),
        wrong('∞', 'm4-start-is-infinity', '∞ means not reached yet. A is where we start, so getting there costs nothing: 0.'),
        wrong('4, the weight of edge A-B', 'm4-start-is-edge-weight', "A's distance is the cost of getting from A to A. That's 0, not the weight of an edge."),
      ],
      correctFeedback: 'Getting from A to A costs nothing, so A starts at 0.',
      fallbackWrongFeedback: 'How much does it cost to get to where you already are?',
      hints: startHints,
      facts: [{ kind: 'edge-weight', a: 'A', b: 'B', weight: 4 }],
    }),
    choiceVersion({
      id: 'm4-start-others',
      prompt: 'At the start, what distance does every vertex except the start get?',
      options: [
        right('∞, meaning not reached yet'),
        wrong('0', 'm4-all-start-zero', 'Only the start vertex gets 0. The others start at ∞ because no route to them has been found yet.'),
        wrong('The weight of the edge from the start to it', 'm4-start-from-edges', 'Those distances come later, when the start vertex is visited and its edges are checked. At the very start, every other vertex is ∞.'),
      ],
      correctFeedback: "Every other vertex starts at ∞, because the algorithm hasn't found a route to it yet.",
      fallbackWrongFeedback: 'Before any edge is checked, what does the algorithm know about reaching B?',
      hints: startHints,
    }),
    choiceVersion({
      id: 'm4-start-why-infinity',
      prompt: 'Why does every vertex except the start begin at ∞?',
      options: [
        right('No route to it has been found yet'),
        wrong("It's very far from the start", 'm4-infinity-means-far', "∞ doesn't mean far. It means no route has been found yet. B starts at ∞ but ends up only 3 from A."),
        wrong('It can never be reached', 'm4-infinity-means-unreachable', '∞ only means not reached yet. Most vertices get a real distance once their neighbours are visited.'),
      ],
      correctFeedback: '∞ is a placeholder for "not reached yet". It gets replaced as soon as a route is found.',
      fallbackWrongFeedback: 'What does the algorithm know about the other vertices before it checks any edges?',
      hints: startHints,
      facts: [{ kind: 'shortest-distance', to: 'B', distance: 3 }],
    }),
  ],
}

// ---------- Choosing the next vertex ----------

const nextRuleHints = {
  nudge: "Dijkstra's algorithm always deals with the closest unvisited vertex first.",
  workedExample: 'For example, after A is visited, B is 4 and D is 2. D is closer, so D is visited next, even though B comes first in the alphabet.',
  subSteps: [
    sub("What does Dijkstra's algorithm compare to choose the next vertex?", 'The distances of the unvisited vertices', ['The letters of the vertices', 'The weights of single edges'], 'It compares distances: the total cost from the start.'),
    sub('Does it pick the smallest distance or the largest?', 'The smallest', ['The largest'], 'It picks the unvisited vertex with the smallest distance.'),
  ],
}

const nextRule: ConceptGroup = {
  id: 'm4-next-rule',
  module: 4,
  objective: 4,
  about: 'The rule for choosing the next vertex.',
  versions: [
    choiceVersion({
      id: 'm4-next-how',
      prompt: "How does Dijkstra's algorithm choose the next vertex to visit?",
      options: [
        right('The unvisited vertex with the smallest distance'),
        wrong('The next vertex in alphabetical order', 'next-alphabetical', "The letters don't matter. It always picks the unvisited vertex with the smallest distance."),
        wrong('The neighbour at the end of the lightest edge', 'next-lightest-edge', 'It compares total distances from the start, not single edges.'),
      ],
      correctFeedback: 'It always visits the unvisited vertex with the smallest distance next.',
      fallbackWrongFeedback: 'Think about which vertex is closest to the start.',
      hints: nextRuleHints,
    }),
    choiceVersion({
      id: 'm4-next-b-or-d',
      prompt: "B has distance 4 and D has distance 2. Neither is visited. Which does Dijkstra's algorithm visit first?",
      options: [
        right('D'),
        wrong('B, because it comes first in the alphabet', 'next-alphabetical', "The letters don't matter. D's distance (2) is smaller than B's (4), so D is first."),
        wrong('B, because it was reached first', 'next-discovery-order', "The order vertices were reached in doesn't matter. D's distance (2) is smaller, so D is first."),
      ],
      correctFeedback: "D's distance, 2, is smaller than B's, 4, so D is visited first.",
      fallbackWrongFeedback: 'Compare the two distances.',
      hints: {
        ...nextRuleHints,
        workedExample: 'For example, if C is 10 and F is 8, F is visited first, because 8 is smaller.',
      },
      facts: [
        { kind: 'edge-check', current: 'A', neighbour: 'B', before: Infinity, after: 4 },
        { kind: 'edge-check', current: 'A', neighbour: 'D', before: Infinity, after: 2 },
      ],
    }),
    choiceVersion({
      id: 'm4-next-first',
      prompt: "Which vertex does Dijkstra's algorithm always visit first?",
      options: [
        right('The start vertex'),
        wrong('The vertex with the most edges', 'm4-first-most-edges', "The number of edges doesn't matter. The start has distance 0, the smallest possible, so it's visited first."),
        wrong('The vertex at the end of the lightest edge', 'next-lightest-edge', 'Before anything is visited, every vertex except the start is ∞. The start, at 0, is the smallest, so it goes first.'),
      ],
      correctFeedback: 'The start has distance 0 and everything else is ∞, so the start is always visited first.',
      fallbackWrongFeedback: 'At the very beginning, which vertex has the smallest distance?',
      hints: nextRuleHints,
    }),
  ],
}

// ---------- When a distance changes ----------

const updateHints = {
  nudge: "Work out the cost through the current vertex, then compare it with the neighbour's current distance.",
  workedExample: "For example, visiting C (distance 10) and checking edge C-E (weight 2): 10 + 2 = 12, which is less than E's 14, so E changes to 12.",
  subSteps: [
    sub('What do you add to get the cost through the current vertex?', 'Its distance plus the edge weight', ['The edge weight only', 'Its distance only'], 'The cost through it is its distance plus the weight of the edge.'),
    sub("When does the neighbour's distance change?", 'Only when the new cost is smaller', ['Every time an edge is checked', 'Only the first time it is reached'], "Dijkstra's algorithm only ever replaces a distance with a smaller one."),
  ],
}

const updateRule: ConceptGroup = {
  id: 'm4-update-rule',
  module: 4,
  objective: 4,
  about: 'A distance changes only when the new route is shorter.',
  versions: [
    choiceVersion({
      id: 'm4-update-when',
      prompt: "When does Dijkstra's algorithm change a vertex's distance?",
      options: [
        right('When the route through the current vertex is shorter than its current distance'),
        wrong('Every time it checks an edge to that vertex', 'dist-always-update', "It only changes a distance when the new route is shorter. If it isn't, the old distance stays."),
        wrong('Only the first time the vertex is reached', 'dist-keep-old', 'A distance can change more than once. B is first 4, then changes to 3 when a shorter route through D is found.'),
      ],
      correctFeedback: 'It replaces a distance only when it finds a shorter route.',
      fallbackWrongFeedback: 'Think about B: it was 4, then a route through D cost 3.',
      hints: updateHints,
      facts: [{ kind: 'edge-check', current: 'D', neighbour: 'B', before: 4, after: 3 }],
    }),
    choiceVersion({
      id: 'm4-update-d-b',
      view: 'sample',
      prompt: "We're visiting D (distance 2). Edge D-B has weight 1, and B's distance is 4. What happens?",
      options: [
        right('B changes to 3'),
        wrong('B stays at 4', 'dist-keep-old', 'Work out the cost through D: 2 + 1 = 3. Is that smaller than 4?'),
        wrong('B changes to 1', 'dist-edge-only', "1 is only the weight of edge D-B. Add D's distance to it."),
      ],
      correctFeedback: '2 + 1 = 3, which is smaller than 4, so B changes to 3 with D as its previous vertex.',
      fallbackWrongFeedback: "Work out D's distance plus the weight of D-B, then compare with 4.",
      hints: updateHints,
      facts: [
        { kind: 'edge-check', current: 'D', neighbour: 'B', before: 4, after: 3 },
        { kind: 'edge-weight', a: 'D', b: 'B', weight: 1 },
      ],
    }),
    choiceVersion({
      id: 'm4-update-f-c',
      view: 'sample',
      prompt: "We're visiting F (distance 8). Edge F-C has weight 3, and C's distance is 10. What happens?",
      options: [
        right('C stays at 10'),
        wrong('C changes to 11', 'dist-always-update', "You worked out 8 + 3 = 11 correctly. But 11 isn't smaller than 10, so C keeps 10."),
        wrong('C changes to 3', 'dist-edge-only', '3 is only the weight of edge F-C. The route through F costs 8 + 3.'),
      ],
      correctFeedback: "8 + 3 = 11, which isn't smaller than 10, so C keeps 10.",
      fallbackWrongFeedback: "Work out F's distance plus the weight of F-C, then compare with 10.",
      hints: updateHints,
      facts: [
        { kind: 'edge-check', current: 'F', neighbour: 'C', before: 10, after: 10 },
        { kind: 'edge-weight', a: 'F', b: 'C', weight: 3 },
      ],
    }),
  ],
}

// ---------- Is this distance final? ----------

const finalHints = {
  nudge: 'Think about when a distance can no longer get any smaller.',
  workedExample:
    'For example, once D is visited at 2, no route can reach D for less: every unvisited vertex is already at least 2 away, and weights are never negative. But E is 14 until C is visited, and then it drops to 12.',
  subSteps: [
    sub("Can a visited vertex's distance change later?", 'No', ['Yes'], 'Once a vertex is visited, its distance is final.'),
    sub("Can an unvisited vertex's distance still change?", 'Yes, if a shorter route turns up', ['No, never'], "Until it's visited, a shorter route can still be found."),
  ],
}

const isFinal: ConceptGroup = {
  id: 'm4-is-final',
  module: 4,
  objective: 4,
  about: 'Is this distance final? Visited distances are final, unvisited ones can still drop.',
  versions: [
    choiceVersion({
      id: 'm4-final-visited',
      prompt: "D has just been visited with distance 2. Can D's distance still change later?",
      options: [
        right('No. Once a vertex is visited, its distance is final'),
        wrong('Yes. A shorter route could still turn up', 'm4-visited-not-final', 'Every unvisited vertex is at least as far as D, and weights are never negative, so no route through them can reach D for less than 2.'),
        wrong('Only if D has more neighbours', 'm4-final-depends-on-neighbours', "D's neighbours don't matter. Once D is visited, its distance is final."),
      ],
      correctFeedback: "D was the closest unvisited vertex, and weights can't be negative, so no shorter route to D can exist.",
      fallbackWrongFeedback: 'What does it mean for a vertex to be visited?',
      hints: finalHints,
      facts: [{ kind: 'shortest-distance', to: 'D', distance: 2 }],
    }),
    choiceVersion({
      id: 'm4-final-unvisited',
      prompt: "A, D, B and F have been visited. E isn't visited yet, and its distance is 14. Can E's distance still change?",
      options: [
        right("Yes. E isn't visited yet, so a shorter route can still turn up"),
        wrong('No. Once a vertex has a distance, it never changes', 'm4-first-distance-final', 'Only visited vertices have final distances. E is still unvisited, and it drops to 12 when C is visited.'),
        wrong('No. Distances can only go up', 'm4-distances-go-up', "In Dijkstra's algorithm, distances only ever go down. E drops from 14 to 12 when C is visited."),
      ],
      correctFeedback: 'E is unvisited, so its distance can still drop. It does: to 12, when C is visited.',
      fallbackWrongFeedback: 'Is E visited yet?',
      hints: finalHints,
      facts: [
        { kind: 'edge-check', current: 'F', neighbour: 'E', before: Infinity, after: 14 },
        { kind: 'edge-check', current: 'C', neighbour: 'E', before: 14, after: 12 },
      ],
    }),
    choiceVersion({
      id: 'm4-final-why',
      prompt: "Why is a vertex's distance final once it's visited?",
      options: [
        right('Every unvisited vertex is at least as far away, and weights are never negative, so no shorter route can turn up'),
        wrong('Because it was the first vertex to be reached', 'next-discovery-order', "Being reached first doesn't make a distance final. It's final because it was the smallest unvisited distance when it was visited."),
        wrong("Because Dijkstra's algorithm forgets about visited vertices", 'm4-final-because-ignored', 'The algorithm skips visited vertices because their distances are already final, not the other way round.'),
      ],
      correctFeedback: 'Any other route would have to go through a vertex that is at least as far, and adding weights can only make it longer.',
      fallbackWrongFeedback: 'Think about the distances of the other unvisited vertices at that moment.',
      hints: finalHints,
    }),
  ],
}

export const MODULE_4_GROUPS: readonly ConceptGroup[] = [startValues, nextRule, updateRule, isFinal]
