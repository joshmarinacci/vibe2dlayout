import {describe, expect, it} from 'vitest'
import type {TreeNode} from '../../src/model/document'
import type {Shape} from '../../src/model/shapes'
import type {BoundingBox} from '../../src/model/transform'
import {applyTransform, computeVisualBounds, shapeCorners} from '../../src/utils/exportBounds'

// Helper: make a minimal text shape for testing
function makeText(id: string, t: Partial<BoundingBox> & {
    x: number;
    y: number;
    width: number;
    height: number
}): Shape {
    return {
        id,
        type: 'text',
        visible: true,
        locked: false,
        opacity: 1,
        boxShadow: [],
        transform: {rotation: 0, ...t} as BoundingBox,
        text: {
            content: 'test',
            fontSize: 14,
            fontFamily: 'sans-serif',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: 'left',
            color: '#000',
            lineHeight: 1.4,
            letterSpacing: 0,
            textDecoration: 'none',
            smallCaps: false
        },
        fill: {type: 'solid', color: 'transparent', opacity: 1},
    } as unknown as Shape
}

function makeNode(id: string): TreeNode {
    return {id, children: []}
}

// ─── applyTransform ────────────────────────────────────────────────────────

describe('applyTransform', () => {
    it('identity: no transform leaves point unchanged', () => {
        const t: BoundingBox = {x: 0, y: 0, width: 100, height: 50, rotation: 0}
        const [rx, ry] = applyTransform(10, 20, t)
        expect(rx).toBeCloseTo(10)
        expect(ry).toBeCloseTo(20)
    })

    it('rotation 90°: (1,0) → (0,1)', () => {
        const t: BoundingBox = {x: 0, y: 0, width: 100, height: 50, rotation: 90}
        const [rx, ry] = applyTransform(1, 0, t)
        expect(rx).toBeCloseTo(0)
        expect(ry).toBeCloseTo(1)
    })

    it('rotation 180°: (1,0) → (-1,0)', () => {
        const t: BoundingBox = {x: 0, y: 0, width: 100, height: 50, rotation: 180}
        const [rx, ry] = applyTransform(1, 0, t)
        expect(rx).toBeCloseTo(-1)
        expect(ry).toBeCloseTo(0)
    })

    it('scaleX 2: doubles x', () => {
        const t: BoundingBox = {x: 0, y: 0, width: 100, height: 50, rotation: 0, scaleX: 2}
        const [rx, ry] = applyTransform(5, 3, t)
        expect(rx).toBeCloseTo(10)
        expect(ry).toBeCloseTo(3)
    })

    it('scaleY 3: triples y', () => {
        const t: BoundingBox = {x: 0, y: 0, width: 100, height: 50, rotation: 0, scaleY: 3}
        const [rx, ry] = applyTransform(5, 3, t)
        expect(rx).toBeCloseTo(5)
        expect(ry).toBeCloseTo(9)
    })

    it('skewX 45°: shifts x by y', () => {
        const t: BoundingBox = {x: 0, y: 0, width: 100, height: 50, rotation: 0, skewX: 45}
        const [rx, ry] = applyTransform(0, 10, t)
        expect(rx).toBeCloseTo(10)
        expect(ry).toBeCloseTo(10)
    })

    it('skewY 45°: shifts y by x', () => {
        const t: BoundingBox = {x: 0, y: 0, width: 100, height: 50, rotation: 0, skewY: 45}
        const [rx, ry] = applyTransform(10, 0, t)
        expect(rx).toBeCloseTo(10)
        expect(ry).toBeCloseTo(10)
    })
})

// ─── shapeCorners ──────────────────────────────────────────────────────────

describe('shapeCorners', () => {
    it('no rotation: corners are the four axis-aligned corners', () => {
        const t: BoundingBox = {x: 10, y: 20, width: 100, height: 60, rotation: 0}
        const corners = shapeCorners(t)
        expect(corners).toHaveLength(4)
        const xs = corners.map(c => c[0]).sort((a, b) => a - b)
        const ys = corners.map(c => c[1]).sort((a, b) => a - b)
        expect(xs[0]).toBeCloseTo(10)
        expect(xs[3]).toBeCloseTo(110)
        expect(ys[0]).toBeCloseTo(20)
        expect(ys[3]).toBeCloseTo(80)
    })

    it('rotation 90°: width and height axes are swapped visually', () => {
        // 100×60 shape at origin, rotated 90°
        const t: BoundingBox = {x: 0, y: 0, width: 100, height: 60, rotation: 90}
        const corners = shapeCorners(t)
        const xs = corners.map(c => c[0])
        const ys = corners.map(c => c[1])
        const w = Math.max(...xs) - Math.min(...xs)
        const h = Math.max(...ys) - Math.min(...ys)
        // Visual extent should be 60 wide and 100 tall after 90° rotation
        expect(w).toBeCloseTo(60)
        expect(h).toBeCloseTo(100)
    })

    it('rotation 45°: diagonal shape is wider and taller than original', () => {
        const t: BoundingBox = {x: 0, y: 0, width: 100, height: 20, rotation: 45}
        const corners = shapeCorners(t)
        const xs = corners.map(c => c[0])
        const ys = corners.map(c => c[1])
        const w = Math.max(...xs) - Math.min(...xs)
        const h = Math.max(...ys) - Math.min(...ys)
        // Both extents should be larger than the 20px height
        expect(w).toBeGreaterThan(20)
        expect(h).toBeGreaterThan(20)
    })
})

