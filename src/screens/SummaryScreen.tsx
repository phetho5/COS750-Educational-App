/*
  Pre-lecture summary (CLAUDE.md): mastery per objective, strengths, what to
  review, and questions to bring to the lecture. The facts come from
  preLectureSummary() and reviewItems() in src/progress/summary.ts.
*/
import { useState, type FormEvent } from 'react'
import { addLectureQuestion, correctCount, latestAttempt, preLectureSummary, removeLectureQuestion, reviewItems } from '../progress'
import { LESSONS } from '../content/lessons'
import { objectiveInfo } from '../content/modules'
import { STRENGTHS, summaryText as t } from '../content/summaryText'
import type { ModuleId } from '../questions'
import { navigate } from '../routing/router'
import { paths } from '../routing/routes'
import { Icon } from '../components/Icon'
import { useProgress } from '../components/progressContext'
import { Button, StatusBadge } from '../components/ui'
import ui from '../components/ui.module.css'
import styles from './SummaryScreen.module.css'

export function SummaryScreen() {
  const { progress, update } = useProgress()
  const summary = preLectureSummary(progress)
  const toReview = reviewItems(summary)
  const allMastered = summary.objectives.every((o) => o.mastered)
  const finalAttempt = latestAttempt(progress, 'final')

  return (
    <div className={`${ui.page} ${styles.summary}`}>
      <div className={ui.pageHeader}>
        <p className={ui.eyebrow}>{t.eyebrow}</p>
        <h1 className={ui.pageTitle}>{allMastered ? t.titleReady : t.titleNotYet}</h1>
        <p className={ui.muted}>{t.intro}</p>
      </div>

      <section className={ui.card} aria-labelledby="mastery-title">
        <h2 id="mastery-title" className={styles.bigTitle}>
          {t.masteryTitle}
        </h2>
        {summary.finalCheck && finalAttempt && (
          <p className={styles.final}>{t.finalScore(summary.finalCheck.percent, correctCount(finalAttempt), finalAttempt.answers.length)}</p>
        )}
        <ul className={styles.objectives}>
          {summary.objectives.map((o) => (
            <li key={o.objective}>
              <span className={styles.objectiveText}>{objectiveInfo(o.objective).text}</span>
              <div className={styles.barRow}>
                <div className={styles.bar} aria-hidden="true">
                  <div style={{ width: `${o.percent}%` }} />
                </div>
                <span className={styles.percent}>{o.attempted ? `${o.percent}%` : ''}</span>
              </div>
              <span className={styles.status}>
                {!o.attempted ? <span className={ui.chipOutline}>{t.notStarted}</span> : <StatusBadge status={o.mastered ? 'mastered' : 'review'} />}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.pair}>
        <section className={ui.card} aria-labelledby="well-title">
          <h2 id="well-title" className={ui.sectionTitle}>
            {t.wellTitle}
          </h2>
          <ul className={styles.list}>
            {summary.strengths.length === 0 && <li>{t.wellNone}</li>}
            {summary.strengths.map((o) => (
              <li key={o} className={styles.well}>
                <Icon name="check" color="var(--color-good)" />
                <span>{STRENGTHS[o]}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={ui.card} aria-labelledby="review-title">
          <h2 id="review-title" className={ui.sectionTitle}>
            {t.reviewTitle}
          </h2>
          <ul className={styles.list}>
            {toReview.length === 0 ? (
              <ReviewLine text={t.reviewNothing} moduleId={4} label={t.openWalkthrough} />
            ) : (
              toReview.map((item) => <ReviewLine key={item.text} text={item.text} moduleId={item.moduleId} label={t.revisitModule(item.moduleId)} />)
            )}
          </ul>
        </section>
      </div>

      <LectureQuestions
        questions={summary.lectureQuestions}
        onAdd={(text) => update((p) => addLectureQuestion(p, text))}
        onRemove={(i) => update((p) => removeLectureQuestion(p, i))}
      />

      {summary.thinkNotes.length > 0 && (
        <section className={ui.card} aria-labelledby="notes-title">
          <h2 id="notes-title" className={ui.sectionTitle}>
            {t.notesTitle}
          </h2>
          <ul className={styles.list}>
            {summary.thinkNotes.map((n) => (
              <li key={n.boxId} className={styles.note}>
                <p className={`${ui.small} ${ui.muted}`}>{noteQuestion(n.boxId)}</p>
                <p>{n.text}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

/** The question a "Think about it" box asked, from its id ("module-3"). */
function noteQuestion(boxId: string): string {
  const id = Number(boxId.replace('module-', '')) as ModuleId
  return LESSONS[id]?.think ?? ''
}

function ReviewLine({ text, moduleId, label }: { text: string; moduleId: ModuleId; label: string }) {
  return (
    <li className={styles.reviewLine}>
      <span>{text}</span>
      <Button variant="secondary" onClick={() => navigate(paths.module(moduleId))}>
        {label}
      </Button>
    </li>
  )
}

function LectureQuestions(props: { questions: readonly string[]; onAdd: (text: string) => void; onRemove: (index: number) => void }) {
  const { questions, onAdd, onRemove } = props
  const [draft, setDraft] = useState('')
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  function add(event: FormEvent) {
    event.preventDefault()
    onAdd(draft)
    setDraft('')
  }

  async function copy() {
    const text = questions.map((q, i) => `${i + 1}. ${q}`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopyState('copied')
    } catch {
      setCopyState('failed') // e.g. no clipboard access over plain http
    }
    window.setTimeout(() => setCopyState('idle'), 2000)
  }

  return (
    <section className={ui.card} aria-labelledby="questions-title">
      <div className={styles.questionsHeader}>
        <h2 id="questions-title" className={ui.sectionTitle}>
          {t.questionsTitle}
        </h2>
        {questions.length > 0 && (
          <Button variant="text" onClick={copy}>
            {copyState === 'copied' ? t.copied : t.copy}
          </Button>
        )}
      </div>
      <p aria-live="polite" className={`${ui.small} ${ui.muted}`}>
        {copyState === 'failed' ? t.copyFailed : ''}
      </p>
      {questions.length === 0 ? (
        <p className={ui.muted}>{t.noQuestions}</p>
      ) : (
        <ol className={styles.questions}>
          {questions.map((q, i) => (
            <li key={`${i}-${q}`}>
              <span className={styles.qNumber}>{i + 1}</span>
              <span className={styles.qText}>{q}</span>
              <button type="button" className={styles.remove} aria-label={t.remove(i + 1)} onClick={() => onRemove(i)}>
                <Icon name="cross" />
              </button>
            </li>
          ))}
        </ol>
      )}
      <form onSubmit={add} className={styles.addForm}>
        <label htmlFor="new-question" className="visually-hidden">
          {t.addLabel}
        </label>
        <input id="new-question" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t.addPlaceholder} className={styles.addInput} />
        <Button type="submit">{t.add}</Button>
      </form>
    </section>
  )
}
