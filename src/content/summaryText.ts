/*
  Wording for the pre-lecture summary (CLAUDE.md): mastery per objective,
  strengths, what to review and questions to bring to the lecture.

  "What to review" (handoff D60): the seven trace misconceptions (the core
  Dijkstra mistakes, shared by trace and concept questions, D43) each have
  their own line. Every other mistake is grouped under its objective's line,
  so the group doesn't have to review about 90 separate sentences.
*/
import type { ObjectiveId } from '../questions'

/** Set to true once the group has reviewed this file's wording. */
export const SUMMARY_TEXT_REVIEWED = false

export const summaryText = {
  eyebrow: 'Pre-lecture summary',
  titleReady: "You're ready for the lecture",
  titleNotYet: "Here's where you stand before the lecture",
  intro: "Here's where you stand. Bring your questions to class.",
  masteryTitle: 'Mastery by objective',
  finalScore: (percent: number, correct: number, total: number) => `Final check: ${percent}% (${correct} of ${total} right on the first try).`,
  notStarted: 'Not started',
  wellTitle: 'What you did well',
  wellNone: "Keep going. Once you pass a module's check, it shows up here.",
  reviewTitle: 'What to review',
  reviewNothing: 'Nothing urgent. Skim the walkthrough once more before class.',
  openWalkthrough: 'Open the walkthrough',
  revisitModule: (n: number) => `Revisit Module ${n}`,
  questionsTitle: 'Questions to bring to the lecture',
  copy: 'Copy list',
  copied: 'Copied',
  copyFailed: "Couldn't copy. Select the questions and copy them yourself.",
  remove: (n: number) => `Remove question ${n}`,
  addLabel: 'Add a question',
  addPlaceholder: 'Add your own question',
  add: 'Add',
  noQuestions: "You haven't added any questions yet.",
  notesTitle: 'Your notes from "Think about it"',
}

/** A strength for each mastered objective. */
export const STRENGTHS: Record<ObjectiveId, string> = {
  1: 'You can describe a graph with the right terms: vertex, edge, weight, directed and undirected.',
  2: 'You can read an adjacency matrix and an adjacency list, and match them to the drawing.',
  3: 'You know that the shortest path is the one with the smallest total weight, not the fewest edges.',
  4: "You can explain how Dijkstra's algorithm picks the next vertex and updates distances.",
  5: "You can trace Dijkstra's algorithm on a small weighted graph.",
}

/** What to review for an objective below 80%, or with mistakes that have no line of their own. */
export const OBJECTIVE_REVIEW: Record<ObjectiveId, string> = {
  1: 'The parts of a graph: vertices, edges, weights, and directed or undirected edges.',
  2: 'Reading an adjacency matrix (row = from, column = to) and an adjacency list.',
  3: "Path length: add up the edge weights, and remember that fewer edges isn't always shorter.",
  4: "Dijkstra's two rules: visit the smallest unvisited distance, and only replace a distance with a smaller one.",
  5: 'Tracing step by step: choose the next vertex, then update each unvisited neighbour.',
}

/** The core Dijkstra mistakes, each with its own line. */
export const MISCONCEPTION_REVIEW: Readonly<Record<string, string>> = {
  'next-alphabetical': 'Picking the next vertex: always the unvisited one with the smallest distance, not the next letter of the alphabet.',
  'next-discovery-order': "Picking the next vertex: the order vertices were reached in doesn't matter, only their distances.",
  'next-lightest-edge': 'Picking the next vertex: compare total distances from the start, not the weight of a single edge.',
  'dist-keep-old': 'Updating: when the new path is shorter, the distance must change.',
  'dist-edge-only': "A new distance is the whole path: the current vertex's distance plus the edge weight, not just the weight.",
  'dist-always-update': 'Only update a distance when the new path is shorter, like the F-C step in the walkthrough.',
  'dist-own-distance': "A new distance adds the edge weight to the current vertex's distance.",
}
