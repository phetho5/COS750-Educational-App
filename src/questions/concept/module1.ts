/*
  Module 1: What is a graph? (objective 1)
  Describe a graph using the terms vertex, edge, weight, directed and undirected.

  DRAFT: every version is reviewed: false until the group has checked it.
*/
import { listText } from '../../content/format'
import type { VertexId } from '../../engine'
import type { WrongAnswerInfo } from '../types'
import { choiceVersion, right, selectVersion, sub, wrong } from './build'
import {
  inNeighbours,
  nearbyEdges,
  neighbours,
  outNeighbours,
  SAMPLE_VERTICES,
  weightBetween,
} from './sampleFacts'
import type { ConceptGroup, ConceptVersion } from './types'

// ---------- Terminology (hand-written) ----------

const termHints = {
  nudge: 'Think of a map. The places are one kind of thing, the roads between them are another, and the distance along a road is a third.',
  workedExample:
    'On a map of campus, each building would be a vertex, each path between two buildings an edge, and the walking time along a path its weight.',
  subSteps: [
    sub('Which word means a point, like a building on a map?', 'Vertex', ['Edge', 'Weight'], 'A vertex is a point. More than one are called vertices.'),
    sub('Which word means a line joining two vertices?', 'Edge', ['Vertex', 'Weight'], 'An edge joins two vertices.'),
  ],
}

const terms: ConceptGroup = {
  id: 'm1-terms',
  module: 1,
  objective: 1,
  about: 'Vocabulary: vertex, edge, weight, neighbour.',
  versions: [
    choiceVersion({
      id: 'm1-terms-points',
      view: 'sample',
      prompt: 'What do we call the points in a graph, like A and B?',
      options: [
        right('Vertices'),
        wrong('Edges', 'm1-mixes-vertex-edge', 'Edges are the lines that join the points. The points themselves are called vertices.'),
        wrong('Weights', 'm1-mixes-weight', 'Weights are the numbers on the edges. The points are called vertices.'),
      ],
      correctFeedback: 'Each point is a vertex, and together they are vertices.',
      fallbackWrongFeedback: 'Look at the circles labelled A to F. What are they called?',
      hints: termHints,
    }),
    choiceVersion({
      id: 'm1-terms-lines',
      view: 'sample',
      prompt: 'What do we call a line that joins two vertices?',
      options: [
        right('An edge'),
        wrong('A vertex', 'm1-mixes-vertex-edge', 'A vertex is a point, like A. The line joining two points is an edge.'),
        wrong('A weight', 'm1-mixes-weight', 'The weight is the number on the line. The line itself is an edge.'),
      ],
      correctFeedback: 'A line joining two vertices is an edge.',
      fallbackWrongFeedback: 'Look at the lines between the circles. What are they called?',
      hints: termHints,
    }),
    choiceVersion({
      id: 'm1-terms-number',
      view: 'sample',
      prompt: 'The line between A and D has the number 2 on it. What is that number called?',
      options: [
        right("The edge's weight"),
        wrong('The edge', 'm1-mixes-weight', 'The edge is the line itself. The number on it is its weight.'),
        wrong('A vertex', 'm1-mixes-vertex-edge', "A vertex is a point, like A or D. The number on the line is the edge's weight."),
      ],
      correctFeedback: 'The number on an edge is its weight. It could be a distance, a time or a cost.',
      fallbackWrongFeedback: 'The number sits on the line between A and D. What do we call a number on an edge?',
      hints: termHints,
      facts: [{ kind: 'edge-weight', a: 'A', b: 'D', weight: 2 }],
    }),
    choiceVersion({
      id: 'm1-terms-neighbours',
      prompt: 'What are two vertices called when one edge joins them?',
      options: [
        right('Neighbours'),
        wrong('Weights', 'm1-mixes-weight', 'A weight is the number on an edge. Two vertices joined by an edge are neighbours.'),
        wrong('A path', 'm1-mixes-path', 'A path is a route that can use several edges. Two vertices joined directly by one edge are neighbours.'),
      ],
      correctFeedback: 'Two vertices joined by an edge are neighbours.',
      fallbackWrongFeedback: 'Think about what we call people who live right next to each other.',
      hints: termHints,
    }),
  ],
}

// ---------- Edge weight (computed from the sample graph) ----------

