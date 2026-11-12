import { describe, expect, it } from 'vitest'
import { LEARNING_MODE_STORAGE_KEY, readLearningMode, writeLearningMode } from './learningMode'

function fakeStorage(initial?: string) {
  const values = new Map<string, string>()
  if (initial !== undefined) values.set(LEARNING_MODE_STORAGE_KEY, initial)
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  }
}

describe('learning mode preference', () => {
  it('defaults to Support when there is no saved preference', () => {
    expect(readLearningMode(fakeStorage())).toBe('support')
  })

  it('loads Challenge and treats unknown saved values as Support', () => {
    expect(readLearningMode(fakeStorage('challenge'))).toBe('challenge')
    expect(readLearningMode(fakeStorage('unknown'))).toBe('support')
  })

  it('saves the preference independently from scored progress', () => {
    const storage = fakeStorage()
    writeLearningMode('challenge', storage)
    expect(storage.values.get(LEARNING_MODE_STORAGE_KEY)).toBe('challenge')
    expect(readLearningMode(storage)).toBe('challenge')
  })

  it('falls back safely when browser storage is unavailable', () => {
    expect(readLearningMode(null)).toBe('support')
    expect(() => writeLearningMode('challenge', null)).not.toThrow()
  })
})
