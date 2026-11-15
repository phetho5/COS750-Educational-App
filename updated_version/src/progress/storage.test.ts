import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildCheck, checkAnswer } from '../questions'
import { attempt, stateWith } from '../test/progressFixtures'
import { moduleStatus } from './mastery'
import { addLectureQuestion, finishCheck, initialProgress, setThinkNote } from './state'
import { browserStorage, createProgressStore, parseProgress, STORAGE_KEY, type StorageLike } from './storage'
import type { ProgressState } from './types'

/** An in-memory stand-in for localStorage that can be told to fail. */
function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  const fail = { read: false, write: false }
  const storage: StorageLike = {
    getItem(key) {
      if (fail.read) throw new Error('SecurityError')
      return data.get(key) ?? null
    },
    setItem(key, value) {
      if (fail.write) throw new Error('QuotaExceededError')
      data.set(key, value)
    },
  }
  return { storage, data, fail }
}

/** A state with something in every field, built through the real update functions. */
function busyState(): ProgressState {
  const questions = buildCheck('module-1', 21)
  const results = questions.map((q, i) => checkAnswer(q, i < 2 ? q.correctAnswers[0] : Object.keys(q.wrongAnswers)[0]))
  let state = finishCheck(initialProgress(), 'module-1', questions, results)
  state = setThinkNote(state, 'graph-vs-list', 'A graph can branch.')
  return addLectureQuestion(state, 'Why no negative weights?')
}

const saved = (state: unknown) => JSON.stringify(state)

describe('parseProgress', () => {
  it('reads back exactly what was saved', () => {
    const state = busyState()
    expect(parseProgress(saved(state))).toEqual(state)
    expect(parseProgress(saved({ ...state, demoUnlocked: true }))).toEqual({ ...state, demoUnlocked: true })
    expect(parseProgress(saved(initialProgress()))).toEqual(initialProgress())
  })

  it('returns null when nothing is saved or the text is not JSON', () => {
    expect(parseProgress(null)).toBeNull()
    expect(parseProgress('')).toBeNull()
    expect(parseProgress('{not json')).toBeNull()
    expect(parseProgress('null')).toBeNull()
    expect(parseProgress('[]')).toBeNull()
  })

  it('rejects saved data from another version', () => {
    expect(parseProgress(saved({ ...initialProgress(), version: 1 }))).toBeNull()
    expect(parseProgress(saved({ ...initialProgress(), version: 3 }))).toBeNull()
    expect(parseProgress(saved({ ...initialProgress(), version: undefined }))).toBeNull()
  })

  // Each of these is a fresh start with one thing broken.
  const broken: [string, (s: Record<string, unknown>) => void][] = [
    ['attempts missing', (s) => delete s.attempts],
    ['a check missing from attempts', (s) => delete (s.attempts as Record<string, unknown>)['module-3']],
    ['an unknown check in attempts', (s) => ((s.attempts as Record<string, unknown>)['module-9'] = [])],
    ['attempts for a check not a list', (s) => ((s.attempts as Record<string, unknown>)['module-1'] = {})],
    ['an attempt with no answers', (s) => ((s.attempts as Record<string, unknown>)['module-1'] = [{ answers: [] }])],
    ['an answer with objective 6', (s) => setAnswer(s, { objective: 6 })],
    ['an answer with correct as text', (s) => setAnswer(s, { correct: 'yes' })],
    ['a correct answer with a misconception', (s) => setAnswer(s, { correct: true, misconception: 'x' })],
    ['an answer with no question id', (s) => setAnswer(s, { questionId: undefined })],
    ['reviewDue not a list', (s) => (s.reviewDue = 'module-1')],
    ['reviewDue with the final check', (s) => (s.reviewDue = ['final'])],
    ['reviewDue with an unknown check', (s) => (s.reviewDue = ['module-0'])],
    ['reviewDue with a repeat', (s) => (s.reviewDue = ['module-1', 'module-1'])],
    ['lastShown with a number', (s) => (s.lastShown = { 'm1-terms': 3 })],
    ['thinkNotes as a list', (s) => (s.thinkNotes = ['note'])],
    ['lectureQuestions with a number', (s) => (s.lectureQuestions = ['ok', 7])],
    ['demoUnlocked missing', (s) => delete s.demoUnlocked],
    ['demoUnlocked as text', (s) => (s.demoUnlocked = 'yes')],
  ]

  function setAnswer(s: Record<string, unknown>, change: Record<string, unknown>) {
    const answer = { questionId: 'q', typeKey: 't', objective: 1, correct: false, misconception: null, ...change }
    ;(s.attempts as Record<string, unknown>)['module-1'] = [{ answers: [answer] }]
  }

  it.each(broken)('rejects saved data with %s', (_, breakIt) => {
    const data = structuredClone(initialProgress()) as unknown as Record<string, unknown>
    breakIt(data)
    expect(parseProgress(saved(data))).toBeNull()
  })

  it('accepts a single valid answer built the same way, so the broken cases fail for the right reason', () => {
    const data = structuredClone(initialProgress()) as unknown as Record<string, unknown>
    setAnswer(data, {})
    expect(parseProgress(saved(data))).not.toBeNull()
  })

  it('drops extra fields it does not know', () => {
    const parsed = parseProgress(saved({ ...initialProgress(), unlockEverything: true }))
    expect(parsed).toEqual(initialProgress())
    expect(parsed).not.toHaveProperty('unlockEverything')
  })
})

