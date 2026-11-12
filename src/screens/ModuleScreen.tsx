/*
  A module's lesson: Watch, Read and Try tabs (CLAUDE.md), the optional
  "Think about it" box, and the button to start the module check.

  What each tab shows (handoff D58):
    Module 1  Watch: the graph built in parts  Try: select A's neighbours
    Module 2  Watch: edges through 3 views     Try: find an edge in the views
    Module 3  Watch: three routes compared     Try: choose the shortest route
    Module 4  Watch: the walkthrough           Try: one practice step with hints
    Module 5  Watch: the walkthrough again     Try: Your turn
  Every Read tab is text from src/content/lessons.ts.
*/
import { useState, type ReactNode } from "react";
import type { ModuleId } from "../questions";
import { canStartCheck, hasPassed, isUnlocked, needsReview } from "../progress";
import { moduleInfo } from "../content/modules";
import { LESSONS, lessonUiText as t, TAB_NAMES } from "../content/lessons";
import { navigate } from "../routing/router";
import { paths } from "../routing/routes";
import { GraphPartsWatch } from "../components/lessons/GraphPartsWatch";
import { NeighboursTry } from "../components/lessons/NeighboursTry";
import { PracticeQuestion } from "../components/lessons/PracticeQuestion";
import { RoutesTry, RoutesWatch } from "../components/lessons/Routes";
import {
  ThreeViewsTry,
  ThreeViewsWatch,
} from "../components/lessons/ThreeViews";
import { useProgress } from "../components/progressContext";
import { RichText } from "../components/RichText";
import { Tabs, type TabInfo } from "../components/Tabs";
import { ThinkAboutIt } from "../components/ThinkAboutIt";
import { DijkstraPrinciple } from "../components/DijkstraPrinciple";
import { DijkstraCommonMistakes } from "../components/DijkstraCommonMistakes";
import { ShortestPathsInPractice } from "../components/ShortestPathsInPractice";
import { Button, Feedback, StatusBadge } from "../components/ui";
import { Walkthrough } from "../components/Walkthrough";
import { YourTurn } from "../components/YourTurn";
import ui from "../components/ui.module.css";
import lessonStyles from "../components/lessons/lessons.module.css";

type TabId = "watch" | "read" | "try";

const TABS: readonly TabInfo<TabId>[] = [
  { id: "watch", label: TAB_NAMES.watch, icon: "watch" },
  { id: "read", label: TAB_NAMES.read, icon: "read" },
  { id: "try", label: TAB_NAMES.try, icon: "try" },
];

export function ModuleScreen({ moduleId }: { moduleId: ModuleId }) {
  const { progress } = useProgress();
  const [tab, setTab] = useState<TabId>("watch");
  const checkId = `module-${moduleId}` as const;
  const info = moduleInfo(moduleId);
  const lesson = LESSONS[moduleId];

  if (!isUnlocked(progress, checkId)) {
    return (
      <div className={ui.page}>
        <h1 className={ui.pageTitle}>{info.title}</h1>
        <Feedback kind="info">{t.locked(moduleId)}</Feedback>
        <div className={ui.row}>
          <Button onClick={() => navigate(paths.map)}>{t.backToMap}</Button>
        </div>
      </div>
    );
  }

  const mastered = hasPassed(progress, checkId);
  const checkButton = canStartCheck(progress, checkId) ? (
    <Button
      iconAfter="arrowRight"
      onClick={() => navigate(paths.check(checkId))}
    >
      {mastered ? t.retakeCheck(moduleId) : t.startCheck(moduleId)}
    </Button>
  ) : needsReview(progress, checkId) ? (
    <Button
      iconAfter="arrowRight"
      onClick={() => navigate(paths.review(checkId))}
    >
      {t.reviewFirst}
    </Button>
  ) : null;

  return (
    <div className={ui.page}>
      <div className={`${ui.row} ${ui.spaceBetween}`}>
        <div className={ui.pageHeader}>
          <p className={ui.eyebrow}>{t.eyebrow(moduleId)}</p>
          <h1 className={ui.pageTitle}>{info.title}</h1>
        </div>
        {mastered && <StatusBadge status="mastered" />}
      </div>

      <Tabs
        label={t.tabsLabel}
        tabs={TABS}
        selected={tab}
        onSelect={setTab}
        idPrefix={`module-${moduleId}`}
      >
        {tab === "watch" && (
          <>
            <p className={ui.lead}>{lesson.watchIntro}</p>
            <WatchTab moduleId={moduleId} />
          </>
        )}
        {tab === "read" && <ReadTab moduleId={moduleId} />}
        {tab === "try" && (
          <>
            <p className={ui.lead}>{lesson.tryIntro}</p>
            <TryTab moduleId={moduleId} checkButton={checkButton} />
          </>
        )}
      </Tabs>

      <ThinkAboutIt boxId={`module-${moduleId}`} question={lesson.think} />

      <div className={`${ui.row} ${ui.spaceBetween}`}>
        <Button
          variant="text"
          icon="chevronLeft"
          onClick={() => navigate(paths.map)}
        >
          {t.backToMap}
        </Button>
        {checkButton}
      </div>
    </div>
  );
}

function WatchTab({ moduleId }: { moduleId: ModuleId }) {
  switch (moduleId) {
    case 1:
      return <GraphPartsWatch />;
    case 2:
      return <ThreeViewsWatch />;
    case 3:
      return <RoutesWatch />;
    case 4:
    case 5:
      return <Walkthrough />;
  }
}

function TryTab({
  moduleId,
  checkButton,
}: {
  moduleId: ModuleId;
  checkButton: ReactNode;
}) {
  switch (moduleId) {
    case 1:
      return <NeighboursTry />;
    case 2:
      return <ThreeViewsTry />;
    case 3:
      return <RoutesTry />;
    case 4:
      return <PracticeQuestion />;
    case 5:
      return <YourTurn doneAction={checkButton} />;
  }
}

function ReadTab({ moduleId }: { moduleId: ModuleId }) {
  const lesson = LESSONS[moduleId];
  return (
    <div className={lessonStyles.read}>
      {moduleId === 4 && <DijkstraPrinciple />}
      {moduleId === 4 && <DijkstraCommonMistakes />}
      <div className={lessonStyles.readText}>
        {lesson.read.map((paragraph) => (
          <p key={paragraph}>
            <RichText text={paragraph} />
          </p>
        ))}
      </div>
      {lesson.glossary.length > 0 && (
        <dl className={lessonStyles.glossary}>
          {lesson.glossary.map((g) => (
            <div key={g.term}>
              <dt>{g.term}</dt>
              <dd>{g.meaning}</dd>
            </div>
          ))}
        </dl>
      )}
      {moduleId === 3 && <ShortestPathsInPractice />}
    </div>
  );
}
