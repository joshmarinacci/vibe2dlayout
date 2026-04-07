import type { ConnectorEndpoint, ConnectorRoute } from '@model/connector'
import type { Shape } from '@model/shapes'
import type { Point } from '@model/transform'
import { anchorPoint } from './geometry'

/** Resolve a ConnectorEndpoint to a world-space Point */
export function resolveEndpoint(
  endpoint: ConnectorEndpoint,
  shapes: Record<string, Shape>,
): Point {
  if (endpoint.kind === 'free') {
    return endpoint.point
  }
  const shape = shapes[endpoint.shapeId]
  if (!shape || shape.type === 'line') {
    return { x: 0, y: 0 }
  }
  return anchorPoint(shape.transform, endpoint.anchor)
}

/** Build the SVG path data for a connector route */
export function buildConnectorPath(
  start: Point,
  end: Point,
  route: ConnectorRoute,
): string {
  switch (route.mode) {
    case 'straight':
      return `M ${start.x} ${start.y} L ${end.x} ${end.y}`

    case 'orthogonal':
      return buildOrthogonalPath(start, end, route.waypoints)

    case 'curved':
      return buildCurvedPath(start, end, route.waypoints)

    default:
      return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
  }
}

function buildOrthogonalPath(start: Point, end: Point, waypoints: Point[]): string {
  const points = [start, ...waypoints, end]
  if (points.length === 2) {
    const midX = (start.x + end.x) / 2
    return `M ${start.x} ${start.y} H ${midX} V ${end.y} H ${end.x}`
  }
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`
  }
  return d
}

function buildCurvedPath(start: Point, end: Point, waypoints: Point[]): string {
  if (waypoints.length === 0) {
    const dx = end.x - start.x
    const cp1x = start.x + dx * 0.4
    const cp2x = end.x - dx * 0.4
    return `M ${start.x} ${start.y} C ${cp1x} ${start.y}, ${cp2x} ${end.y}, ${end.x} ${end.y}`
  }
  let d = `M ${start.x} ${start.y}`
  const all = [start, ...waypoints, end]
  for (let i = 1; i < all.length; i++) {
    d += ` L ${all[i].x} ${all[i].y}`
  }
  return d
}

/** Arrow marker path for SVG <marker> defs */
export function arrowMarkerPath(type: 'arrow' | 'circle' | 'diamond'): string {
  switch (type) {
    case 'arrow':   return 'M 0 0 L 10 5 L 0 10 z'
    case 'circle':  return 'M 5 5 m -4 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0'
    case 'diamond': return 'M 5 0 L 10 5 L 5 10 L 0 5 z'
  }
}
