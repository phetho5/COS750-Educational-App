/*
  The optional "Think about it" box: the student explains something in their
  own words. It isn't marked. The answer is saved with their progress and
  shown on the pre-lecture summary.
*/
import { setThinkNote } from '../progress'
import { lessonUiText as t } from '../content/lessons'
import { useProgress } from './progressContext'
import styles from './ThinkAboutIt.module.css'

export function ThinkAboutIt({ boxId, question }: { boxId: string; question: string }) {
  const { progress, update } = useProgress()
  const inputId = `think-${boxId}`
  return (
    <section aria-labelledby={`${inputId}-title`} className={styles.think}>
      <div className={styles.header}>
        <h2 id={`${inputId}-title`} className={styles.title}>
          {t.thinkTitle}
        </h2>
        <span className={styles.badge}>{t.thinkBadge}</span>
      </div>
      <label htmlFor={inputId}>{question}</label>
      <textarea
        id={inputId}
        rows={3}
        placeholder={t.thinkPlaceholder}
        value={progress.thinkNotes[boxId] ?? ''}
        onChange={(e) => update((p) => setThinkNote(p, boxId, e.target.value))}
        className={styles.input}
      />
      <p className={styles.note}>{t.thinkNote}</p>
    </section>
  )
}
