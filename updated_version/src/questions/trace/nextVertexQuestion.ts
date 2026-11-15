/*
  "Which vertex does Dijkstra's algorithm visit next?", as multiple choice or
  as "select it on the graph".
*/
import { TRACE_TEXT_REVIEWED, nextVertexText as text, type UnvisitedDistance } from '../../content/traceText'
import type { Rng } from '../random'
import type { ObjectiveId, Question, WrongAnswerInfo } from '../types'
import type { NextVertexCase } from './cases'
import { nextVertexMistakes, type NextVertexMistake } from './misconceptions'
import { makeSubStep } from './subSteps'
import { viewFor } from './view'

export type NextVertexFormat = 'multiple-choice' | 'select-vertex'

function unvisitedDistances(c: NextVertexCase): UnvisitedDistance[] {
  return c.unvisited.map((vertex) => ({ vertex, distance: c.table[vertex].distance }))
}

function mistakeFeedback(c: NextVertexCase, mistake: NextVertexMistake): string {
  const distance = c.table[mistake.vertex].distance
  switch (mistake.misconception) {
    case 'next-alphabetical':
      return text.alphabetical(mistake.vertex, distance)
    case 'next-discovery-order':
      return text.discoveryOrder(mistake.vertex, distance)
    case 'next-lightest-edge':
      return text.lightestEdge(mistake.vertex, distance, c.lastVisited)
  }
}

/** Feedback for every wrong vertex: its misconception if it has one, otherwise a general hint. */
function wrongAnswers(c: NextVertexCase, mistakes: NextVertexMistake[]): Record<string, WrongAnswerInfo> {
  const result: Record<string, WrongAnswerInfo> = {}
  for (const vertex of c.unvisited) {
    if (vertex === c.answer) continue
    const mistake = mistakes.find((m) => m.vertex === vertex)
    result[vertex] = mistake
      ? { misconception: mistake.misconception, feedback: mistakeFeedback(c, mistake) }
      : { misconception: null, feedback: text.other(vertex, c.table[vertex].distance) }
  }
  return result
}

/** A different moment from the same run, described as a worked example. */
function workedExample(c: NextVertexCase, others: readonly NextVertexCase[]): string {
  const other = others.find((o) => o.stepIndex !== c.stepIndex)
  if (!other) return text.sampleWorkedExample
  return text.workedExample(other.visited, unvisitedDistances(other), other.answer, other.table[other.answer].distance)
}

function subSteps(c: NextVertexCase, rng: Rng) {
  const distances = unvisitedDistances(c)
  return [
    makeSubStep(
      rng,
      text.subStepUnvisited.prompt,
      c.unvisited.join(', '),
      [c.visited.join(', ')],
      text.subStepUnvisited.explanation(c.visited, c.unvisited),
    ),
    makeSubStep(
      rng,
      text.subStepSmallest.prompt,
      text.subStepSmallest.option(c.answer, c.table[c.answer].distance),
      distances.filter((u) => u.vertex !== c.answer).map((u) => text.subStepSmallest.option(u.vertex, u.distance)),
      text.subStepSmallest.explanation(c.answer, c.table[c.answer].distance),
    ),
  ]
}

export function buildNextVertexQuestion(
  c: NextVertexCase,
  format: NextVertexFormat,
  others: readonly NextVertexCase[],
  rng: Rng,
  seed: number,
  objective: ObjectiveId,
): Question {
  const mistakes = nextVertexMistakes(c)
  const isChoice = format === 'multiple-choice'
  const allWrong = wrongAnswers(c, mistakes)

  // Multiple choice offers only misconception answers as wrong options, so
  // every wrong option is tied to a misconception. Select-vertex lets the
  // student pick any unvisited vertex, so it needs feedback for all of them.
  const optionVertices = isChoice ? rng.shuffle([c.answer, ...mistakes.map((m) => m.vertex)]) : []
  const shownWrong = isChoice
    ? Object.fromEntries(mistakes.map((m) => [m.vertex, allWrong[m.vertex]]))
    : allWrong

  return {
    id: `trace:next-vertex:${format}:${seed}`,
    source: 'trace',
    typeKey: `trace:next-vertex:${format}`,
    format,
    objective,
    lead: text.lead(c.visited, unvisitedDistances(c), isChoice),
    prompt: isChoice ? text.promptChoice : text.promptSelect,
    view: viewFor(c.layout, c.graph, {
      table: c.table,
      visited: c.visited,
      current: null,
      checkingEdge: null,
      selectable: isChoice ? [] : c.unvisited,
    }),
    options: optionVertices.map((v) => ({ id: v, label: v })),
    fillTarget: null,
    correctAnswers: [c.answer],
    wrongAnswers: shownWrong,
    fallbackWrongFeedback: text.fallback,
    correctFeedback: text.correct(c.answer, c.table[c.answer].distance),
    hints: { nudge: text.nudge, workedExample: workedExample(c, others), subSteps: subSteps(c, rng) },
    reviewed: TRACE_TEXT_REVIEWED,
    concept: null,
    trace: { skill: 'next-vertex', seed, layoutId: c.layout.id },
  }
}
