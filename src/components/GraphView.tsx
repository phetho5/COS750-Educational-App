/*
  Draws a small weighted graph as plain SVG (no graph library, CLAUDE.md).

  Vertex states never rely on colour alone (CLAUDE.md, Accessibility):
  - unvisited: thin grey outline
  - current: thick orange ring
  - visited: filled blue, with a tick badge
  - candidate: violet tint with a dashed outline
  - checking: solid violet outline for the neighbour on the active edge
  - selected: dashed ring around it
  The edge being checked is drawn thicker and dashed.

  Positions come from the caller (a question's view, or a layout), never
  from a fixed table here, because trace questions shuffle letters (D32).
*/
import type { KeyboardEvent, ReactNode } from 'react'
import type { Graph, VertexId } from '../engine'
import type { LayoutSize } from '../questions'
import { formatDistance } from '../content/format'
import { edgeKey, vertexLabel, type EdgePair, type VertexState } from './graphHelpers'
import { useIsNarrow } from './useIsNarrow'

/** Sizes from the design, for the laptop and phone layouts. */
const SIZES = {
  wide: { r: 22, vertexFont: 19, weightFont: 15, labelFont: 15, pillW: 36, pillH: 24, labelW: 64, labelH: 24, labelY: 42, edge: 2, edgeHot: 4 },
  narrow: { r: 25, vertexFont: 25, weightFont: 20, labelFont: 18, pillW: 42, pillH: 30, labelW: 72, labelH: 28, labelY: 48, edge: 2.5, edgeHot: 5 },
}

const COLOURS = {
  ink: '#1B2430',
  blue: '#256ABF',
  blueDark: '#1C5CAB',
  tint: '#E8F0FB',
  orange: '#EB6834',
  orangeTint: '#FDEBDD',
  hint: '#6250D6',
  hintDark: '#4A3AA7',
  hintTint: '#EEEBFB',
  grey: '#7A828E',
  pill: '#C4C9D0',
  bg: '#F6F7F9',
  divider: '#E1E4E8',
  good: '#006300',
  badIcon: '#D03B3B',
}

const FONT = '"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", system-ui, sans-serif'
const TRANSITION = '0.5s ease-out'

export type VertexBadge = 'right' | 'wrong'

export interface GraphViewProps {
  graph: Graph
  /** Vertex positions for laptops and phones. */
  wide: LayoutSize
  narrow: LayoutSize
  /** What a screen reader calls the whole graph. */
  label: string
  /** A longer description read after the label, e.g. what's happening at this step. */
  description?: string
  states?: Readonly<Record<VertexId, VertexState>>
  /** Distance labels to show above the vertices. Leave out to show none. */
  distances?: Readonly<Record<VertexId, number>> | null
  checkingEdge?: EdgePair | null
  /** An edge picked by the student (e.g. in the three views). */
  highlightEdge?: EdgePair | null
  /** Edges on the shortest paths so far, drawn thick and blue. */
  pathEdges?: readonly EdgePair[]
  /** A vertex whose distance just changed: its label turns orange. */
  changed?: VertexId | null
  badges?: Readonly<Record<VertexId, VertexBadge>>
  /** The start vertex gets a "Start" tag. Null for no tag. */
  start?: VertexId | null
  /** Makes vertices selectable. */
  onVertex?: (vertex: VertexId) => void
  /** Which vertices can be selected when onVertex is set. Defaults to all. */
  selectable?: readonly VertexId[]
  /** Makes edges selectable. */
  onEdge?: (edge: EdgePair) => void
  /** For the step-by-step "Watch" animation: 1 vertices only, 2 adds edges, 3 adds weights. */
  reveal?: 1 | 2 | 3
}

function activateOnKey(event: KeyboardEvent, action: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    action()
  }
}

