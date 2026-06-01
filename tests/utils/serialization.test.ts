import {describe, expect, it} from 'vitest'
import {initialState} from '../../src/store/reducer'
import {fromJSON, toJSON} from '../../src/utils/serialization'

describe('serialization round-trip', () => {
    it('serializes and deserializes document', () => {
        const doc = initialState.document
        const json = toJSON(doc)
        const restored = fromJSON(json)
        expect(restored.version).toBe(3)
        expect(Object.keys(restored.shapes)).toEqual(Object.keys(doc.shapes))
        expect(restored.rootNodes).toHaveLength(doc.rootNodes.length)
    })

    it('throws on invalid JSON', () => {
        expect(() => fromJSON('not json')).toThrow('Invalid JSON')
    })

    it('throws on wrong schema', () => {
        expect(() => fromJSON(JSON.stringify({foo: 'bar'}))).toThrow('Invalid document format')
    })
})
