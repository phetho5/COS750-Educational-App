// Everything the screens need from the question code, in one import.
export { checkAnswer, normalizeDistanceInput } from "./answers";
export {
  buildCheck,
  CHECK_IDS,
  CHECK_LENGTH,
  newQuestionLike,
  shownVersions,
  type CheckDifficulty,
  type CheckId,
  type LastShown,
} from "./checks";
export { CONCEPT_GROUPS, conceptGroupById } from "./concept/bank";
export {
  CHALLENGE_LAYOUT,
  LAYOUTS,
  layoutById,
  type GraphLayout,
  type LayoutId,
  type LayoutSize,
  type Point,
} from "./layouts";
export { createRng, deriveSeed, randomSeed, type Rng } from "./random";
export {
  generateTraceQuestion,
  type TraceRequest,
  type TraceSkill,
} from "./trace/generator";
export type * from "./types";
export {
  currentVertex,
  neighboursToUpdate,
  pickVertex,
  startYourTurn,
  submitDistances,
  visitedSoFar,
  type YourTurnFeedback,
  type YourTurnState,
} from "./yourTurn";
