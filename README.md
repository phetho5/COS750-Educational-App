# COS212: Graphs and the Shortest Path

An interactive educational web application developed as a COS750 (Educational Software Development) project at the University of Pretoria. It helps second-year COS212 students prepare for lectures on graphs, graph representations, shortest paths, and Dijkstra's algorithm through visual demonstrations, guided activities, and formative assessments.

The application is a React and TypeScript single-page application, built with Vite. Student progress and preferences are stored locally in the browser; no separate server or database is required for normal use.

## Learning experience

Students begin with introductory graph concepts and progress through five modules. Each module uses **Watch**, **Read**, and **Try** activities, followed by a five-question knowledge check.

| Module | Watch | Read | Try |
| --- | --- | --- | --- |
| **1. What is a graph?** | Build a graph in four parts. | Vertices, edges, weights, and directed and undirected graphs. | Select a vertex's neighbours. |
| **2. Representing graphs** | See corresponding edges in a graph drawing, adjacency matrix, and adjacency list. | Matrix and list representations. | Find an edge across the linked views. |
| **3. The shortest path problem** | Compare three possible routes. | Paths and path lengths. | Identify the shortest route. |
| **4. Dijkstra's algorithm** | Follow an interactive walkthrough with a distance table, explanations, pseudocode, and playback controls. | The algorithm's two central rules. | Predict the next vertex. |
| **5. Your turn** | Revisit the walkthrough. | Learn how to trace the algorithm on paper. | Trace the algorithm independently, step by step. |

After the modules, students complete a final check and receive a pre-lecture summary showing mastery by learning objective, strengths, areas to review, and questions to take to the lecture.

### Assessments and learning support

- Module checks and the final check present **five questions**, one at a time.
- Question formats include multiple choice, graph-vertex selection, distance-table entry, and next-step prediction.
- Algorithm-tracing questions use generated graph weights. The Dijkstra engine determines the correct answers, while incorrect options connect to specific misconceptions and feedback.
- Incorrect answers reveal a **four-level hint ladder**: a nudge, an explanation of the mistake, a worked example, and smaller guided questions. Students can then attempt a new question of the same type.
- Only the **first answer** to each scored question contributes to the assessment score. Practice questions after hints do not replace the original scored answer.
- A score of **80% or higher (4/5)** passes a module and unlocks the next one.
- Students below 80% complete a short review and easier practice before retrying.
- Module status, objective mastery, and next steps are visible on the module map.

### Learning modes

On the module map, students can choose **Support** or **Challenge** learning mode. The selection affects the learning or question experience and is stored separately from assessment scores. It is independent of the interface's light/dark appearance setting.

## Interface and visual design

The interface combines a connected learning roadmap, card-based screens, visual progress indicators, and interactive graphs to support step-by-step learning.

- **Module roadmap:** clearly distinguishes locked, in-progress, and mastered modules.
- **Watch / Read / Try navigation:** makes it easy to move between demonstration, explanation, and practice.
- **Interactive graph visualizations:** use labelled vertices, weighted edges, visible selection states, and highlights for the current vertex, visited vertices, candidate vertices, and active edges.
- **Dijkstra walkthrough:** uses step-by-step controls, distance-table changes, and visual path indicators.
- **Feedback and progress:** use distinct states, badges, contextual hints, and progress bars.
- **Visual styling:** charcoal surfaces and cyan, lime, amber, and violet accents in dark mode; light backgrounds and high-contrast accents in light mode; rounded cards, subtle depth, and gentle transitions.
- **Accessibility features:** skip-to-content navigation, visible keyboard focus, descriptive graph states, legible self-hosted fonts, and support for reduced-motion preferences.
- **Responsive styles:** the layout and graph sizing adapt to narrower screens; final cross-device checks remain part of project verification.

### Light and dark mode

An appearance control in the **top-right header** is available throughout the app:

