/*
  Questions about one edge check:
  - "new distance" (fill-in): type the neighbour's distance after the check.
  - "predict" (options): what happens next, stays or changes?
*/
import { formatDistance } from '../../content/format'
import {
  TRACE_TEXT_REVIEWED,
  edgeCheckExampleText as exampleText,
  edgeCheckMistakeText as mistakeText,
  newDistanceText,
  predictText,
  type EdgeCheckNumbers,
} from '../../content/traceText'
import type { Rng } from '../random'
import type { AnswerOption, GraphView, ObjectiveId, Question, SubStep, WrongAnswerInfo } from '../types'
import type { EdgeCheckCase } from './cases'
import { edgeCheckMistakes, ownDistanceMistake, type EdgeCheckMistake } from './misconceptions'
import { makeSubStep } from './subSteps'
import { viewFor } from './view'

/** How a distance is stored as an answer key: "12" or "Infinity". */
export function distanceKey(distance: number): string {
  return String(distance)
}

function numbers(c: EdgeCheckCase): EdgeCheckNumbers {
  return {
    current: c.current,
    neighbour: c.neighbour,
    currentDistance: c.currentDistance,
    weight: c.weight,
    oldDistance: c.oldDistance,
    candidate: c.candidate,
    updated: c.updated,
  }
}

function mistakeFeedback(n: EdgeCheckNumbers, mistake: EdgeCheckMistake): string {
  switch (mistake.misconception) {
    case 'dist-keep-old':
      return mistakeText.keepOld(n)
    case 'dist-edge-only':
      return mistakeText.edgeOnly(n)
    case 'dist-always-update':
      return mistakeText.alwaysUpdate(n)
    case 'dist-own-distance':
      return mistakeText.ownDistance(n)
  }
}

function view(c: EdgeCheckCase): GraphView {
  return viewFor(c.layout, c.graph, {
    table: c.table,
    visited: c.visited,
    current: c.current,
    checkingEdge: [c.current, c.neighbour],
    selectable: [],
  })
}

/** A different edge check from the same run, preferring one with the same outcome (changed or not). */
function workedExample(c: EdgeCheckCase, others: readonly EdgeCheckCase[]): string {
  const different = others.filter((o) => o.stepIndex !== c.stepIndex && o.currentDistance > 0)
  const other = different.find((o) => o.updated === c.updated) ?? different[0]
  return other ? exampleText.workedExample(numbers(other)) : exampleText.sampleWorkedExample
}

function subSteps(c: EdgeCheckCase, rng: Rng): SubStep[] {
  const n = numbers(c)
  const fmt = formatDistance
  return [
    makeSubStep(
      rng,
      exampleText.subStepCurrentDistance.prompt(n),
      fmt(c.currentDistance),
      [String(c.weight), fmt(c.oldDistance)],
      exampleText.subStepCurrentDistance.explanation(n),
    ),
    makeSubStep(
      rng,
      exampleText.subStepPathCost.prompt(n),
      `${fmt(c.currentDistance)} + ${c.weight} = ${c.candidate}`,
      [String(c.weight), fmt(c.currentDistance)],
      exampleText.subStepPathCost.explanation(n),
    ),
    makeSubStep(
      rng,
      exampleText.subStepCompare.prompt(n),
      c.updated ? exampleText.subStepCompare.yes : exampleText.subStepCompare.no,
      [c.updated ? exampleText.subStepCompare.no : exampleText.subStepCompare.yes],
      exampleText.subStepCompare.explanation(n),
    ),
  ]
}

interface SharedParts {
  c: EdgeCheckCase
  others: readonly EdgeCheckCase[]
  rng: Rng
  seed: number
  objective: ObjectiveId
}

export function buildNewDistanceQuestion({ c, others, rng, seed, objective }: SharedParts): Question {
  const n = numbers(c)
  const wrongAnswers: Record<string, WrongAnswerInfo> = {}
  const own = ownDistanceMistake(c)
  for (const mistake of [...edgeCheckMistakes(c), ...(own ? [own] : [])]) {
    wrongAnswers[distanceKey(mistake.value)] = { misconception: mistake.misconception, feedback: mistakeFeedback(n, mistake) }
  }

  return {
    id: `trace:new-distance:fill-in:${seed}`,
    source: 'trace',
    typeKey: 'trace:new-distance:fill-in',
    format: 'fill-in',
    objective,
    lead: newDistanceText.lead(n),
    prompt: newDistanceText.prompt(n),
    view: view(c),
    options: [],
    fillTarget: c.neighbour,
    correctAnswers: [distanceKey(c.answer)],
    wrongAnswers,
    fallbackWrongFeedback: mistakeText.fallback(n),
    correctFeedback: newDistanceText.correct(n),
    hints: { nudge: newDistanceText.nudge, workedExample: workedExample(c, others), subSteps: subSteps(c, rng) },
    reviewed: TRACE_TEXT_REVIEWED,
    concept: null,
    trace: { skill: 'new-distance', seed, layoutId: c.layout.id },
  }
}

/** A predict option for "the neighbour ends up at `value`". */
function predictOption(n: EdgeCheckNumbers, value: number): AnswerOption {
  return value === n.oldDistance
    ? { id: 'stays', label: predictText.stays(n) }
    : { id: `changes-to-${distanceKey(value)}`, label: predictText.changesTo(n, value) }
}

export function buildPredictQuestion({ c, others, rng, seed, objective }: SharedParts): Question {
  const n = numbers(c)
  const mistakes = edgeCheckMistakes(c)
  const correct = predictOption(n, c.answer)
  const wrongOptions = mistakes.map((m) => ({ option: predictOption(n, m.value), mistake: m }))

  const wrongAnswers: Record<string, WrongAnswerInfo> = {}
  for (const { option, mistake } of wrongOptions) {
    wrongAnswers[option.id] = { misconception: mistake.misconception, feedback: mistakeFeedback(n, mistake) }
  }

  return {
    id: `trace:predict-update:predict:${seed}`,
    source: 'trace',
    typeKey: 'trace:predict-update:predict',
    format: 'predict',
    objective,
    lead: predictText.lead(n),
    prompt: predictText.prompt,
    view: view(c),
    options: rng.shuffle([correct, ...wrongOptions.map((w) => w.option)]),
    fillTarget: null,
    correctAnswers: [correct.id],
    wrongAnswers,
    fallbackWrongFeedback: mistakeText.fallback(n),
    correctFeedback: predictText.correct(n),
    hints: { nudge: predictText.nudge(n), workedExample: workedExample(c, others), subSteps: subSteps(c, rng) },
    reviewed: TRACE_TEXT_REVIEWED,
    concept: null,
    trace: { skill: 'predict-update', seed, layoutId: c.layout.id },
  }
}
