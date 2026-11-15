/*
  Every page in the app and its URL, in one place.

    /                 Welcome
    /map              Module map
    /module/1 to /5   A module's lesson (Watch, Read, Try)
    /check/module-1   A module check (or /check/final)
    /review/module-1  The review after scoring below 80%
    /summary          Pre-lecture summary

  parseRoute() turns a URL path into a Route, so screens never parse URLs.
*/
import { CHECK_IDS, type CheckId, type ModuleId } from '../questions'

export type Route =
  | { readonly page: 'welcome' }
  | { readonly page: 'map' }
  | { readonly page: 'module'; readonly moduleId: ModuleId }
  | { readonly page: 'check'; readonly checkId: CheckId }
  | { readonly page: 'review'; readonly checkId: CheckId }
  | { readonly page: 'summary' }
  | { readonly page: 'not-found' }

export const paths = {
  welcome: '/',
  map: '/map',
  module: (id: ModuleId) => `/module/${id}`,
  check: (id: CheckId) => `/check/${id}`,
  review: (id: CheckId) => `/review/${id}`,
  summary: '/summary',
}

/** Where "go on" leads after passing a check: the next module, or the final check after module 5. */
export function pathAfterPass(checkId: CheckId): string {
  if (checkId === 'final') return paths.summary
  const moduleId = Number(checkId.slice('module-'.length))
  return moduleId === 5 ? paths.check('final') : paths.module((moduleId + 1) as ModuleId)
}

function isModuleId(n: number): n is ModuleId {
  return Number.isInteger(n) && n >= 1 && n <= 5
}

function isCheckId(s: string): s is CheckId {
  return CHECK_IDS.includes(s as CheckId)
}

export function parseRoute(path: string): Route {
  // Ignore a trailing slash, so "/map/" works like "/map".
  const parts = path.replace(/\/+$/, '').split('/').filter(Boolean)
  if (parts.length === 0) return { page: 'welcome' }

  const [first, second] = parts
  if (parts.length === 1 && first === 'map') return { page: 'map' }
  if (parts.length === 1 && first === 'summary') return { page: 'summary' }
  if (parts.length === 2 && first === 'module' && /^\d$/.test(second) && isModuleId(Number(second))) {
    return { page: 'module', moduleId: Number(second) as ModuleId }
  }
  if (parts.length === 2 && first === 'check' && isCheckId(second)) return { page: 'check', checkId: second }
  // There's no review for the final check: it always leads to the summary (D49).
  if (parts.length === 2 && first === 'review' && isCheckId(second) && second !== 'final') {
    return { page: 'review', checkId: second }
  }
  return { page: 'not-found' }
}
