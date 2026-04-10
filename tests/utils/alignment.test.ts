import { describe, it, expect } from 'vitest'
import { computeAlignedTransforms } from '../../src/utils/alignment'
import type { Shape } from '../../src/model/shapes'
import type { TreeNode } from '../../src/model/document'

function makeRect(id: string, x: number, y: number, w: number, h: number): Shape {
  return {
    id,
    name: id,
    type: 'rect',
    locked: false,
    visible: true,
    transform: { x, y, width: w, height: h, rotation: 0 },
    fill: { color: '#ff0000', opacity: 1 },
    stroke: { color: '#000000', width: 1, opacity: 1, dash: [] },
    cornerRadius: 0,
    clipChildren: false,
  }
}

function makeTree(ids: string[]): TreeNode[] {
  return ids.map(id => ({ id, children: [] }))
}

describe('computeAlignedTransforms', () => {
  const a = makeRect('a', 10, 20, 50, 40)
  const b = makeRect('b', 80, 60, 70, 30)
  const c = makeRect('c', 40, 100, 60, 50)
  const shapes: Record<string, Shape> = { a, b, c }
  const rootNodes = makeTree(['a', 'b', 'c'])
  const ids = ['a', 'b', 'c']

  it('align left: all shapes get minimum x', () => {
    const updates = computeAlignedTransforms(ids, shapes, rootNodes, 'left')
    const minX = 10
    for (const u of updates) {
      expect(u.transform.x).toBe(minX)
    }
  })

  it('align right: all shapes right edges match maximum', () => {
    const updates = computeAlignedTransforms(ids, shapes, rootNodes, 'right')
    const maxX = 80 + 70  // 150
    for (const u of updates) {
      const shape = shapes[u.id] as Extract<Shape, { transform: { width: number } }>
      expect(u.transform.x + shape.transform.width).toBe(maxX)
    }
  })

  it('align center-h: all shapes are horizontally centered', () => {
    const updates = computeAlignedTransforms(ids, shapes, rootNodes, 'center-h')
    const minX = 10, maxX = 150
    const centerX = (minX + maxX) / 2
    for (const u of updates) {
      const shape = shapes[u.id] as Extract<Shape, { transform: { width: number } }>
      const shapeCenter = u.transform.x + shape.transform.width / 2
      expect(shapeCenter).toBeCloseTo(centerX)
    }
  })

  it('align top: all shapes get minimum y', () => {
    const updates = computeAlignedTransforms(ids, shapes, rootNodes, 'top')
    const minY = 20
    for (const u of updates) {
      expect(u.transform.y).toBe(minY)
    }
  })

  it('align bottom: all shapes bottom edges match maximum', () => {
    const updates = computeAlignedTransforms(ids, shapes, rootNodes, 'bottom')
    const maxY = 100 + 50  // 150
    for (const u of updates) {
      const shape = shapes[u.id] as Extract<Shape, { transform: { height: number } }>
      expect(u.transform.y + shape.transform.height).toBe(maxY)
    }
  })

  it('align middle-v: all shapes are vertically centered', () => {
    const updates = computeAlignedTransforms(ids, shapes, rootNodes, 'middle-v')
    const minY = 20, maxY = 150
    const centerY = (minY + maxY) / 2
    for (const u of updates) {
      const shape = shapes[u.id] as Extract<Shape, { transform: { height: number } }>
      const shapeCenter = u.transform.y + shape.transform.height / 2
      expect(shapeCenter).toBeCloseTo(centerY)
    }
  })

  it('match-width: all shapes get width of first eligible shape', () => {
    const updates = computeAlignedTransforms(ids, shapes, rootNodes, 'match-width')
    const refWidth = (shapes['a'] as Extract<Shape, { transform: { width: number } }>).transform.width
    for (const u of updates) {
      expect(u.transform.width).toBe(refWidth)
    }
  })

  it('match-height: all shapes get height of first eligible shape', () => {
    const updates = computeAlignedTransforms(ids, shapes, rootNodes, 'match-height')
    const refHeight = (shapes['a'] as Extract<Shape, { transform: { height: number } }>).transform.height
    for (const u of updates) {
      expect(u.transform.height).toBe(refHeight)
    }
  })

  it('skips line shapes', () => {
    const line: Shape = {
      id: 'line1',
      name: 'line1',
      type: 'line',
      locked: false,
      visible: true,
      start: { kind: 'free', point: { x: 0, y: 0 } },
      end: { kind: 'free', point: { x: 100, y: 100 } },
      route: { mode: 'straight', waypoints: [] },
      stroke: { color: '#000', width: 1, opacity: 1, dash: [] },
      startArrow: 'none',
      endArrow: 'arrow',
    }
    const shapesWithLine: Record<string, Shape> = { a, b, line1: line }
    const rootsWithLine = makeTree(['a', 'b', 'line1'])
    const updates = computeAlignedTransforms(['a', 'b', 'line1'], shapesWithLine, rootsWithLine, 'left')
    const lineUpdate = updates.find(u => u.id === 'line1')
    expect(lineUpdate).toBeUndefined()
    expect(updates).toHaveLength(2)
  })

  it('returns empty array for empty ids', () => {
    const updates = computeAlignedTransforms([], shapes, rootNodes, 'left')
    expect(updates).toHaveLength(0)
  })
})
