/*
  Module map: each module's status (locked, in progress, mastered), progress
  per learning objective, and a Reset progress button (CLAUDE.md).
  Statuses and percentages come from the mastery rules in src/progress/.
*/
import { useState } from 'react'
import { checkStatus, moduleStatus, objectiveMastery, type ModuleStatus } from '../progress'
import { FINAL_CHECK_INFO, MODULES, objectiveInfo } from '../content/modules'
import { mapText as t } from '../content/welcomeText'
import { checkText } from '../content/checkText'
import { navigate } from '../routing/router'
import { paths } from '../routing/routes'
import { cx } from '../components/classNames'
import { Icon } from '../components/Icon'
import { useProgress } from '../components/progressContext'
import { Button, Feedback, StatusBadge } from '../components/ui'
import ui from '../components/ui.module.css'
import styles from './MapScreen.module.css'

interface MapEntry {
  number: number
  title: string
  subtitle: string
  status: ModuleStatus
  path: string
}

export function MapScreen() {
  const { progress, reset, isSaving } = useProgress()
  const [confirming, setConfirming] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  const entries: MapEntry[] = [
    ...MODULES.map((m) => ({ number: m.id, title: m.title, subtitle: m.subtitle, status: moduleStatus(progress, m.id), path: paths.module(m.id) })),
    { number: 6, ...FINAL_CHECK_INFO, status: checkStatus(progress, 'final'), path: paths.check('final') },
  ]
  const finalTaken = progress.attempts.final.length > 0

  function confirmReset() {
    reset()
    setConfirming(false)
    setResetDone(true)
  }

  return (
    <div className={`${ui.page} ${styles.map}`}>
      <section className={styles.modules}>
        <div className={ui.pageHeader}>
          <p className={ui.eyebrow}>{t.eyebrow}</p>
          <h1 className={ui.pageTitle}>{t.title}</h1>
          <p className={ui.lead}>{t.intro}</p>
        </div>

        {progress.demoUnlocked && <Feedback kind="info">{t.demoNote}</Feedback>}
        {!isSaving && <Feedback kind="info">{checkText.notSavingNote}</Feedback>}

        <ol className={styles.list} aria-label="Modules">
          {entries.map((e) => (
            <li key={e.number}>
              {e.status === 'locked' ? (
                <div className={cx(styles.entry, styles.locked)} aria-disabled="true">
                  <span className={styles.number} aria-hidden="true">
                    {e.number}
                  </span>
                  <EntryText title={e.title} subtitle={e.subtitle} />
                  <StatusBadge status="locked" />
                </div>
              ) : (
                <button type="button" className={styles.entry} onClick={() => navigate(e.path)}>
                  <span className={styles.number} aria-hidden="true">
                    {e.number}
                  </span>
                  <EntryText title={e.title} subtitle={e.subtitle} />
                  <StatusBadge status={e.status} />
                  <Icon name="chevronRight" color="var(--color-muted)" />
                </button>
              )}
            </li>
          ))}
        </ol>

        {finalTaken && (
          <Button iconAfter="arrowRight" className={styles.summary} onClick={() => navigate(paths.summary)}>
            {t.summaryButton}
          </Button>
        )}
      </section>

      <aside className={`${ui.card} ${styles.objectives}`} aria-labelledby="objectives-title">
        <h2 id="objectives-title" className={ui.sectionTitle}>
          {t.objectivesTitle}
        </h2>
        <ul className={styles.bars}>
          {objectiveMastery(progress).map((o) => {
            const name = `${o.objective}. ${objectiveInfo(o.objective).short}`
            return (
              <li key={o.objective}>
                <span>{name}</span>
                <div className={styles.barRow}>
                  <div
                    role="progressbar"
                    aria-label={name}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={o.percent}
                    aria-valuetext={o.attempted ? `${o.percent}%` : t.notStarted}
                    className={styles.bar}
                  >
                    <div style={{ width: `${o.percent}%` }} />
                  </div>
                  <span className={styles.percent}>{o.percent}%</span>
                </div>
              </li>
            )
          })}
        </ul>
        <p className={`${ui.small} ${ui.muted}`}>{t.objectivesNote}</p>

        <div className={styles.reset}>
          {!confirming ? (
            <Button variant="secondary" icon="restart" onClick={() => setConfirming(true)}>
              {t.reset}
            </Button>
          ) : (
            <div role="alertdialog" aria-labelledby="reset-question" className={styles.confirm}>
              <p id="reset-question">{t.resetConfirm}</p>
              <div className={ui.row}>
                <Button onClick={confirmReset}>{t.resetYes}</Button>
                <Button variant="text" onClick={() => setConfirming(false)}>
                  {t.resetNo}
                </Button>
              </div>
            </div>
          )}
          <p aria-live="polite" className={`${ui.small} ${ui.muted}`}>
            {resetDone && !confirming ? t.resetDone : ''}
          </p>
        </div>
      </aside>
    </div>
  )
}

function EntryText({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <span className={styles.text}>
      <span className={styles.title}>{title}</span>
      <span className={styles.subtitle}>{subtitle}</span>
    </span>
  )
}
