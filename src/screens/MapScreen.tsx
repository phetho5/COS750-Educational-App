/*
  Module map: each module's status (locked, in progress, mastered), progress
  per learning objective, and a Reset progress button (CLAUDE.md).
  Statuses and percentages come from the mastery rules in src/progress/.
*/
import { useState } from "react";
import {
  checkStatus,
  hasPassed,
  moduleStatus,
  objectiveMastery,
  progressionNextStep,
  type ModuleStatus,
  MODULE_IDS,
} from "../progress";
import { FINAL_CHECK_INFO, MODULES, objectiveInfo } from "../content/modules";
import { mapText as t } from "../content/welcomeText";
import { checkText } from "../content/checkText";
import { navigate } from "../routing/router";
import { paths } from "../routing/routes";
import { cx } from "../components/classNames";
import { Icon } from "../components/Icon";
import { useProgress } from "../components/progressContext";
import { Button, Feedback, StatusBadge } from "../components/ui";
import ui from "../components/ui.module.css";
import styles from "./MapScreen.module.css";

interface MapEntry {
  number: number;
  title: string;
  subtitle: string;
  status: ModuleStatus;
  path: string;
}

export function MapScreen() {
  const { progress, reset, isSaving, learningMode, setLearningMode } =
    useProgress();
  const [confirming, setConfirming] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const entries: MapEntry[] = [
    ...MODULES.map((m) => ({
      number: m.id,
      title: m.title,
      subtitle: m.subtitle,
      status: moduleStatus(progress, m.id),
      path: paths.module(m.id),
    })),
    {
      number: 6,
      ...FINAL_CHECK_INFO,
      status: checkStatus(progress, "final"),
      path: paths.check("final"),
    },
  ];
  const completedModules = MODULE_IDS.filter((id) =>
    hasPassed(progress, `module-${id}`),
  ).length;
  const nextStep = progressionNextStep(progress);

  const nextAction = (() => {
    switch (nextStep.kind) {
      case "review": {
        const moduleId = Number(nextStep.checkId.slice("module-".length));
        return {
          label: t.continueReview(moduleId),
          detail: "Complete the short review to retry this check.",
          path: paths.review(nextStep.checkId),
        };
      }
      case "module":
        return {
          label: t.continueModule(
            nextStep.moduleId,
            MODULES[nextStep.moduleId - 1].title,
          ),
          detail: "Continue with the next unlocked lesson.",
          path: paths.module(nextStep.moduleId),
        };
      case "final":
        return {
          label: t.continueFinal,
          detail:
            "You have mastered all five modules. Put your learning together in the final check.",
          path: paths.check("final"),
        };
      case "summary":
        return {
          label: t.continueSummary,
          detail: t.progressDone,
          path: paths.summary,
        };
    }
  })();

  function confirmReset() {
    reset();
    setConfirming(false);
    setResetDone(true);
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
        {!isSaving && (
          <Feedback kind="info">{checkText.notSavingNote}</Feedback>
        )}

        <section
          className={styles.progressOverview}
          aria-labelledby="progress-title"
        >
          <div className={styles.progressHeading}>
            <div>
              <h2 id="progress-title" className={ui.sectionTitle}>
                {t.progressTitle}
              </h2>
              <p>{t.modulesComplete(completedModules, MODULE_IDS.length)}</p>
            </div>
            <span className={styles.progressCount}>
              {completedModules}/{MODULE_IDS.length}
            </span>
          </div>
          <div
            className={styles.courseProgress}
            role="progressbar"
            aria-label={t.progressTitle}
            aria-valuemin={0}
            aria-valuemax={MODULE_IDS.length}
            aria-valuenow={completedModules}
            aria-valuetext={t.modulesComplete(
              completedModules,
              MODULE_IDS.length,
            )}
          >
            <span
              style={{
                width: `${(completedModules / MODULE_IDS.length) * 100}%`,
              }}
            />
          </div>
          <div className={styles.nextStep}>
            <div>
              <p className={styles.nextLabel}>{t.nextUp}</p>
              <p className={ui.small}>{nextAction.detail}</p>
            </div>
            <Button
              iconAfter="arrowRight"
              onClick={() => navigate(nextAction.path)}
            >
              {nextAction.label}
            </Button>
          </div>
        </section>

        <fieldset className={styles.modePicker}>
          <legend className={ui.sectionTitle}>{t.learningModeTitle}</legend>
          <label className={styles.modeOption}>
            <input
              type="radio"
              name="learning-mode"
              value="support"
              checked={learningMode === "support"}
              onChange={() => setLearningMode("support")}
            />
            <span className={styles.modeCopy}>
              <strong>{t.supportMode}</strong>
              <span>{t.supportModeDescription}</span>
            </span>
          </label>
          <label className={styles.modeOption}>
            <input
              type="radio"
              name="learning-mode"
              value="challenge"
              checked={learningMode === "challenge"}
              onChange={() => setLearningMode("challenge")}
            />
            <span className={styles.modeCopy}>
              <strong>{t.challengeMode}</strong>
              <span>{t.challengeModeDescription}</span>
            </span>
          </label>
          <p aria-live="polite" className={`${ui.small} ${ui.muted}`}>
            {t.learningModeSaved(
              learningMode === "support" ? t.supportMode : t.challengeMode,
            )}
          </p>
        </fieldset>

        <ol className={styles.list} aria-label="Modules">
          {entries.map((e) => (
            <li key={e.number}>
              {e.status === "locked" ? (
                <div
                  className={cx(styles.entry, styles.locked)}
                  aria-disabled="true"
                >
                  <span className={styles.number} aria-hidden="true">
                    {e.number}
                  </span>
                  <EntryText title={e.title} subtitle={e.subtitle} />
                  <StatusBadge status="locked" />
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.entry}
                  onClick={() => navigate(e.path)}
                >
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
      </section>

      <aside
        className={`${ui.card} ${styles.objectives}`}
        aria-labelledby="objectives-title"
      >
        <h2 id="objectives-title" className={ui.sectionTitle}>
          {t.objectivesTitle}
        </h2>
        <ul className={styles.bars}>
          {objectiveMastery(progress).map((o) => {
            const name = `${o.objective}. ${objectiveInfo(o.objective).short}`;
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
                    aria-valuetext={
                      o.attempted ? `${o.percent}%` : t.notStarted
                    }
                    className={styles.bar}
                  >
                    <div style={{ width: `${o.percent}%` }} />
                  </div>
                  <span className={styles.percent}>{o.percent}%</span>
                </div>
              </li>
            );
          })}
        </ul>
        <p className={`${ui.small} ${ui.muted}`}>{t.objectivesNote}</p>

        <div className={styles.reset}>
          {!confirming ? (
            <Button
              variant="secondary"
              icon="restart"
              onClick={() => setConfirming(true)}
            >
              {t.reset}
            </Button>
          ) : (
            <div
              role="alertdialog"
              aria-labelledby="reset-question"
              className={styles.confirm}
            >
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
            {resetDone && !confirming ? t.resetDone : ""}
          </p>
        </div>
      </aside>
    </div>
  );
}

function EntryText({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <span className={styles.text}>
      <span className={styles.title}>{title}</span>
      <span className={styles.subtitle}>{subtitle}</span>
    </span>
  );
}
