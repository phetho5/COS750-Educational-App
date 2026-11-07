import { describe, expect, it } from 'vitest'
import { dijkstra, SAMPLE_GRAPH, type CheckEdgeStep } from '../../engine'
import { allStrings, textRuleProblems } from '../../test/textRules'
import { checkAnswer } from '../answers'
import { createRng } from '../random'
import { CONCEPT_GROUPS, conceptGroupById } from './bank'
import { conceptQuestion, pickVersion } from './build'
import type { ChoiceVersion, ConceptVersion, SampleFact, SelectVersion } from './types'

const allVersions = CONCEPT_GROUPS.flatMap((g) => g.versions.map((v) => ({ group: g, version: v })))
const label = (g: { id: string }, v: { id: string }) => `${g.id} / ${v.id}`

// ---------- An independent check of every sample-graph fact ----------
// Written separately from sampleFacts.ts on purpose: if both agree, the fact is right.

const run = dijkstra(SAMPLE_GRAPH, 'A')
const weight = (a: string, b: string) =>
  SAMPLE_GRAPH.edges.find((e) => (e.from === a && e.to === b) || (e.from === b && e.to === a))?.weight ?? 0
const sorted = (xs: readonly string[]) => [...xs].sort()

function checkFact(fact: SampleFact): void {
  switch (fact.kind) {
    case 'edge-weight':
      expect(weight(fact.a, fact.b)).toBe(fact.weight)
      expect(fact.weight).toBeGreaterThan(0)
      return
    case 'neighbours':
      expect(sorted(fact.vertices)).toEqual(SAMPLE_GRAPH.vertices.filter((v) => weight(fact.of, v) > 0))
      return
    case 'out-neighbours':
      expect(sorted(fact.vertices)).toEqual(sorted(SAMPLE_GRAPH.edges.filter((e) => e.from === fact.of).map((e) => e.to)))
      return
    case 'matrix-cell':
      expect(weight(fact.row, fact.column)).toBe(fact.value)
      return
    case 'in-list':
      expect(weight(fact.of, fact.neighbour) === fact.weight && fact.weight > 0).toBe(fact.present)
      return
    case 'list-length':
      expect(SAMPLE_GRAPH.edges.filter((e) => e.from === fact.of || e.to === fact.of).length).toBe(fact.length)
      return
    case 'path-cost': {
      let total = 0
      for (let i = 1; i < fact.path.length; i++) {
        const w = weight(fact.path[i - 1], fact.path[i])
        expect(w, `edge ${fact.path[i - 1]}-${fact.path[i]} exists`).toBeGreaterThan(0)
        total += w
      }
      expect(total).toBe(fact.cost)
      return
    }
    case 'shortest-distance':
      expect(run.finalTable[fact.to].distance).toBe(fact.distance)
      return
    case 'previous-on-shortest-path':
      expect(run.finalTable[fact.to].previous).toBe(fact.previous)
      return
    case 'edge-check': {
      const step = run.steps.find(
        (s): s is CheckEdgeStep => s.kind === 'check-edge' && s.vertex === fact.current && s.neighbour === fact.neighbour,
      )
      expect(step, `check ${fact.current}-${fact.neighbour}`).toBeDefined()
      expect(step!.oldDistance).toBe(fact.before)
      expect(step!.table[fact.neighbour].distance).toBe(fact.after)
      return
    }
    case 'count':
      expect(fact.what === 'vertices' ? SAMPLE_GRAPH.vertices.length : SAMPLE_GRAPH.edges.length).toBe(fact.value)
      return
  }
}

const correctLabel = (v: ConceptVersion) => (v as ChoiceVersion).options.find((o) => o.correct)!.label
const firstFact = <K extends SampleFact['kind']>(v: ConceptVersion, kind: K) =>
  v.facts.find((f): f is Extract<SampleFact, { kind: K }> => f.kind === kind)!

/** For computed groups: the answer the version gives must be the one its fact states. */
const ANSWER_MATCHES_FACT: Record<string, (v: ConceptVersion) => void> = {
  'm1-weight': (v) => expect(correctLabel(v)).toBe(String(firstFact(v, 'edge-weight').weight)),
  'm1-neighbour': (v) => expect(sorted((v as SelectVersion).correctVertices)).toEqual(sorted(firstFact(v, 'neighbours').vertices)),
  'm1-directed': (v) => expect(sorted((v as SelectVersion).correctVertices)).toEqual(sorted(firstFact(v, 'out-neighbours').vertices)),
  'm2-matrix-cell': (v) => expect(correctLabel(v)).toBe(String(firstFact(v, 'matrix-cell').value)),
  'm2-symmetry': (v) => expect(correctLabel(v)).toBe(String(firstFact(v, 'matrix-cell').value)),
  'm2-list-entry': (v) => {
    const f = v.facts.find((x) => x.kind === 'in-list' && x.present) as Extract<SampleFact, { kind: 'in-list' }>
    expect(correctLabel(v)).toBe(`${f.neighbour} · ${f.weight}`)
  },
  'm2-list-length': (v) => expect(correctLabel(v)).toBe(String(firstFact(v, 'list-length').length)),
  'm3-path-cost': (v) => expect(correctLabel(v)).toBe(String(firstFact(v, 'path-cost').cost)),
  'm3-shortest-distance': (v) => expect(correctLabel(v)).toBe(String(firstFact(v, 'shortest-distance').distance)),
  'm3-previous': (v) => expect((v as SelectVersion).correctVertices).toEqual([firstFact(v, 'previous-on-shortest-path').previous]),
}

