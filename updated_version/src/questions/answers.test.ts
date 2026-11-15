import { describe, expect, it } from 'vitest'
import { checkAnswer, INVALID_NUMBER_FEEDBACK, normalizeDistanceInput } from './answers'
import type { Question } from './types'

/** A minimal question for testing checkAnswer. Only the fields it reads matter. */
function question(overrides: Partial<Question>): Question {
  return {
    id: 'test',
    source: 'trace',
    typeKey: 'test',
    format: 'multiple-choice',
    objective: 5,
    lead: '',
    prompt: '',
    view: null,
    options: [],
    fillTarget: null,
    correctAnswers: [],
    wrongAnswers: {},
    fallbackWrongFeedback: 'fallback',
    correctFeedback: 'well done',
    hints: { nudge: '', workedExample: '', subSteps: [] },
    reviewed: false,
    concept: null,
    trace: null,
    ...overrides,
  }
}

describe('normalizeDistanceInput', () => {
  it('reads whole numbers, ignoring spaces and leading zeros', () => {
    expect(normalizeDistanceInput('12')).toBe('12')
    expect(normalizeDistanceInput('  7 ')).toBe('7')
    expect(normalizeDistanceInput('012')).toBe('12')
    expect(normalizeDistanceInput('0')).toBe('0')
  })

  it('reads ∞, inf and infinity in any case', () => {
    for (const text of ['∞', 'inf', 'INF', 'Infinity', ' infinity ']) {
      expect(normalizeDistanceInput(text)).toBe('Infinity')
    }
  })

  it('rejects anything else', () => {
    for (const text of ['', ' ', 'abc', '-3', '3.5', '1e3', '12a', '+4']) {
      expect(normalizeDistanceInput(text)).toBeNull()
    }
  })
})

describe('checkAnswer', () => {
  const choice = question({
    correctAnswers: ['F'],
    wrongAnswers: { C: { misconception: 'next-alphabetical', feedback: 'not alphabetical' } },
  })

  it('marks a correct answer correct', () => {
    expect(checkAnswer(choice, 'F')).toEqual({ status: 'correct', feedback: 'well done' })
  })

  it('gives the misconception feedback for a known wrong answer', () => {
    expect(checkAnswer(choice, 'C')).toEqual({
      status: 'wrong',
      misconception: 'next-alphabetical',
      feedback: 'not alphabetical',
    })
  })

  it('gives the fallback feedback for an unexpected wrong answer', () => {
    expect(checkAnswer(choice, 'E')).toEqual({ status: 'wrong', misconception: null, feedback: 'fallback' })
  })

  it('does not treat built-in object names as known answers', () => {
    expect(checkAnswer(choice, 'toString')).toMatchObject({ status: 'wrong', feedback: 'fallback' })
  })

  it('asks for an answer when none is given', () => {
    expect(checkAnswer(choice, '')).toMatchObject({ status: 'invalid' })
  })

  describe('fill-in questions', () => {
    const fill = question({
      format: 'fill-in',
      correctAnswers: ['12'],
      wrongAnswers: { Infinity: { misconception: 'dist-keep-old', feedback: 'old' } },
    })

    it('accepts the right number however it is typed', () => {
      expect(checkAnswer(fill, '12').status).toBe('correct')
      expect(checkAnswer(fill, ' 012 ').status).toBe('correct')
    })

    it('recognises ∞ typed in different ways as the same answer', () => {
      expect(checkAnswer(fill, 'inf')).toMatchObject({ status: 'wrong', misconception: 'dist-keep-old' })
      expect(checkAnswer(fill, '∞')).toMatchObject({ status: 'wrong', misconception: 'dist-keep-old' })
    })

    it('does not mark unreadable input as wrong', () => {
      expect(checkAnswer(fill, 'twelve')).toEqual({ status: 'invalid', feedback: INVALID_NUMBER_FEEDBACK })
      expect(checkAnswer(fill, '').status).toBe('invalid')
    })
  })
})
