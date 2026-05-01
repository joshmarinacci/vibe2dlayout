import { describe, it, expect } from 'vitest'
import { appReducer, initialState } from '../../src/store/reducer'
import { historyReducer, createInitialHistory } from '../../src/store/history'
import { createShape } from '../../src/utils/shapeFactory'

function addShape(type: Parameters<typeof createShape>[0]) {
  const pageId = initialState.document.rootNodes[0].id
  const shape = createShape(type)
  const state = appReducer(initialState, { type: 'ADD_SHAPE', parentId: pageId, shape })
  return { state, shape, pageId }
}

describe('START_TEXT_EDIT / STOP_TEXT_EDIT', () => {
  it('sets editingTextId on START_TEXT_EDIT', () => {
    const { state, shape } = addShape('text')
    const next = appReducer(state, { type: 'START_TEXT_EDIT', id: shape.id })
    expect(next.selection.editingTextId).toBe(shape.id)
  })

  it('clears editingTextId on STOP_TEXT_EDIT', () => {
    const { state, shape } = addShape('text')
    const s2 = appReducer(state, { type: 'START_TEXT_EDIT', id: shape.id })
    const s3 = appReducer(s2, { type: 'STOP_TEXT_EDIT' })
    expect(s3.selection.editingTextId).toBeNull()
  })
})

describe('COMMIT_TEXT_EDIT updates content', () => {
  it('updates text shape content', () => {
    const { state, shape } = addShape('text')
    const s2 = appReducer(state, { type: 'COMMIT_TEXT_EDIT', id: shape.id, content: 'Hello' })
    const updated = s2.document.shapes[shape.id]
    expect(updated?.type === 'text' && updated.text.content).toBe('Hello')
  })

  it('updates button text content', () => {
    const { state, shape } = addShape('button')
    const s2 = appReducer(state, { type: 'COMMIT_TEXT_EDIT', id: shape.id, content: 'Click me' })
    const updated = s2.document.shapes[shape.id]
    expect(updated?.type === 'button' && updated.text.content).toBe('Click me')
  })

  it('updates panel title content', () => {
    const { state, shape } = addShape('panel')
    const s2 = appReducer(state, { type: 'COMMIT_TEXT_EDIT', id: shape.id, content: 'My Panel' })
    const updated = s2.document.shapes[shape.id]
    expect(updated?.type === 'panel' && updated.text?.content).toBe('My Panel')
  })

  it('does not affect shape type or other text properties', () => {
    const { state, shape } = addShape('text')
    const originalFontSize = shape.type === 'text' ? shape.text.fontSize : 0
    const s2 = appReducer(state, { type: 'COMMIT_TEXT_EDIT', id: shape.id, content: 'New content' })
    const updated = s2.document.shapes[shape.id]
    expect(updated?.type === 'text' && updated.text.fontSize).toBe(originalFontSize)
    expect(updated?.type).toBe('text')
  })

  it('no-ops for unknown shape id', () => {
    const s2 = appReducer(initialState, { type: 'COMMIT_TEXT_EDIT', id: 'nonexistent', content: 'x' })
    expect(s2.document).toBe(initialState.document)
  })

  it('is undoable via history', () => {
    const { state, shape } = addShape('text')
    const h = createInitialHistory(state)
    const h2 = historyReducer(h, { type: 'COMMIT_TEXT_EDIT', id: shape.id, content: 'Hello' })
    expect(h2.present.document.shapes[shape.id]?.type === 'text' &&
           (h2.present.document.shapes[shape.id] as { text: { content: string } }).text.content
    ).toBe('Hello')
    const h3 = historyReducer(h2, { type: 'UNDO' })
    const original = h3.present.document.shapes[shape.id]
    expect(original?.type === 'text' && original.text.content).toBe('Text') // default from factory
  })
})

describe('PATCH_SHAPE updates text style properties', () => {
  it('updates text color', () => {
    const { state, shape } = addShape('text')
    if (shape.type !== 'text') throw new Error()
    const newText = { ...shape.text, color: '#ff0000' }
    const s2 = appReducer(state, { type: 'PATCH_SHAPE', id: shape.id, patch: { text: newText } })
    const updated = s2.document.shapes[shape.id]
    expect(updated?.type === 'text' && updated.text.color).toBe('#ff0000')
  })

  it('updates font size without changing content', () => {
    const { state, shape } = addShape('text')
    if (shape.type !== 'text') throw new Error()
    const newText = { ...shape.text, fontSize: 24 }
    const s2 = appReducer(state, { type: 'PATCH_SHAPE', id: shape.id, patch: { text: newText } })
    const updated = s2.document.shapes[shape.id]
    expect(updated?.type === 'text' && updated.text.fontSize).toBe(24)
    expect(updated?.type === 'text' && updated.text.content).toBe(shape.text.content)
  })
})
