import {describe, expect, it} from 'vitest'
import type {ColorPalette} from '../../src/model/palette'
import {canUndo, createInitialHistory, historyReducer} from '../../src/store/history'
import {appReducer, initialState} from '../../src/store/reducer'
import type {AppState} from '../../src/store/types'
import {createShape} from '../../src/utils/shapeFactory'

const pageId = initialState.document.rootNodes[0].id

function addRect(state: AppState, overrides?: Partial<{
    fillColor: string;
    fillPaletteId: string;
    strokeColor: string;
    strokePaletteId: string
}>) {
    const shape = createShape('rect', 100, 100)
    if (overrides?.fillColor) {
        (shape as any).fill = {
            ...(shape as any).fill,
            color: overrides.fillColor,
            paletteColorId: overrides.fillPaletteId
        }
    }
    if (overrides?.strokeColor) {
        (shape as any).stroke = {
            ...(shape as any).stroke,
            color: overrides.strokeColor,
            paletteColorId: overrides.strokePaletteId
        }
    }
    const next = appReducer(state, {type: 'ADD_SHAPE', parentId: pageId, shape})
    return {state: next, id: shape.id}
}

const testPalette: ColorPalette = {
    id: 'p1',
    name: 'Test',
    colors: [
        {id: 'c1', name: 'Red', color: '#ff0000'},
        {id: 'c2', name: 'Blue', color: '#0000ff'},
    ],
}

describe('ADD_PALETTE', () => {
    it('adds a palette to the document', () => {
        const next = appReducer(initialState, {type: 'ADD_PALETTE', palette: testPalette})
        expect(next.document.palettes.find(p => p.id === 'p1')).toBeDefined()
    })
})

describe('DELETE_PALETTE', () => {
    it('removes the palette', () => {
        let s = appReducer(initialState, {type: 'ADD_PALETTE', palette: testPalette})
        s = appReducer(s, {type: 'DELETE_PALETTE', paletteId: 'p1'})
        expect(s.document.palettes.find(p => p.id === 'p1')).toBeUndefined()
    })
})

describe('RENAME_PALETTE', () => {
    it('renames the palette', () => {
        let s = appReducer(initialState, {type: 'ADD_PALETTE', palette: testPalette})
        s = appReducer(s, {type: 'RENAME_PALETTE', paletteId: 'p1', name: 'Renamed'})
        expect(s.document.palettes.find(p => p.id === 'p1')?.name).toBe('Renamed')
    })
})

describe('ADD_PALETTE_COLOR', () => {
    it('adds a color to the palette', () => {
        let s = appReducer(initialState, {type: 'ADD_PALETTE', palette: testPalette})
        s = appReducer(s, {
            type: 'ADD_PALETTE_COLOR',
            paletteId: 'p1',
            color: {id: 'c3', name: 'Green', color: '#00ff00'}
        })
        const palette = s.document.palettes.find(p => p.id === 'p1')!
        expect(palette.colors.find(c => c.id === 'c3')).toBeDefined()
    })
})

describe('DELETE_PALETTE_COLOR', () => {
    it('removes the color from the palette', () => {
        let s = appReducer(initialState, {type: 'ADD_PALETTE', palette: testPalette})
        s = appReducer(s, {type: 'DELETE_PALETTE_COLOR', paletteId: 'p1', colorId: 'c1'})
        const palette = s.document.palettes.find(p => p.id === 'p1')!
        expect(palette.colors.find(c => c.id === 'c1')).toBeUndefined()
    })
})

describe('UPDATE_PALETTE_COLOR', () => {
    it('updates the palette color hex', () => {
        let s = appReducer(initialState, {type: 'ADD_PALETTE', palette: testPalette})
        s = appReducer(s, {
            type: 'UPDATE_PALETTE_COLOR',
            paletteId: 'p1',
            colorId: 'c1',
            color: '#ff8800'
        })
        const palette = s.document.palettes.find(p => p.id === 'p1')!
        expect(palette.colors.find(c => c.id === 'c1')?.color).toBe('#ff8800')
    })

    it('updates fill.color on all shapes linked to that palette color', () => {
        let s = appReducer(initialState, {type: 'ADD_PALETTE', palette: testPalette})
        const r = addRect(s, {fillColor: '#ff0000', fillPaletteId: 'c1'})
        s = r.state
        s = appReducer(s, {
            type: 'UPDATE_PALETTE_COLOR',
            paletteId: 'p1',
            colorId: 'c1',
            color: '#ff8800'
        })
        const shape = s.document.shapes[r.id] as any
        expect(shape.fill.color).toBe('#ff8800')
    })

    it('updates stroke.color on linked shapes', () => {
        let s = appReducer(initialState, {type: 'ADD_PALETTE', palette: testPalette})
        const r = addRect(s, {strokeColor: '#ff0000', strokePaletteId: 'c1'})
        s = r.state
        s = appReducer(s, {
            type: 'UPDATE_PALETTE_COLOR',
            paletteId: 'p1',
            colorId: 'c1',
            color: '#ff8800'
        })
        const shape = s.document.shapes[r.id] as any
        expect(shape.stroke.color).toBe('#ff8800')
    })

    it('does NOT update shapes that have the same hex but no paletteColorId', () => {
        let s = appReducer(initialState, {type: 'ADD_PALETTE', palette: testPalette})
        // Shape with matching hex but no paletteColorId link
        const r = addRect(s, {fillColor: '#ff0000'})
        s = r.state
        s = appReducer(s, {
            type: 'UPDATE_PALETTE_COLOR',
            paletteId: 'p1',
            colorId: 'c1',
            color: '#ff8800'
        })
        const shape = s.document.shapes[r.id] as any
        expect(shape.fill.color).toBe('#ff0000')  // unchanged
    })

    it('name-only update does not change shape colors', () => {
        let s = appReducer(initialState, {type: 'ADD_PALETTE', palette: testPalette})
        const r = addRect(s, {fillColor: '#ff0000', fillPaletteId: 'c1'})
        s = r.state
        s = appReducer(s, {
            type: 'UPDATE_PALETTE_COLOR',
            paletteId: 'p1',
            colorId: 'c1',
            name: 'Renamed Red'
        })
        const shape = s.document.shapes[r.id] as any
        expect(shape.fill.color).toBe('#ff0000')  // unchanged
        const palette = s.document.palettes.find(p => p.id === 'p1')!
        expect(palette.colors.find(c => c.id === 'c1')?.name).toBe('Renamed Red')
    })
})

describe('UPDATE_PALETTE_COLOR undo', () => {
    it('undo restores both palette and shape colors', () => {
        let h = createInitialHistory(initialState)
        h = historyReducer(h, {type: 'ADD_PALETTE', palette: testPalette})

        const shape = createShape('rect', 100, 100)
        ;(shape as any).fill = {...(shape as any).fill, color: '#ff0000', paletteColorId: 'c1'}
        h = historyReducer(h, {type: 'ADD_SHAPE', parentId: pageId, shape})
        const shapeId = shape.id

        h = historyReducer(h, {
            type: 'UPDATE_PALETTE_COLOR',
            paletteId: 'p1',
            colorId: 'c1',
            color: '#ff8800'
        })
        expect((h.present.document.shapes[shapeId] as any).fill.color).toBe('#ff8800')
        expect(canUndo(h)).toBe(true)

        h = historyReducer(h, {type: 'UNDO'})
        expect((h.present.document.shapes[shapeId] as any).fill.color).toBe('#ff0000')
        const palette = h.present.document.palettes.find(p => p.id === 'p1')!
        expect(palette.colors.find(c => c.id === 'c1')?.color).toBe('#ff0000')
    })
})
