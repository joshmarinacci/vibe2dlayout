import type { Shape } from '@model/shapes'
import type { BoundingBox } from '@model/transform'
import type { TreeNode } from '@model/document'
import type { AlignType } from '@store/types'
import { buildParentMap, getAbsoluteTransform, getParentContentOrigin } from './geometry'

export interface AlignUpdate {
  id: string
  transform: BoundingBox
}

/**
 * Compute new local transforms for a set of shapes after applying an alignment.
 * Skips line and page shapes. Uses the first eligible shape as the size reference
 * for match-width and match-height.
 */
export function computeAlignedTransforms(
  ids: string[],
  shapes: Record<string, Shape>,
  rootNodes: TreeNode[],
  alignment: AlignType,
): AlignUpdate[] {
  const parentMap = buildParentMap(rootNodes)

  // Collect absolute transforms for all eligible shapes
  const eligible: Array<{ id: string; abs: BoundingBox; shape: Extract<Shape, { transform: BoundingBox }> }> = []
  for (const id of ids) {
    const shape = shapes[id]
    if (!shape || shape.type === 'line' || shape.type === 'page') continue
    const abs = getAbsoluteTransform(id, shapes, parentMap)
    if (!abs) continue
    eligible.push({ id, abs, shape: shape as Extract<Shape, { transform: BoundingBox }> })
  }

  if (eligible.length === 0) return []

  const updates: AlignUpdate[] = []

  // Compute target values
  const minX = Math.min(...eligible.map(e => e.abs.x))
  const maxX = Math.max(...eligible.map(e => e.abs.x + e.abs.width))
  const centerX = (minX + maxX) / 2

  const minY = Math.min(...eligible.map(e => e.abs.y))
  const maxY = Math.max(...eligible.map(e => e.abs.y + e.abs.height))
  const centerY = (minY + maxY) / 2

  const refWidth = eligible[0].abs.width
  const refHeight = eligible[0].abs.height

  for (const { id, abs, shape } of eligible) {
    const origin = getParentContentOrigin(id, shapes, parentMap)
    let newAbsX = abs.x
    let newAbsY = abs.y
    let newWidth = shape.transform.width
    let newHeight = shape.transform.height

    switch (alignment) {
      case 'left':        newAbsX = minX; break
      case 'center-h':    newAbsX = centerX - abs.width / 2; break
      case 'right':       newAbsX = maxX - abs.width; break
      case 'top':         newAbsY = minY; break
      case 'middle-v':    newAbsY = centerY - abs.height / 2; break
      case 'bottom':      newAbsY = maxY - abs.height; break
      case 'match-width':  newWidth = refWidth; break
      case 'match-height': newHeight = refHeight; break
    }

    updates.push({
      id,
      transform: {
        ...shape.transform,
        x: newAbsX - origin.x,
        y: newAbsY - origin.y,
        width: newWidth,
        height: newHeight,
      },
    })
  }

  return updates
}
