/*
  Module 2: Representing graphs (objective 2)
  Represent a small graph as an adjacency matrix and an adjacency list.

  DRAFT: every version is reviewed: false until the group has checked it.
*/
import { listText } from '../../content/format'
import { SAMPLE_GRAPH, type VertexId } from '../../engine'
import { choiceVersion, right, sub, wrong } from './build'
import { nearbyEdges, neighbours, SAMPLE_VERTICES, weightBetween } from './sampleFacts'
import type { ConceptGroup, ConceptOption, ConceptVersion, SampleFact } from './types'

const EDGE_COUNT = SAMPLE_GRAPH.edges.length
const VERTEX_COUNT = SAMPLE_GRAPH.vertices.length

/** The non-zero cells in row `row` other than column `except`, as { column, weight }. */
function otherCellsInRow(row: VertexId, except: VertexId) {
  return neighbours(row)
    .filter((c) => c !== except)
    .map((column) => ({ column, weight: weightBetween(row, column) }))
}

/** Keeps only options whose labels are new and differ from the correct label. */
function distinctWrong(correctLabel: string, options: ConceptOption[], count: number): ConceptOption[] {
  const seen = new Set([correctLabel])
  const result: ConceptOption[] = []
  for (const o of options) {
    if (seen.has(o.label)) continue
    seen.add(o.label)
    result.push(o)
    if (result.length === count) break
  }
  return result
}

// ---------- Reading a matrix cell (computed) ----------

function matrixCellVersion(row: VertexId, column: VertexId): ConceptVersion {
  const value = weightBetween(row, column)
  const hasEdge = value > 0
  const misreadCells = otherCellsInRow(row, column).map((cell) =>
    wrong(
      String(cell.weight),
      'm2-wrong-cell',
      `${cell.weight} is in row ${row}, but in column ${cell.column}: it's the weight of edge ${row}-${cell.column}. Look in column ${column}.`,
    ),
  )
  const thinksNoEdge = wrong('0', 'm2-thinks-no-edge', `There is an edge between ${row} and ${column}, so the cell holds its weight, not 0.`)
  const wrongOptions = distinctWrong(String(value), hasEdge ? [thinksNoEdge, ...misreadCells] : misreadCells, 2)
  const correctFeedback = hasEdge
    ? `Edge ${row}-${column} has weight ${value}, so row ${row}, column ${column} holds ${value}.`
    : `No edge joins ${row} and ${column}, so the cell holds 0.`

  return choiceVersion({
    id: `m2-matrix-${row}${column}`,
    view: 'sample',
    lead: 'In an adjacency matrix, each row is a "from" vertex and each column a "to" vertex. 0 means no edge.',
    prompt: `In this graph's adjacency matrix, what is in row ${row}, column ${column}?`,
    options: [right(String(value)), ...wrongOptions],
    correctFeedback,
    fallbackWrongFeedback: `Check whether an edge joins ${row} and ${column}. If one does, the cell holds its weight. If not, it holds 0.`,
    hints: {
      nudge: `Row ${row}, column ${column} is about the edge between ${row} and ${column}. Is there one?`,
      workedExample: 'For example, row A, column B holds 4, because edge A-B has weight 4. Row A, column C holds 0, because no edge joins A and C.',
      subSteps: [
        sub(
          `Is there an edge between ${row} and ${column}?`,
          hasEdge ? 'Yes' : 'No',
          [hasEdge ? 'No' : 'Yes'],
          hasEdge ? `Yes, with weight ${value}.` : `No. No line joins ${row} and ${column}.`,
        ),
        sub('So what goes in the cell?', String(value), wrongOptions.map((o) => o.label), correctFeedback),
      ],
    },
    facts: [
      { kind: 'matrix-cell', row, column, value },
      ...otherCellsInRow(row, column).map((cell): SampleFact => ({ kind: 'matrix-cell', row, column: cell.column, value: cell.weight })),
    ],
  })
}

