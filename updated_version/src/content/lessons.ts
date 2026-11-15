/*
  The lesson for each module: Watch, Read and Try (CLAUDE.md: each concept is
  offered three ways), plus the optional "Think about it" question.

  Words wrapped in **double stars** are shown in bold.
  Any fact about the sample graph stated here is checked against the engine
  in lessons.test.ts, so a typo can't teach something wrong.
*/
import type { ModuleId } from '../questions'

/** Set to true once the group has reviewed this file's wording. */
export const LESSONS_REVIEWED = false

export interface GlossaryEntry {
  readonly term: string
  readonly meaning: string
}

export interface Lesson {
  /** One line above the Watch panel. */
  readonly watchIntro: string
  readonly read: readonly string[]
  readonly glossary: readonly GlossaryEntry[]
  /** One line above the Try panel. */
  readonly tryIntro: string
  readonly think: string
}

export const TAB_NAMES = { watch: 'Watch', read: 'Read', try: 'Try' } as const

export const lessonUiText = {
  eyebrow: (id: ModuleId) => `Module ${id} of 5`,
  tabsLabel: 'Ways to learn this',
  thinkTitle: 'Think about it',
  thinkBadge: 'Optional · not marked',
  thinkPlaceholder: 'Write a sentence or two',
  thinkNote: "We'll add your answer to your pre-lecture summary.",
  backToMap: 'Back to map',
  startCheck: (id: ModuleId) => `Start the Module ${id} check`,
  retakeCheck: (id: ModuleId) => `Take the Module ${id} check again`,
  reviewFirst: 'Do the review first',
  masteredNote: "You've mastered this module.",
  locked: (id: ModuleId) => `Module ${id} is still locked. Pass the check for the module before it to open it.`,
  partOf: (n: number, total: number, title: string) => `Part ${n} of ${total} · ${title}`,
  playFromStart: 'Play from the start',
  pause: 'Pause',
  check: 'Check',
  clear: 'Clear',
  selected: 'Selected:',
  nothingYet: 'nothing yet',
  tryAnother: 'Try another one',
}

