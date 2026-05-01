import { describe, it, expect } from 'vitest'
import { appReducer, initialState } from '../../src/store/reducer'
import { createShape } from '../../src/utils/shapeFactory'

function setup(type: Parameters<typeof createShape>[0]) {
  const pageId = initialState.document.rootNodes[0].id
  const shape = createShape(type)
  const state = appReducer(initialState, { type: 'ADD_SHAPE', parentId: pageId, shape })
  return { state, shape }
}

// These tests cover the store-level behaviour that the "commit on click-outside"
// fix depends on.  The component watches isEditing (derived from editingTextId)
// and dispatches COMMIT_TEXT_EDIT when isEditing transitions true → false.
// DESELECT_ALL is what causes that transition when the user clicks outside.

describe('text edit commit-on-deselect sequence', () => {
  it('DESELECT_ALL clears editingTextId, making isEditing false', () => {
    const { state, shape } = setup('text')
    const s2 = appReducer(state, { type: 'START_TEXT_EDIT', id: shape.id })
    expect(s2.selection.editingTextId).toBe(shape.id)

    const s3 = appReducer(s2, { type: 'DESELECT_ALL' })
    expect(s3.selection.editingTextId).toBeNull()
  })

  it('COMMIT_TEXT_EDIT dispatched after DESELECT_ALL still updates content', () => {
    const { state, shape } = setup('text')
    const s2 = appReducer(state, { type: 'START_TEXT_EDIT', id: shape.id })
    const s3 = appReducer(s2, { type: 'DESELECT_ALL' })
    // Component dispatches COMMIT_TEXT_EDIT in the isEditing → false effect
    const s4 = appReducer(s3, { type: 'COMMIT_TEXT_EDIT', id: shape.id, content: 'new value' })
    const updated = s4.document.shapes[shape.id]
    expect(updated?.type === 'text' && updated.text.content).toBe('new value')
  })

  it('cancel path: STOP_TEXT_EDIT without COMMIT leaves content unchanged (text)', () => {
    const { state, shape } = setup('text')
    const original = shape.type === 'text' ? shape.text.content : ''
    const s2 = appReducer(state, { type: 'START_TEXT_EDIT', id: shape.id })
    const s3 = appReducer(s2, { type: 'STOP_TEXT_EDIT' })
    const updated = s3.document.shapes[shape.id]
    expect(updated?.type === 'text' && updated.text.content).toBe(original)
    expect(s3.selection.editingTextId).toBeNull()
  })

  it('cancel path: STOP_TEXT_EDIT without COMMIT leaves content unchanged (button)', () => {
    const { state, shape } = setup('button')
    const original = shape.type === 'button' ? shape.text.content : ''
    const s2 = appReducer(state, { type: 'START_TEXT_EDIT', id: shape.id })
    const s3 = appReducer(s2, { type: 'STOP_TEXT_EDIT' })
    const updated = s3.document.shapes[shape.id]
    expect(updated?.type === 'button' && updated.text.content).toBe(original)
  })

  it('cancel path: STOP_TEXT_EDIT without COMMIT leaves content unchanged (panel)', () => {
    const { state, shape } = setup('panel')
    const original = shape.type === 'panel' ? shape.text?.content : ''
    const s2 = appReducer(state, { type: 'START_TEXT_EDIT', id: shape.id })
    const s3 = appReducer(s2, { type: 'STOP_TEXT_EDIT' })
    const updated = s3.document.shapes[shape.id]
    expect(updated?.type === 'panel' && updated.text?.content).toBe(original)
  })

  it('full commit sequence: start → edit → deselect → commit saves content', () => {
    const { state, shape } = setup('button')
    const s2 = appReducer(state, { type: 'START_TEXT_EDIT', id: shape.id })
    // user types; component tracks value in editValueRef
    // user clicks outside: DESELECT_ALL fires, then component effect dispatches COMMIT
    const s3 = appReducer(s2, { type: 'DESELECT_ALL' })
    const s4 = appReducer(s3, { type: 'COMMIT_TEXT_EDIT', id: shape.id, content: 'Submit' })
    const updated = s4.document.shapes[shape.id]
    expect(updated?.type === 'button' && updated.text.content).toBe('Submit')
    expect(s4.selection.editingTextId).toBeNull()
    expect(s4.selection.ids).toHaveLength(0)
  })

  it('full commit sequence works for panel title', () => {
    const { state, shape } = setup('panel')
    const s2 = appReducer(state, { type: 'START_TEXT_EDIT', id: shape.id })
    const s3 = appReducer(s2, { type: 'DESELECT_ALL' })
    const s4 = appReducer(s3, { type: 'COMMIT_TEXT_EDIT', id: shape.id, content: 'Settings' })
    const updated = s4.document.shapes[shape.id]
    expect(updated?.type === 'panel' && updated.text?.content).toBe('Settings')
  })
})
