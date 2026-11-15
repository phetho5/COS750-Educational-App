// Everything the rest of the app needs from the engine, in one import.
export { dijkstra, shortestPath } from './dijkstra'
export { GraphError, compareVertices, neighboursOf, validateGraph, type Neighbour } from './graph'
export { SAMPLE_GRAPH, SAMPLE_START } from './sampleGraph'
export type * from './types'
