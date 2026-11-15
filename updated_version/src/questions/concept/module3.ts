/*
  Module 3: The shortest path problem (objective 3)
  Explain what the shortest path problem is.

  DRAFT: every version is reviewed: false until the group has checked it.
*/
import type { VertexId } from '../../engine'
import type { WrongAnswerInfo } from '../types'
import { choiceVersion, right, selectVersion, sub, wrong } from './build'
import { neighbours, pathCost, pathWords, SAMPLE_RESULT, SAMPLE_VERTICES, simplePaths, weightBetween } from './sampleFacts'
import type { ConceptGroup, ConceptOption, ConceptVersion, SampleFact } from './types'

const edgeWeightsOf = (path: readonly VertexId[]) => path.slice(1).map((v, i) => weightBetween(path[i], v))
const sumText = (path: readonly VertexId[]) => `${edgeWeightsOf(path).join(' + ')} = ${pathCost(path)}`
const shortestPathTo = (to: VertexId) => simplePaths('A', to)[0]
const costFact = (path: readonly VertexId[]): SampleFact => ({ kind: 'path-cost', path, cost: pathCost(path) })

// ---------- What the problem asks (hand-written) ----------

const problemHints = {
  nudge: 'Shortest means the smallest total of the edge weights along the route.',
  workedExample:
    'For example, a route along two roads of 2 km and 1 km (3 km in all) is shorter than a route along one road of 4 km, even though it uses more roads.',
  subSteps: [
    sub('How do you work out the length of a route in a weighted graph?', 'Add up the weights of its edges', ['Count its edges', 'Take its heaviest edge'], "A route's length is the sum of its edge weights."),
    sub('Which route does the shortest path problem want?', 'The one with the smallest total weight', ['The one with the fewest edges'], 'Shortest means the smallest total weight.'),
  ],
}

const problem: ConceptGroup = {
  id: 'm3-problem',
  module: 3,
  objective: 3,
  about: 'What the shortest path problem asks for.',
  versions: [
    choiceVersion({
      id: 'm3-problem-asks',
      prompt: 'What does the shortest path problem ask for?',
      options: [
        right('The route between two vertices with the smallest total weight'),
        wrong('The route that uses the fewest edges', 'm3-fewest-edges', "Fewer edges isn't always shorter. The problem asks for the smallest total weight."),
        wrong('The lightest single edge in the graph', 'm3-lightest-edge', "One light edge isn't a route. The problem asks for the route between two vertices with the smallest total weight."),
      ],
      correctFeedback: 'The shortest path is the route between two vertices whose edge weights add up to the smallest total.',
      fallbackWrongFeedback: 'Think about what "shortest" means when every edge has a weight.',
      hints: problemHints,
    }),
    choiceVersion({
      id: 'm3-problem-gautrain',
      prompt: 'A navigation app finds the quickest route from campus to the Gautrain station. In graph terms, what is it finding?',
      options: [
        right('The path with the smallest total weight, where the weights are travel times'),
        wrong('The path with the fewest roads', 'm3-fewest-edges', 'A route with fewer roads can still take longer. The app wants the smallest total travel time.'),
        wrong('The single fastest road', 'm3-lightest-edge', "One fast road doesn't get you to the station. The app adds up the times along the whole route."),
      ],
      correctFeedback: 'Places are vertices, roads are edges and travel times are weights. The quickest route is the shortest path.',
      fallbackWrongFeedback: 'The app adds up something along the whole route. What?',
      hints: problemHints,
    }),
    choiceVersion({
      id: 'm3-problem-length',
      prompt: 'In a weighted graph, what is the length of a path?',
      options: [
        right('The sum of the weights of its edges'),
        wrong('The number of edges on it', 'm3-length-is-edge-count', "That's only true when every edge counts the same. In a weighted graph, you add up the weights."),
        wrong('The weight of its heaviest edge', 'm3-length-is-max-edge', 'You need every edge, not just the heaviest. Add up all the weights along the path.'),
      ],
      correctFeedback: "A path's length is the total of its edge weights.",
      fallbackWrongFeedback: 'In a weighted graph, every edge on the path counts by its weight.',
      hints: problemHints,
    }),
  ],
}

// ---------- Cost of a path (computed) ----------

