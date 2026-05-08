import {describe, expect, it} from 'vitest'
import {defaultFill, fillColor} from '../../src/model/shapes'
import type {ColorFill, GradientFill, SketchFill} from '../../src/model/shapes'

describe('defaultFill', () => {
    it('returns a ColorFill with type color', () => {
        const f = defaultFill()
        expect(f.type).toBe('color')
        expect((f as ColorFill).color).toBe('#ffffff')
        expect(f.opacity).toBe(1)
    })
})

describe('fillColor', () => {
    it('returns color for ColorFill', () => {
        const f: ColorFill = {type: 'color', color: '#ff0000', opacity: 1}
        expect(fillColor(f)).toBe('#ff0000')
    })

    it('returns color for SketchFill', () => {
        const f: SketchFill = {type: 'sketch', color: '#00ff00', fillStyle: 'solid', hachureAngle: 45, hachureGap: 4, opacity: 1}
        expect(fillColor(f)).toBe('#00ff00')
    })

    it('returns first stop color for GradientFill', () => {
        const f: GradientFill = {
            type: 'gradient',
            gradientType: 'linear',
            angle: 90,
            stops: [{color: '#aabbcc', position: 0}, {color: '#ffffff', position: 1}],
            opacity: 1,
        }
        expect(fillColor(f)).toBe('#aabbcc')
    })

    it('returns transparent when GradientFill has no stops', () => {
        const f: GradientFill = {type: 'gradient', gradientType: 'linear', angle: 90, stops: [], opacity: 1}
        expect(fillColor(f)).toBe('transparent')
    })
})
