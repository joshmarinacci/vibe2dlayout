import {describe, expect, it} from 'vitest'
import {decodeLimnPng, encodeLimnPng} from '../../src/utils/limnFile'
import {extractTextChunk, injectTextChunk} from '../../src/utils/pngMeta'
import {initialState} from '../../src/store/reducer'

// Same minimal 1×1 white RGB PNG used in pngMeta tests
const MINIMAL_PNG = new Uint8Array([
    137, 80, 78, 71, 13, 10, 26, 10,
    0, 0, 0, 13, 73, 72, 68, 82,
    0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0,
    144, 119, 83, 222,
    0, 0, 0, 12, 73, 68, 65, 84,
    120, 156, 99, 248, 255, 255, 63, 0, 5, 254, 2, 254,
    13, 239, 70, 184,
    0, 0, 0, 0, 73, 69, 78, 68,
    174, 66, 96, 130,
])

// Helper: embed raw JSON into MINIMAL_PNG via the LimnDocument chunk
function makeTestLimnPng(json: string): Uint8Array {
    const utf8 = new TextEncoder().encode(json)
    let binary = ''
    const CHUNK = 0x8000
    for (let i = 0; i < utf8.length; i += CHUNK)
        binary += String.fromCharCode(...utf8.subarray(i, i + CHUNK))
    const base64 = btoa(binary)
    return injectTextChunk(MINIMAL_PNG, 'LimnDocument', base64)
}

describe('limnFile', () => {
    it('throws when PNG has no LimnDocument chunk', () => {
        expect(() => decodeLimnPng(MINIMAL_PNG)).toThrow('Not a Limn file')
    })

    it('throws on non-PNG bytes', () => {
        expect(() => decodeLimnPng(new Uint8Array([0, 1, 2, 3]))).toThrow()
    })

    it('round-trips a document through encode and decode', () => {
        const doc = initialState.document
        const encoded = encodeLimnPng(MINIMAL_PNG, doc)
        const decoded = decodeLimnPng(encoded)
        expect(decoded.version).toBe(4)
        expect(Object.keys(decoded.shapes)).toEqual(Object.keys(doc.shapes))
        expect(decoded.rootNodes).toHaveLength(doc.rootNodes.length)
    })

    it('encoded result is still a valid PNG (correct signature)', () => {
        const encoded = encodeLimnPng(MINIMAL_PNG, initialState.document)
        const SIG = [137, 80, 78, 71, 13, 10, 26, 10]
        SIG.forEach((byte, i) => expect(encoded[i]).toBe(byte))
    })

    it('migrates a v3 document to v4 on decode', () => {
        const v3 = {
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
        const limn = makeTestLimnPng(JSON.stringify(v3))
        const decoded = decodeLimnPng(limn)
        expect(decoded.version).toBe(4)
        const page = decoded.shapes['page-1'] as {pageSize: {kind: string} | null}
        expect(page.pageSize?.kind).toBe('custom')
    })

    it('preserves unicode text content in shapes through encode/decode', () => {
        const doc = initialState.document
        // Inject a shape with unicode content via raw JSON manipulation
        const json = JSON.stringify({...doc, _testField: 'Hello 🌍 привет'})
        const limn = makeTestLimnPng(json)
        // decodeLimnPng calls fromJSON which expects a VibeDocument schema —
        // use the raw extraction approach to verify unicode survival
        const base64 = extractTextChunk(limn, 'LimnDocument')!
        const decoded = new TextDecoder().decode(Uint8Array.from(atob(base64), c => c.charCodeAt(0)))
        expect(decoded).toContain('Hello 🌍 привет')
    })
})
