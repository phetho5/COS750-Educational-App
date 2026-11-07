/*
  The whole concept question bank, by module.
*/
import { MODULE_1_GROUPS } from './module1'
import { MODULE_2_GROUPS } from './module2'
import { MODULE_3_GROUPS } from './module3'
import { MODULE_4_GROUPS } from './module4'
import type { ConceptGroup } from './types'

export const CONCEPT_GROUPS: readonly ConceptGroup[] = [
  ...MODULE_1_GROUPS,
  ...MODULE_2_GROUPS,
  ...MODULE_3_GROUPS,
  ...MODULE_4_GROUPS,
]

export function conceptGroupById(id: string): ConceptGroup {
  const group = CONCEPT_GROUPS.find((g) => g.id === id)
  if (!group) throw new Error(`Unknown concept group "${id}".`)
  return group
}
