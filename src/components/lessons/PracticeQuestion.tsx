/*
  Module 4, Try: one practice step with the full hint ladder. It's a real
  generated trace question ("which vertex is visited next?"), so its answer
  comes from the engine. Practice isn't scored. The student can always ask
  for another one.
*/
import { useState } from "react";
import { generateTraceQuestion, randomSeed } from "../../questions";
import type { LearningMode } from "../../progress/learningMode";
import { lessonUiText as t } from "../../content/lessons";
import { QuestionPanel } from "../QuestionPanel";
import { Button } from "../ui";

const newQuestion = () =>
  generateTraceQuestion({
    skill: "next-vertex",
    format: "select-vertex",
    objective: 4,
    seed: randomSeed(),
  });

export function PracticeQuestion({
  learningMode = "support",
}: {
  learningMode?: LearningMode;
}) {
  const [question, setQuestion] = useState(newQuestion);
  const another = () => setQuestion(newQuestion());
  return (
    <QuestionPanel
      key={question.id}
      question={question}
      learningMode={learningMode}
      headingLevel={2}
      onNewQuestion={another}
      afterCorrect={
        <Button
          variant="secondary"
          iconAfter="arrowRight"
          onClick={another}
          style={{ alignSelf: "flex-start" }}
        >
          {t.tryAnother}
        </Button>
      }
    />
  );
}
