import type { AppState } from './types'
import type { Shape } from '@model/shapes'
import type { TreeNode } from '@model/document'
import { getAllIds } from '@model/document'

export function selectShape(state: AppState, id: string): Shape | undefined {
  return state.document.shapes[id]
}

export function selectSelectedShapes(state: AppState): Shape[] {
  return state.selection.ids
    .map(id => state.document.shapes[id])
    .filter((s): s is Shape => s !== undefined)
}

export function selectActivePageNode(state: AppState): TreeNode | undefined {
  if (!state.activePageId) return undefined
  return state.document.rootNodes.find(n => n.id === state.activePageId)
}

export function selectConnectedLines(state: AppState, shapeId: string): string[] {
  const lines: string[] = []
  for (const [id, shape] of Object.entries(state.document.shapes)) {
    if (shape.type !== 'line') continue
    if (
      (shape.start.kind === 'attached' && shape.start.shapeId === shapeId) ||
      (shape.end.kind === 'attached' && shape.end.shapeId === shapeId)
    ) {
      lines.push(id)
    }
  }
  return lines
}

export function selectAllShapeIds(state: AppState): string[] {
  return getAllIds(state.document.rootNodes)
}
