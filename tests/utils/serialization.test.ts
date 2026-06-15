import {describe, expect, it} from 'vitest'
import {initialState} from '../../src/store/reducer'
import {fromJSON, toJSON} from '../../src/utils/serialization'

describe('serialization round-trip', () => {
    it('serializes and deserializes document', () => {
        const doc = initialState.document
        const json = toJSON(doc)
        const restored = fromJSON(json)
        expect(restored.version).toBe(4)
        expect(Object.keys(restored.shapes)).toEqual(Object.keys(doc.shapes))
        expect(restored.rootNodes).toHaveLength(doc.rootNodes.length)
    })

    it('upgrades legacy fixed-size pages to custom page sizes', () => {
        const legacy = {
            version: 3,
            rootNodes: [{id: 'page-1', children: []}],
            shapes: {
                'page-1': {
                    id: 'page-1',
                    type: 'page',
                    name: 'Legacy Page',
                    locked: false,
                    visible: true,
                    transform: {x: 0, y: 0, width: 900, height: 700, rotation: 0},
                    fixedSize: {width: 900, height: 700},
                    background: '#ffffff',
                    clipChildren: false,
                },
            },
            palettes: [],
            themes: [],
            activeThemeId: '',
            gridSettings: {size: 16, style: 'lines', snapEnabled: false, snapAlignment: false},
            pageFolders: [],
            images: [],
            pixelAssets: [],
            customFonts: [],
            gradients: [],
            sketchStyles: [],
            powerUps: [],
        }

        const restored = fromJSON(JSON.stringify(legacy))
        const page = restored.shapes['page-1'] as {
            fixedSize: {width: number; height: number} | null
            pageSize: {kind: string; width: number; height: number} | null
        }

        expect(restored.version).toBe(4)
        expect(page.pageSize?.kind).toBe('custom')
        expect(page.fixedSize).toEqual({width: 900, height: 700})
        expect(page.pageSize).toEqual({kind: 'custom', width: 900, height: 700})
    })

    it('throws on invalid JSON', () => {
        expect(() => fromJSON('not json')).toThrow('Invalid JSON')
    })

    it('throws on wrong schema', () => {
        expect(() => fromJSON(JSON.stringify({foo: 'bar'}))).toThrow('Invalid document format')
    })
})