function weightVersion(a: VertexId, b: VertexId): ConceptVersion {
  const weight = weightBetween(a, b)
  const misreads = nearbyEdges(a, b).filter(
    (e, i, all) => e.weight !== weight && all.findIndex((x) => x.weight === e.weight) === i,
  )
  const [first, second] = misreads

  return choiceVersion({
    id: `m1-weight-${a}${b}`,
    view: 'sample',
    prompt: `What is the weight of edge ${a}-${b}?`,
    options: [
      right(String(weight)),
      ...[first, second].map((e) =>
        wrong(String(e.weight), 'm1-wrong-edge', `${e.weight} is the weight of edge ${e.name}. Find the line that joins ${a} and ${b}.`),
      ),
    ],
    correctFeedback: `The line joining ${a} and ${b} has ${weight} on it, so edge ${a}-${b} has weight ${weight}.`,
    fallbackWrongFeedback: `Find the line that joins ${a} and ${b}. The number on it is its weight.`,
    hints: {
      nudge: `Find the line that joins ${a} and ${b}. The number on that line is the edge's weight.`,
      workedExample: 'For example, the line joining A and B has 4 on it, so edge A-B has weight 4.',
      subSteps: [
        sub(`Is there a line joining ${a} and ${b} directly?`, 'Yes', ['No'], `Yes. Edge ${a}-${b} joins them.`),
        sub('What number is on that line?', String(weight), [String(first.weight), String(second.weight)], `The number on edge ${a}-${b} is ${weight}.`),
      ],
    },
    facts: [
      { kind: 'edge-weight', a, b, weight },
      ...[first, second].map((e) => {
        const [x, y] = e.name.split('-')
        return { kind: 'edge-weight' as const, a: x, b: y, weight: e.weight }
      }),
    ],
  })
}

const weights: ConceptGroup = {
  id: 'm1-weight',
  module: 1,
  objective: 1,
  about: 'Reading the weight of an edge off the graph.',
  versions: [weightVersion('A', 'D'), weightVersion('B', 'F'), weightVersion('F', 'C'), weightVersion('C', 'E')],
}

// ---------- Neighbours (computed, select on the graph) ----------

const others = (v: VertexId) => SAMPLE_VERTICES.filter((x) => x !== v)

function neighbourVersion(of: VertexId): ConceptVersion {
  const correct = neighbours(of)
  const notJoined = others(of).filter((v) => !correct.includes(v))
  const vertexFeedback: Record<VertexId, WrongAnswerInfo> = {}
  for (const v of notJoined) {
    vertexFeedback[v] = { misconception: 'm1-not-adjacent', feedback: `${v} isn't joined to ${of} by an edge. Follow only the lines that touch ${of}.` }
  }
  const degree = correct.length

  return selectVersion({
    id: `m1-neighbour-${of}`,
    lead: "There's more than one right answer. Any one will do.",
    prompt: `Select a neighbour of ${of}.`,
    selectable: others(of),
    correctVertices: correct,
    vertexFeedback,
    correctFeedback: `${listText(correct)} are all joined to ${of} by an edge, so each of them is a neighbour.`,
    fallbackWrongFeedback: `Follow the lines that touch ${of}. The vertices at their other ends are its neighbours.`,
    hints: {
      nudge: `A neighbour of ${of} is at the other end of a line that touches ${of}.`,
      // The example must not involve `of`, or it would give part of the answer away.
      workedExample: ['A', 'B', 'D'].includes(of)
        ? "For example, E's neighbours are C and F, because lines join E to C and E to F."
        : "For example, A's neighbours are B and D, because lines join A to B and A to D.",
      subSteps: [
        sub(`How many lines touch ${of}?`, String(degree), [String(degree + 1), String(degree - 1)], `${degree} lines touch ${of}: to ${listText(correct)}.`),
        sub(`Which of these is at the other end of one of those lines?`, correct[0], notJoined.slice(0, 2), `A line joins ${of} and ${correct[0]}.`),
      ],
    },
    facts: [{ kind: 'neighbours', of, vertices: correct }],
  })
}

const neighbourGroup: ConceptGroup = {
  id: 'm1-neighbour',
  module: 1,
  objective: 1,
  about: 'Finding a neighbour of a vertex on the graph.',
  versions: [neighbourVersion('C'), neighbourVersion('E'), neighbourVersion('F'), neighbourVersion('B')],
}

// ---------- Directed edges (computed, select on the directed graph) ----------

