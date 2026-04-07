import { describe, it, expect } from 'vitest'
import { historyReducer, createInitialHistory, canUndo, canRedo } from '../../src/store/history'
import { initialState } from '../../src/store/reducer'
import { createShape } from '../../src/utils/shapeFactory'

function makeHistory() {
  return createInitialHistory(initialState)
}

describe('undo/redo', () => {
  it('starts with no undo/redo', () => {
    const h = makeHistory()
    expect(canUndo(h)).toBe(false)
    expect(canRedo(h)).toBe(false)
  })

  it('document action creates undo entry', () => {
    const h = makeHistory()
    const shape = createShape('rect')
    const h2 = historyReducer(h, {
      type: 'ADD_SHAPE',
      parentId: initialState.document.rootNodes[0].id,
      shape,
    })
    expect(canUndo(h2)).toBe(true)
    expect(h2.present.document.shapes[shape.id]).toBeDefined()
  })

  it('undo removes the shape', () => {
    const h = makeHistory()
    const shape = createShape('rect')
    const h2 = historyReducer(h, {
      type: 'ADD_SHAPE',
      parentId: initialState.document.rootNodes[0].id,
      shape,
    })
    const h3 = historyReducer(h2, { type: 'UNDO' })
    expect(h3.present.document.shapes[shape.id]).toBeUndefined()
    expect(canUndo(h3)).toBe(false)
    expect(canRedo(h3)).toBe(true)
  })

  it('redo restores the shape', () => {
    const h = makeHistory()
    const shape = createShape('rect')
    const h2 = historyReducer(h, {
      type: 'ADD_SHAPE',
      parentId: initialState.document.rootNodes[0].id,
      shape,
    })
    const h3 = historyReducer(h2, { type: 'UNDO' })
    const h4 = historyReducer(h3, { type: 'REDO' })
    expect(h4.present.document.shapes[shape.id]).toBeDefined()
    expect(canUndo(h4)).toBe(true)
    expect(canRedo(h4)).toBe(false)
  })

  it('new action clears redo history', () => {
    const h = makeHistory()
    const shape1 = createShape('rect')
    const shape2 = createShape('circle')
    const pageId = initialState.document.rootNodes[0].id

    const h2 = historyReducer(h, { type: 'ADD_SHAPE', parentId: pageId, shape: shape1 })
    const h3 = historyReducer(h2, { type: 'UNDO' })
    expect(canRedo(h3)).toBe(true)

    const h4 = historyReducer(h3, { type: 'ADD_SHAPE', parentId: pageId, shape: shape2 })
    expect(canRedo(h4)).toBe(false)
  })

  it('selection actions do not create undo entries', () => {
    const h = makeHistory()
    const h2 = historyReducer(h, { type: 'SELECT_SHAPES', ids: ['x'], additive: false })
    expect(canUndo(h2)).toBe(false)
  })

  it('view actions do not create undo entries', () => {
    const h = makeHistory()
    const h2 = historyReducer(h, { type: 'SET_TOOL_MODE', mode: 'insert-rect' })
    expect(canUndo(h2)).toBe(false)
  })

  it('load document resets history', () => {
    const h = makeHistory()
    const shape = createShape('rect')
    const h2 = historyReducer(h, {
      type: 'ADD_SHAPE',
      parentId: initialState.document.rootNodes[0].id,
      shape,
    })
    expect(canUndo(h2)).toBe(true)

    const h3 = historyReducer(h2, { type: 'LOAD_DOCUMENT', document: initialState.document })
    expect(canUndo(h3)).toBe(false)
  })
})