function pathCostVersion(path: VertexId[]): ConceptVersion {
  const cost = pathCost(path)
  const edgeCount = path.length - 1
  const last = edgeWeightsOf(path)[edgeCount - 1]
  const [x, y] = path.slice(-2)
  const otherExample = path.join('') === 'ABF'
    ? 'For example, the path D to C to E uses edges D-C (8) and C-E (2), so its total weight is 8 + 2 = 10.'
    : 'For example, the path A to B to F uses edges A-B (4) and B-F (5), so its total weight is 4 + 5 = 9.'

  return choiceVersion({
    id: `m3-path-cost-${path.join('')}`,
    view: 'sample',
    prompt: `What is the total weight of the path ${pathWords(path)}?`,
    options: [
      right(String(cost)),
      wrong(String(edgeCount), 'm3-length-is-edge-count', `${edgeCount} is the number of edges on the path. Its length is the sum of the edge weights.`),
      wrong(String(last), 'm3-last-edge-only', `${last} is only the weight of the last edge, ${x}-${y}. Add the weights of every edge on the path.`),
    ],
    correctFeedback: `${sumText(path)}.`,
    fallbackWrongFeedback: 'Find each edge on the path and add up their weights.',
    hints: {
      nudge: 'Find each edge on the path and add up their weights.',
      workedExample: otherExample,
      subSteps: [
        ...path.slice(1).map((v, i) =>
          sub(`What is the weight of edge ${path[i]}-${v}?`, String(weightBetween(path[i], v)), [String(cost)], `Edge ${path[i]}-${v} has weight ${weightBetween(path[i], v)}.`),
        ),
        sub(`What is ${edgeWeightsOf(path).join(' + ')}?`, String(cost), [String(edgeCount), String(last)], `${sumText(path)}.`),
      ],
    },
    facts: [costFact(path)],
  })
}

const pathCostGroup: ConceptGroup = {
  id: 'm3-path-cost',
  module: 3,
  objective: 3,
  about: 'Adding up the weights along a path.',
  versions: [
    pathCostVersion(['A', 'D', 'B']),
    pathCostVersion(['A', 'B', 'F']),
    pathCostVersion(['A', 'D', 'C', 'E']),
    pathCostVersion(['B', 'F', 'E']),
  ],
}

// ---------- Shortest distance (computed from the engine) ----------

function shortestDistanceVersion(to: VertexId): ConceptVersion {
  const distance = SAMPLE_RESULT.finalTable[to].distance
  const shortest = shortestPathTo(to)
  const paths = simplePaths('A', to)
  const fewestEdges = Math.min(...paths.map((p) => p.length))
  const fewestPath = paths.find((p) => p.length === fewestEdges)!

  // Wrong options: the cheapest fewest-edges route first, then other routes from cheapest up.
  const candidates: { path: VertexId[]; misconception: string }[] = [
    { path: fewestPath, misconception: 'm3-fewest-edges' },
    ...paths.slice(1).map((path) => ({ path, misconception: 'm3-not-shortest' })),
  ]
  const wrongOptions: ConceptOption[] = []
  const usedPaths: VertexId[][] = []
  const seen = new Set([String(distance)])
  for (const { path, misconception } of candidates) {
    const label = String(pathCost(path))
    if (seen.has(label)) continue
    seen.add(label)
    usedPaths.push(path)
    wrongOptions.push(
      wrong(
        label,
        misconception,
        misconception === 'm3-fewest-edges'
          ? `The route ${pathWords(path)} has the fewest edges, but it costs ${pathCost(path)}. There's a route with a smaller total weight.`
          : `${pathCost(path)} is the cost of the route ${pathWords(path)}, but there's a route with a smaller total weight.`,
      ),
    )
    if (wrongOptions.length === 2) break
  }

  const compareWith = usedPaths[0]
  const example =
    to === 'B'
      ? 'For example, from A to F: A to B to F costs 4 + 5 = 9, but A to D to B to F costs 2 + 1 + 5 = 8, so the shortest distance from A to F is 8.'
      : 'For example, from A to B: the direct edge costs 4, but A to D to B costs 2 + 1 = 3, so the shortest distance from A to B is 3.'

  return choiceVersion({
    id: `m3-shortest-${to}`,
    view: 'sample',
    prompt: `What is the shortest distance from A to ${to}?`,
    options: [right(String(distance)), ...wrongOptions],
    correctFeedback: `The shortest route is ${pathWords(shortest)}: ${sumText(shortest)}.`,
    fallbackWrongFeedback: `Try a few routes from A to ${to} and add up the weights on each. Keep the smallest total.`,
    hints: {
      nudge: `Try a few routes from A to ${to} and add up the weights on each. Keep the smallest total.`,
      workedExample: example,
      subSteps: [
        sub(`What does the route ${pathWords(compareWith)} cost?`, String(pathCost(compareWith)), [String(distance), String(compareWith.length - 1)], `${sumText(compareWith)}.`),
        sub(`What does the route ${pathWords(shortest)} cost?`, String(distance), [String(pathCost(compareWith)), String(shortest.length - 1)], `${sumText(shortest)}.`),
        sub('Which of those two is smaller?', String(distance), [String(pathCost(compareWith))], `${distance} is smaller, and no other route beats it.`),
      ],
    },
    facts: [{ kind: 'shortest-distance', to, distance }, costFact(shortest), ...usedPaths.map(costFact)],
  })
}

