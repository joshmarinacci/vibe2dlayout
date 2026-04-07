import { describe, it, expect } from 'vitest'
import { anchorPoint, pointInBox, pointNearLine, unionBoxes, distance } from '../../src/utils/geometry'
import type { BoundingBox } from '../../src/model/transform'

const box: BoundingBox = { x: 10, y: 20, width: 100, height: 60, rotation: 0 }

describe('anchorPoint', () => {
  it('top-left', () => expect(anchorPoint(box, 'top-left')).toEqual({ x: 10, y: 20 }))
  it('top-center', () => expect(anchorPoint(box, 'top-center')).toEqual({ x: 60, y: 20 }))
  it('top-right', () => expect(anchorPoint(box, 'top-right')).toEqual({ x: 110, y: 20 }))
  it('middle-left', () => expect(anchorPoint(box, 'middle-left')).toEqual({ x: 10, y: 50 }))
  it('middle-center', () => expect(anchorPoint(box, 'middle-center')).toEqual({ x: 60, y: 50 }))
  it('middle-right', () => expect(anchorPoint(box, 'middle-right')).toEqual({ x: 110, y: 50 }))
  it('bottom-left', () => expect(anchorPoint(box, 'bottom-left')).toEqual({ x: 10, y: 80 }))
  it('bottom-center', () => expect(anchorPoint(box, 'bottom-center')).toEqual({ x: 60, y: 80 }))
  it('bottom-right', () => expect(anchorPoint(box, 'bottom-right')).toEqual({ x: 110, y: 80 }))
})

describe('pointInBox', () => {
  it('returns true for point inside', () => {
    expect(pointInBox({ x: 50, y: 50 }, box)).toBe(true)
  })
  it('returns true for point on edge', () => {
    expect(pointInBox({ x: 10, y: 20 }, box)).toBe(true)
  })
  it('returns false for point outside', () => {
    expect(pointInBox({ x: 0, y: 0 }, box)).toBe(false)
  })
  it('returns false for point past right edge', () => {
    expect(pointInBox({ x: 200, y: 50 }, box)).toBe(false)
  })
})

describe('pointNearLine', () => {
  const p1 = { x: 0, y: 0 }
  const p2 = { x: 100, y: 0 }

  it('returns true for point on the line', () => {
    expect(pointNearLine({ x: 50, y: 0 }, p1, p2)).toBe(true)
  })
  it('returns true for point near (within tolerance)', () => {
    expect(pointNearLine({ x: 50, y: 5 }, p1, p2, 8)).toBe(true)
  })
  it('returns false for point far away', () => {
    expect(pointNearLine({ x: 50, y: 20 }, p1, p2, 8)).toBe(false)
  })
  it('handles zero-length line', () => {
    expect(pointNearLine({ x: 0, y: 0 }, p1, p1, 8)).toBe(true)
  })
})

describe('unionBoxes', () => {
  it('unions two boxes', () => {
    const a = { x: 0, y: 0, width: 50, height: 50 }
    const b = { x: 30, y: 30, width: 50, height: 50 }
    const u = unionBoxes(a, b)
    expect(u).toEqual({ x: 0, y: 0, width: 80, height: 80 })
  })
})

describe('distance', () => {
  it('computes distance between two points', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })
  it('returns 0 for same point', () => {
    expect(distance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0)
  })
})
