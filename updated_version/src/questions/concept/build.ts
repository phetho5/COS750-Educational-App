/*
  Turning bank versions into questions, and choosing which version to show.
*/
import { SAMPLE_GRAPH } from '../../engine'
import { layoutById } from '../layouts'
import type { Rng } from '../random'
import type { GraphView, Question, SubStep, WrongAnswerInfo } from '../types'
import { SAMPLE_DIRECTED } from './sampleFacts'
import type { ChoiceVersion, ConceptGroup, ConceptOption, ConceptVersion, SelectVersion } from './types'

/**
 * Picks a version at random, but never the one shown last time
 * (CLAUDE.md, concept questions). With only one version, it has to repeat.
 */
export function pickVersion(group: ConceptGroup, lastShownId: string | undefined, rng: Rng): ConceptVersion {
  const fresh = group.versions.filter((v) => v.id !== lastShownId)
  return rng.pick(fresh.length > 0 ? fresh : group.versions)
}

function viewFor(version: ConceptVersion): GraphView | null {
  if (version.view === 'none') return null
  const layout = layoutById('sample')
  return {
    layoutId: layout.id,
    wide: layout.wide,
    narrow: layout.narrow,
    graph: version.view === 'sample-directed' ? SAMPLE_DIRECTED : SAMPLE_GRAPH,
    table: null,
    visited: [],
    current: null,
    checkingEdge: null,
    selectable: version.format === 'select-vertex' ? version.selectable : [],
  }
}

/** Shuffles each sub-step's options so the answer isn't always in the same place. */
function shuffleSubSteps(subSteps: readonly SubStep[], rng: Rng): SubStep[] {
  return subSteps.map((sub) => {
    const options = rng.shuffle(sub.options)
    return { ...sub, options, correctIndex: options.indexOf(sub.options[sub.correctIndex]) }
  })
}

function choiceParts(options: readonly ConceptOption[], rng: Rng) {
  const withIds = options.map((option, i) => ({ ...option, id: `option-${i + 1}` }))
  const wrongAnswers: Record<string, WrongAnswerInfo> = {}
  for (const o of withIds) {
    if (!o.correct) wrongAnswers[o.id] = { misconception: o.misconception, feedback: o.feedback }
  }
  return {
    options: rng.shuffle(withIds).map(({ id, label }) => ({ id, label })),
    correctAnswers: withIds.filter((o) => o.correct).map((o) => o.id),
    wrongAnswers,
  }
}

export function conceptQuestion(group: ConceptGroup, version: ConceptVersion, rng: Rng): Question {
  const answerParts =
    version.format === 'multiple-choice'
      ? choiceParts(version.options, rng)
      : { options: [], correctAnswers: [...version.correctVertices], wrongAnswers: { ...version.vertexFeedback } }

  return {
    id: `concept:${group.id}:${version.id}`,
    source: 'concept',
    typeKey: `concept:${group.id}`,
    format: version.format,
    objective: group.objective,
    lead: version.lead,
    prompt: version.prompt,
    view: viewFor(version),
    ...answerParts,
    fillTarget: null,
    fallbackWrongFeedback: version.fallbackWrongFeedback,
    correctFeedback: version.correctFeedback,
    hints: { ...version.hints, subSteps: shuffleSubSteps(version.hints.subSteps, rng) },
    reviewed: version.reviewed,
    concept: { groupId: group.id, versionId: version.id },
    trace: null,
  }
}

// ---------- Small helpers for writing versions ----------

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * A multiple-choice version. Drafts default to reviewed: false, no graph,
 * no lead text and no sample-graph facts.
 */
export function choiceVersion(
  v: Optional<Omit<ChoiceVersion, 'format'>, 'reviewed' | 'view' | 'lead' | 'facts'>,
): ChoiceVersion {
  return { format: 'multiple-choice', reviewed: false, view: 'none', lead: '', facts: [], ...v }
}

/** A select-a-vertex version. Drafts default to reviewed: false and the sample graph. */
export function selectVersion(
  v: Optional<Omit<SelectVersion, 'format'>, 'reviewed' | 'view' | 'lead' | 'facts'>,
): SelectVersion {
  return { format: 'select-vertex', reviewed: false, view: 'sample', lead: '', facts: [], ...v }
}

/** The correct option. */
export function right(label: string): ConceptOption {
  return { label, correct: true, misconception: null, feedback: '' }
}

/** A wrong option, tied to a misconception, with its feedback. */
export function wrong(label: string, misconception: string, feedback: string): ConceptOption {
  return { label, correct: false, misconception, feedback }
}

/** A sub-step whose first option is the correct one (options are shuffled when the question is built). */
export function sub(prompt: string, correct: string, others: readonly string[], explanation: string): SubStep {
  const distinctOthers = [...new Set(others)].filter((o) => o !== correct)
  return { prompt, options: [correct, ...distinctOthers], correctIndex: 0, explanation }
}
