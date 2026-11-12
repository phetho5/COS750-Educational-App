# Improvement Plan – Step 1

## Learning Goal

The app should help students with little or no prior knowledge of graphs and shortest paths to understand and trace Dijkstra's algorithm before attending a lecture.

## Intended Learner

This app is designed for second-year students in COS212 who are learning graph algorithms for the first time. The learner is expected to have basic computational thinking skills, but not necessarily any prior understanding of graphs, weighted edges, or shortest-path algorithms.

## Learning Outcomes

By the end of the app, the student should be able to:

- explain what a graph, vertex, edge, and weighted edge are;
- describe the shortest-path problem;
- explain the purpose of Dijkstra's algorithm;
- explain why Dijkstra chooses the unvisited vertex with the smallest known total distance;
- trace Dijkstra's algorithm step by step on a small weighted graph;
- identify and correct common misconceptions in shortest-path reasoning;
- recognise the importance of the algorithm's assumptions, especially the absence of negative-weight edges.

## Success Criteria

A student can be considered successful when they are able to:

- distinguish between a route and a shortest route;
- choose the correct next vertex in a Dijkstra run;
- update tentative distances correctly;
- explain why a visited vertex can be considered final;
- identify common mistakes in Dijkstra reasoning;
- explain the algorithm in plain language without needing to memorise a formula.

## Core Teaching Statement

This app teaches students how Dijkstra's algorithm works by guiding them through a visual, interactive, and scaffolded shortest-path problem before lecture delivery. The emphasis is not only on getting the answer right, but on understanding why the algorithm makes each decision.

## Why Step 1 Matters

This step defines the educational purpose of the app before any redesign or feature work is done. Without a clear learning goal, the project risks becoming content-heavy, overly technical, or visually attractive but pedagogically weak. Defining the learning outcome first ensures that all later improvements support the intended learning experience.

## Next Step

The next improvement step should focus on strengthening the conceptual teaching of Dijkstra, especially the key invariant that drives the algorithm:

> Dijkstra always selects the unvisited vertex with the smallest known total distance from the start, and once that vertex is chosen, its shortest distance is final.