export const LESSONS: Record<ModuleId, Lesson> = {
  1: {
    watchIntro: 'Watch a graph being built, one part at a time.',
    read: [
      'A graph is a set of **vertices** joined by **edges**.',
      'You already know linked lists, where each node points to the next one. A graph drops that rule. Any vertex can connect to any other, and a vertex can have many connections.',
      'When an edge carries a number, like distance or travel time, we call that number its **weight**. In our example, the edge between A and D has weight 2.',
      "Two vertices joined by an edge are called **neighbours**. A's neighbours are B and D.",
      'In an **undirected** graph, every edge works both ways. In a **directed** graph, each edge is a one-way arrow. Our example graph is undirected.',
    ],
    glossary: [
      { term: 'Vertex', meaning: 'A point, like a place on a map. Also called a node.' },
      { term: 'Edge', meaning: 'A connection between two vertices.' },
      { term: 'Weight', meaning: 'A number on an edge: distance, time or cost.' },
      { term: 'Undirected', meaning: 'The edge works both ways. A-B is the same as B-A.' },
      { term: 'Directed', meaning: "The edge is one-way, drawn as an arrow. An arrow from A to B doesn't let you go from B to A." },
    ],
    tryIntro: 'Find the neighbours of a vertex on the graph.',
    think: 'In your own words: how is a graph different from a linked list?',
  },
  2: {
    watchIntro: 'Watch each edge appear in the drawing, the matrix and the list.',
    read: [
      "A computer can't look at a drawing, so we store a graph as data. There are two common ways.",
      'An **adjacency matrix** is a table with a row and a column for every vertex. The cell in row A, column B holds the weight of edge A-B. A 0 means there is no edge.',
      'In an undirected graph, every edge appears twice in the matrix: in row A, column B and in row B, column A. So the matrix is **symmetric**: a mirror image along its diagonal.',
      "An **adjacency list** gives each vertex a list of its neighbours, each with the edge's weight. It's like keeping a linked list for every vertex.",
      "A matrix makes it quick to check whether two vertices are joined. A list uses less space when a graph has few edges, and makes it quick to find a vertex's neighbours, which is what Dijkstra's algorithm needs.",
    ],
    glossary: [
      { term: 'Adjacency matrix', meaning: 'A table of weights: row = from, column = to, 0 = no edge.' },
      { term: 'Adjacency list', meaning: 'For every vertex, a list of its neighbours and the weights of the edges to them.' },
      { term: 'Symmetric', meaning: 'Row X, column Y always matches row Y, column X. True for every undirected graph.' },
    ],
    tryIntro: 'Find edges in the matrix and the list. Selecting an edge in one view highlights it in the others.',
    think: 'Why does every edge appear twice in the matrix of an undirected graph?',
  },
  3: {
    watchIntro: 'Compare three routes from A to E and see which one is shortest.',
    read: [
      'A **path** is a sequence of vertices where each one is joined to the next by an edge, like A, D, C.',
      'The **length** of a path is the sum of its edge weights. A, D, C has length 2 + 8 = 10.',
      'The **shortest path problem** asks: what is the cheapest path from a start vertex to each of the other vertices?',
      'Shortest means the smallest total weight, not the fewest edges. A path with more edges can still be cheaper.',
      'Navigation apps solve this problem every day: places are vertices, roads are edges and travel times are weights.',
    ],
    glossary: [
      { term: 'Path', meaning: 'A sequence of vertices, each joined to the next by an edge.' },
      { term: 'Path length', meaning: 'The sum of the weights of the edges on the path. Also called its cost.' },
      { term: 'Shortest path', meaning: 'The path with the smallest total weight between two vertices.' },
    ],
    tryIntro: 'Choose the shortest route.',
    think: 'Name a problem, other than finding a route on a map, that you could solve with shortest paths.',
  },
  4: {
    watchIntro: "Step through Dijkstra's algorithm on our example graph. Use Next and Back, or press Play.",
    read: [
      "**Dijkstra's algorithm** finds the shortest path from a start vertex to every other vertex, in a graph with no negative weights.",
      'It keeps a table with each vertex\'s best distance so far. The start is 0 and every other vertex is ∞, which means "not reached yet".',
      'Then it repeats two rules until every vertex is visited.',
      "**Rule 1.** Visit the unvisited vertex with the smallest distance. Its distance is now final.",
      "**Rule 2.** For each unvisited neighbour, work out the distance through the vertex you're visiting: its distance plus the edge weight. Only replace the neighbour's distance if the new one is smaller, and then record the vertex you came from as its previous vertex.",
      'Why is a visited distance final? Any other route to it must leave from an unvisited vertex, which is at least as far away. Weights are never negative, so no cheaper route can turn up later.',
      'When two vertices tie for the smallest distance, this app visits the one that comes first in the alphabet.',
    ],
    glossary: [
      { term: 'Distance', meaning: 'The length of the best path found so far from the start. ∞ means not reached yet.' },
      { term: 'Previous', meaning: 'The vertex just before this one on the best path so far. Follow it backwards to read the route.' },
      { term: 'Visited', meaning: "A vertex whose distance is final. Dijkstra's algorithm never changes it again." },
    ],
    tryIntro: 'Practise one step: which vertex does Dijkstra visit next?',
    think: 'Why can a cheaper path to a visited vertex never turn up later?',
  },
  5: {
    watchIntro: 'Watch the whole algorithm once more before you trace it yourself.',
    read: [
      "How to trace Dijkstra's algorithm on paper:",
      '**1.** Draw a table with a row for each vertex and the columns Distance, Previous and Visited.',
      '**2.** Write 0 for the start and ∞ for every other vertex.',
      '**3.** Choose the unvisited vertex with the smallest distance, and mark it as visited.',
      "**4.** For each of its unvisited neighbours, add the vertex's distance to the edge weight. If the total is smaller than the neighbour's distance, write in the new distance and the previous vertex. If not, leave it.",
      '**5.** Go back to step 3 until every vertex is visited.',
      "Tip: cross out old distances instead of rubbing them out, so you can check your work. And make sure you add the vertex's distance, not just the edge weight.",
    ],
    glossary: [],
    tryIntro: 'Your turn: trace the rest of the algorithm yourself.',
    think: 'Which part of tracing did you find hardest, and why?',
  },
}

