/*
  A module check or the final check: 5 questions, one at a time.

  - Questions are built once, with a fresh random seed and the concept
    versions shown last time (so a retry never repeats them).
  - Only the first readable answer to each question counts (D8). The student
    still has to get it right (on that question, or on a new question of the
    same type after the hint ladder) before moving on.
  - "Try a new question like this" swaps in a practice question. It doesn't
    count, and its concept version is remembered.
  - At the end the attempt is recorded, then the student goes on to the
    next module (pass), the review (below 80%) or the summary (final check).
*/
import { useState } from "react";
import {
  buildCheck,
  CHECK_LENGTH,
  newQuestionLike,
  randomSeed,
  type CheckId,
  type CheckResult,
  type Question,
} from "../questions";
import {
  answerRecord,
  canStartCheck,
  correctCount,
  finishCheck,
  needsReview,
  nextStepAfterCheck,
  PASS_PERCENT,
  rememberShown,
  scorePercent,
  type CheckAttempt,
} from "../progress";
import {
  checkName,
  FORMAT_LABEL,
  questionUiText as t,
} from "../content/questionUiText";
import { checkText } from "../content/checkText";
import { navigate } from "../routing/router";
import { pathAfterPass, paths } from "../routing/routes";
import { useProgress } from "../components/progressContext";
import { QuestionPanel } from "../components/QuestionPanel";
import { Button, Card, Feedback } from "../components/ui";
import ui from "../components/ui.module.css";
import styles from "./CheckScreen.module.css";

export function CheckScreen({ checkId }: { checkId: CheckId }) {
  const { progress } = useProgress();
  const name = checkName(checkId);

  if (!canStartCheck(progress, checkId)) {
    return (
      <CheckBlocked
        checkId={checkId}
        name={name}
        reviewDue={needsReview(progress, checkId)}
      />
    );
  }
  // Remount with a fresh attempt each time the check is opened.
  return <CheckRun checkId={checkId} name={name} />;
}

function CheckRun({ checkId, name }: { checkId: CheckId; name: string }) {
  const { progress, update, learningMode } = useProgress();
  // Built once per attempt. A refresh starts a new attempt (D54).
  const [questions] = useState(() =>
    buildCheck(checkId, randomSeed(), progress.lastShown, learningMode),
  );
  const [index, setIndex] = useState(0);
  const [firstResults, setFirstResults] = useState<(CheckResult | undefined)[]>(
    [],
  );
  const [practice, setPractice] = useState<Question | null>(null);
  const [passed, setPassed] = useState<CheckAttempt | null>(null);

  if (passed)
    return <CheckPassed checkId={checkId} name={name} attempt={passed} />;

  const question = practice ?? questions[index];
  const isLast = index === questions.length - 1;

  function recordFirst(result: CheckResult) {
    if (practice || firstResults[index] !== undefined) return;
    setFirstResults((r) => {
      const next = [...r];
      next[index] = result;
      return next;
    });
  }

  function newPractice() {
    const next = newQuestionLike(question, randomSeed());
    update((p) => rememberShown(p, [next]));
    setPractice(next);
  }

  function goOn() {
    if (!isLast) {
      setIndex(index + 1);
      setPractice(null);
      window.scrollTo(0, 0);
      return;
    }
    finish();
  }

  function finish() {
    // Every question has a first answer by now: "Next" only appears after a correct answer,
    // and the hint ladder (and so a practice question) only opens after a wrong one.
    const results = firstResults as CheckResult[];
    const attempt: CheckAttempt = {
      answers: questions.map((q, i) => answerRecord(q, results[i])),
    };
    update((p) => finishCheck(p, checkId, questions, results));
    const step = nextStepAfterCheck(checkId, attempt);
    if (step === "summary") navigate(paths.summary);
    else if (step === "review") navigate(paths.review(checkId));
    else setPassed(attempt);
    window.scrollTo(0, 0);
  }

  return (
    <div className={ui.page}>
      <div className={styles.header}>
        <div className={`${ui.row} ${ui.spaceBetween}`}>
          <p className={ui.eyebrow}>
            {name} · Question {index + 1} of {questions.length}
          </p>
          <p className={ui.row}>
            <span className={ui.chip}>{FORMAT_LABEL[question.format]}</span>
            <span className={ui.chipOutline}>
              {learningMode === "support" ? t.supportMode : t.challengeMode}
            </span>
            {question.trace?.layoutId === "network" && (
              <span className={ui.chipOutline}>{t.largerGraph}</span>
            )}
            {practice && (
              <span className={ui.chipOutline}>{t.practiceChip}</span>
            )}
          </p>
        </div>
        <div
          className={styles.segments}
          role="progressbar"
          aria-label="Question progress"
          aria-valuemin={1}
          aria-valuemax={questions.length}
          aria-valuenow={index + 1}
          aria-valuetext={`Question ${index + 1} of ${questions.length}`}
        >
          {questions.map((q, i) => (
            <span
              key={q.id}
              aria-hidden="true"
              className={
                i < index ? styles.done : i === index ? styles.now : styles.todo
              }
            />
          ))}
        </div>
      </div>

      <QuestionPanel
        key={question.id}
        question={question}
        learningMode={learningMode}
        onResult={recordFirst}
        onNewQuestion={newPractice}
        afterCorrect={
          <Button iconAfter="arrowRight" onClick={goOn} className={styles.next}>
            {isLast ? t.seeResults : t.nextQuestion}
          </Button>
        }
      />

      <p className={`${ui.small} ${ui.muted}`}>
        {t.assessmentNote(
          checkId,
          CHECK_LENGTH,
          Math.ceil((CHECK_LENGTH * PASS_PERCENT) / 100),
        )}
      </p>
    </div>
  );
}

function CheckPassed({
  checkId,
  name,
  attempt,
}: {
  checkId: CheckId;
  name: string;
  attempt: CheckAttempt;
}) {
  return (
    <div className={`${ui.page} ${styles.narrow}`}>
      <div className={ui.pageHeader}>
        <p className={ui.eyebrow}>{name} result</p>
        <h1 className={ui.pageTitle}>{checkText.passedTitle}</h1>
      </div>
      <Card>
        <div className={styles.result}>
          <span className={styles.score}>{scorePercent(attempt)}%</span>
          <p>
            {checkText.score(correctCount(attempt), attempt.answers.length)}{" "}
            {checkText.unlockedNext(checkId)}
          </p>
        </div>
      </Card>
      <div className={ui.row}>
        <Button
          iconAfter="arrowRight"
          onClick={() => navigate(pathAfterPass(checkId))}
        >
          {checkText.nextButton(checkId)}
        </Button>
        <Button variant="text" onClick={() => navigate(paths.map)}>
          {checkText.backToMap}
        </Button>
      </div>
    </div>
  );
}

function CheckBlocked({
  checkId,
  name,
  reviewDue,
}: {
  checkId: CheckId;
  name: string;
  reviewDue: boolean;
}) {
  return (
    <div className={`${ui.page} ${styles.narrow}`}>
      <h1 className={ui.pageTitle}>{name}</h1>
      <Feedback kind="info">
        {reviewDue ? checkText.reviewFirst(name) : checkText.locked(name)}
      </Feedback>
      <div className={ui.row}>
        {reviewDue && (
          <Button
            iconAfter="arrowRight"
            onClick={() => navigate(paths.review(checkId))}
          >
            {checkText.goToReview}
          </Button>
        )}
        <Button
          variant={reviewDue ? "text" : "primary"}
          onClick={() => navigate(paths.map)}
        >
          {checkText.backToMap}
        </Button>
      </div>
    </div>
  );
}
