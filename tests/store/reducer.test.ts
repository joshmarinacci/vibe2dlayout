import { describe, it, expect } from 'vitest'
import { appReducer, initialState } from '../../src/store/reducer'
import { createShape } from '../../src/utils/shapeFactory'
import type { AppState } from '../../src/store/types'

function stateWithShape(): { state: AppState; shapeId: string; pageId: string } {
  const pageId = initialState.document.rootNodes[0].id
  const shape = createShape('rect', 100, 100)
  const state = appReducer(initialState, {
    type: 'ADD_SHAPE',
    parentId: pageId,
    shape,
  })
  return { state, shapeId: shape.id, pageId }
}

describe('ADD_SHAPE', () => {
  it('adds shape to document', () => {
    const { state, shapeId } = stateWithShape()
    expect(state.document.shapes[shapeId]).toBeDefined()
  })
  it('adds shape as child of page', () => {
    const { state, shapeId, pageId } = stateWithShape()
    const page = state.document.rootNodes.find(n => n.id === pageId)
    expect(page?.children.some(c => c.id === shapeId)).toBe(true)
  })
})

describe('DELETE_SHAPES', () => {
  it('removes shape from document', () => {
    const { state, shapeId } = stateWithShape()
    const next = appReducer(state, { type: 'DELETE_SHAPES', ids: [shapeId] })
    expect(next.document.shapes[shapeId]).toBeUndefined()
  })
  it('removes shape from tree', () => {
    const { state, shapeId, pageId } = stateWithShape()
    const next = appReducer(state, { type: 'DELETE_SHAPES', ids: [shapeId] })
    const page = next.document.rootNodes.find(n => n.id === pageId)
    expect(page?.children.some(c => c.id === shapeId)).toBe(false)
  })
})

describe('MOVE_SHAPES', () => {
  it('moves shape by delta', () => {
    const { state, shapeId } = stateWithShape()
    const next = appReducer(state, { type: 'MOVE_SHAPES', ids: [shapeId], dx: 20, dy: -10 })
    const shape = next.document.shapes[shapeId]
    expect(shape?.type !== 'line' && shape?.transform.x).toBe(120)
    expect(shape?.type !== 'line' && shape?.transform.y).toBe(90)
  })
})

describe('SET_TRANSFORM', () => {
  it('sets transform on shape', () => {
    const { state, shapeId } = stateWithShape()
    const transform = { x: 50, y: 60, width: 200, height: 150, rotation: 45 }
    const next = appReducer(state, { type: 'SET_TRANSFORM', id: shapeId, transform })
    const shape = next.document.shapes[shapeId]
    expect(shape?.type !== 'line' && shape?.transform).toEqual(transform)
  })
})

describe('SELECT_SHAPES', () => {
  it('selects shapes exclusively by default', () => {
    const { state, shapeId } = stateWithShape()
    const next = appReducer(state, { type: 'SELECT_SHAPES', ids: [shapeId], additive: false })
    expect(next.selection.ids).toEqual([shapeId])
  })
  it('adds shapes when additive', () => {
    const { state, shapeId } = stateWithShape()
    const shape2 = createShape('circle', 200, 200)
    const s2 = appReducer(state, { type: 'ADD_SHAPE', parentId: initialState.document.rootNodes[0].id, shape: shape2 })
    const s3 = appReducer(s2, { type: 'SELECT_SHAPES', ids: [shapeId], additive: false })
    const s4 = appReducer(s3, { type: 'SELECT_SHAPES', ids: [shape2.id], additive: true })
    expect(s4.selection.ids).toContain(shapeId)
    expect(s4.selection.ids).toContain(shape2.id)
  })
})

describe('DESELECT_ALL', () => {
  it('clears selection', () => {
    const { state, shapeId } = stateWithShape()
    const s2 = appReducer(state, { type: 'SELECT_SHAPES', ids: [shapeId], additive: false })
    const s3 = appReducer(s2, { type: 'DESELECT_ALL' })
    expect(s3.selection.ids).toHaveLength(0)
  })
})

describe('PATCH_SHAPE', () => {
  it('patches shape properties', () => {
    const { state, shapeId } = stateWithShape()
    const next = appReducer(state, { type: 'PATCH_SHAPE', id: shapeId, patch: { name: 'MyRect' } })
    expect(next.document.shapes[shapeId]?.name).toBe('MyRect')
  })
})

describe('SET_TOOL_MODE', () => {
  it('changes tool mode', () => {
    const next = appReducer(initialState, { type: 'SET_TOOL_MODE', mode: 'insert-rect' })
    expect(next.toolMode).toBe('insert-rect')
  })
})

describe('PAN_BY', () => {
  it('pans the view', () => {
    const next = appReducer(initialState, { type: 'PAN_BY', dx: 100, dy: 50 })
    expect(next.viewTransform.panX).toBe(100)
    expect(next.viewTransform.panY).toBe(50)
  })
})

describe('ZOOM_TO', () => {
  it('zooms toward origin', () => {
    const next = appReducer(initialState, { type: 'ZOOM_TO', zoom: 2, origin: { x: 0, y: 0 } })
    expect(next.viewTransform.zoom).toBe(2)
  })
})

describe('COMMIT_TEXT_EDIT', () => {
  it('updates text shape content', () => {
    const pageId = initialState.document.rootNodes[0].id
    const shape = createShape('text', 100, 100)
    const s2 = appReducer(initialState, { type: 'ADD_SHAPE', parentId: pageId, shape })
    const s3 = appReducer(s2, { type: 'COMMIT_TEXT_EDIT', id: shape.id, content: 'Hello world' })
    const updated = s3.document.shapes[shape.id]
    expect(updated?.type === 'text' && updated.text.content).toBe('Hello world')
  })
})
