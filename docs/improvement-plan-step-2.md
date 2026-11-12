# Improvement Plan – Step 2

## Focus

Step 2 strengthens the conceptual teaching of Dijkstra's algorithm. The current app already teaches the procedure well, but it can improve by making the main idea more visible and easier to understand.

## Goal of This Step

The app should help students understand why Dijkstra makes each decision, not just how to follow the algorithm mechanically.

## Key Learning Idea to Emphasise

Dijkstra's algorithm works because it always chooses the unvisited vertex with the smallest known total distance from the start. Once a vertex is selected, its shortest distance is final.

This is the central invariant behind the algorithm and the idea students must understand before the lecture.

## Why This Is Important

Students often struggle with Dijkstra because they confuse:

- the smallest single edge with the smallest total path;
- alphabetical order with algorithmic priority;
- the state of a vertex before vs. after it is visited;
- the idea of a tentative distance with the final shortest distance.

If the app does not clearly explain the core invariant, students may learn the steps but still not understand the reasoning behind them.

## Proposed Improvement

Add a dedicated concept section before the walkthrough and question tasks.

### Section title

"Why Dijkstra works"

### Content to include

1. A simple explanation of the shortest-path problem.
2. The idea of tentative distances.
3. The rule for choosing the next vertex.
4. Why a visited vertex is final.
5. Why the algorithm fails when negative weights are allowed.

## Suggested Layout

Use a short teaching panel that appears before the algorithm walkthrough.

### Example content

> Dijkstra always picks the unvisited vertex with the smallest known total distance from the start. This is the key idea.
>
> Why is this valid? Because any other route to that vertex would have to be at least as long as the current best known distance.
>
> Once a vertex is chosen, we do not need to revisit it. Its shortest distance is final.

## Recommended Design Elements

- a highlighted invariant box;
- a small example with explanation;
- a colour-coded diagram showing visited, current, and candidate vertices;
- one short reminder: “Choose the smallest total distance, not the smallest edge.”

## Educational Benefit

This improvement makes the app more suitable for novice learners because it shifts the focus from memorising steps to understanding the reasoning behind the algorithm.

## Where This Improvement Should Appear in the App

This improvement should appear in the Dijkstra module, especially the module that teaches the algorithm itself. In the current app, the relevant route is the Dijkstra lesson under the module map and the Dijkstra walkthrough screen. The app routes are defined in [src/routing/routes.ts](src/routing/routes.ts), and the module view is handled in [src/screens/ModuleScreen.tsx](src/screens/ModuleScreen.tsx).

### Local app route to view it

When the app is running locally, this section should be visible at:

- /module/4

The most relevant tabs are:

- Watch
- Read

This is where the algorithm explanation and conceptual understanding are presently introduced.

## Deliverable for This Step

A new concept panel or educational callout that explains the invariant of Dijkstra's algorithm before the student begins the interactive walkthrough or assessment.

## Next Step

The next improvement should focus on improving the visual learning of the algorithm by making visited, candidate, and updated vertices clearer in the graph and table view.
