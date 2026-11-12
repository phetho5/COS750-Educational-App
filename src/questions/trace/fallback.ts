/*
  A fixed graph the generator uses if 50 random attempts all fail (about a
  1 in 100 million chance). It is the ladder layout with fixed letters and
  weights, chosen because it has usable steps for every kind of trace
  question. generator.test.ts checks that this stays true.

  Checked by hand, start A:
    A: D 7, F 5.  Visit F (5): C 8, B 10.  Visit D (7): C stays 8 (7 + 2 = 9).
    Visit C (8): B stays 10 (8 + 2 = 10, not smaller), E 9.  Visit E (9): B stays 10.
    Visit B (10).  Visit order: A, F, D, C, E, B. No ties.

    A ----- F ----- B
    |     / |     / |
    D ----- C ----- E
*/
import type { Graph } from "../../engine";
import { layoutById, type GraphLayout } from "../layouts";

const ladder = layoutById("ladder");

export const FALLBACK_LAYOUT: GraphLayout = {
  ...ladder,
  vertices: ["A", "B", "C", "D", "E", "F"],
  edges: [
    ["A", "D"],
    ["A", "F"],
    ["D", "F"],
    ["D", "C"],
    ["F", "C"],
    ["F", "B"],
    ["C", "B"],
    ["C", "E"],
    ["B", "E"],
  ],
  wide: {
    viewBox: ladder.wide.viewBox,
    positions: {
      A: { x: 70, y: 90 },
      D: { x: 70, y: 330 },
      F: { x: 305, y: 90 },
      C: { x: 305, y: 330 },
      B: { x: 540, y: 90 },
      E: { x: 540, y: 330 },
    },
  },
  narrow: {
    viewBox: ladder.narrow.viewBox,
    positions: {
      A: { x: 40, y: 95 },
      D: { x: 40, y: 325 },
      F: { x: 200, y: 95 },
      C: { x: 200, y: 325 },
      B: { x: 360, y: 95 },
      E: { x: 360, y: 325 },
    },
  },
};

const WEIGHTS = [7, 5, 5, 2, 3, 5, 2, 1, 7]; // same order as FALLBACK_LAYOUT.edges

export const FALLBACK_GRAPH: Graph = {
  vertices: FALLBACK_LAYOUT.vertices,
  directed: false,
  edges: FALLBACK_LAYOUT.edges.map(([from, to], i) => ({
    from,
    to,
    weight: WEIGHTS[i],
  })),
};
