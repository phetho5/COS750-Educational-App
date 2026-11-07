/*
  Checks for the text rules in CLAUDE.md, shared by tests.
  Student-facing text must have no em-dashes, and we write edges with a
  plain hyphen, so en-dashes are banned too (docs/handoff.md D4).
*/

const BANNED = [
  { char: '—', name: 'em-dash' },
  { char: '–', name: 'en-dash' },
]

/** Every string inside a value (objects and arrays are searched all the way down). */
export function allStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(allStrings)
  if (value && typeof value === 'object') return Object.values(value).flatMap(allStrings)
  return []
}

/** Problems found in the strings, e.g. ['em-dash in "A — B"']. Empty means all good. */
export function textRuleProblems(value: unknown): string[] {
  const problems: string[] = []
  for (const text of allStrings(value)) {
    for (const { char, name } of BANNED) {
      if (text.includes(char)) problems.push(`${name} in "${text}"`)
    }
  }
  return problems
}
