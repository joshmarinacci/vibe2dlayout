import {describe, expect, it} from 'vitest'
import {extractTextChunk, injectTextChunk} from '../../src/utils/pngMeta'

// Minimal valid 1×1 white RGB PNG (69 bytes), generated with Node zlib.deflateSync
const MINIMAL_PNG = new Uint8Array([
    137, 80, 78, 71, 13, 10, 26, 10,       // PNG signature
    0, 0, 0, 13, 73, 72, 68, 82,           // IHDR: length=13, type='IHDR'
    0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, // IHDR data: 1x1 RGB
    144, 119, 83, 222,                      // IHDR CRC
    0, 0, 0, 12, 73, 68, 65, 84,           // IDAT: length=12, type='IDAT'
    120, 156, 99, 248, 255, 255, 63, 0, 5, 254, 2, 254, // IDAT data
    13, 239, 70, 184,                       // IDAT CRC
    0, 0, 0, 0, 73, 69, 78, 68,            // IEND: length=0, type='IEND'
    174, 66, 96, 130,                       // IEND CRC
])

function walkChunks(png: Uint8Array): string[] {
    const types: string[] = []
    let pos = 8
    while (pos + 12 <= png.length) {
        const len = (png[pos] << 24 | png[pos + 1] << 16 | png[pos + 2] << 8 | png[pos + 3]) >>> 0
        types.push(String.fromCharCode(png[pos + 4], png[pos + 5], png[pos + 6], png[pos + 7]))
        pos += 12 + len
    }
    return types
}

describe('pngMeta', () => {
    it('returns null when no tEXt chunk exists', () => {
        expect(extractTextChunk(MINIMAL_PNG, 'LimnDocument')).toBeNull()
    })

    it('injects and extracts a text chunk round-trip', () => {
        const injected = injectTextChunk(MINIMAL_PNG, 'LimnDocument', 'hello-world')
        expect(extractTextChunk(injected, 'LimnDocument')).toBe('hello-world')
    })

    it('handles multiple keywords independently', () => {
        const step1 = injectTextChunk(MINIMAL_PNG, 'Author', 'alice')
        const step2 = injectTextChunk(step1, 'LimnDocument', 'doc-data')
        expect(extractTextChunk(step2, 'Author')).toBe('alice')
        expect(extractTextChunk(step2, 'LimnDocument')).toBe('doc-data')
        expect(extractTextChunk(step2, 'Missing')).toBeNull()
    })

    it('preserves PNG signature after injection', () => {
        const injected = injectTextChunk(MINIMAL_PNG, 'Test', 'value')
        const SIG = [137, 80, 78, 71, 13, 10, 26, 10]
        SIG.forEach((byte, i) => expect(injected[i]).toBe(byte))
    })

    it('inserts tEXt chunk before IDAT', () => {
        const injected = injectTextChunk(MINIMAL_PNG, 'LimnDocument', 'x')
        const chunks = walkChunks(injected)
        const textIdx = chunks.indexOf('tEXt')
        const idatIdx = chunks.indexOf('IDAT')
        expect(textIdx).toBeGreaterThan(-1)
        expect(textIdx).toBeLessThan(idatIdx)
    })

    it('throws on invalid PNG signature', () => {
        const garbage = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
        expect(() => injectTextChunk(garbage, 'Test', 'value')).toThrow('Not a valid PNG')
        expect(() => extractTextChunk(garbage, 'Test')).toThrow('Not a valid PNG')
    })

    it('handles base64-encoded unicode content (emoji)', () => {
        // Simulate what limnFile.ts does: UTF-8 → base64 → inject → extract → decode
        const original = 'Hello 🌍 world'
        const utf8 = new TextEncoder().encode(original)
        let binary = ''
        for (const b of utf8) binary += String.fromCharCode(b)
        const base64 = btoa(binary)

        const injected = injectTextChunk(MINIMAL_PNG, 'LimnDocument', base64)
        const extracted = extractTextChunk(injected, 'LimnDocument')
        expect(extracted).toBe(base64)

        const decodedBytes = Uint8Array.from(atob(extracted!), c => c.charCodeAt(0))
        expect(new TextDecoder().decode(decodedBytes)).toBe(original)
    })

    it('survives a large value without stack overflow', () => {
        const bigValue = 'A'.repeat(100_000)
        const injected = injectTextChunk(MINIMAL_PNG, 'BigData', bigValue)
        expect(extractTextChunk(injected, 'BigData')).toBe(bigValue)
    })
})
