// Answers a question through the real UI, the way a student would.
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Question } from '../questions'

/** The correct answer, or the first known wrong answer. */
export function answerKey(q: Question, correct: boolean): string {
  return correct ? q.correctAnswers[0] : Object.keys(q.wrongAnswers)[0]
}

/** Gives the answer (an option id, a vertex or a distance) and presses Check. */
export async function answer(q: Question, key: string): Promise<void> {
  if (q.format === 'fill-in') {
    const input = screen.getByLabelText(`Distance for ${q.fillTarget}`)
    await userEvent.clear(input)
    await userEvent.type(input, key === 'Infinity' ? 'inf' : key)
  } else if (q.format === 'select-vertex') {
    await userEvent.click(screen.getByRole('button', { name: new RegExp(`^Vertex ${key},`) }))
  } else {
    const label = q.options.find((o) => o.id === key)!.label
    await userEvent.click(screen.getByRole('radio', { name: label }))
  }
  await userEvent.click(screen.getByRole('button', { name: 'Check' }))
}

export async function answerRight(q: Question): Promise<void> {
  await answer(q, answerKey(q, true))
}

export async function answerWrong(q: Question): Promise<void> {
  await answer(q, answerKey(q, false))
}
