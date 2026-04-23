import type { BoundingBox } from '@model/transform'
import type { Shape } from '@model/shapes'
import type { TreeNode } from '@model/document'

/**
 * Transform a point (px, py) — relative to shape center — through the CSS
 * transform stack matching buildCSSTransform's output order:
 *   rotate(θ) scaleX(sx) scaleY(sy) skewX(kx) skewY(ky)
 * CSS applies listed transforms left-to-right to the coordinate system, which
 * means points are transformed right-to-left: skewY → skewX → scaleY → scaleX → rotate.
 */
export function applyTransform(px: number, py: number, t: BoundingBox): [number, number] {
  const kx = ((t.skewX ?? 0) * Math.PI) / 180
  const ky = ((t.skewY ?? 0) * Math.PI) / 180
  const sx = t.scaleX ?? 1
  const sy = t.scaleY ?? 1
  const θ  = (t.rotation * Math.PI) / 180

  // skewY: (x, y) → (x, y + x·tan(ky))
  py = py + px * Math.tan(ky)
  // skewX: (x, y) → (x + y·tan(kx), y)
  px = px + py * Math.tan(kx)
  // scaleY
  py = py * sy
  // scaleX
  px = px * sx
  // rotate
  const cos = Math.cos(θ), sin = Math.sin(θ)
  return [px * cos - py * sin, px * sin + py * cos]
}

/**
 * Return the four corners of a shape in parent-local coordinates, fully
 * accounting for rotation, scale and skew.
 */
export function shapeCorners(t: BoundingBox): [number, number][] {
  const cx = t.x + t.width  / 2
  const cy = t.y + t.height / 2
  const hw = t.width  / 2
  const hh = t.height / 2
  return ([ [-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh] ] as [number, number][])
    .map(([px, py]) => {
      const [rx, ry] = applyTransform(px, py, t)
      return [cx + rx, cy + ry] as [number, number]
    })
}

/**
 * Compute the axis-aligned visual bounding box of a set of tree nodes,
 * accounting for each shape's transforms. Does not recurse into children
 * (containers are responsible for their own overflow).
 */
export function computeVisualBounds(nodes: TreeNode[], shapes: Record<string, Shape>) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const node of nodes) {
    const shape = shapes[node.id]
    if (!shape || shape.type === 'line') continue
    for (const [x, y] of shapeCorners(shape.transform as BoundingBox)) {
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }
  if (!isFinite(minX)) return { x: 0, y: 0, width: 0, height: 0 }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}