describe('the concept bank', () => {
  it('has 3 or 4 versions of every question', () => {
    for (const g of CONCEPT_GROUPS) {
      expect(g.versions.length, g.id).toBeGreaterThanOrEqual(3)
      expect(g.versions.length, g.id).toBeLessThanOrEqual(4)
    }
  })

  it('has unique group and version ids', () => {
    const groupIds = CONCEPT_GROUPS.map((g) => g.id)
    const versionIds = allVersions.map(({ version }) => version.id)
    expect(new Set(groupIds).size).toBe(groupIds.length)
    expect(new Set(versionIds).size).toBe(versionIds.length)
  })

  it('has at least five groups for each of modules 1 to 3 and three for module 4, so each check has enough', () => {
    const count = (m: number) => CONCEPT_GROUPS.filter((g) => g.module === m).length
    expect([count(1), count(2), count(3)].every((n) => n >= 5)).toBe(true)
    expect(count(4)).toBeGreaterThanOrEqual(3)
  })

  it('ties each group to the objective of its module', () => {
    for (const g of CONCEPT_GROUPS) expect(g.objective, g.id).toBe(g.module)
  })

  it('marks every version with a reviewed flag (drafts are false)', () => {
    for (const { group, version } of allVersions) expect(typeof version.reviewed, label(group, version)).toBe('boolean')
  })
})

describe('every multiple-choice version', () => {
  const choices = allVersions.filter(({ version }) => version.format === 'multiple-choice') as {
    group: (typeof CONCEPT_GROUPS)[number]
    version: ChoiceVersion
  }[]

  it('has exactly one correct option and at least two wrong ones', () => {
    for (const { group, version } of choices) {
      expect(version.options.filter((o) => o.correct).length, label(group, version)).toBe(1)
      expect(version.options.filter((o) => !o.correct).length, label(group, version)).toBeGreaterThanOrEqual(2)
    }
  })

  it('ties every wrong option to a misconception with its own feedback', () => {
    for (const { group, version } of choices) {
      for (const o of version.options.filter((x) => !x.correct)) {
        expect(o.misconception, `${label(group, version)}: ${o.label}`).toBeTruthy()
        expect(o.feedback, `${label(group, version)}: ${o.label}`).not.toBe('')
      }
    }
  })

  it('never shows the same option label twice', () => {
    for (const { group, version } of choices) {
      const labels = version.options.map((o) => o.label)
      expect(new Set(labels).size, label(group, version)).toBe(labels.length)
    }
  })
})

describe('every select-vertex version', () => {
  const selects = allVersions.filter(({ version }) => version.format === 'select-vertex') as {
    group: (typeof CONCEPT_GROUPS)[number]
    version: SelectVersion
  }[]

  it('has correct vertices the student can actually select', () => {
    for (const { group, version } of selects) {
      expect(version.correctVertices.length, label(group, version)).toBeGreaterThan(0)
      for (const v of version.correctVertices) expect(version.selectable, label(group, version)).toContain(v)
    }
  })

  it('has misconception feedback for every wrong vertex, and none for correct ones', () => {
    for (const { group, version } of selects) {
      for (const v of version.selectable) {
        const info = version.vertexFeedback[v]
        if (version.correctVertices.includes(v)) expect(info, `${label(group, version)}: ${v}`).toBeUndefined()
        else expect(info?.misconception, `${label(group, version)}: ${v}`).toBeTruthy()
      }
    }
  })
})

