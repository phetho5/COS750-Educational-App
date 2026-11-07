# COS212 app: Graphs and the shortest path

A prototype for the COS750 (Educational Software Development) exam project at the University of Pretoria. It gives second-year COS212 students tutor-style practice on graphs and Dijkstra's shortest path algorithm before the lecture, with assessment that adds scaffolding (a four-level hint ladder and a review path) for students who struggle.

**Live app:** _to be added after deployment (step 7)_

## What's in the app

Students have no prior knowledge of graphs. They work through five modules in order, each ending with a short check:

| Module | Watch | Read | Try |
|---|---|---|---|
| 1. What is a graph? | The graph built in four parts | Vertices, edges, weights, directed and undirected | Select a vertex's neighbours |
| 2. Representing graphs | Each edge shown in the drawing, the adjacency matrix and the adjacency list | Matrix and list | Find an edge in the three linked views |
| 3. The shortest path problem | Three routes compared | Paths and path length | Choose the shortest route |
| 4. Dijkstra's algorithm | Step-by-step walkthrough with the table, explanations, pseudocode and play controls | The two rules | Predict the next vertex |
| 5. Your turn | The walkthrough again | How to trace on paper | Trace the algorithm yourself, step by step |

Then a final check and a pre-lecture summary (mastery per objective, strengths, what to review and questions to bring to the lecture).

**Assessment and scaffolding**

- Each check has 5 questions of mixed types: multiple choice, selecting a vertex on the graph, filling in a distance table cell and predicting the next step.
- Trace questions are generated on random weights, and their answers come from the Dijkstra engine. Every wrong option is tied to a specific misconception with its own feedback.
- A wrong answer opens a hint ladder, one level at a time: a nudge, what went wrong, a worked example, then smaller questions. After that the student can try a new question of the same type.
- Only the first answer to each question counts. 80% (4 of 5) unlocks the next module. Below 80%, the student does a short review with easier practice, then retries.
- Progress is saved in the browser (localStorage). If storage isn't available, the app keeps working in memory.

**For the demo:** opening `/map?demo=unlock` opens every module without recording any scores. Reset progress on the module map turns it off.

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

The tests cover the engine (including every sample-graph fact in the brief), the question generator, the concept bank, the mastery rules, saving, the content and the screens.

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

The app is a static site hosted on Vercel. `vercel.json` sends every URL to `index.html`, so refreshing any page works.

_Deployment steps to be completed in step 7._

## Project structure

| Folder | What it holds |
|---|---|
| `src/engine/` | Dijkstra engine (pure TypeScript, no React) |
| `src/questions/` | Trace question generator and concept question bank |
| `src/content/` | Lesson text, objectives, hints and feedback |
| `src/progress/` | Mastery rules and localStorage |
| `src/components/` | Reusable UI (graph view, distance table, hint ladder and so on) |
| `src/screens/` | One file per screen |
| `src/routing/` | A small router built on the browser's History API |
| `src/styles/` | Design tokens and global styles |
| `src/test/` | Test setup and shared test helpers |
| `design/` | Claude Design export we build from |
| `docs/` | Handoff log and GenAI prompt log |

## Documentation

- `CLAUDE.md`: the project brief and rules.
- `docs/handoff.md`: everything we've done, every decision and every bug, stage by stage.
- `docs/genai-log.md`: the GenAI prompts we used, for our ID document.
- Each folder in `src/` has a `README.md` explaining its files.

## Status

Build steps 1 to 5 are done: setup, engine, questions, progress and all screens. Still to do: step 6 (responsive layout and accessibility pass, starting with checking every screen at 1440px and 390px) and step 7 (deployment). All student-facing text is marked as not yet reviewed until the group has checked it.

## Fonts

The app uses Atkinson Hyperlegible Next and Atkinson Hyperlegible Mono, self-hosted in `public/fonts/` under the SIL Open Font License 1.1 (licence files are in the same folder).