const matrixCell: ConceptGroup = {
  id: 'm2-matrix-cell',
  module: 2,
  objective: 2,
  about: 'Reading one cell of the adjacency matrix, including a 0 cell.',
  versions: [matrixCellVersion('B', 'D'), matrixCellVersion('C', 'F'), matrixCellVersion('A', 'E'), matrixCellVersion('E', 'F')],
}

// ---------- Symmetry of the matrix (computed) ----------

function symmetryVersion(a: VertexId, b: VertexId): ConceptVersion {
  const value = weightBetween(a, b)
  const misread = otherCellsInRow(b, a)[0]
  const wrongOptions = distinctWrong(
    String(value),
    [
      wrong('0', 'm2-one-direction', `In an undirected graph, edge ${a}-${b} works both ways, so it appears in both cells: row ${a}, column ${b} and row ${b}, column ${a}.`),
      wrong(String(misread.weight), 'm2-wrong-cell', `${misread.weight} is in row ${b}, but it's the weight of edge ${b}-${misread.column}. Look in column ${a}.`),
    ],
    2,
  )

  return choiceVersion({
    id: `m2-symmetry-${a}${b}`,
    prompt: `This graph is undirected. In its adjacency matrix, row ${a}, column ${b} holds ${value}. What does row ${b}, column ${a} hold?`,
    view: 'sample',
    options: [right(String(value)), ...wrongOptions],
    correctFeedback: `Edge ${b}-${a} is the same edge as ${a}-${b}, so both cells hold ${value}.`,
    fallbackWrongFeedback: 'In an undirected graph each edge works both ways. Where does that put it in the matrix?',
    hints: {
      nudge: 'In an undirected graph, an edge works both ways. Where does that put it in the matrix?',
      workedExample: 'For example, edge A-D has weight 2, so row A, column D holds 2, and so does row D, column A.',
      subSteps: [
        sub(`Is edge ${b}-${a} the same edge as ${a}-${b}?`, 'Yes, because the graph is undirected', ["No, it's a different edge"], 'In an undirected graph the same edge works both ways.'),
        sub(`So what is in row ${b}, column ${a}?`, String(value), wrongOptions.map((o) => o.label), `The same as row ${a}, column ${b}: ${value}.`),
      ],
    },
    facts: [
      { kind: 'matrix-cell', row: a, column: b, value },
      { kind: 'matrix-cell', row: b, column: a, value },
      { kind: 'matrix-cell', row: b, column: misread.column, value: misread.weight },
    ],
  })
}

const symmetry: ConceptGroup = {
  id: 'm2-symmetry',
  module: 2,
  objective: 2,
  about: 'An undirected edge appears twice in the matrix.',
  versions: [symmetryVersion('B', 'D'), symmetryVersion('F', 'C'), symmetryVersion('A', 'B')],
}

// ---------- Adjacency list entries (computed) ----------

const entry = (vertex: VertexId, weight: number) => `${vertex} · ${weight}`
const listOf = (of: VertexId) => neighbours(of).map((n) => entry(n, weightBetween(of, n)))

