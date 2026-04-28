import type { BoundingBox, Point, Anchor } from '@model/transform'
import type { Shape } from '@model/shapes'
import type { TreeNode } from '@model/document'

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

/** Build a flat map of childId → parentId from the document tree. Top-level shapes have no entry. */
export function buildParentMap(nodes: TreeNode[]): Record<string, string> {
  const map: Record<string, string> = {}
  function walk(ns: TreeNode[], parentId: string | null) {
    for (const n of ns) {
      if (parentId !== null) map[n.id] = parentId
      walk(n.children, n.id)
    }
  }
  walk(nodes, null)
  return map
}

/**
 * Returns the canvas-space origin of the content area of the given shape (as a parent).
 * Use this to convert a canvas-space position into local coordinates for a new child.
 * Returns (0, 0) for null (top-level/page).
 */
export function getContentOrigin(
  parentId: string | null,
  shapes: Record<string, Shape>,
  parentMap: Record<string, string>,
): { x: number; y: number } {
  if (!parentId) return { x: 0, y: 0 }
  const parent = shapes[parentId]
  if (!parent || parent.type === 'page') return { x: 0, y: 0 }
  const abs = getAbsoluteTransform(parentId, shapes, parentMap)
  if (!abs) return { x: 0, y: 0 }
  let contentOffsetY = 0
  if (parent.type === 'panel' && parent.title) {
    contentOffsetY = parent.title.fontSize + 12
  } else if (parent.type === 'tabbed-panel') {
    contentOffsetY = parent.tabs.fontSize + 16
  } else if (parent.type === 'dialog') {
    contentOffsetY = parent.titleFontSize + 12
  }
  return { x: abs.x, y: abs.y + contentOffsetY }
}

/**
 * Returns the canvas-space origin of the parent's content area for a shape.
 * Subtract this from a canvas-space position to get the shape's local coordinate.
 * Returns (0, 0) for top-level shapes.
 */
export function getParentContentOrigin(
  shapeId: string,
  shapes: Record<string, Shape>,
  parentMap: Record<string, string>,
): { x: number; y: number } {
  const parentId = parentMap[shapeId]
  if (!parentId) return { x: 0, y: 0 }

  const parent = shapes[parentId]
  // Pages don't offset their children — shapes use absolute canvas coordinates
  if (parent?.type === 'page') return { x: 0, y: 0 }

  const parentAbs = getAbsoluteTransform(parentId, shapes, parentMap)
  if (!parentAbs) return { x: 0, y: 0 }

  let contentOffsetY = 0
  if (parent?.type === 'panel' && parent.title) {
    contentOffsetY = parent.title.fontSize + 12
  } else if (parent?.type === 'tabbed-panel') {
    contentOffsetY = parent.tabs.fontSize + 16
  } else if (parent?.type === 'dialog') {
    contentOffsetY = parent.titleFontSize + 12
  }

  return { x: parentAbs.x, y: parentAbs.y + contentOffsetY }
}

/**
 * Compute the canvas-space (absolute) bounding box of a shape by walking up
 * the parent chain and accumulating offsets. Panel shapes add a title-bar
 * offset to their children's Y coordinate.
 */
export function getAbsoluteTransform(
  shapeId: string,
  shapes: Record<string, Shape>,
  parentMap: Record<string, string>,
): BoundingBox | null {
  const shape = shapes[shapeId]
  if (!shape || shape.type === 'line') return null

  const parentId = parentMap[shapeId]
  if (!parentId) return { ...shape.transform }

  const parent = shapes[parentId]
  // Pages don't offset their children — shapes use absolute canvas coordinates
  if (parent?.type === 'page') return { ...shape.transform }

  const parentAbs = getAbsoluteTransform(parentId, shapes, parentMap)
  if (!parentAbs) return { ...shape.transform }

  let contentOffsetY = 0
  if (parent?.type === 'panel' && parent.title) {
    contentOffsetY = parent.title.fontSize + 12
  } else if (parent?.type === 'tabbed-panel') {
    contentOffsetY = parent.tabs.fontSize + 16
  } else if (parent?.type === 'dialog') {
    contentOffsetY = parent.titleFontSize + 12
  }

  return {
    ...shape.transform,
    x: parentAbs.x + shape.transform.x,
    y: parentAbs.y + contentOffsetY + shape.transform.y,
  }
}
