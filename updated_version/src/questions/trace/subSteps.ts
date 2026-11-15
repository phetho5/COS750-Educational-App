import type { Rng } from '../random'
import type { SubStep } from '../types'

/**
 * Builds one hint-ladder sub-question. Wrong options that repeat or equal the
 * correct one are dropped, then the options are shuffled so the answer isn't
 * always first.
 */
export function makeSubStep(
  rng: Rng,
  prompt: string,
  correct: string,
  wrong: readonly string[],
  explanation: string,
): SubStep {
  const distinctWrong = [...new Set(wrong)].filter((w) => w !== correct)
  const options = rng.shuffle([correct, ...distinctWrong])
  return { prompt, options, correctIndex: options.indexOf(correct), explanation }
}
