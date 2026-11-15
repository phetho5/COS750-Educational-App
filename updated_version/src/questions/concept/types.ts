/*
  Types for the concept question bank.

  A group is one question asked three or four ways (its versions). When a
  student gets a new question of the same type, they get another version
  from the same group, never the one they saw last time.
*/
import type { VertexId } from '../../engine'
import type { Hints, ModuleId, ObjectiveId, WrongAnswerInfo } from '../types'

export interface ConceptOption {
  readonly label: string
  readonly correct: boolean
  /** Required for wrong options: every wrong option is tied to a misconception. */
  readonly misconception: string | null
  /** Feedback when this option is chosen and it is wrong. Empty for the correct option. */
  readonly feedback: string
}

/**
 * A fact about the sample graph that a version relies on. The tests check
 * every fact independently, so a typo in a computed version can't slip through.
 */
export type SampleFact =
  | { readonly kind: 'edge-weight'; readonly a: VertexId; readonly b: VertexId; readonly weight: number }
  | { readonly kind: 'neighbours'; readonly of: VertexId; readonly vertices: readonly VertexId[] }
  | { readonly kind: 'out-neighbours'; readonly of: VertexId; readonly vertices: readonly VertexId[] }
  | { readonly kind: 'matrix-cell'; readonly row: VertexId; readonly column: VertexId; readonly value: number }
  | { readonly kind: 'in-list'; readonly of: VertexId; readonly neighbour: VertexId; readonly weight: number; readonly present: boolean }
  | { readonly kind: 'list-length'; readonly of: VertexId; readonly length: number }
  | { readonly kind: 'path-cost'; readonly path: readonly VertexId[]; readonly cost: number }
  | { readonly kind: 'shortest-distance'; readonly to: VertexId; readonly distance: number }
  | { readonly kind: 'previous-on-shortest-path'; readonly to: VertexId; readonly previous: VertexId }
  | { readonly kind: 'edge-check'; readonly current: VertexId; readonly neighbour: VertexId; readonly before: number; readonly after: number }
  | { readonly kind: 'count'; readonly what: 'vertices' | 'edges'; readonly value: number }

/** What the version shows next to the question. */
export type ConceptView = 'sample' | 'sample-directed' | 'none'

interface VersionBase {
  /** Unique within the bank. */
  readonly id: string
  /** False until the group has checked the wording and the answer (CLAUDE.md). */
  readonly reviewed: boolean
  readonly view: ConceptView
  readonly lead: string
  readonly prompt: string
  readonly correctFeedback: string
  readonly fallbackWrongFeedback: string
  readonly hints: Hints
  /** Facts about the sample graph this version states or depends on. */
  readonly facts: readonly SampleFact[]
}

export interface ChoiceVersion extends VersionBase {
  readonly format: 'multiple-choice'
  readonly options: readonly ConceptOption[]
}

export interface SelectVersion extends VersionBase {
  readonly format: 'select-vertex'
  readonly selectable: readonly VertexId[]
  /** Any of these is a correct answer. */
  readonly correctVertices: readonly VertexId[]
  /** Feedback for each wrong vertex the student could select. */
  readonly vertexFeedback: Readonly<Record<VertexId, WrongAnswerInfo>>
}

export type ConceptVersion = ChoiceVersion | SelectVersion

export interface ConceptGroup {
  readonly id: string
  readonly module: ModuleId
  readonly objective: ObjectiveId
  /** Short description, for the group reviewing the bank. Not shown to students. */
  readonly about: string
  readonly versions: readonly ConceptVersion[]
}
