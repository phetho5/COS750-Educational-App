import { describe, expect, it } from 'vitest'
import { dijkstra, SAMPLE_GRAPH, type Graph } from '../engine'
import { textRuleProblems } from '../test/textRules'
import { pseudocodeLines, PSEUDOCODE, stepExplanation, stepTitle } from './walkthroughText'

const result = dijkstra(SAMPLE_GRAPH, 'A')
const texts = result.steps.map((s) => stepExplanation(s, result))
const titles = result.steps.map(stepTitle)

describe('walkthrough text for the sample graph', () => {
  it('has a title and an explanation for all 16 steps', () => {
    expect(result.steps).toHaveLength(16)
    expect(titles[0]).toBe('Set up')
    expect(titles[1]).toBe('Visit A')
    expect(titles[2]).toBe('Visit A: check A-B')
    expect(titles[15]).toBe('Finished')
  })

  it('explains the start', () => {
    expect(texts[0]).toContain('We start at A. Its distance is 0')
    expect(texts[0]).toContain('∞')
  })

  it('explains B going from 4 to 3 when D is visited', () => {
    const i = titles.indexOf('Visit D: check D-B')
    expect(texts[i]).toBe(
      "Going through D, B costs 2 + 1 = 3. That's less than B's current 4, so we update B to 3 and record D as its previous vertex.",
    )
  })

  it('explains that F-C gives 11, which does not beat 10', () => {
    const i = titles.indexOf('Visit F: check F-C')
    expect(texts[i]).toBe("Going through F, C costs 8 + 3 = 11. That's not less than C's current 10, so C keeps 10. Nothing changes.")
  })

  it('explains E going from 14 to 12 when C is visited', () => {
    const i = titles.indexOf('Visit C: check C-E')
    expect(texts[i]).toContain('10 + 2 = 12')
    expect(texts[i]).toContain("less than E's current 14")
  })

  it('explains a first reach from ∞', () => {
    expect(texts[titles.indexOf('Visit A: check A-B')]).toContain("B hadn't been reached yet (∞), so we set B to 4")
  })

  it('says when a visited vertex has nothing left to check', () => {
    expect(texts[titles.indexOf('Visit E')]).toContain('nothing left to check')
  })

  it('reads the route to E backwards at the end, with the right cost', () => {
    expect(texts[15]).toContain('E came from C, C came from D and D came from A')
    expect(texts[15]).toContain('the shortest route to E is A, D, C, E, and it costs 12')
  })

  it('follows the text rules (no em-dashes or en-dashes, no raw Infinity)', () => {
    expect(textRuleProblems([texts, titles, PSEUDOCODE])).toEqual([])
    for (const t of texts) expect(t).not.toMatch(/Infinity|NaN|undefined/)
  })
})

describe('walkthrough text for other graphs', () => {
  it('mentions ties and unreachable vertices', () => {
    const graph: Graph = {
      vertices: ['A', 'B', 'C', 'Z'],
      directed: false,
      edges: [
        { from: 'A', to: 'B', weight: 2 },
        { from: 'A', to: 'C', weight: 2 },
      ],
    }
    const r = dijkstra(graph, 'A')
    const all = r.steps.map((s) => stepExplanation(s, r))
    expect(all.some((t) => t.includes('C also had 2, and ties go in alphabetical order'))).toBe(true)
    expect(all[all.length - 1]).toContain("Z can't be reached from A")
  })
})

describe('pseudocode lines', () => {
  it('points every step at real lines', () => {
    for (const step of result.steps) {
      for (const line of pseudocodeLines(step)) {
        expect(line).toBeGreaterThanOrEqual(1)
        expect(line).toBeLessThanOrEqual(PSEUDOCODE.length)
      }
    }
  })

  it('highlights the update line only when a distance changes', () => {
    for (const step of result.steps) {
      if (step.kind === 'check-edge') expect(pseudocodeLines(step).includes(10)).toBe(step.updated)
    }
  })
})
