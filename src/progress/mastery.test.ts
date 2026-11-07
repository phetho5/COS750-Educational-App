import { describe, expect, it } from 'vitest'
import { CHECK_IDS } from '../questions'
import { attempt, passedUpTo, stateWith } from '../test/progressFixtures'
import {
  bestAttempt,
  canStartCheck,
  checkStatus,
  isPass,
  isUnlocked,
  moduleStatus,
  nextStepAfterCheck,
  objectiveMastery,
  scorePercent,
} from './mastery'
import { initialProgress } from './state'

describe('the 80% pass mark', () => {
  it('passes 4 of 5 and 5 of 5, fails 3 of 5 and below', () => {
    expect(isPass(attempt(5))).toBe(true)
    expect(isPass(attempt(4))).toBe(true)
    expect(isPass(attempt(3))).toBe(false)
    expect(isPass(attempt(0))).toBe(false)
  })

  it('treats exactly 80% as a pass and anything just under as a fail', () => {
    expect(isPass(attempt(8, 10))).toBe(true)
    expect(isPass(attempt(7, 9))).toBe(false) // 77.8%
    expect(isPass(attempt(39, 49))).toBe(false) // 79.6%, which rounds to 80 but isn't a pass
    expect(scorePercent(attempt(39, 49))).toBe(80)
  })

  it('never passes an attempt with no answers', () => {
    expect(isPass({ answers: [] })).toBe(false)
    expect(scorePercent({ answers: [] })).toBe(0)
  })

  it('gives scores as whole-number percentages', () => {
    expect([0, 1, 2, 3, 4, 5].map((c) => scorePercent(attempt(c)))).toEqual([0, 20, 40, 60, 80, 100])
    expect(scorePercent(attempt(2, 3))).toBe(67)
  })
})

describe('bestAttempt', () => {
  it('is null when the check was never tried', () => {
    expect(bestAttempt([])).toBeNull()
  })

  it('picks the attempt with the most correct answers', () => {
    const best = attempt(4)
    expect(bestAttempt([attempt(2), best, attempt(3)])).toBe(best)
  })

  it('picks the later attempt when two tie', () => {
    const earlier = attempt(3, 5, ['a', 'b'])
    const later = attempt(3, 5, ['c', 'd'])
    expect(bestAttempt([earlier, later])).toBe(later)
  })
})

describe('unlocking and module status', () => {
  it('opens only module 1 for a new student', () => {
    const state = initialProgress()
    expect(CHECK_IDS.map((id) => isUnlocked(state, id))).toEqual([true, false, false, false, false, false])
    expect(moduleStatus(state, 1)).toBe('in-progress')
    expect(moduleStatus(state, 2)).toBe('locked')
  })

  it('unlocks the next module when a check is passed', () => {
    const state = stateWith({ 'module-1': [attempt(4)] })
    expect(moduleStatus(state, 1)).toBe('mastered')
    expect(moduleStatus(state, 2)).toBe('in-progress')
    expect(moduleStatus(state, 3)).toBe('locked')
  })

  it('keeps the next module locked after a failed attempt', () => {
    const state = stateWith({ 'module-1': [attempt(3)] })
    expect(moduleStatus(state, 1)).toBe('in-progress')
    expect(moduleStatus(state, 2)).toBe('locked')
  })

  it('unlocks the final check only once module 5 is passed', () => {
    expect(checkStatus(stateWith(passedUpTo(4)), 'final')).toBe('locked')
    expect(checkStatus(stateWith(passedUpTo(5)), 'final')).toBe('in-progress')
    expect(checkStatus(stateWith({ ...passedUpTo(5), final: [attempt(4)] }), 'final')).toBe('mastered')
  })

  it('keeps a module mastered when a retry scores lower', () => {
    const state = stateWith({ 'module-1': [attempt(5), attempt(1)] })
    expect(moduleStatus(state, 1)).toBe('mastered')
    expect(moduleStatus(state, 2)).toBe('in-progress')
  })

  it('masters a module when a retry passes after failing', () => {
    expect(moduleStatus(stateWith({ 'module-1': [attempt(2), attempt(4)] }), 1)).toBe('mastered')
  })
})

describe('canStartCheck', () => {
  it('blocks locked checks', () => {
    expect(canStartCheck(initialProgress(), 'module-2')).toBe(false)
  })

  it('blocks a check while its review is due, and only that check', () => {
    const state = stateWith({ ...passedUpTo(1), 'module-2': [attempt(2)] }, { reviewDue: ['module-2'] })
    expect(canStartCheck(state, 'module-2')).toBe(false)
    expect(canStartCheck(state, 'module-1')).toBe(true)
  })

  it('allows an open check with no review due', () => {
    expect(canStartCheck(initialProgress(), 'module-1')).toBe(true)
  })
})

describe('nextStepAfterCheck', () => {
  it('sends a pass on to the next module and a fail to the review', () => {
    expect(nextStepAfterCheck('module-3', attempt(4))).toBe('next-module')
    expect(nextStepAfterCheck('module-3', attempt(3))).toBe('review')
  })

  it('always sends the final check to the summary, pass or fail', () => {
    expect(nextStepAfterCheck('final', attempt(5))).toBe('summary')
    expect(nextStepAfterCheck('final', attempt(1))).toBe('summary')
  })
})

describe('objectiveMastery', () => {
  it('shows every objective at 0% and not attempted for a new student', () => {
    expect(objectiveMastery(initialProgress())).toEqual(
      [1, 2, 3, 4, 5].map((objective) => ({ objective, attempted: false, percent: 0, mastered: false })),
    )
  })

  it('uses the best attempt at each module check', () => {
    const state = stateWith({
      'module-1': [attempt(3), attempt(5), attempt(2)],
      'module-2': [attempt(3)],
    })
    const [o1, o2, o3] = objectiveMastery(state)
    expect(o1).toEqual({ objective: 1, attempted: true, percent: 100, mastered: true })
    expect(o2).toEqual({ objective: 2, attempted: true, percent: 60, mastered: false })
    expect(o3.attempted).toBe(false)
  })

  it("doesn't let the final check change an objective's percentage", () => {
    const state = stateWith({ ...passedUpTo(5), final: [attempt(0)] })
    expect(objectiveMastery(state).every((o) => o.percent === 100 && o.mastered)).toBe(true)
  })
})