describe('every version', () => {
  it('has a full hint ladder', () => {
    for (const { group, version } of allVersions) {
      const where = label(group, version)
      expect(version.hints.nudge, where).not.toBe('')
      expect(version.hints.workedExample, where).not.toBe('')
      expect(version.hints.subSteps.length, where).toBeGreaterThanOrEqual(2)
      for (const s of version.hints.subSteps) {
        expect(s.options.length, `${where}: ${s.prompt}`).toBeGreaterThanOrEqual(2)
        expect(new Set(s.options).size, `${where}: ${s.prompt}`).toBe(s.options.length)
        expect(s.options[s.correctIndex], `${where}: ${s.prompt}`).toBeDefined()
      }
    }
  })

  it('follows the text rules: no em-dashes or en-dashes, and no unfilled values', () => {
    for (const { group, version } of allVersions) {
      expect(textRuleProblems(version), label(group, version)).toEqual([])
      for (const text of allStrings(version)) expect(text, label(group, version)).not.toMatch(/undefined|NaN|Infinity|\[object/)
    }
  })

  it("states only true facts about the sample graph", () => {
    for (const { group, version } of allVersions) {
      for (const fact of version.facts) {
        try {
          checkFact(fact)
        } catch (error) {
          throw new Error(`${label(group, version)}: wrong fact ${JSON.stringify(fact)}\n${String(error)}`)
        }
      }
    }
  })

  it('gives the answer its fact states (computed groups)', () => {
    for (const [groupId, matches] of Object.entries(ANSWER_MATCHES_FACT)) {
      for (const version of conceptGroupById(groupId).versions) matches(version)
    }
  })

  it("has worked examples that don't mention the vertex being asked about (so they can't give the answer away)", () => {
    const asked: Record<string, (v: ConceptVersion) => string> = {
      'm1-neighbour': (v) => firstFact(v, 'neighbours').of,
      'm1-directed': (v) => firstFact(v, 'out-neighbours').of,
      'm3-previous': (v) => firstFact(v, 'previous-on-shortest-path').to,
    }
    for (const [groupId, vertexOf] of Object.entries(asked)) {
      for (const version of conceptGroupById(groupId).versions) {
        const vertex = vertexOf(version)
        // Split into words instead of using a regex: "\b" inside a template string is a
        // backspace character, not a word boundary, which silently broke this test once (bug B3).
        const words = version.hints.workedExample.split(/[^A-Za-z]+/)
        expect(words, `${version.id} mentions ${vertex}`).not.toContain(vertex)
      }
    }
  })

  it('is used by a known group', () => {
    expect(Object.keys(ANSWER_MATCHES_FACT).every((id) => CONCEPT_GROUPS.some((g) => g.id === id))).toBe(true)
  })
})

describe('conceptQuestion', () => {
  it('marks only the correct answer correct, and gives misconception feedback for wrong ones', () => {
    for (const { group, version } of allVersions) {
      const q = conceptQuestion(group, version, createRng(1))
      for (const answer of q.correctAnswers) expect(checkAnswer(q, answer).status, q.id).toBe('correct')
      for (const [answer, info] of Object.entries(q.wrongAnswers)) {
        expect(checkAnswer(q, answer), `${q.id} ${answer}`).toMatchObject({ status: 'wrong', misconception: info.misconception })
      }
    }
  })

  it('keeps every option but shuffles their order', () => {
    const group = conceptGroupById('m1-terms')
    const orders = new Set<string>()
    for (let seed = 0; seed < 20; seed++) {
      const q = conceptQuestion(group, group.versions[0], createRng(seed))
      expect(q.options.length).toBe(3)
      orders.add(q.options.map((o) => o.id).join())
    }
    expect(orders.size).toBeGreaterThan(1)
  })

  it('shuffles sub-step options and keeps track of the correct one', () => {
    for (const { group, version } of allVersions) {
      const q = conceptQuestion(group, version, createRng(3))
      q.hints.subSteps.forEach((s, i) => {
        const original = version.hints.subSteps[i]
        expect(s.options[s.correctIndex]).toBe(original.options[original.correctIndex])
      })
    }
  })

  it('shows the directed graph for directed questions and no graph when asked', () => {
    const directed = conceptQuestion(conceptGroupById('m1-directed'), conceptGroupById('m1-directed').versions[0], createRng(1))
    expect(directed.view?.graph.directed).toBe(true)
    const plain = conceptQuestion(conceptGroupById('m2-compare'), conceptGroupById('m2-compare').versions[0], createRng(1))
    expect(plain.view).toBeNull()
  })

  it('records which group and version it came from', () => {
    const group = conceptGroupById('m4-is-final')
    const q = conceptQuestion(group, group.versions[1], createRng(1))
    expect(q.concept).toEqual({ groupId: 'm4-is-final', versionId: group.versions[1].id })
    expect(q.typeKey).toBe('concept:m4-is-final')
  })
})

describe('pickVersion', () => {
  it('never picks the version shown last time', () => {
    for (const group of CONCEPT_GROUPS) {
      for (const last of group.versions) {
        for (let seed = 0; seed < 30; seed++) {
          expect(pickVersion(group, last.id, createRng(seed)).id).not.toBe(last.id)
        }
      }
    }
  })

  it('can pick every other version', () => {
    const group = conceptGroupById('m1-weight')
    const picked = new Set<string>()
    for (let seed = 0; seed < 100; seed++) picked.add(pickVersion(group, group.versions[0].id, createRng(seed)).id)
    expect(picked).toEqual(new Set(group.versions.slice(1).map((v) => v.id)))
  })

  it('can pick any version when nothing was shown before', () => {
    const group = conceptGroupById('m1-weight')
    const picked = new Set<string>()
    for (let seed = 0; seed < 100; seed++) picked.add(pickVersion(group, undefined, createRng(seed)).id)
    expect(picked.size).toBe(group.versions.length)
  })
})

describe('conceptGroupById', () => {
  it('rejects an unknown group', () => {
    expect(() => conceptGroupById('nope')).toThrow(/Unknown concept group/)
  })
})
