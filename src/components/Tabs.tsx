/*
  Watch / Read / Try tabs (CLAUDE.md: each concept is offered three ways).
  Follows the standard keyboard pattern for tabs: Tab moves into the tab
  list, the left and right arrow keys move between tabs, Home and End jump
  to the first and last.
*/
import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from './classNames'
import { Icon, type IconName } from './Icon'
import styles from './Tabs.module.css'

export interface TabInfo<Id extends string> {
  id: Id
  label: string
  icon: IconName
}

interface TabsProps<Id extends string> {
  label: string
  tabs: readonly TabInfo<Id>[]
  selected: Id
  onSelect: (id: Id) => void
  /** A prefix that keeps element ids unique on the page. */
  idPrefix: string
  children: ReactNode
}

export function Tabs<Id extends string>({ label, tabs, selected, onSelect, idPrefix, children }: TabsProps<Id>) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  function onKeyDown(event: KeyboardEvent, index: number) {
    const last = tabs.length - 1
    const target =
      event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null
    if (target === null) return
    event.preventDefault()
    onSelect(tabs[target].id)
    buttons.current[target]?.focus()
  }

  return (
    <div className={styles.wrap}>
      <div role="tablist" aria-label={label} className={styles.list}>
        {tabs.map((tab, i) => {
          const isSelected = tab.id === selected
          return (
            <button
              key={tab.id}
              ref={(el) => {
                buttons.current[i] = el
              }}
              type="button"
              role="tab"
              id={`${idPrefix}-tab-${tab.id}`}
              aria-selected={isSelected}
              aria-controls={`${idPrefix}-panel`}
              tabIndex={isSelected ? 0 : -1}
              className={cx(styles.tab, isSelected && styles.selected)}
              onClick={() => onSelect(tab.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              <Icon name={tab.icon} />
              {tab.label}
            </button>
          )
        })}
      </div>
      <div role="tabpanel" id={`${idPrefix}-panel`} aria-labelledby={`${idPrefix}-tab-${selected}`} className={styles.panel}>
        {children}
      </div>
    </div>
  )
}