function listEntryVersion(of: VertexId): ConceptVersion {
  const joined = neighbours(of)
  const correct = joined[0]
  const correctWeight = weightBetween(of, correct)

  // A vertex not joined to `of`, shown with the weight of one of its own edges.
  const stranger = SAMPLE_VERTICES.find((v) => v !== of && !joined.includes(v))!
  const strangerWeight = weightBetween(stranger, neighbours(stranger)[0])

  // A real neighbour shown with the weight of a different edge.
  const misweighed = joined[1] ?? joined[0]
  const realWeight = weightBetween(of, misweighed)
  const wrongWeight = nearbyEdges(of, misweighed).map((e) => e.weight).find((w) => w !== realWeight)!

  return choiceVersion({
    id: `m2-list-entry-${of}`,
    view: 'sample',
    lead: 'Each entry in an adjacency list is a neighbour and the weight of the edge to it.',
    prompt: `Which of these is in ${of}'s adjacency list?`,
    options: [
      right(entry(correct, correctWeight)),
      wrong(entry(stranger, strangerWeight), 'm2-not-adjacent', `${stranger} isn't joined to ${of} by an edge, so it isn't in ${of}'s list.`),
      wrong(entry(misweighed, wrongWeight), 'm2-wrong-weight', `${misweighed} is in ${of}'s list, but edge ${of}-${misweighed} has weight ${realWeight}, not ${wrongWeight}.`),
    ],
    correctFeedback: `Edge ${of}-${correct} has weight ${correctWeight}. ${of}'s full list is ${listText(listOf(of))}.`,
    fallbackWrongFeedback: `${of}'s list has one entry for each edge that touches ${of}.`,
    hints: {
      nudge: `${of}'s list has one entry for each edge that touches ${of}: the vertex at the other end and the edge's weight.`,
      workedExample: "For example, B's list is A · 4, D · 1 and F · 5, because B has edges to A (4), D (1) and F (5).",
      subSteps: [
        sub(
          `Which vertices are joined to ${of} by an edge?`,
          listText(joined),
          [listText(SAMPLE_VERTICES.filter((v) => v !== of && !joined.includes(v)))],
          `Lines join ${of} to ${listText(joined)}.`,
        ),
        sub(`What is the weight of edge ${of}-${misweighed}?`, String(realWeight), [String(wrongWeight)], `Edge ${of}-${misweighed} has weight ${realWeight}.`),
      ],
    },
    facts: [
      { kind: 'in-list', of, neighbour: correct, weight: correctWeight, present: true },
      { kind: 'in-list', of, neighbour: stranger, weight: strangerWeight, present: false },
      { kind: 'in-list', of, neighbour: misweighed, weight: wrongWeight, present: false },
      { kind: 'edge-weight', a: of, b: misweighed, weight: realWeight },
    ],
  })
}

const listEntry: ConceptGroup = {
  id: 'm2-list-entry',
  module: 2,
  objective: 2,
  about: 'Recognising an entry in an adjacency list.',
  versions: [listEntryVersion('A'), listEntryVersion('C'), listEntryVersion('F'), listEntryVersion('E')],
}

// ---------- Adjacency list length (computed) ----------

function listLengthVersion(of: VertexId): ConceptVersion {
  const joined = neighbours(of)
  const length = joined.length

  return choiceVersion({
    id: `m2-list-length-${of}`,
    view: 'sample',
    prompt: `How many entries are in ${of}'s adjacency list?`,
    options: [
      right(String(length)),
      wrong(String(length + 1), 'm2-counts-self', `${of} itself isn't in its own list. Count only the edges that touch ${of}.`),
      wrong(String(EDGE_COUNT), 'm2-counts-all-edges', `${EDGE_COUNT} is the number of edges in the whole graph. ${of}'s list only has the edges that touch ${of}.`),
    ],
    correctFeedback: `${of} has ${length} edges, to ${listText(joined)}, so its list has ${length} entries.`,
    fallbackWrongFeedback: `Count the lines that touch ${of}.`,
    hints: {
      nudge: `Count the lines that touch ${of}. Each one is an entry in its list.`,
      workedExample: "For example, A has edges to B and D, so A's list has 2 entries.",
      subSteps: [
        sub(`Which vertices are joined to ${of}?`, listText(joined), [listText(SAMPLE_VERTICES.filter((v) => v !== of))], `Lines join ${of} to ${listText(joined)}.`),
        sub('How many is that?', String(length), [String(length + 1), String(EDGE_COUNT)], `That's ${length} vertices, so ${length} entries.`),
      ],
    },
    facts: [
      { kind: 'list-length', of, length },
      { kind: 'neighbours', of, vertices: joined },
      { kind: 'count', what: 'edges', value: EDGE_COUNT },
    ],
  })
}

