/*
  The shape of every question in the app, whether it was generated from the
  engine (a trace question) or taken from the concept bank. The question
  screen only needs to understand this one shape.
*/
import type { DistanceTable, Graph, VertexId } from '../engine'
import type { LayoutId, LayoutSize } from './layouts'

export type ObjectiveId = 1 | 2 | 3 | 4 | 5
export type ModuleId = 1 | 2 | 3 | 4 | 5

/** The four question types the brief asks for. */
export type QuestionFormat =
  | 'multiple-choice' // pick one option
  | 'select-vertex' // select a vertex on the graph
  | 'fill-in' // type a number into the distance table
  | 'predict' // predict what happens at the next step (options)

/**
 * A misconception is a specific wrong idea, such as "picks vertices in
 * alphabetical order". Every wrong option is tied to one, so the feedback can
 * be about that exact mistake.
 */
export type MisconceptionId = string

export interface AnswerOption {
  /** Stable id, used to check the answer. */
  readonly id: string
  /** Text shown to the student. */
  readonly label: string
}

/** What a particular wrong answer means, and the feedback for it. */
export interface WrongAnswerInfo {
  readonly misconception: MisconceptionId | null
  readonly feedback: string
}

/** One small question in hint level 4 ("the task broken into smaller questions"). */
export interface SubStep {
  readonly prompt: string
  readonly options: readonly string[]
  readonly correctIndex: number
  /** Shown once the student has answered this sub-step correctly. */
  readonly explanation: string
}

/**
 * The hint ladder. Level 2, "what went wrong", isn't stored here because it
 * depends on the student's answer: it's the feedback from checkAnswer().
 */
export interface Hints {
  /** Level 1: a nudge in the right direction. */
  readonly nudge: string
  /** Level 3: a worked example of a similar step. */
  readonly workedExample: string
  /** Level 4: the task broken into smaller questions. */
  readonly subSteps: readonly SubStep[]
}

/** What to draw next to the question. */
export interface GraphView {
  /** Which fixed shape this is. Its letters may be shuffled, so draw from `wide`/`narrow`, not from the layout. */
  readonly layoutId: LayoutId
  /** Where to draw each vertex, keyed by the letters this graph actually uses. */
  readonly wide: LayoutSize
  readonly narrow: LayoutSize
  readonly graph: Graph
  /** Distances to show on the graph and in the table, or null to show none. */
  readonly table: DistanceTable | null
  /** Vertices visited so far, in visit order (excluding `current`). */
  readonly visited: readonly VertexId[]
  /** The vertex being visited right now, if any. */
  readonly current: VertexId | null
  /** The edge being checked right now, if any. */
  readonly checkingEdge: readonly [VertexId, VertexId] | null
  /** Vertices the student may select (select-vertex questions only). */
  readonly selectable: readonly VertexId[]
}

export interface Question {
  /** Unique id. The same seed or bank version always gives the same id. */
  readonly id: string
  readonly source: 'trace' | 'concept'
  /**
   * Questions with the same typeKey are "the same type". After the hint
   * ladder, the student gets a new question with the same typeKey.
   */
  readonly typeKey: string
  readonly format: QuestionFormat
  readonly objective: ObjectiveId
  /** Context shown above the prompt. Can be empty. */
  readonly lead: string
  readonly prompt: string
  readonly view: GraphView | null
  /** Options for multiple-choice and predict questions. Empty for the others. */
  readonly options: readonly AnswerOption[]
  /** For fill-in questions: the vertex whose distance cell the student fills in. */
  readonly fillTarget: VertexId | null
  /**
   * Every answer that is correct: option ids, vertex names, or a distance
   * written as a whole number (or "Infinity").
   */
  readonly correctAnswers: readonly string[]
  /** Known wrong answers and what each one means. Same keys as correctAnswers. */
  readonly wrongAnswers: Readonly<Record<string, WrongAnswerInfo>>
  /** Feedback for a wrong answer we didn't predict. */
  readonly fallbackWrongFeedback: string
  readonly correctFeedback: string
  readonly hints: Hints
  /** False until the group has checked the question's wording and answer. */
  readonly reviewed: boolean
  /** Concept questions only: which bank group and version this is. */
  readonly concept: { readonly groupId: string; readonly versionId: string } | null
  /** Trace questions only: how to rebuild it. */
  readonly trace: { readonly skill: string; readonly seed: number; readonly layoutId: LayoutId } | null
}

export type CheckResult =
  | { readonly status: 'correct'; readonly feedback: string }
  | { readonly status: 'wrong'; readonly misconception: MisconceptionId | null; readonly feedback: string }
  /** The input couldn't be read (e.g. letters typed into a number box). Not marked wrong. */
  | { readonly status: 'invalid'; readonly feedback: string }