/** Module 1, Watch: the graph is built in four parts (from the design). */
export const GRAPH_PARTS = [
  { title: 'Vertices', caption: 'These circles are vertices. Each one is a place, like a building on campus.' },
  { title: 'Edges', caption: 'The lines are edges. An edge joins two vertices that are directly connected.' },
  { title: 'Weights', caption: 'Each edge has a weight: a number such as distance or travel time. Here, going from A to D costs 2.' },
  {
    title: 'Directed or not',
    caption: 'In a directed graph, edges are one-way and drawn as arrows. Our example graph is undirected: you can travel both ways.',
  },
] as const

/** Module 1, Try: select the neighbours of a vertex. */
export const neighboursTryText = {
  vertex: 'A',
  question: (v: string) => `Which vertices are neighbours of ${v}?`,
  instruction: 'Select every one on the graph, then press Check.',
  right: (v: string, list: string) => `${list} each share an edge with ${v}.`,
  extra: (x: string, v: string) => `${x} isn't joined to ${v} by an edge. Follow only the lines that touch ${v}.`,
  noneYet: (v: string) => `Select the vertices at the other end of the lines that touch ${v}.`,
  missing: (v: string) => `You're nearly there. Another vertex shares an edge with ${v}.`,
}

/** Module 2: the sentence under the three views for the selected edge (from the design). */
export const threeViewsText = {
  edgeTitle: (a: string, b: string, w: number) => `Edge ${a}-${b}, weight ${w}`,
  edgeExplain: (a: string, b: string) =>
    `In the drawing, it's the edge between ${a} and ${b}. In the matrix, it appears twice: row ${a}, column ${b} and row ${b}, column ${a}, because the graph is undirected. In the list, ${b} is in ${a}'s list and ${a} is in ${b}'s.`,
  drawing: 'Drawing',
  matrix: 'Adjacency matrix',
  matrixNote: 'Row = from, column = to. 0 means no edge.',
  list: 'Adjacency list',
  task: (a: string, b: string) => `Find edge ${a}-${b} in the matrix or the list, and select it.`,
  taskRight: (a: string, b: string, w: number) =>
    `That's edge ${a}-${b}, weight ${w}. See how it's highlighted in all three views.`,
  taskWrong: (a: string, b: string) => `That's edge ${a}-${b}. Look for the row of one end and the column of the other.`,
  nextTask: 'Find another edge',
  cellLabel: (r: string, c: string, w: number) => `Row ${r}, column ${c}: weight ${w}`,
  listLabel: (v: string, u: string, w: number) => `${v} to ${u}, weight ${w}`,
}

/** Module 3: the routes compared in Watch, and the question in Try. Costs are worked out in code. */
export const routesText = {
  watchRoutes: [
    ['A', 'B', 'F', 'E'],
    ['A', 'D', 'B', 'F', 'C', 'E'],
    ['A', 'D', 'C', 'E'],
  ],
  routeTitle: (n: number) => `Route ${n}`,
  routeCost: (route: readonly string[], weights: readonly number[], total: number) =>
    `${route.join(', ')}: ${weights.join(' + ')} = ${total}`,
  edges: (n: number) => `${n} ${n === 1 ? 'edge' : 'edges'}`,
  watchConclusion: (route: readonly string[], total: number) =>
    `The shortest route is ${route.join(', ')}, with length ${total}. It isn't the route with the fewest edges that wins: it's the one with the smallest total weight.`,
  tryTarget: 'F',
  tryRoutes: [
    ['A', 'B', 'F'],
    ['A', 'D', 'B', 'F'],
    ['A', 'D', 'C', 'F'],
  ],
  tryQuestion: (to: string) => `Which route from A to ${to} is the shortest?`,
  tryInstruction: 'Add up the edge weights on each route, then choose.',
  tryRight: (cost: string) => `${cost}, the smallest total. It has more edges than A, B, F, but a smaller total weight.`,
  tryFewest: (cost: string) => `${cost}. This route has the fewest edges, but shortest means the smallest total weight. Add up the other routes too.`,
  tryOther: (cost: string) => `${cost}. Is there a route with a smaller total?`,
}
