# COS212 app: Graphs and the shortest path

A prototype for the COS750 (Educational Software Development) exam project at the University of Pretoria. It gives second-year COS212 (Data Structures and Algorithms) students tutor-style practice on graphs and Dijkstra's shortest path algorithm before the lecture. Its core feature is assessment that adds scaffolding for students who struggle: a four-level hint ladder after a wrong answer, and a short review before a retry.

Both topics are CS Core in the ACM CS2023 curriculum (AL-Foundational knowledge unit). Students need no prior knowledge of graphs. They only need to be able to program and know arrays and linked lists.

**Live app:** https://cos-750-educational-app-steel.vercel.app

## Learning objectives

By the end, a student can:

1. Describe a graph using the terms vertex, edge, weight, directed and undirected.
2. Represent a small graph as an adjacency matrix and an adjacency list.
3. Explain what the shortest path problem is.
4. Explain step by step how Dijkstra's algorithm finds shortest paths.
5. Trace Dijkstra's algorithm on a small weighted graph.

## What's in the app

The student goes from the Welcome screen through five modules in order. Each module ends with a short check. After Module 5 comes a final check and a pre-lecture summary. The whole path takes about 35 minutes.

### Screens

| Screen | URL | What it shows |
|---|---|---|
| Welcome | `/` | The hook (how does a navigation app find the quickest route from campus to the Gautrain station?), the learning objectives, the time and a Start button |
| Module map | `/map` | Each module's status (locked, in progress, mastered), mastery per objective, a "Next up" button, the Support or Challenge choice and Reset progress |
| Module lesson | `/module/1` to `/module/5` | Watch, Read and Try tabs, a "Think about it" box and a button to start the check |
| Module check | `/check/module-1` to `/check/module-5` | Five questions with the hint ladder, then a result screen |
| Review | `/review/module-1` to `/review/module-5` | After a score below 80%: another way to see the idea, two rules and two easy practice questions |
| Final check | `/check/final` | One question for each objective |
| Pre-lecture summary | `/summary` | Mastery per objective, strengths, what to review, the student's notes and questions to bring to the lecture |

Every page has its own URL, so refreshing a page or opening a link works.

### The five modules

Each concept is offered three ways, in tabs:

| Module | Watch | Read | Try |
|---|---|---|---|
| 1. What is a graph? | The graph built up in four parts | Vertices, edges, weights, directed and undirected, with a glossary | Select a vertex's neighbours on the graph |
| 2. Representing graphs | One graph shown as a drawing, an adjacency matrix and an adjacency list. Selecting an edge highlights it in all three | Matrix and list | Find an edge in the three linked views |
| 3. The shortest path problem | Three routes compared | Paths and path length, plus "Shortest paths in practice" (navigation, delivery planning, computer networks) | Choose the shortest route |
| 4. Dijkstra's algorithm | Step-by-step walkthrough | The two rules, "Why Dijkstra works" and five common mistakes | A practice "which vertex is visited next?" question with the hint ladder |
| 5. Your turn | The walkthrough again | How to trace on paper | The app visits A and D, then the student chooses each next vertex, fills in the distances and presses Check |

**The walkthrough** shows the graph, a distance table (vertex, distance, previous vertex, visited), a plain-language explanation of each step and collapsible pseudocode with the current lines highlighted. The controls are back, next, play or pause, speed and restart, and the arrow keys also step through it. It shows every one of the engine's 16 steps for the sample graph.

**Think about it:** each module page has an optional box where the student explains something in their own words. It isn't marked. The answer is saved and shown on the pre-lecture summary.

### Assessment and scaffolding