// ─── computeVisualBounds ───────────────────────────────────────────────────

describe('computeVisualBounds', () => {
    it('single unrotated shape: bounds match the transform exactly', () => {
        const shape = makeText('a', {x: 10, y: 20, width: 100, height: 40})
        const bounds = computeVisualBounds([makeNode('a')], {a: shape})
        expect(bounds.x).toBeCloseTo(10)
        expect(bounds.y).toBeCloseTo(20)
        expect(bounds.width).toBeCloseTo(100)
        expect(bounds.height).toBeCloseTo(40)
    })

    it('two side-by-side unrotated shapes: bounds span both', () => {
        const a = makeText('a', {x: 0, y: 0, width: 50, height: 30})
        const b = makeText('b', {x: 60, y: 0, width: 50, height: 30})
        const bounds = computeVisualBounds([makeNode('a'), makeNode('b')], {a, b})
        expect(bounds.x).toBeCloseTo(0)
        expect(bounds.y).toBeCloseTo(0)
        expect(bounds.width).toBeCloseTo(110)
        expect(bounds.height).toBeCloseTo(30)
    })

    it('shape rotated 90°: visual bounds are swapped dimensions', () => {
        // 100×20 shape at (0,0) rotated 90° — visual extent should be ~20 wide, ~100 tall
        const shape = makeText('a', {x: 0, y: 0, width: 100, height: 20, rotation: 90})
        const bounds = computeVisualBounds([makeNode('a')], {a: shape})
        expect(bounds.width).toBeCloseTo(20, 0)
        expect(bounds.height).toBeCloseTo(100, 0)
    })

    it('shape rotated 45°: height grows beyond original height', () => {
        // A 100×20 shape rotated 45°: the narrow axis sweeps diagonally, so the
        // visual height (20 → ~84.9) is much larger than the original 20px.
        // Visual width (~84.9) is actually less than the original 100px.
        const shape = makeText('a', {x: 0, y: 0, width: 100, height: 20, rotation: 45})
        const bounds = computeVisualBounds([makeNode('a')], {a: shape})
        // height must be significantly larger than the unrotated 20px
        expect(bounds.height).toBeGreaterThan(50)
        // width = sqrt((100²+20²)/2) ≈ 84.9 — verify it's in the expected range
        expect(bounds.width).toBeCloseTo(84.85, 0)
        expect(bounds.height).toBeCloseTo(84.85, 0)
    })

    it('mixed: rotated shape extends bounds beyond unrotated siblings', () => {
        // Unrotated 100×20 at (0,0); rotated 100×20 at (0,30) rotated 45°
        const a = makeText('a', {x: 0, y: 0, width: 100, height: 20})
        const b = makeText('b', {x: 0, y: 30, width: 100, height: 20, rotation: 45})
        const bounds = computeVisualBounds([makeNode('a'), makeNode('b')], {a, b})
        // The rotated shape's visual x extent starts before 0 and/or ends after 100
        const covers100 = bounds.width >= 100
        expect(covers100).toBe(true)
        // Total height must exceed 50 (0+20 unrotated + 30+20 rotated)
        expect(bounds.height).toBeGreaterThan(50)
    })

    it('group with scaled text: bounds reflect scale', () => {
        const shape = makeText('a', {x: 0, y: 0, width: 100, height: 20, scaleX: 2})
        const bounds = computeVisualBounds([makeNode('a')], {a: shape})
        expect(bounds.width).toBeCloseTo(200, 0)
        expect(bounds.height).toBeCloseTo(20, 0)
    })

    it('skewed shape: bounds are wider than original', () => {
        const shape = makeText('a', {x: 0, y: 0, width: 100, height: 20, skewX: 30})
        const bounds = computeVisualBounds([makeNode('a')], {a: shape})
        expect(bounds.width).toBeGreaterThan(100)
    })

    it('ignores line shapes (no transform)', () => {
        const line = {
            id: 'l',
            type: 'line',
            visible: true,
            locked: false,
            opacity: 1,
            boxShadow: []
        } as unknown as Shape
        const text = makeText('a', {x: 10, y: 10, width: 50, height: 20})
        const bounds = computeVisualBounds([makeNode('l'), makeNode('a')], {l: line, a: text})
        expect(bounds.x).toBeCloseTo(10)
        expect(bounds.width).toBeCloseTo(50)
    })
})
