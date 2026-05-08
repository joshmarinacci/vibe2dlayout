import {describe, expect, it} from 'vitest'
import type {GradientDef, SketchStyleDef} from '../../src/model/document'
import {appReducer, initialState} from '../../src/store/reducer'

const stops = [{color: '#ff0000', position: 0}, {color: '#0000ff', position: 1}]

const testGradient: GradientDef = {
    id: 'g1',
    name: 'Test Gradient',
    stops,
}

const testStyle: SketchStyleDef = {
    id: 'ss1',
    name: 'Test Style',
    fillStyle: 'hatched',
    hachureAngle: 45,
    hachureGap: 4,
}

describe('gradient document actions', () => {
    it('ADD_GRADIENT appends a gradient', () => {
        const before = initialState.document.gradients.length
        const next = appReducer(initialState, {type: 'ADD_GRADIENT', gradient: testGradient})
        expect(next.document.gradients).toHaveLength(before + 1)
        expect(next.document.gradients[next.document.gradients.length - 1]?.id).toBe('g1')
    })

    it('UPDATE_GRADIENT replaces by id', () => {
        const s1 = appReducer(initialState, {type: 'ADD_GRADIENT', gradient: testGradient})
        const updated: GradientDef = {...testGradient, name: 'Updated'}
        const s2 = appReducer(s1, {type: 'UPDATE_GRADIENT', gradient: updated})
        const found = s2.document.gradients.find(g => g.id === 'g1')
        expect(found?.name).toBe('Updated')
    })

    it('DELETE_GRADIENT removes by id', () => {
        const s1 = appReducer(initialState, {type: 'ADD_GRADIENT', gradient: testGradient})
        const s2 = appReducer(s1, {type: 'DELETE_GRADIENT', gradientId: 'g1'})
        expect(s2.document.gradients.find(g => g.id === 'g1')).toBeUndefined()
    })
})

describe('sketch style document actions', () => {
    it('ADD_SKETCH_STYLE appends a style', () => {
        const before = initialState.document.sketchStyles.length
        const next = appReducer(initialState, {type: 'ADD_SKETCH_STYLE', style: testStyle})
        expect(next.document.sketchStyles).toHaveLength(before + 1)
        expect(next.document.sketchStyles[next.document.sketchStyles.length - 1]?.id).toBe('ss1')
    })

    it('UPDATE_SKETCH_STYLE replaces by id', () => {
        const s1 = appReducer(initialState, {type: 'ADD_SKETCH_STYLE', style: testStyle})
        const updated: SketchStyleDef = {...testStyle, name: 'Updated'}
        const s2 = appReducer(s1, {type: 'UPDATE_SKETCH_STYLE', style: updated})
        const found = s2.document.sketchStyles.find(s => s.id === 'ss1')
        expect(found?.name).toBe('Updated')
    })

    it('DELETE_SKETCH_STYLE removes by id', () => {
        const s1 = appReducer(initialState, {type: 'ADD_SKETCH_STYLE', style: testStyle})
        const s2 = appReducer(s1, {type: 'DELETE_SKETCH_STYLE', styleId: 'ss1'})
        expect(s2.document.sketchStyles.find(s => s.id === 'ss1')).toBeUndefined()
    })
})