- **Mixed question types** in every check: multiple choice, selecting a vertex on the graph, filling in a distance table cell, and predicting the next step.
- **Misconception feedback:** every wrong option is tied to a specific misconception, and each misconception has its own feedback. For example, choosing alphabetically, choosing the lightest edge instead of the smallest total distance, or using only the edge weight instead of adding it to the current distance.
- **Hint ladder:** a wrong answer opens it one level at a time: (1) a nudge, (2) what went wrong, (3) a worked example of a similar step, (4) the task broken into smaller questions. After that the student can try a new question of the same type.
- **Scoring:** only the first answer to each question counts. Each check has 5 questions, so 4 of 5 (80%) passes and unlocks the next module. The best attempt counts, and a mastered module stays mastered.
- **Review before retry:** below 80%, the student does a short review (extra explanation and two easy practice questions) before they can retry the check.
- **Final check:** pass or fail, it always leads to the pre-lecture summary.
- **Pre-lecture summary:** mastery per objective (Mastered, Review or Not started), the final check score, strengths, what to review, and questions to bring to the lecture. It starts with three suggested questions, which the student can remove or add to.

### Support and Challenge modes

On the module map the student chooses a learning mode. It never changes the pass mark or how answers are scored.

- **Support** (the default): the first hint opens automatically after a wrong answer.
- **Challenge:** no automatic hint (the student presses "Reveal a hint" when they want one), and some trace questions use a larger graph with 8 vertices.

### Light and dark mode

A switch in the top-right corner of every page changes the app between dark mode (the default) and light mode. The change applies straight away, graphs included, and is saved in the browser (localStorage key `cos750-color-theme`), so it stays the next time the student opens the app. If storage is blocked, the switch still works for that visit. A small script in `index.html` applies the saved mode before the page draws, so there's no flash of the wrong colours. The mode only changes how the app looks. It's separate from Support and Challenge mode and from progress, and Reset progress doesn't change it.

### Accessibility

- Vertex states never rely on colour alone: unvisited (outline), current (thick ring), visited (filled, with a tick). The edge being checked is a thicker dashed line.
- The main text, button and feedback colours of both themes meet WCAG AA contrast. The theme switch is announced as "Dark mode, switch, on" or "off".
- Vertices and edges can be selected with the keyboard (Tab, then Enter or Space) and have screen-reader labels. Focus states are visible.
- A "Skip to content" link, arrow keys in the tabs, and feedback announced to screen readers.
- Buttons are at least 48px tall (the target is 44px).
- Graphs switch to a phone layout below 720px wide. The laptop layout (1440px) is the main one for the demo.

### For the demo

- Opening `/map?demo=unlock` opens every module and check without recording any scores. Reset progress on the module map turns it off.
- Reset progress clears every score, note and lecture question.

## How it works

| Part | Folder | What it does |
|---|---|---|
| Dijkstra engine | `src/engine/` | Pure TypeScript, no React. Takes a graph and a start vertex and returns every step: each visit, each edge checked, whether a distance changed, and the full distance table after each change. Breaks ties alphabetically and rejects negative weights. |
| Questions | `src/questions/` | The trace question generator and the concept question bank. |
| Content | `src/content/` | Lesson text, objectives, hints and feedback, kept apart from the components. |
| Progress | `src/progress/` | Mastery rules, the pre-lecture summary, and saving to localStorage. |
| Components | `src/components/` | Reusable UI: header and theme switch, graph view, distance table, walkthrough, question panel, hint ladder and so on. |
| Screens | `src/screens/` | One file per screen. |
| Routing | `src/routing/` | A small router built on the browser's History API. |
| Styles | `src/styles/` | Design tokens (colours for both themes, sizes, fonts) and global styles. |

**Trace questions** are generated, not written by hand. The generator picks one of a few fixed graph layouts with 5 or 6 vertices (8 in Challenge mode), shuffles the letters, and gives each edge a random weight from 1 to 9. It then runs the engine and asks about a step. Wrong options come from misconceptions, and one is only used if it gives a different answer from the correct one. Steps where two vertices tie are skipped. Because the answer always comes from the engine, a wrong answer can never be marked correct. A seeded random number generator makes every question reproducible in tests.

**Concept questions** (terms, representations, "is this distance final?") come from a bank with three or four versions of each question. A retry never shows the version seen last time.

**Progress** is kept in memory and saved to localStorage. Every read and write is wrapped in try/catch, so the app keeps working in memory if storage isn't available. Only facts are saved (the first answer to each question); every status and percentage is worked out from them. The learning mode and the colour theme are saved under their own keys, so resetting progress doesn't change them.

