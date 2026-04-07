import { describe, it, expect } from 'vitest'
import { resolveEndpoint, buildConnectorPath } from '../../src/utils/connectors'
import type { Shape } from '../../src/model/shapes'
import { createShape } from '../../src/utils/shapeFactory'

describe('resolveEndpoint', () => {
  it('resolves free endpoint to its point', () => {
    const ep = { kind: 'free' as const, point: { x: 10, y: 20 } }
    expect(resolveEndpoint(ep, {})).toEqual({ x: 10, y: 20 })
  })

  it('resolves attached endpoint to anchor on shape', () => {
    const rect = createShape('rect', 0, 0)
    if (rect.type !== 'rect') throw new Error()
    // Override transform for predictable values
    const shapes: Record<string, Shape> = {
      [rect.id]: { ...rect, transform: { x: 0, y: 0, width: 100, height: 60, rotation: 0 } },
    }
    const ep = { kind: 'attached' as const, shapeId: rect.id, anchor: 'middle-center' as const }
    expect(resolveEndpoint(ep, shapes)).toEqual({ x: 50, y: 30 })
  })

  it('returns (0,0) if attached shape not found', () => {
    const ep = { kind: 'attached' as const, shapeId: 'missing', anchor: 'top-left' as const }
    expect(resolveEndpoint(ep, {})).toEqual({ x: 0, y: 0 })
  })
})

describe('buildConnectorPath', () => {
  const start = { x: 0, y: 0 }
  const end = { x: 100, y: 0 }

  it('builds straight path', () => {
    const d = buildConnectorPath(start, end, { mode: 'straight', waypoints: [] })
    expect(d).toBe('M 0 0 L 100 0')
  })

  it('builds orthogonal path with midpoint', () => {
    const d = buildConnectorPath(start, end, { mode: 'orthogonal', waypoints: [] })
    expect(d).toContain('M 0 0')
    expect(d).toContain('H 50')
  })

  it('builds curved path', () => {
    const d = buildConnectorPath(start, end, { mode: 'curved', waypoints: [] })
    expect(d).toContain('C')
  })
})
