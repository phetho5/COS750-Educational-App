/*
  Module checks: which questions each check asks, and "a new question of
  the same type" for after the hint ladder.

  Every check has 5 questions, so 4 out of 5 (80%) passes (docs/handoff.md D9).
  Each check mixes question types, as the brief asks.

  `lastShown` maps a concept group id to the version the student saw last
  time, so a retry never shows the same version again. The progress code
  (step 4) keeps it up to date.
*/
import { conceptGroupById } from "./concept/bank";
import { conceptQuestion, pickVersion } from "./concept/build";
import { createRng, deriveSeed } from "./random";
import { generateTraceQuestion, type TraceRequest } from "./trace/generator";
import type { ModuleId, Question } from "./types";

export type CheckId = `module-${ModuleId}` | "final";

export const CHECK_IDS: readonly CheckId[] = [
  "module-1",
  "module-2",
  "module-3",
  "module-4",
  "module-5",
  "final",
];

export const CHECK_LENGTH = 5;

/** Concept group id -> id of the version shown last time. */
export type LastShown = Readonly<Record<string, string>>;

type PlanItem =
  /** One concept question from the first group in `from` not already used in this check. */
  | { readonly kind: "concept"; readonly from: readonly string[] }
  | { readonly kind: "trace"; readonly request: Omit<TraceRequest, "seed"> };

const concept = (...from: string[]): PlanItem => ({ kind: "concept", from });
const trace = (request: Omit<TraceRequest, "seed">): PlanItem => ({
  kind: "trace",
  request,
});

const M1 = [
  "m1-terms",
  "m1-weight",
  "m1-neighbour",
  "m1-directed",
  "m1-undirected",
];
const M2 = [
  "m2-matrix-cell",
  "m2-symmetry",
  "m2-list-entry",
  "m2-list-owner",
  "m2-list-length",
  "m2-compare",
];
const M3 = [
  "m3-problem",
  "m3-path-cost",
  "m3-shortest-distance",
  "m3-previous",
  "m3-fewest-edges",
];
const M4 = ["m4-start-values", "m4-next-rule", "m4-update-rule", "m4-is-final"];

/**
 * What each check asks, in order. A concept item listing several groups picks
 * one at random from those not yet used in the check.
 */
export const CHECK_PLANS: Readonly<Record<CheckId, readonly PlanItem[]>> = {
  "module-1": [
    concept("m1-terms"),
    concept("m1-weight"),
    concept("m1-neighbour"),
    concept("m1-directed"),
    concept("m1-undirected"),
  ],
  "module-2": [
    concept("m2-matrix-cell"),
    concept("m2-symmetry"),
    concept("m2-list-entry"),
    concept("m2-list-owner"),
    concept("m2-list-length", "m2-compare"),
  ],
  "module-3": [
    concept("m3-problem"),
    concept("m3-path-cost"),
    concept("m3-shortest-distance"),
    concept("m3-previous"),
    concept("m3-fewest-edges"),
  ],
  // Cover every Dijkstra concept group once, then assess choosing the next vertex on a graph.
  "module-4": [
    concept(...M4),
    concept(...M4),
    concept(...M4),
    concept(...M4),
    trace({ skill: "next-vertex", format: "select-vertex", objective: 4 }),
  ],
  "module-5": [
    trace({ skill: "next-vertex", format: "select-vertex", objective: 5 }),
    trace({ skill: "new-distance", format: "fill-in", objective: 5 }),
    trace({ skill: "predict-update", format: "predict", objective: 5 }),
    trace({ skill: "next-vertex", format: "multiple-choice", objective: 5 }),
    trace({ skill: "new-distance", format: "fill-in", objective: 5 }),
  ],
  // One question for each learning objective.
  final: [
    concept(...M1),
    concept(...M2),
    concept(...M3),
    concept(...M4),
    trace({ skill: "new-distance", format: "fill-in", objective: 5 }),
  ],
};

/** The questions for one attempt at a check. A new seed gives new questions. */
export function buildCheck(
  checkId: CheckId,
  seed: number,
  lastShown: LastShown = {},
): Question[] {
  const rng = createRng(seed);
  const usedGroups = new Set<string>();

  return CHECK_PLANS[checkId].map((item, index) => {
    if (item.kind === "trace") {
      return generateTraceQuestion({
        ...item.request,
        seed: deriveSeed(seed, index),
      } as TraceRequest);
    }
    const groupId = rng.pick(item.from.filter((id) => !usedGroups.has(id)));
    usedGroups.add(groupId);
    const group = conceptGroupById(groupId);
    return conceptQuestion(
      group,
      pickVersion(group, lastShown[groupId], rng),
      rng,
    );
  });
}

/**
 * A new question of the same type, for after the hint ladder (CLAUDE.md).
 * Trace: same skill and format, new numbers. Concept: another version of the
 * same group, never the one just shown.
 */
export function newQuestionLike(question: Question, seed: number): Question {
  if (question.trace) {
    const [, skill, format] = question.typeKey.split(":");
    const freshSeed = seed === question.trace.seed ? deriveSeed(seed, 1) : seed;
    return generateTraceQuestion({
      skill,
      format,
      objective: question.objective,
      seed: freshSeed,
    } as TraceRequest);
  }
  if (question.concept) {
    const group = conceptGroupById(question.concept.groupId);
    const rng = createRng(seed);
    return conceptQuestion(
      group,
      pickVersion(group, question.concept.versionId, rng),
      rng,
    );
  }
  throw new Error(
    `Question ${question.id} has no source to make another like it.`,
  );
}

/** The concept versions a set of questions showed, to save as `lastShown`. */
export function shownVersions(
  questions: readonly Question[],
): Record<string, string> {
  const shown: Record<string, string> = {};
  for (const q of questions)
    if (q.concept) shown[q.concept.groupId] = q.concept.versionId;
  return shown;
}
