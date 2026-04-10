import { describe, it, expect } from 'vitest'
import { toJSON, fromJSON } from '../../src/utils/serialization'
import { initialState } from '../../src/store/reducer'

describe('serialization round-trip', () => {
  it('serializes and deserializes document', () => {
    const doc = initialState.document
    const json = toJSON(doc)
    const restored = fromJSON(json)
    expect(restored.version).toBe(2)
    expect(Object.keys(restored.shapes)).toEqual(Object.keys(doc.shapes))
    expect(restored.rootNodes).toHaveLength(doc.rootNodes.length)
  })

  it('throws on invalid JSON', () => {
    expect(() => fromJSON('not json')).toThrow('Invalid JSON')
  })

  it('throws on wrong schema', () => {
    expect(() => fromJSON(JSON.stringify({ foo: 'bar' }))).toThrow('Invalid document format')
  })
})
