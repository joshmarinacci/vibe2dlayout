import {describe, expect, it} from 'vitest'
import {fillBackground, gradientCSS, sketchFillCSS} from '../../src/utils/fillCSS'
import type {ColorFill, GradientFill, SketchFill} from '../../src/model/shapes'

describe('gradientCSS', () => {
    const stops = [{color: '#ff0000', position: 0}, {color: '#0000ff', position: 1}]

    it('linear gradient', () => {
        const f: GradientFill = {type: 'gradient', gradientType: 'linear', angle: 45, stops, opacity: 1}
        expect(gradientCSS(f)).toBe('linear-gradient(45deg, #ff0000 0%, #0000ff 100%)')
    })

    it('radial gradient', () => {
        const f: GradientFill = {type: 'gradient', gradientType: 'radial', angle: 0, stops, opacity: 1}
        expect(gradientCSS(f)).toBe('radial-gradient(circle, #ff0000 0%, #0000ff 100%)')
    })

    it('conic gradient', () => {
        const f: GradientFill = {type: 'gradient', gradientType: 'conic', angle: 90, stops, opacity: 1}
        expect(gradientCSS(f)).toBe('conic-gradient(from 90deg, #ff0000 0%, #0000ff 100%)')
    })

    it('repeat gradient uses svg data url', () => {
        const f: GradientFill = {type: 'gradient', gradientType: 'linear', angle: 45, stops, opacity: 1, spreadMethod: 'repeat'}
        const css = gradientCSS(f)
        expect(css).toContain('data:image/svg+xml')
        expect(css).toContain('spreadMethod%3D%22repeat%22')
    })

    it('short span uses svg data url', () => {
        const f: GradientFill = {type: 'gradient', gradientType: 'linear', angle: 45, stops, opacity: 1, span: 0.25}
        const css = gradientCSS(f)
        expect(css).toContain('data:image/svg+xml')
        expect(css).toContain('y1%3D%2262.5%22')
    })

    it('mirror gradient uses svg data url', () => {
        const f: GradientFill = {type: 'gradient', gradientType: 'radial', angle: 0, stops, opacity: 1, spreadMethod: 'reflect'}
        const css = gradientCSS(f)
        expect(css).toContain('data:image/svg+xml')
        expect(css).toContain('spreadMethod%3D%22reflect%22')
    })

    it('rounds stop positions', () => {
        const f: GradientFill = {
            type: 'gradient', gradientType: 'linear', angle: 0,
            stops: [{color: '#aaa', position: 0.333}],
            opacity: 1,
        }
        expect(gradientCSS(f)).toBe('linear-gradient(0deg, #aaa 33%)')
    })
})

describe('sketchFillCSS', () => {
    it('solid returns color', () => {
        const f: SketchFill = {type: 'sketch', color: '#123456', fillStyle: 'solid', hachureAngle: 45, hachureGap: 4, opacity: 1}
        expect(sketchFillCSS(f)).toBe('#123456')
    })

    it('none returns transparent', () => {
        const f: SketchFill = {type: 'sketch', color: '#000', fillStyle: 'none', hachureAngle: 45, hachureGap: 4, opacity: 1}
        expect(sketchFillCSS(f)).toBe('transparent')
    })

    it('hatched returns repeating-linear-gradient', () => {
        const f: SketchFill = {type: 'sketch', color: '#333', fillStyle: 'hatched', hachureAngle: 45, hachureGap: 4, opacity: 1}
        const result = sketchFillCSS(f)
        expect(result).toContain('repeating-linear-gradient')
        expect(result).toContain('45deg')
        expect(result).toContain('#333')
    })
})

describe('fillBackground', () => {
    it('ColorFill returns color string', () => {
        const f: ColorFill = {type: 'color', color: '#abcdef', opacity: 1}
        expect(fillBackground(f)).toBe('#abcdef')
    })

    it('GradientFill returns gradient CSS', () => {
        const stops = [{color: '#ff0000', position: 0}, {color: '#0000ff', position: 1}]
        const f: GradientFill = {type: 'gradient', gradientType: 'linear', angle: 90, stops, opacity: 1}
        expect(fillBackground(f)).toContain('linear-gradient')
    })

    it('GradientFill repeat returns svg data url', () => {
        const stops = [{color: '#ff0000', position: 0}, {color: '#0000ff', position: 1}]
        const f: GradientFill = {type: 'gradient', gradientType: 'linear', angle: 90, stops, opacity: 1, spreadMethod: 'repeat'}
        expect(fillBackground(f)).toContain('spreadMethod%3D%22repeat%22')
    })

    it('SketchFill solid returns color', () => {
        const f: SketchFill = {type: 'sketch', color: '#ff0000', fillStyle: 'solid', hachureAngle: 45, hachureGap: 4, opacity: 1}
        expect(fillBackground(f)).toBe('#ff0000')
    })
})
