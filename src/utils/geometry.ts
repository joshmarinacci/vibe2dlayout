import type { BoundingBox, Point, Anchor } from '@model/transform'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** Get anchor point on a bounding box */
export function anchorPoint(box: BoundingBox, anchor: Anchor): Point {
  const { x, y, width, height } = box
  const cx = x + width / 2
  const cy = y + height / 2

  switch (anchor) {
    case 'top-left':      return { x, y }
    case 'top-center':    return { x: cx, y }
    case 'top-right':     return { x: x + width, y }
    case 'middle-left':   return { x, y: cy }
    case 'middle-center': return { x: cx, y: cy }
    case 'middle-right':  return { x: x + width, y: cy }
    case 'bottom-left':   return { x, y: y + height }
    case 'bottom-center': return { x: cx, y: y + height }
    case 'bottom-right':  return { x: x + width, y: y + height }
  }
}

/** Check if a point is inside a (non-rotated) bounding box */
export function pointInBox(pt: Point, box: BoundingBox): boolean {
  return (
    pt.x >= box.x &&
    pt.x <= box.x + box.width &&
    pt.y >= box.y &&
    pt.y <= box.y + box.height
  )
}

/** Check if a point is within `tolerance` pixels of a line segment */
export function pointNearLine(pt: Point, p1: Point, p2: Point, tolerance = 8): boolean {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const len2 = dx * dx + dy * dy
  if (len2 === 0) {
    const ex = pt.x - p1.x
    const ey = pt.y - p1.y
    return Math.sqrt(ex * ex + ey * ey) <= tolerance
  }
  const t = Math.max(0, Math.min(1, ((pt.x - p1.x) * dx + (pt.y - p1.y) * dy) / len2))
  const projX = p1.x + t * dx
  const projY = p1.y + t * dy
  const distX = pt.x - projX
  const distY = pt.y - projY
  return Math.sqrt(distX * distX + distY * distY) <= tolerance
}

/** Union of two bounding boxes */
export function unionBoxes(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  const x2 = Math.max(a.x + a.width, b.x + b.width)
  const y2 = Math.max(a.y + a.height, b.y + b.height)
  return { x, y, width: x2 - x, height: y2 - y }
}

/** Compute bounding rect of a set of points */
export function pointsBBox(points: Point[]): Rect {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 }
  let minX = points[0].x, minY = points[0].y
  let maxX = points[0].x, maxY = points[0].y
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/** Rotate a point around an origin */
export function rotatePoint(pt: Point, origin: Point, angleDeg: number): Point {
  const rad = (angleDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = pt.x - origin.x
  const dy = pt.y - origin.y
  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  }
}

/** Distance between two points */
export function distance(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
}