const shortestDistance: ConceptGroup = {
  id: 'm3-shortest-distance',
  module: 3,
  objective: 3,
  about: 'Finding a shortest distance by comparing routes.',
  versions: [shortestDistanceVersion('B'), shortestDistanceVersion('C'), shortestDistanceVersion('F'), shortestDistanceVersion('E')],
}

// ---------- The vertex before the end of a shortest path (computed, select on the graph) ----------

function previousVersion(to: VertexId): ConceptVersion {
  const previous = SAMPLE_RESULT.finalTable[to].previous!
  const shortest = shortestPathTo(to)
  const joined = neighbours(to)
  const vertexFeedback: Record<VertexId, WrongAnswerInfo> = {}
  for (const v of SAMPLE_VERTICES) {
    if (v === to || v === previous) continue
    vertexFeedback[v] = joined.includes(v)
      ? { misconception: 'm3-not-shortest-route', feedback: `${v} is joined to ${to}, but going through ${v} isn't the shortest route from A to ${to}.` }
      : { misconception: 'm3-not-adjacent', feedback: `${v} isn't joined to ${to} by an edge, so it can't come just before ${to} on any route.` }
  }
  const otherRoutes = simplePaths('A', to).slice(1, 3).map(pathWords)
  // The example uses another vertex whose shortest path doesn't overlap with this one,
  // so it can't give the answer away.
  const exampleTarget = ['E', 'B', 'F'].find(
    (t) => t !== to && !shortestPathTo(t).includes(to) && !shortest.includes(t),
  )!
  const examplePath = shortestPathTo(exampleTarget)
  const example = `For example, the shortest path from A to ${exampleTarget} is ${pathWords(examplePath)}, so the vertex just before ${exampleTarget} is ${examplePath[examplePath.length - 2]}.`

  return selectVersion({
    id: `m3-previous-${to}`,
    prompt: `Select the vertex that comes just before ${to} on the shortest path from A to ${to}.`,
    selectable: SAMPLE_VERTICES.filter((v) => v !== to),
    correctVertices: [previous],
    vertexFeedback,
    correctFeedback: `The shortest path from A to ${to} is ${pathWords(shortest)}, so ${previous} comes just before ${to}.`,
    fallbackWrongFeedback: `First find the shortest path from A to ${to}. Then look at the vertex just before ${to}.`,
    hints: {
      nudge: `First find the shortest path from A to ${to}. Then look at the last vertex before ${to}.`,
      workedExample: example,
      subSteps: [
        sub(`What is the shortest path from A to ${to}?`, pathWords(shortest), otherRoutes, `${pathWords(shortest)} costs ${pathCost(shortest)}, less than any other route.`),
        sub(`Which vertex comes just before ${to} on it?`, previous, joined.filter((v) => v !== previous).slice(0, 2), `On ${pathWords(shortest)}, the vertex before ${to} is ${previous}.`),
      ],
    },
    facts: [
      { kind: 'previous-on-shortest-path', to, previous },
      { kind: 'previous-on-shortest-path', to: exampleTarget, previous: examplePath[examplePath.length - 2] },
      costFact(shortest),
    ],
  })
}