export function GraphView(props: GraphViewProps) {
  const { graph, label, description, states = {}, distances, checkingEdge, highlightEdge, changed, badges = {} } = props
  const { start = 'A', onVertex, selectable, onEdge, reveal = 3 } = props
  const isNarrow = useIsNarrow()
  const size = isNarrow ? SIZES.narrow : SIZES.wide
  const layout = isNarrow ? props.narrow : props.wide
  const pos = layout.positions
  const directed = graph.directed

  const checkingKey = checkingEdge ? edgeKey(checkingEdge[0], checkingEdge[1]) : null
  const highlightKey = highlightEdge ? edgeKey(highlightEdge[0], highlightEdge[1]) : null
  const pathKeys = new Set((props.pathEdges ?? []).map(([a, b]) => edgeKey(a, b)))

  const edges = graph.edges.map((edge) => {
    const key = edgeKey(edge.from, edge.to)
    const a = pos[edge.from]
    const b = pos[edge.to]
    const checking = key === checkingKey
    const hot = checking || key === highlightKey
    const onPath = pathKeys.has(key)
    const stroke = hot ? COLOURS.orange : onPath ? COLOURS.blue : COLOURS.grey
    const width = hot || onPath ? size.edgeHot : size.edge
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    const interactive = onEdge !== undefined
    const select = () => onEdge?.([edge.from, edge.to])

    return (
      <g
        key={directed ? edgeKey(edge.from, edge.to, true) : key}
        style={{ opacity: reveal >= 2 ? 1 : 0, transition: `opacity ${TRANSITION}`, cursor: interactive ? 'pointer' : undefined }}
        {...(interactive && {
          role: 'button',
          tabIndex: 0,
          'aria-pressed': key === highlightKey,
          'aria-label': `Edge ${edge.from}-${edge.to}, weight ${edge.weight}`,
          onClick: select,
          onKeyDown: (e: KeyboardEvent) => activateOnKey(e, select),
        })}
      >
        <line
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          style={{
            stroke,
            strokeWidth: width,
            strokeDasharray: checking ? '12 8' : 'none',
            strokeLinecap: 'round',
            transition: `stroke ${TRANSITION}, stroke-width ${TRANSITION}`,
          }}
        />
        {directed && <Arrowhead from={a} to={b} r={size.r} colour={stroke} />}
        {/* A wide invisible line makes the edge easy to tap. */}
        {interactive && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} style={{ stroke: 'transparent', strokeWidth: 30 }} />}
        <g style={{ opacity: reveal >= 3 ? 1 : 0, transition: `opacity ${TRANSITION}` }}>
          <rect
            x={mid.x - size.pillW / 2}
            y={mid.y - size.pillH / 2}
            width={size.pillW}
            height={size.pillH}
            rx={size.pillH / 2}
            style={{ fill: '#FFFFFF', stroke: hot ? COLOURS.orange : COLOURS.pill, strokeWidth: hot ? 2.5 : 1.5 }}
          />
          <SvgText x={mid.x} y={mid.y} size={size.weightFont} fill={COLOURS.ink}>
            {edge.weight}
          </SvgText>
        </g>
      </g>
    )
  })

  const vertices = graph.vertices.map((v) => {
    const p = pos[v]
    const state = states[v] ?? 'unvisited'
    const filled = state === 'visited'
    const distance = distances?.[v]
    const vertexName = vertexLabel(v, state, distance)
    const canSelect = onVertex !== undefined && (selectable === undefined || selectable.includes(v))
    const select = () => onVertex?.(v)
    const badge = badges[v] ?? (filled ? 'tick' : null)

    return (
      <g
        key={v}
        style={{ cursor: canSelect ? 'pointer' : undefined }}
        {...(canSelect && {
          role: 'button',
          tabIndex: 0,
          'aria-label': vertexName,
          'aria-pressed': state === 'selected',
          onClick: select,
          onKeyDown: (e: KeyboardEvent) => activateOnKey(e, select),
        })}
      >
        {!canSelect && <title>{vertexName}</title>}
        {/* A bigger invisible circle makes the vertex easy to tap (at least 44px). */}
        {canSelect && <circle cx={p.x} cy={p.y} r={size.r + 14} style={{ fill: 'transparent' }} />}
        {state === 'selected' && (
          <circle cx={p.x} cy={p.y} r={size.r + 7} style={{ fill: 'none', stroke: COLOURS.blueDark, strokeWidth: 2.5, strokeDasharray: '6 4' }} />
        )}
        <circle
          cx={p.x}
          cy={p.y}
          r={size.r}
          data-state={state}
          style={{
            fill: filled ? COLOURS.blue : state === 'selected' ? COLOURS.tint : state === 'candidate' || state === 'checking' ? COLOURS.hintTint : '#FFFFFF',
            stroke:
              state === 'current'
                ? COLOURS.orange
                : filled
                  ? COLOURS.blue
                  : state === 'checking'
                    ? COLOURS.hintDark
                    : state === 'candidate'
                      ? COLOURS.hint
                      : state === 'selected'
                        ? COLOURS.blueDark
                        : COLOURS.grey,
            strokeWidth: state === 'current' ? 4 : state === 'checking' ? 3.5 : 2,
            strokeDasharray: state === 'candidate' ? '5 3' : 'none',
            transition: `fill ${TRANSITION}, stroke ${TRANSITION}`,
          }}
        />
        <SvgText x={p.x} y={p.y} size={size.vertexFont} fill={filled ? '#FFFFFF' : COLOURS.ink}>
          {v}
        </SvgText>
        {badge && <Badge x={p.x + size.r * 0.78} y={p.y + size.r * 0.78} r={isNarrow ? 10 : 9} kind={badge} />}
        {v === start && <StartTag x={p.x} y={p.y + size.r + 18} />}
        {distance !== undefined && (
          <DistanceLabel x={p.x} y={p.y - size.labelY} distance={distance} changed={v === changed} size={size} />
        )}
      </g>
    )
  })

  return (
    <svg
      viewBox={layout.viewBox}
      role="group"
      aria-label={label}
      style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible', fontFamily: FONT }}
    >
      {description && <desc>{description}</desc>}
      {edges}
      <g style={{ opacity: reveal >= 1 ? 1 : 0, transition: `opacity ${TRANSITION}` }}>{vertices}</g>
    </svg>
  )
}