describe('createProgressStore', () => {
  it('starts fresh when nothing is saved', () => {
    const { storage } = fakeStorage()
    expect(createProgressStore(storage).get()).toEqual(initialProgress())
  })

  it('saves every change and loads it again after a refresh', () => {
    const { storage, data } = fakeStorage()
    const store = createProgressStore(storage)
    const state = busyState()
    store.set(state)
    expect(JSON.parse(data.get(STORAGE_KEY)!)).toEqual(state)

    const afterRefresh = createProgressStore(storage)
    expect(afterRefresh.get()).toEqual(state)
    expect(afterRefresh.isSaving()).toBe(true)
  })

  it('starts fresh when the saved data is corrupt, and replaces it on the next save', () => {
    const { storage, data } = fakeStorage({ [STORAGE_KEY]: '{"version":1,"attempts":' })
    const store = createProgressStore(storage)
    expect(store.get()).toEqual(initialProgress())
    store.set(busyState())
    expect(parseProgress(data.get(STORAGE_KEY)!)).toEqual(busyState())
  })

  it('works in memory when there is no storage at all', () => {
    const store = createProgressStore(null)
    expect(store.isSaving()).toBe(false)
    store.set(busyState())
    expect(store.get()).toEqual(busyState())
  })

  it('works in memory when reading storage throws', () => {
    const { storage, fail } = fakeStorage()
    fail.read = true
    const store = createProgressStore(storage)
    expect(store.get()).toEqual(initialProgress())
    expect(store.isSaving()).toBe(false)
  })

  it('keeps the latest progress in memory when writing throws, and recovers when storage works again', () => {
    const { storage, data, fail } = fakeStorage()
    const store = createProgressStore(storage)
    fail.write = true
    const state = busyState()
    expect(() => store.set(state)).not.toThrow()
    expect(store.get()).toEqual(state)
    expect(store.isSaving()).toBe(false)
    expect(data.has(STORAGE_KEY)).toBe(false)

    fail.write = false
    store.set(state)
    expect(store.isSaving()).toBe(true)
    expect(parseProgress(data.get(STORAGE_KEY)!)).toEqual(state)
  })

  it('reset goes back to a fresh start and saves it, so a refresh does not bring old progress back', () => {
    const { storage } = fakeStorage()
    const store = createProgressStore(storage)
    store.set(stateWith({ 'module-1': [attempt(5)] }))
    expect(store.reset()).toEqual(initialProgress())
    expect(store.get()).toEqual(initialProgress())
    expect(moduleStatus(createProgressStore(storage).get(), 2)).toBe('locked')
  })

  it('reset still works in memory when writing throws', () => {
    const { storage, fail } = fakeStorage()
    const store = createProgressStore(storage)
    store.set(busyState())
    fail.write = true
    expect(store.reset()).toEqual(initialProgress())
    expect(store.get()).toEqual(initialProgress())
  })
})

describe('browserStorage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it("returns the browser's localStorage, which the store can save to and load from", () => {
    const storage = browserStorage()
    expect(storage).toBe(window.localStorage)
    createProgressStore(storage).set(busyState())
    expect(createProgressStore(browserStorage()).get()).toEqual(busyState())
  })

  it('returns null when even reaching localStorage throws', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(browserStorage()).toBeNull()
    expect(createProgressStore().get()).toEqual(initialProgress())
  })
})
