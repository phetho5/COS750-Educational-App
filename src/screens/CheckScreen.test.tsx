import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildCheck, type CheckId } from "../questions";
import {
  createProgressStore,
  initialProgress,
  moduleStatus,
  unlockForDemo,
  type ProgressState,
} from "../progress";
import { ProgressProvider } from "../components/ProgressProvider";
import { answerRight, answerWrong } from "../test/answerInUi";
import { CheckScreen } from "./CheckScreen";

// Fix the random seed, so the test knows which questions the screen builds.
const SEED = 42;
vi.mock("../questions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../questions")>()),
  randomSeed: () => SEED,
}));

function renderCheck(
  checkId: CheckId,
  start: ProgressState = initialProgress(),
) {
  const store = createProgressStore(null);
  store.set(start);
  render(
    <ProgressProvider store={store}>
      <CheckScreen checkId={checkId} />
    </ProgressProvider>,
  );
  return store;
}

const next = () =>
  userEvent.click(
    screen.getByRole("button", { name: /Next question|See your results/ }),
  );

beforeEach(() => {
  window.history.pushState(null, "", "/check/module-1");
});

describe("CheckScreen", () => {
  it("explains module scoring and exposes the current question progress accessibly", async () => {
    renderCheck("module-1");
    const progress = screen.getByRole("progressbar", {
      name: "Question progress",
    });
    expect(progress).toHaveAttribute("aria-valuenow", "1");
    expect(progress).toHaveAttribute("aria-valuetext", "Question 1 of 5");
    expect(
      screen.getByText(/at least 4 of 5 right to pass/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /practice questions help you learn but do not affect your score/,
      ),
    ).toBeInTheDocument();

    await answerRight(buildCheck("module-1", SEED, {})[0]);
    await next();
    expect(progress).toHaveAttribute("aria-valuenow", "2");
    expect(progress).toHaveAttribute("aria-valuetext", "Question 2 of 5");
  });

  it("describes the final check as summary evidence, not a pass gate", () => {
    renderCheck("final", unlockForDemo(initialProgress()));
    expect(
      screen.getByText(/recorded for your pre-lecture summary/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/to pass/)).not.toBeInTheDocument();
  });

  it("runs a module check and records a pass, which opens the next module", async () => {
    const store = renderCheck("module-1");
    const questions = buildCheck("module-1", SEED, {});
    for (const [i, q] of questions.entries()) {
      expect(
        screen.getByText(`Module 1 check · Question ${i + 1} of 5`),
      ).toBeInTheDocument();
      await answerRight(q);
      await next();
    }
    expect(
      screen.getByRole("heading", { name: "Well done. You passed." }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/You got 5 of 5 right on the first try/),
    ).toBeInTheDocument();
    expect(moduleStatus(store.get(), 1)).toBe("mastered");
    expect(moduleStatus(store.get(), 2)).toBe("in-progress");
  });

  it("counts only the first answer: wrong then right still counts as wrong", async () => {
    const store = renderCheck("module-1");
    const questions = buildCheck("module-1", SEED, {});
    await answerWrong(questions[0]);
    await answerRight(questions[0]);
    await next();
    for (const q of questions.slice(1)) {
      await answerRight(q);
      await next();
    }
    const attempt = store.get().attempts["module-1"][0];
    expect(attempt.answers.map((a) => a.correct)).toEqual([
      false,
      true,
      true,
      true,
      true,
    ]);
    expect(attempt.answers[0].misconception).toBe(
      questions[0].wrongAnswers[Object.keys(questions[0].wrongAnswers)[0]]
        .misconception,
    );
    expect(screen.getByText(/4 of 5 right/)).toBeInTheDocument(); // 80% still passes
  });

  it("sends the student to the review below 80%", async () => {
    const store = renderCheck("module-1");
    const questions = buildCheck("module-1", SEED, {});
    for (const [i, q] of questions.entries()) {
      if (i < 2) await answerWrong(q);
      await answerRight(q);
      await next();
    }
    expect(window.location.pathname).toBe("/review/module-1");
    expect(store.get().reviewDue).toEqual(["module-1"]);
  });

  it("gives a new question of the same type after the full hint ladder, which does not count", async () => {
    const store = renderCheck("module-1");
    const [first, ...rest] = buildCheck("module-1", SEED, {});
    await answerWrong(first);
    for (const title of [
      "What went wrong",
      "A worked example",
      "Smaller steps",
    ]) {
      await userEvent.click(
        screen.getByRole("button", { name: `Show next hint: ${title}` }),
      );
    }
    await userEvent.click(
      screen.getByRole("button", { name: "Try a new question like this" }),
    );
    expect(screen.getByText("New question · same type")).toBeInTheDocument();

    // The practice question is another version from the same group, and is remembered.
    const groupId = first.concept!.groupId;
    const shown = store.get().lastShown[groupId];
    expect(shown).toBeDefined();
    expect(shown).not.toBe(first.concept!.versionId);
    expect(
      screen.getByText("Module 1 check · Question 1 of 5"),
    ).toBeInTheDocument();

    for (const q of rest) expect(q.concept!.groupId).not.toBe(groupId);
  });

  it("works with trace questions (select on the graph, fill in the table, predict)", async () => {
    const store = renderCheck("module-5", unlockForDemo(initialProgress()));
    for (const q of buildCheck("module-5", SEED, {})) {
      await answerRight(q);
      await next();
    }
    expect(screen.getByText(/The final check is now open/)).toBeInTheDocument();
    expect(
      store.get().attempts["module-5"][0].answers.every((a) => a.correct),
    ).toBe(true);
  });

  it("says a locked check is locked", () => {
    renderCheck("module-2");
    expect(
      screen.getByText(/Module 2 check is still locked/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Check" }),
    ).not.toBeInTheDocument();
  });

  it("sends the student to the review if one is due", () => {
    renderCheck("module-1", { ...initialProgress(), reviewDue: ["module-1"] });
    expect(
      screen.getByRole("button", { name: "Go to the review" }),
    ).toBeInTheDocument();
  });
});
