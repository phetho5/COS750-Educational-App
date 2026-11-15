/*
  Bug B11 guard. An effect callback may only return a clean-up function (or nothing).
  An arrow without braces, like useEffect(() => window.scrollTo(0, 0)), returns
  whatever the call returns. TypeScript allows it, but React crashes if that value
  isn't a function (newer browsers return a Promise from scrollTo).
  This test reads every source file and fails on any effect written that way.
*/
import { describe, expect, it } from 'vitest'

const sources = import.meta.glob<string>('../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true })

// useEffect( or useLayoutEffect(, an optional async, () =>, then anything but "{".
// The spaces go inside the lookahead: with "=>\s*(?!\{)", \s* could match no
// spaces and the lookahead would then see " {" and wrongly report a match.
const effectWithoutBraces = /use(?:Layout)?Effect\(\s*(?:async\s*)?\(\)\s*=>(?!\s*\{)/

describe('effects', () => {
  it('reads the source files', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(50)
  })

  it('never return a value from an effect by leaving out the braces', () => {
    const problems = Object.entries(sources)
      .filter(([file]) => !file.endsWith('effects.test.ts'))
      .flatMap(([file, text]) =>
        text
          .split('\n')
          .map((line, i) => ({ file, line: i + 1, text: line.trim() }))
          .filter(({ text }) => effectWithoutBraces.test(text)),
      )
    expect(problems).toEqual([])
  })
})