function directedVersion(of: VertexId): ConceptVersion {
  const reachable = outNeighbours(of)
  const pointingIn = inNeighbours(of)
  const vertexFeedback: Record<VertexId, WrongAnswerInfo> = {}
  for (const v of others(of)) {
    if (reachable.includes(v)) continue
    vertexFeedback[v] = pointingIn.includes(v)
      ? {
          misconception: 'm1-ignores-direction',
          feedback: `There's an edge between ${v} and ${of}, but its arrow points into ${of}. In a directed graph you can only follow an edge the way its arrow points.`,
        }
      : { misconception: 'm1-not-adjacent', feedback: `${v} isn't joined to ${of} by an edge at all.` }
  }
  const notJoined = others(of).filter((v) => !reachable.includes(v) && !pointingIn.includes(v))
  // The example must not involve `of`, or it would give part of the answer away.
  const exampleTouchesOf = of === 'A' || of === 'B'

  return selectVersion({
    id: `m1-directed-${of}`,
    view: 'sample-directed',
    lead: 'This is the same graph, but directed: the arrows show which way each edge goes.',
    prompt: `Select a vertex you can reach from ${of} by following one edge.`,
    selectable: others(of),
    correctVertices: reachable,
    vertexFeedback,
    correctFeedback: `The arrows from ${of} point to ${listText(reachable)}, so you can reach ${reachable.length === 1 ? 'it' : 'any of them'} in one step.`,
    fallbackWrongFeedback: `Find the arrows that start at ${of}. Where do they point?`,
    hints: {
      nudge: `Only arrows that start at ${of} count. You can't follow an arrow that points into ${of} away from it.`,
      workedExample: exampleTouchesOf
        ? 'For example, the arrow between C and E points from C to E, so you can go from C to E, but not from E to C.'
        : 'For example, the arrow between A and B points from A to B, so you can go from A to B, but not from B to A.',
      subSteps: [
        sub(
          `How many arrows start at ${of}?`,
          String(reachable.length),
          [String(reachable.length + pointingIn.length), String(reachable.length + 1)],
          `${reachable.length} ${reachable.length === 1 ? 'arrow starts' : 'arrows start'} at ${of}: to ${listText(reachable)}.`,
        ),
        sub(
          `Where does ${reachable.length === 1 ? 'it' : 'one of them'} point?`,
          reachable[0],
          [...pointingIn, ...notJoined].slice(0, 2),
          `The arrow from ${of} to ${reachable[0]} points to ${reachable[0]}.`,
        ),
      ],
    },
    facts: [{ kind: 'out-neighbours', of, vertices: reachable }],
  })
}

const directed: ConceptGroup = {
  id: 'm1-directed',
  module: 1,
  objective: 1,
  about: 'Following directed edges only the way the arrow points.',
  versions: [directedVersion('D'), directedVersion('F'), directedVersion('B'), directedVersion('A')],
}

// ---------- Directed and undirected (hand-written) ----------

const directionHints = {
  nudge: 'Undirected edges are plain lines and work both ways. Directed edges are arrows and work one way only.',
  workedExample: 'For example, a two-way street is like an undirected edge, and a one-way street is like a directed edge.',
  subSteps: [
    sub('Which kind of edge is drawn as an arrow?', 'Directed', ['Undirected'], 'Directed edges have arrows because they only go one way.'),
    sub('Can you follow an undirected edge in both directions?', 'Yes, with the same weight', ['No'], 'Undirected edges work both ways, with the same weight.'),
  ],
}

const undirected: ConceptGroup = {
  id: 'm1-undirected',
  module: 1,
  objective: 1,
  about: 'What directed and undirected mean.',
  versions: [
    choiceVersion({
      id: 'm1-undirected-both-ways',
      view: 'sample',
      prompt: 'Our graph is undirected. Edge A-B has weight 4. Which of these is true?',
      options: [
        right('You can go from A to B or from B to A, and both cost 4'),
        wrong('You can only go from A to B', 'm1-undirected-is-one-way', 'That would be a directed edge, drawn as an arrow. Our graph is undirected, so every edge works both ways.'),
        wrong('Going from B to A costs a different amount', 'm1-direction-changes-weight', "An undirected edge has one weight, and it's the same in both directions."),
      ],
      correctFeedback: 'An undirected edge works both ways, with the same weight each way.',
      fallbackWrongFeedback: 'Undirected means the edge has no direction. What does that mean for travelling along it?',
      hints: directionHints,
      facts: [{ kind: 'edge-weight', a: 'A', b: 'B', weight: 4 }],
    }),
    choiceVersion({
      id: 'm1-undirected-arrow',
      prompt: 'What does an arrow on an edge mean?',
      options: [
        right('The edge is one-way: you can only follow it the way the arrow points'),
        wrong('The edge has a bigger weight', 'm1-arrow-means-weight', 'An arrow shows direction, not weight. The weight is the number on the edge.'),
        wrong('The edge is part of the shortest path', 'm1-arrow-means-path', 'An arrow shows that the edge is one-way. It says nothing about shortest paths.'),
      ],
      correctFeedback: 'An arrow makes an edge directed: it can only be followed one way.',
      fallbackWrongFeedback: 'Think of arrows on a road sign. What do they tell drivers?',
      hints: directionHints,
    }),
    choiceVersion({
      id: 'm1-undirected-reverse',
      prompt: 'A directed graph has an arrow from A to B. Can you travel from B to A along that edge?',
      options: [
        right('No. You can only follow it from A to B'),
        wrong('Yes. Every edge works both ways', 'm1-directed-is-two-way', "That's true in an undirected graph. In a directed graph, an arrow can only be followed the way it points."),
        wrong('Only if its weight is small', 'm1-direction-depends-on-weight', "The weight doesn't change the direction. An arrow from A to B can only be followed from A to B."),
      ],
      correctFeedback: 'A directed edge only works the way its arrow points.',
      fallbackWrongFeedback: 'Which way does the arrow point? Can you follow it the other way?',
      hints: directionHints,
    }),
  ],
}

export const MODULE_1_GROUPS: readonly ConceptGroup[] = [terms, weights, neighbourGroup, directed, undirected]