const previousGroup: ConceptGroup = {
  id: 'm3-previous',
  module: 3,
  objective: 3,
  about: 'Reading a shortest path: which vertex comes just before the end.',
  versions: [previousVersion('B'), previousVersion('C'), previousVersion('E'), previousVersion('F')],
}

// ---------- Fewer edges is not always shorter (hand-written) ----------

const fewestHints = {
  nudge: 'Compare the total weights of whole routes, not the number of edges and not one edge at a time.',
  workedExample: 'For example, from A to B: the direct edge costs 4, but A to D to B costs 2 + 1 = 3. The route with more edges is shorter.',
  subSteps: [
    sub('What does the direct edge from A to B cost?', '4', ['1', '2'], 'Edge A-B has weight 4.'),
    sub('What does the route A to D to B cost?', '3', ['2', '4'], '2 + 1 = 3.'),
    sub('So which is shorter?', 'A to D to B', ['The direct edge A-B'], '3 is less than 4, even though it uses two edges.'),
  ],
}

const fewestFacts: SampleFact[] = [
  { kind: 'edge-weight', a: 'A', b: 'B', weight: 4 },
  { kind: 'path-cost', path: ['A', 'D', 'B'], cost: 3 },
]

const fewest: ConceptGroup = {
  id: 'm3-fewest-edges',
  module: 3,
  objective: 3,
  about: 'A route with more edges can be shorter.',
  versions: [
    choiceVersion({
      id: 'm3-fewest-always',
      prompt: 'Is the path with the fewest edges always the shortest path?',
      options: [
        right('No. A path with more edges can have a smaller total weight'),
        wrong('Yes. Fewer edges always means a shorter path', 'm3-fewest-edges', 'Not in a weighted graph. A-B is one edge of weight 4, but A to D to B is two edges with a total of 3.'),
        wrong('Only in a directed graph', 'm3-direction-matters', 'Direction has nothing to do with it. In any weighted graph, more edges can still add up to less.'),
      ],
      correctFeedback: 'What counts is the total weight. A to D to B (3) beats the single edge A-B (4).',
      fallbackWrongFeedback: 'Compare A-B with A to D to B on the graph.',
      hints: fewestHints,
      facts: fewestFacts,
    }),
    choiceVersion({
      id: 'm3-fewest-a-to-b',
      view: 'sample',
      prompt: "From A to B there's a direct edge of weight 4, and a route A to D to B. Which is shorter?",
      options: [
        right('A to D to B, with a total of 2 + 1 = 3'),
        wrong('The direct edge, because it uses fewer edges', 'm3-fewest-edges', 'Count the weights, not the edges. A to D to B costs 2 + 1 = 3, which is less than 4.'),
        wrong("They're the same length", 'm3-miscounted', 'Add up the weights again: A to D to B is 2 + 1 = 3, and the direct edge is 4.'),
      ],
      correctFeedback: '2 + 1 = 3 is less than 4, so the route through D is shorter.',
      fallbackWrongFeedback: 'Add up the weights on A to D to B and compare with 4.',
      hints: fewestHints,
      facts: fewestFacts,
    }),
    choiceVersion({
      id: 'm3-fewest-greedy',
      prompt: "Why can't we find the shortest path by always taking the lightest edge from wherever we are?",
      options: [
        right('A light edge now can lead to heavy edges later, so we have to compare total distances'),
        wrong('We can. It always finds the shortest path', 'm3-greedy-lightest-edge', "It doesn't always work. A light first edge can lead to heavy ones, so a route that starts with a heavier edge can still be shorter overall."),
        wrong('Because edges in a graph have no weights', 'm3-no-weights', "Edges in a weighted graph do have weights. The trouble is that the lightest edge now isn't always on the shortest route."),
      ],
      correctFeedback: 'Only the total along the whole route matters, so we have to compare totals, not single edges.',
      fallbackWrongFeedback: 'Think about what can happen after a light first edge.',
      hints: fewestHints,
      facts: fewestFacts,
    }),
  ],
}

export const MODULE_3_GROUPS: readonly ConceptGroup[] = [problem, pathCostGroup, shortestDistance, previousGroup, fewest]