const listLength: ConceptGroup = {
  id: 'm2-list-length',
  module: 2,
  objective: 2,
  about: 'How many entries a vertex has in its adjacency list.',
  versions: [listLengthVersion('B'), listLengthVersion('C'), listLengthVersion('E'), listLengthVersion('F')],
}

// ---------- Matrix or list? (hand-written) ----------

const compareHints = {
  nudge: 'A matrix has a row and a column for every vertex. A list only has entries for the edges that exist.',
  workedExample: `For example, our graph has ${VERTEX_COUNT} vertices, so its matrix has ${VERTEX_COUNT} rows and ${VERTEX_COUNT} columns: ${VERTEX_COUNT * VERTEX_COUNT} cells. Only ${EDGE_COUNT * 2} of them hold a weight, because each of the ${EDGE_COUNT} edges appears twice.`,
  subSteps: [
    sub('How many rows does the matrix have for a graph with 5 vertices?', '5', ['10', '25'], 'One row for each vertex.'),
    sub('Does an adjacency list have entries for pairs of vertices with no edge?', 'No', ['Yes'], 'A list only has entries for edges that exist.'),
  ],
}

const compare: ConceptGroup = {
  id: 'm2-compare',
  module: 2,
  objective: 2,
  about: 'How a matrix and a list differ.',
  versions: [
    choiceVersion({
      id: 'm2-compare-only-edges',
      prompt: 'Which way of storing a graph keeps only the edges that exist?',
      options: [
        right('An adjacency list'),
        wrong('An adjacency matrix', 'm2-matrix-only-edges', 'A matrix has a cell for every pair of vertices, even pairs with no edge. Those cells hold 0.'),
        wrong('Both of them', 'm2-both-only-edges', 'A matrix stores every pair of vertices, including pairs with no edge. Only the list skips them.'),
      ],
      correctFeedback: 'An adjacency list only has an entry for each edge that exists. A matrix has a cell for every pair.',
      fallbackWrongFeedback: 'Which one has a 0 for pairs with no edge?',
      hints: compareHints,
    }),
    choiceVersion({
      id: 'm2-compare-rows',
      prompt: `Our graph has ${VERTEX_COUNT} vertices and ${EDGE_COUNT} edges. How many rows does its adjacency matrix have?`,
      options: [
        right(String(VERTEX_COUNT)),
        wrong(String(EDGE_COUNT), 'm2-rows-per-edge', 'The matrix has one row per vertex, not one per edge.'),
        wrong(String(VERTEX_COUNT * VERTEX_COUNT), 'm2-counts-cells', `${VERTEX_COUNT * VERTEX_COUNT} is the number of cells (${VERTEX_COUNT} rows times ${VERTEX_COUNT} columns). The number of rows is the number of vertices.`),
      ],
      correctFeedback: `One row for each vertex, so ${VERTEX_COUNT} rows (and ${VERTEX_COUNT} columns).`,
      fallbackWrongFeedback: 'Each row of the matrix belongs to one vertex.',
      hints: compareHints,
      facts: [
        { kind: 'count', what: 'vertices', value: VERTEX_COUNT },
        { kind: 'count', what: 'edges', value: EDGE_COUNT },
      ],
    }),
    choiceVersion({
      id: 'm2-compare-twice',
      prompt: 'In an undirected graph, why does each edge appear twice in the adjacency matrix?',
      options: [
        right("It works both ways, so it's in row A, column B and also in row B, column A"),
        wrong('Each edge has two different weights', 'm2-two-weights', 'An undirected edge has only one weight. It appears twice because it works in both directions.'),
        wrong("It's a mistake in the matrix", 'm2-duplicate-is-error', "It isn't a mistake. An undirected edge works both ways, so both cells hold its weight."),
      ],
      correctFeedback: 'An undirected edge works both ways, so it fills two cells with the same weight.',
      fallbackWrongFeedback: 'Think about what undirected means.',
      hints: compareHints,
    }),
  ],
}

export const MODULE_2_GROUPS: readonly ConceptGroup[] = [matrixCell, symmetry, listEntry, listLength, compare]
