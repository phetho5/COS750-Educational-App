import { describe, expect, it } from 'vitest'
import { CHECK_IDS } from '../questions'
import { parseRoute, pathAfterPass, paths } from './routes'

describe('parseRoute', () => {
  it('reads every page', () => {
    expect(parseRoute('/')).toEqual({ page: 'welcome' })
    expect(parseRoute('/map')).toEqual({ page: 'map' })
    expect(parseRoute('/map/')).toEqual({ page: 'map' })
    expect(parseRoute('/module/3')).toEqual({ page: 'module', moduleId: 3 })
    expect(parseRoute('/check/module-2')).toEqual({ page: 'check', checkId: 'module-2' })
    expect(parseRoute('/check/final')).toEqual({ page: 'check', checkId: 'final' })
    expect(parseRoute('/review/module-4')).toEqual({ page: 'review', checkId: 'module-4' })
    expect(parseRoute('/summary')).toEqual({ page: 'summary' })
  })

  it('gives "not found" for anything else', () => {
    for (const bad of ['/module/0', '/module/6', '/module/1.5', '/module/x', '/check/module-9', '/review/final', '/map/extra', '/nope']) {
      expect(parseRoute(bad)).toEqual({ page: 'not-found' })
    }
  })

  it('sends a pass on to the next module, then the final check, then the summary', () => {
    expect(pathAfterPass('module-1')).toBe('/module/2')
    expect(pathAfterPass('module-4')).toBe('/module/5')
    expect(pathAfterPass('module-5')).toBe('/check/final')
    expect(pathAfterPass('final')).toBe('/summary')
  })

  it('reads back every path it builds', () => {
    for (const id of [1, 2, 3, 4, 5] as const) expect(parseRoute(paths.module(id))).toEqual({ page: 'module', moduleId: id })
    for (const id of CHECK_IDS) expect(parseRoute(paths.check(id))).toEqual({ page: 'check', checkId: id })
  })
})