function SvgText({ x, y, size, fill, children }: { x: number; y: number; size: number; fill: string; children: ReactNode }) {
  return (
    <text
      x={x}
      y={y + 1}
      textAnchor="middle"
      dominantBaseline="central"
      aria-hidden="true"
      style={{ fill, fontSize: size, fontWeight: 700, fontVariantNumeric: 'tabular-nums', transition: `fill ${TRANSITION}` }}
    >
      {children}
    </text>
  )
}

/** A small circle on the vertex: a tick for visited, or a right/wrong mark after an answer. */
function Badge({ x, y, r, kind }: { x: number; y: number; r: number; kind: 'tick' | VertexBadge }) {
  const colour = kind === 'wrong' ? COLOURS.badIcon : kind === 'right' ? COLOURS.good : COLOURS.blue
  const q = r * 0.45
  const d =
    kind === 'wrong'
      ? `M${x - q} ${y - q}L${x + q} ${y + q}M${x + q} ${y - q}L${x - q} ${y + q}`
      : `M${x - q * 1.1} ${y}l${q * 0.8} ${q * 0.9}l${q * 1.5}-${q * 1.8}`
  return (
    <g aria-hidden="true" data-badge={kind}>
      <circle cx={x} cy={y} r={r} style={{ fill: kind === 'tick' ? '#FFFFFF' : colour, stroke: colour, strokeWidth: 2 }} />
      <path d={d} style={{ fill: 'none', stroke: kind === 'tick' ? COLOURS.blue : '#FFFFFF', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' }} />
    </g>
  )
}

function StartTag({ x, y }: { x: number; y: number }) {
  return (
    <g aria-hidden="true">
      <rect x={x - 26} y={y - 11} width={52} height={22} rx={11} style={{ fill: COLOURS.ink }} />
      <SvgText x={x} y={y} size={13} fill="#FFFFFF">
        Start
      </SvgText>
    </g>
  )
}

function DistanceLabel(props: { x: number; y: number; distance: number; changed: boolean; size: (typeof SIZES)['wide'] }) {
  const { x, y, distance, changed, size } = props
  return (
    <g aria-hidden="true">
      <rect
        x={x - size.labelW / 2}
        y={y - size.labelH / 2}
        width={size.labelW}
        height={size.labelH}
        rx={size.labelH / 2}
        style={{
          fill: changed ? COLOURS.orangeTint : COLOURS.bg,
          stroke: changed ? COLOURS.orange : COLOURS.divider,
          strokeWidth: changed ? 2 : 1,
          transition: `fill ${TRANSITION}, stroke ${TRANSITION}`,
        }}
      />
      <SvgText x={x} y={y} size={size.labelFont} fill={COLOURS.ink}>
        d = {formatDistance(distance)}
      </SvgText>
    </g>
  )
}

/** The arrowhead at the end of a directed edge, stopping just short of the vertex. */
function Arrowhead({ from, to, r, colour }: { from: { x: number; y: number }; to: { x: number; y: number }; r: number; colour: string }) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy)
  const ux = dx / length
  const uy = dy / length
  const tip = { x: to.x - ux * (r + 4), y: to.y - uy * (r + 4) }
  const base = { x: tip.x - ux * 16, y: tip.y - uy * 16 }
  const points = `${tip.x},${tip.y} ${base.x - uy * 8},${base.y + ux * 8} ${base.x + uy * 8},${base.y - ux * 8}`
  return <polygon points={points} style={{ fill: colour }} />
}
