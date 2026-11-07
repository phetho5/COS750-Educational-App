/*
  Small helpers for writing numbers and lists in student-facing text.
*/

/** A distance as students see it: Infinity becomes ∞. */
export function formatDistance(distance: number): string {
  return distance === Infinity ? '∞' : String(distance)
}

/** A distance as a screen reader should say it. */
export function spokenDistance(distance: number): string {
  return distance === Infinity ? 'infinity' : String(distance)
}

/** "A", "A and B", "A, B and C". */
export function listText(items: readonly string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/** An edge's name, written with a plain hyphen (see docs/handoff.md D4). */
export function edgeName(a: string, b: string): string {
  return `${a}-${b}`
}

/** "A has" or "A and D have", for sentences about a list of vertices. */
export function hasOrHave(items: readonly string[]): string {
  return `${listText(items)} ${items.length === 1 ? 'has' : 'have'}`
}

/** Splits "a **b** c" into parts, marking the ones between double stars as bold. */
export function splitBold(text: string): { text: string; bold: boolean }[] {
  return text
    .split('**')
    .map((part, i) => ({ text: part, bold: i % 2 === 1 }))
    .filter((part) => part.text !== '')
}