**The sample graph** (undirected, start A: A-B 4, A-D 2, D-B 1, B-F 5, D-C 8, F-C 3, C-E 2, F-E 6) is used in the walkthrough and lessons. Its results were checked by hand: visit order A, D, B, F, C, E, and final distances A 0, B 3, C 10, D 2, E 12, F 8.

## Tech stack

- React 19 and TypeScript, built with Vite 8
- Vitest 5, React Testing Library and jsdom for tests
- oxlint for linting
- Graphs drawn in plain SVG (no graph library)
- CSS Modules and CSS custom properties, first styled from the Claude Design files, then given dark and light themes
- No backend, database, sign-in or AI calls. It is a static site.

## Requirements

- Node.js 22.22 or later, or 24.15 or later (we develop on Node 24.19). Older versions fail because Vitest and jsdom need them.
- npm

## Install

```sh
npm install
```

## Run locally

```sh
npm run dev
```

Then open the address Vite prints (usually http://localhost:5173).

## Test

```sh
npm test            # run every test once
npm run test:watch  # re-run tests as files change
```

There are 425 tests in 31 files, and all pass. They cover:

- the engine, including every sample-graph fact in the brief and small graphs for ties, equal paths, directed graphs and invalid input
- over 1,200 generated trace questions, each checked against an independent calculation
- the concept bank, including every sample-graph fact it states
- the mastery rules, saving and loading progress
- the content (for example, no em-dashes), the screens and the theme switch

## Lint

```sh
npm run lint
```

## Build

```sh
npm run build    # type-checks, then builds the static site into dist/
npm run preview  # serves dist/ locally to check the build
```

## Deploy

The app is deployed on Vercel at https://cos-750-educational-app-steel.vercel.app. `vercel.json` sends every URL to `index.html`, so refreshing any page works.

Vercel builds the GitHub repository's `main` branch, so every push to `main` updates the live app. To set it up again:

1. Sign in to Vercel and import the GitHub repository.
2. Vercel detects Vite. Keep the defaults: build command `npm run build`, output folder `dist`.
3. Deploy.

## Project structure

| Folder | What it holds |
|---|---|
| `src/engine/` | Dijkstra engine |
| `src/questions/` | Trace question generator and concept question bank |
| `src/content/` | Lesson text, objectives, hints and feedback |
| `src/progress/` | Mastery rules and localStorage |
| `src/components/` | Reusable UI |
| `src/screens/` | One file per screen |
| `src/routing/` | The router |
| `src/styles/` | Design tokens and global styles |
| `src/test/` | Test setup and shared test helpers |
| `public/fonts/` | Self-hosted fonts and their licences |
| `design/` | The Claude Design export we built from |
| `docs/` | Handoff log and GenAI prompt log |

## Documentation

- `CLAUDE.md`: the project brief and rules.
- `docs/handoff.md`: everything we did, every decision and every bug, stage by stage.
- `docs/genai-log.md`: the GenAI prompts we used, for our ID document.
- Each folder in `src/` has a `README.md` explaining its files.

## Status

The app is complete as a prototype for the demo on 16 or 17 November 2026. Every screen, module, check, the hint ladder, the review path, the pre-lecture summary, Support and Challenge modes and the light and dark themes are built and tested. It is live at https://cos-750-educational-app-steel.vercel.app.

Known limitations:

- The concept questions and student-facing text are marked `reviewed: false` until the group has checked them.
- Challenge-mode trace questions have no fixed fallback graph, unlike Support mode.
- Both themes still need a final look on every screen at laptop (1440px) and phone (390px) width.

## GenAI use

We used Claude Code to help build this app. Every prompt, with a one-line summary of what it produced, is in `docs/genai-log.md`.

## Fonts

The app uses Atkinson Hyperlegible Next and Atkinson Hyperlegible Mono, self-hosted in `public/fonts/` under the SIL Open Font License 1.1 (licence files are in the same folder).
