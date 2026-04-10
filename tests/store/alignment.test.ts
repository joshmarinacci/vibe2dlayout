import { describe, it, expect } from 'vitest'
import { appReducer, initialState } from '../../src/store/reducer'
import { historyReducer, createInitialHistory, canUndo } from '../../src/store/history'
import { createShape } from '../../src/utils/shapeFactory'
import type { AppState } from '../../src/store/types'

function addRect(state: AppState, x: number, y: number): { state: AppState; id: string } {
  const pageId = state.document.rootNodes[0].id
  const shape = createShape('rect', x, y)
  const next = appReducer(state, { type: 'ADD_SHAPE', parentId: pageId, shape })
  return { state: next, id: shape.id }
}

describe('ALIGN_SHAPES via appReducer', () => {
  it('aligns shapes left', () => {
    const r1 = addRect(initialState, 10, 20)
    const r2 = addRect(r1.state, 80, 60)
    const r3 = addRect(r2.state, 40, 100)
    const s = r3.state

    const next = appReducer(s, {
      type: 'ALIGN_SHAPES',
      ids: [r1.id, r2.id, r3.id],
      alignment: 'left',
    })

    const shapes = next.document.shapes
    const minX = Math.min(
      (shapes[r1.id] as Extract<typeof shapes[string], { transform: any }>)!.transform.x,
      (shapes[r2.id] as Extract<typeof shapes[string], { transform: any }>)!.transform.x,
      (shapes[r3.id] as Extract<typeof shapes[string], { transform: any }>)!.transform.x,
    )
    // All shapes should have same x equal to the minimum
    expect(minX).toBe(10)
    const xOf = (id: string) => (shapes[id] as any).transform.x
    expect(xOf(r1.id)).toBe(10)
    expect(xOf(r2.id)).toBe(10)
    expect(xOf(r3.id)).toBe(10)
  })

  it('aligns shapes top', () => {
    const r1 = addRect(initialState, 10, 20)
    const r2 = addRect(r1.state, 80, 60)
    const s = r2.state

    const next = appReducer(s, {
      type: 'ALIGN_SHAPES',
      ids: [r1.id, r2.id],
      alignment: 'top',
    })

    const shapes = next.document.shapes
    const yOf = (id: string) => (shapes[id] as any).transform.y
    expect(yOf(r1.id)).toBe(20)
    expect(yOf(r2.id)).toBe(20)
  })

  it('match-width sets all widths to first shape width', () => {
    const r1 = addRect(initialState, 10, 20)
    const r2 = addRect(r1.state, 80, 60)
    const s = r2.state

    // Resize r1 to have a known width
    const s2 = appReducer(s, {
      type: 'SET_TRANSFORM',
      id: r1.id,
      transform: { x: 10, y: 20, width: 200, height: 80, rotation: 0 },
    })

    const next = appReducer(s2, {
      type: 'ALIGN_SHAPES',
      ids: [r1.id, r2.id],
      alignment: 'match-width',
    })

    const shapes = next.document.shapes
    const wOf = (id: string) => (shapes[id] as any).transform.width
    expect(wOf(r1.id)).toBe(200)
    expect(wOf(r2.id)).toBe(200)
  })

  it('does not affect shapes not in ids', () => {
    const r1 = addRect(initialState, 10, 20)
    const r2 = addRect(r1.state, 80, 60)
    const r3 = addRect(r2.state, 200, 300)
    const s = r3.state

    const origX3 = (s.document.shapes[r3.id] as any).transform.x

    const next = appReducer(s, {
      type: 'ALIGN_SHAPES',
      ids: [r1.id, r2.id],
      alignment: 'left',
    })

    expect((next.document.shapes[r3.id] as any).transform.x).toBe(origX3)
  })
})

describe('ALIGN_SHAPES undo via historyReducer', () => {
  it('undo restores original positions after align', () => {
    let h = createInitialHistory(initialState)
    const pageId = h.present.document.rootNodes[0].id

    const shape1 = createShape('rect', 10, 20)
    h = historyReducer(h, { type: 'ADD_SHAPE', parentId: pageId, shape: shape1 })
    const id1 = shape1.id

    const shape2 = createShape('rect', 80, 60)
    h = historyReducer(h, { type: 'ADD_SHAPE', parentId: pageId, shape: shape2 })
    const id2 = shape2.id

    const origX1 = (h.present.document.shapes[id1] as any).transform.x
    const origX2 = (h.present.document.shapes[id2] as any).transform.x

    h = historyReducer(h, { type: 'ALIGN_SHAPES', ids: [id1, id2], alignment: 'left' })
    expect(canUndo(h)).toBe(true)

    h = historyReducer(h, { type: 'UNDO' })
    expect((h.present.document.shapes[id1] as any).transform.x).toBe(origX1)
    expect((h.present.document.shapes[id2] as any).transform.x).toBe(origX2)
  })
})
