import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../App";
import {
  createProgressStore,
  initialProgress,
  STORAGE_KEY,
  type ProgressState,
} from "../progress";
import { REVIEWS } from "../content/reviews";
import { LESSONS } from "../content/lessons";
import { MISCONCEPTION_REVIEW } from "../content/summaryText";
import { ProgressProvider } from "../components/ProgressProvider";
import { attempt, passedUpTo, stateWith } from "../test/progressFixtures";
import { MapScreen } from "./MapScreen";
import { ModuleScreen } from "./ModuleScreen";
import { ReviewScreen } from "./ReviewScreen";
import { SummaryScreen } from "./SummaryScreen";

function withProgress(ui: ReactNode, start: ProgressState = initialProgress()) {
  const store = createProgressStore(null);
  store.set(start);
  render(<ProgressProvider store={store}>{ui}</ProgressProvider>);
  return store;
}

beforeEach(() => {
  window.history.pushState(null, "", "/");
  window.localStorage.clear();
});

describe("MapScreen", () => {
  it("shows module 1 in progress and the rest locked for a new student", () => {
    withProgress(<MapScreen />);
    expect(screen.getByText("0 of 5 modules mastered")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Your progress" }),
    ).toHaveAttribute("aria-valuenow", "0");
    expect(
      screen.getByRole("button", {
        name: "Continue Module 1: What is a graph?",
      }),
    ).toBeInTheDocument();
    const items = within(
      screen.getByRole("list", { name: "Modules" }),
    ).getAllByRole("listitem");
    expect(
      items.map(
        (li) =>
          within(li).queryByText(/Mastered|In progress|Locked/)?.textContent,
      ),
    ).toEqual([
      "In progress",
      "Locked",
      "Locked",
      "Locked",
      "Locked",
      "Locked",
    ]);
    // Locked modules aren't buttons.
    expect(
      screen.queryByRole("button", { name: /Representing graphs/ }),
    ).not.toBeInTheDocument();
  });

  it("lets the learner select a mode and saves the preference separately", async () => {
    withProgress(<MapScreen />);
    const support = screen.getByRole("radio", { name: /Support/ });
    const challenge = screen.getByRole("radio", { name: /Challenge/ });
    expect(support).toBeChecked();

    await userEvent.click(challenge);
    expect(challenge).toBeChecked();
    expect(window.localStorage.getItem("cos212-learning-mode")).toBe("challenge");
    expect(screen.getByText(/This does not change your score or the questions/)).toBeInTheDocument();
  });

  it("opens a module and shows mastery per objective", async () => {
    withProgress(<MapScreen />, stateWith({ "module-1": [attempt(4)] }));
    expect(
      screen.getByRole("progressbar", { name: "1. Describe a graph" }),
    ).toHaveAttribute("aria-valuenow", "80");
    expect(
      screen.getByRole("progressbar", { name: "2. Matrix and list" }),
    ).toHaveAttribute("aria-valuetext", "Not started");
    await userEvent.click(
      within(screen.getByRole("list", { name: "Modules" })).getByRole(
        "button",
        { name: /Representing graphs/ },
      ),
    );
    expect(window.location.pathname).toBe("/module/2");
  });

  it("routes the continue action to review, next module, final check, and summary", async () => {
    withProgress(
      <MapScreen />,
      stateWith({ "module-1": [attempt(4)] }, { reviewDue: ["module-1"] }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Continue Module 1 review" }),
    );
    expect(window.location.pathname).toBe("/review/module-1");
    cleanup();

    window.history.pushState(null, "", "/map");
    withProgress(<MapScreen />, stateWith(passedUpTo(1)));
    await userEvent.click(
      screen.getByRole("button", {
        name: "Continue Module 2: Representing graphs",
      }),
    );
    expect(window.location.pathname).toBe("/module/2");
    cleanup();

    window.history.pushState(null, "", "/map");
    withProgress(<MapScreen />, stateWith(passedUpTo(5)));
    await userEvent.click(
      screen.getByRole("button", { name: "Start the final check" }),
    );
    expect(window.location.pathname).toBe("/check/final");
    cleanup();

    window.history.pushState(null, "", "/map");
    withProgress(
      <MapScreen />,
      stateWith({ ...passedUpTo(5), final: [attempt(2)] }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "See your pre-lecture summary" }),
    );
    expect(window.location.pathname).toBe("/summary");
  });

  it("resets progress only after the student confirms", async () => {
    const store = withProgress(<MapScreen />, stateWith(passedUpTo(3)));
    await userEvent.click(
      screen.getByRole("button", { name: "Reset progress" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(store.get().attempts["module-1"]).toHaveLength(1);

    await userEvent.click(
      screen.getByRole("button", { name: "Reset progress" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Yes, reset everything" }),
    );
    expect(store.get()).toEqual(initialProgress());
    expect(
      screen.getByText("Your progress has been reset."),
    ).toBeInTheDocument();
  });

  it("shows the summary button once the final check has been taken", () => {
    withProgress(
      <MapScreen />,
      stateWith({ ...passedUpTo(5), final: [attempt(3)] }),
    );
    expect(
      screen.getByRole("button", { name: "See your pre-lecture summary" }),
    ).toBeInTheDocument();
  });
});

describe("ModuleScreen", () => {
  it("has Watch, Read and Try tabs that work with the arrow keys", async () => {
    withProgress(<ModuleScreen moduleId={1} />);
    const watch = screen.getByRole("tab", { name: "Watch" });
    expect(watch).toHaveAttribute("aria-selected", "true");
    watch.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Read" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Read" })).toHaveFocus();
    expect(screen.getByText("Vertex")).toBeInTheDocument(); // the glossary
    await userEvent.keyboard("{ArrowRight}");
    expect(
      screen.getByRole("heading", {
        name: "Which vertices are neighbours of A?",
      }),
    ).toBeInTheDocument();
  });

  it("shows the Dijkstra explanation only in Module 4's Read tab", async () => {
    withProgress(<ModuleScreen moduleId={4} />, stateWith(passedUpTo(3)));
    expect(
      screen.queryByRole("heading", { name: "Why Dijkstra works" }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Read" }));
    expect(
      screen.getByRole("heading", { name: "Why Dijkstra works" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/B has distance 4 and D has distance 2/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/requires non-negative edge weights/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Common mistakes" }),
    ).toBeInTheDocument();
    const mistakeToggle = screen.getByText(
      "Choose the edge with the smallest weight.",
    );
    expect(mistakeToggle.closest("details")).not.toHaveAttribute("open");
    await userEvent.click(mistakeToggle);
    expect(mistakeToggle.closest("details")).toHaveAttribute("open");
    expect(
      within(mistakeToggle.closest("details")!).getByText(
        /A-D-B costs 2 \+ 1 = 3/,
      ),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Try" }));
    expect(
      screen.queryByRole("heading", { name: "Why Dijkstra works" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Common mistakes" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("tabpanel")).not.toBeEmptyDOMElement();
  });

  it("connects shortest-path graphs to practical examples in Module 3's Read tab", async () => {
    withProgress(<ModuleScreen moduleId={3} />, stateWith(passedUpTo(2)));
    expect(
      screen.queryByRole("heading", { name: "Where shortest paths show up" }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Read" }));
    expect(
      screen.getByRole("heading", { name: "Where shortest paths show up" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Navigation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Delivery planning" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Computer networks" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/quickest route minimises travel time/),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Try" }));
    expect(
      screen.queryByRole("heading", { name: "Where shortest paths show up" }),
    ).not.toBeInTheDocument();
  });

  it("saves the Think about it answer with the progress", async () => {
    const store = withProgress(<ModuleScreen moduleId={1} />);
    await userEvent.type(
      screen.getByLabelText(LESSONS[1].think),
      "It can branch",
    );
    expect(store.get().thinkNotes["module-1"]).toBe("It can branch");
  });

  it("starts the module check", async () => {
    withProgress(<ModuleScreen moduleId={1} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Start the Module 1 check" }),
    );
    expect(window.location.pathname).toBe("/check/module-1");
  });

  it("sends the student to the review first if one is due", () => {
    withProgress(<ModuleScreen moduleId={1} />, {
      ...initialProgress(),
      reviewDue: ["module-1"],
    });
    expect(
      screen.getByRole("button", { name: "Do the review first" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Start the Module 1 check/ }),
    ).not.toBeInTheDocument();
  });

  it("says a locked module is locked", () => {
    withProgress(<ModuleScreen moduleId={3} />);
    expect(screen.getByText(/Module 3 is still locked/)).toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it.each([2, 3, 4, 5] as const)(
    "shows every tab of module %i without errors",
    async (moduleId) => {
      withProgress(
        <ModuleScreen moduleId={moduleId} />,
        stateWith(passedUpTo(moduleId - 1)),
      );
      for (const name of ["Watch", "Read", "Try"]) {
        await userEvent.click(screen.getByRole("tab", { name }));
        expect(screen.getByRole("tabpanel")).not.toBeEmptyDOMElement();
      }
    },
  );
});

describe("ReviewScreen", () => {
  const failed = () => ({
    ...stateWith({ "module-2": [attempt(3)], ...passedUpTo(1) }),
    reviewDue: ["module-2" as const],
  });

  it("opens the retry only after both practice questions are answered correctly", async () => {
    const store = withProgress(<ReviewScreen checkId="module-2" />, failed());
    expect(
      screen.getByText(/You got 3 of 5 right on the first try/),
    ).toBeInTheDocument();
    const start = screen.getByRole("button", { name: "Start the check" });
    expect(start).toBeDisabled();

    const [q1, q2] = REVIEWS[2].practice;
    const wrong = q1.options.find((_, i) => i !== q1.correctIndex)!;
    await userEvent.click(screen.getByRole("button", { name: wrong }));
    expect(screen.getByText(/Try the other option/)).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: q1.options[q1.correctIndex] }),
    );
    expect(start).toBeDisabled();
    await userEvent.click(
      screen.getByRole("button", { name: q2.options[q2.correctIndex] }),
    );
    expect(start).toBeEnabled();

    await userEvent.click(start);
    expect(store.get().reviewDue).toEqual([]);
    expect(window.location.pathname).toBe("/check/module-2");
  });

  it("says there is nothing to review when no review is due", () => {
    withProgress(<ReviewScreen checkId="module-2" />);
    expect(screen.getByText(/no review waiting/)).toBeInTheDocument();
  });
});

describe("SummaryScreen", () => {
  it("shows mastery, strengths and what to review", () => {
    const state = stateWith({
      ...passedUpTo(4),
      "module-5": [attempt(3, 5, ["dist-edge-only"], 5)],
      final: [attempt(4)],
    });
    withProgress(<SummaryScreen />, state);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Here's where you stand before the lecture",
    );
    expect(screen.getByText(/Final check: 80% \(4 of 5/)).toBeInTheDocument();
    expect(screen.getByText(/You can describe a graph/)).toBeInTheDocument();
    expect(
      screen.getByText(MISCONCEPTION_REVIEW["dist-edge-only"]),
    ).toBeInTheDocument();
  });

  it("says the student is ready when every objective is mastered", () => {
    withProgress(
      <SummaryScreen />,
      stateWith({ ...passedUpTo(5), final: [attempt(5)] }),
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "You're ready for the lecture",
    );
    expect(screen.getByText(/Nothing urgent/)).toBeInTheDocument();
  });

  it("starts with three suggested lecture questions, and lets the student add and remove questions", async () => {
    const store = withProgress(<SummaryScreen />);
    expect(
      screen.getAllByRole("button", { name: /^Remove question/ }),
    ).toHaveLength(3);
    await userEvent.click(
      screen.getByRole("button", { name: "Remove question 1" }),
    );
    await userEvent.type(
      screen.getByLabelText("Add a question"),
      "What about directed graphs?{Enter}",
    );
    expect(store.get().lectureQuestions).toHaveLength(3);
    expect(store.get().lectureQuestions[2]).toBe("What about directed graphs?");
    expect(screen.getByLabelText("Add a question")).toHaveValue("");
  });

  it("shows Think about it notes with their question", () => {
    withProgress(<SummaryScreen />, {
      ...initialProgress(),
      thinkNotes: { "module-3": "Cheapest flights" },
    });
    expect(screen.getByText("Cheapest flights")).toBeInTheDocument();
    expect(screen.getByText(LESSONS[3].think)).toBeInTheDocument();
  });
});

describe("App", () => {
  it("shows the screen for the URL, and changes screen on navigation", async () => {
    window.history.pushState(null, "", "/map");
    render(<App />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Module map" }),
    ).toBeInTheDocument();
    await userEvent.click(
      within(screen.getByRole("list", { name: "Modules" })).getByRole(
        "button",
        { name: /What is a graph/ },
      ),
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "What is a graph?" }),
    ).toBeInTheDocument();
  });

  it("has a not-found page with a way back", () => {
    window.history.pushState(null, "", "/nowhere");
    render(<App />);
    expect(
      screen.getByRole("heading", { name: "We couldn't find that page" }),
    ).toBeInTheDocument();
  });

  it("unlocks everything with the demo switch, then removes it from the address bar", () => {
    window.history.pushState(null, "", "/map?demo=unlock");
    render(<App />);
    expect(
      screen.getByText(/Demo mode: every module is open/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Your turn/ }),
    ).toBeInTheDocument();
    expect(window.location.search).toBe("");
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).demoUnlocked,
    ).toBe(true);
  });

  it("remembers progress after a refresh", async () => {
    window.history.pushState(null, "", "/module/1");
    const { unmount } = render(<App />);
    await userEvent.type(screen.getByLabelText(LESSONS[1].think), "Saved");
    unmount();
    render(<App />);
    expect(screen.getByLabelText(LESSONS[1].think)).toHaveValue("Saved");
  });
});
