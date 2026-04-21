import { describe, it, expect } from 'vitest'
import { snapToGrid, getEffectiveGridSettings } from '../../src/utils/snapping'
import type { GridSettings } from '../../src/model/grid'
import type { Shape } from '../../src/model/shapes'

const DOC_GRID: GridSettings = { size: 10, style: 'lines', snapEnabled: true }

describe('snapToGrid', () => {
  it('snaps to nearest grid line below', () => {
    expect(snapToGrid(13, 10)).toBe(10)
  })

  it('snaps to nearest grid line above', () => {
    expect(snapToGrid(17, 10)).toBe(20)
  })

  it('returns exact value when already on grid', () => {
    expect(snapToGrid(20, 10)).toBe(20)
  })

  it('snaps zero correctly', () => {
    expect(snapToGrid(0, 10)).toBe(0)
  })

  it('snaps negative values', () => {
    expect(snapToGrid(-13, 10)).toBe(-10)
    expect(snapToGrid(-17, 10)).toBe(-20)
  })

  it('works with non-power-of-ten grid sizes', () => {
    expect(snapToGrid(7, 5)).toBe(5)
    expect(snapToGrid(8, 5)).toBe(10)
  })
})

describe('getEffectiveGridSettings', () => {
  const shapes: Record<string, Shape> = {
    page1: {
      id: 'page1',
      type: 'page',
      name: 'Page 1',
      visible: true,
      locked: false,
      background: '#fff',
      transform: { x: 0, y: 0, width: 1200, height: 800, rotation: 0 },
    } as Shape,
  }

  it('returns doc settings when pageId is null', () => {
    expect(getEffectiveGridSettings(null, shapes, DOC_GRID)).toBe(DOC_GRID)
  })

  it('returns doc settings when page has no override', () => {
    expect(getEffectiveGridSettings('page1', shapes, DOC_GRID)).toBe(DOC_GRID)
  })

  it('merges page override over doc settings', () => {
    const shapesWithOverride: Record<string, Shape> = {
      page1: {
        ...shapes.page1,
        gridSettings: { size: 5 },
      } as Shape,
    }
    const result = getEffectiveGridSettings('page1', shapesWithOverride, DOC_GRID)
    expect(result.size).toBe(5)
    expect(result.style).toBe('lines')
    expect(result.snapEnabled).toBe(true)
  })

  it('allows page to override snapEnabled independently', () => {
    const shapesWithOverride: Record<string, Shape> = {
      page1: {
        ...shapes.page1,
        gridSettings: { snapEnabled: false },
      } as Shape,
    }
    const result = getEffectiveGridSettings('page1', shapesWithOverride, DOC_GRID)
    expect(result.snapEnabled).toBe(false)
    expect(result.size).toBe(10)
  })

  it('returns doc settings when pageId not found', () => {
    expect(getEffectiveGridSettings('nonexistent', shapes, DOC_GRID)).toBe(DOC_GRID)
  })
})