1. Select **Light mode** to use a light interface, or **Dark mode** to return to the dark appearance.
2. The change takes effect immediately on the app's pages and graph visualizations.
3. The preference is saved in browser `localStorage` as `cos750-color-theme` and is restored on subsequent visits.

**Dark mode is the default** when no preference has been saved. If browser storage is unavailable, the switch still works during the current session, although the preference may not persist.

The appearance is controlled by `src/components/Header.tsx`, with button styling in `src/components/Header.module.css`. Theme palettes and graph colors are defined in `src/styles/tokens.css`; global styles and motion behaviour are in `src/styles/global.css`. The `index.html` startup script applies the saved mode before React renders the interface.

## Requirements

- **Node.js:** version `22.22.2` or later in the Node 22 line; version `24.15.0` or later in the Node 24 line; or version `26.0.0` or later, as declared in `package.json`.
- **npm:** installed with Node.js.
- A modern web browser.

## Install and run locally

1. Extract the application ZIP into a folder on your computer.
2. Open that folder in Visual Studio Code or another editor. The folder should contain `package.json` and `index.html` directly.
3. Open a terminal in the project folder and run:

   ```bash
   npm install
   npm run dev
   ```

4. Open the local address shown by Vite (usually `http://localhost:5173/`).

The app uses Vite's development server; a separate Live Server extension is not required.

### Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm test` | Run the automated tests once. |
| `npm run test:watch` | Re-run tests as files change. |
| `npm run lint` | Run Oxlint. |
| `npm run build` | Type-check and create a production build in `dist/`. |
| `npm run preview` | Preview the production build locally. |

## Project structure

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | App shell, shared header, and screen routing. |
| `src/engine/` | Graph and Dijkstra algorithm logic, implemented in TypeScript. |
| `src/questions/` | Generated tracing questions and concept question bank. |
| `src/content/` | Module lessons, learning objectives, hints, and feedback text. |
| `src/progress/` | Assessment results, mastery, learning-mode preference, and progress storage. |
| `src/components/` | Reusable components, including graphs, tables, hints, header, and UI controls. |
| `src/screens/` | Welcome, map, module, assessment, review, summary, and related screens. |
| `src/routing/` | Browser History API-based navigation. |
| `src/styles/` | Global CSS, theme variables, typography, and motion. |
| `src/test/` | Shared test setup and test helpers. |
| `public/` | Static assets, including the favicon and font files. |
| `index.html` | HTML entry point and initial appearance setting. |
| `vercel.json` | Single-page application route rewrite configuration for Vercel. |

### State and saved preferences

Student progress is saved with browser `localStorage` and falls back to in-memory state when local storage cannot be used. Learning-mode preference and interface appearance are managed independently from scored progress. Clearing site storage may reset locally saved progress and preferences.

### Demonstration mode

For demonstrations, visit:

```text
http://localhost:5173/map?demo=unlock
```

This unlocks all modules for navigation without recording scores. The app removes the demo query parameter from the address bar after processing it. The **Reset progress** control on the module map can clear the demo state.

## Testing and quality checks

The project includes automated tests for the algorithm engine, question generation, concept content, mastery and progress rules, storage, and app screens. Run `npm test` to check these behaviours after changes.

Before production release, verify the complete learning flow, responsive layouts at desktop and phone sizes, keyboard and screen-reader use, light/dark contrast, and visual interactions. Student-facing educational copy should also be reviewed by the project group.

## Production build and deployment

Build the static application with:

```bash
npm run build
npm run preview
```

The generated site is located in `dist/`. The project includes `vercel.json`, which rewrites incoming routes to `index.html` so browser refreshes work in the single-page application. Deployment and the public application URL should be confirmed before the site is described as live.

## Fonts and licensing

The app self-hosts **Atkinson Hyperlegible Next** and **Atkinson Hyperlegible Mono** from `public/fonts/`. Their SIL Open Font License 1.1 files are supplied alongside the fonts.
