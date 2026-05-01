import {afterEach, describe, expect, it, vi} from 'vitest'
import {
    fetchLospecPalette,
    normalizeHex,
    parseCoolorsUrl,
    parseGPL,
    parseHexFile,
} from '../../src/utils/paletteImport'

describe('normalizeHex', () => {
    it('normalizes uppercase bare hex', () => {
        expect(normalizeHex('FF0000')).toBe('#ff0000')
    })

    it('normalizes already-prefixed hex', () => {
        expect(normalizeHex('#ff0000')).toBe('#ff0000')
    })

    it('normalizes mixed case', () => {
        expect(normalizeHex('#3B82F6')).toBe('#3b82f6')
    })

    it('returns null for 3-char shorthand', () => {
        expect(normalizeHex('fff')).toBeNull()
    })

    it('returns null for 7+ char input', () => {
        expect(normalizeHex('ff0000ff')).toBeNull()
    })

    it('returns null for non-hex chars', () => {
        expect(normalizeHex('gggggg')).toBeNull()
    })

    it('returns null for empty string', () => {
        expect(normalizeHex('')).toBeNull()
    })
})

describe('parseHexFile', () => {
    it('parses bare hex colors one per line', () => {
        expect(parseHexFile('ff0000\n00ff00\n0000ff')).toEqual(['#ff0000', '#00ff00', '#0000ff'])
    })

    it('parses prefixed hex colors', () => {
        expect(parseHexFile('#ff0000\n#00ff00')).toEqual(['#ff0000', '#00ff00'])
    })

    it('skips blank lines', () => {
        expect(parseHexFile('ff0000\n\n00ff00')).toEqual(['#ff0000', '#00ff00'])
    })

    it('skips // comment lines', () => {
        expect(parseHexFile('// palette name\nff0000\n// comment\n00ff00')).toEqual(['#ff0000', '#00ff00'])
    })

    it('skips ; comment lines', () => {
        expect(parseHexFile('; comment\nff0000')).toEqual(['#ff0000'])
    })

    it('skips invalid lines', () => {
        expect(parseHexFile('not-a-color\nff0000\nzzz')).toEqual(['#ff0000'])
    })

    it('handles Windows CRLF line endings', () => {
        expect(parseHexFile('ff0000\r\n00ff00\r\n')).toEqual(['#ff0000', '#00ff00'])
    })

    it('returns empty array for all-invalid input', () => {
        expect(parseHexFile('hello\nworld\n')).toEqual([])
    })
})

describe('parseGPL', () => {
    const validGPL = `GIMP Palette
Name: My Palette
Columns: 8
#
255   0   0 Red
  0 255   0 Green
  0   0 255 Blue`

    it('parses a valid GPL file', () => {
        const result = parseGPL(validGPL)
        expect(result).not.toBeNull()
        expect(result!.name).toBe('My Palette')
        expect(result!.colors).toHaveLength(3)
        expect(result!.colors[0]).toEqual({name: 'Red', hex: '#ff0000'})
        expect(result!.colors[1]).toEqual({name: 'Green', hex: '#00ff00'})
        expect(result!.colors[2]).toEqual({name: 'Blue', hex: '#0000ff'})
    })

    it('extracts the Name: header', () => {
        const result = parseGPL(validGPL)
        expect(result!.name).toBe('My Palette')
    })

    it('defaults name to Imported Palette when no Name: line', () => {
        const gpl = `GIMP Palette\n255 0 0 Red`
        const result = parseGPL(gpl)
        expect(result!.name).toBe('Imported Palette')
    })

    it('returns null for non-GPL file', () => {
        expect(parseGPL('Not a palette file\nff0000')).toBeNull()
    })

    it('skips # comment lines', () => {
        const gpl = `GIMP Palette\nName: Test\n# This is a comment\n255 0 0 Red`
        const result = parseGPL(gpl)
        expect(result!.colors).toHaveLength(1)
    })

    it('uses hex as color name when no name given', () => {
        const gpl = `GIMP Palette\n255 128 0`
        const result = parseGPL(gpl)
        expect(result!.colors[0].name).toBe('#ff8000')
    })

    it('handles extra whitespace in R G B values', () => {
        const gpl = `GIMP Palette\n  10  20  30 Dark`
        const result = parseGPL(gpl)
        expect(result!.colors[0].hex).toBe('#0a141e')
    })
})

describe('parseCoolorsUrl', () => {
    it('parses direct coolors URL', () => {
        const result = parseCoolorsUrl('https://coolors.co/ff0000-00ff00-0000ff')
        expect(result).toEqual(['#ff0000', '#00ff00', '#0000ff'])
    })

    it('parses /palette/ form URL', () => {
        const result = parseCoolorsUrl('https://coolors.co/palette/ff0000-00ff00-0000ff')
        expect(result).toEqual(['#ff0000', '#00ff00', '#0000ff'])
    })

    it('returns null for non-coolors hostname', () => {
        expect(parseCoolorsUrl('https://example.com/ff0000-00ff00')).toBeNull()
    })

    it('returns null when no valid colors found', () => {
        expect(parseCoolorsUrl('https://coolors.co/')).toBeNull()
    })

    it('returns null for unparseable URL string', () => {
        expect(parseCoolorsUrl('not-a-url')).toBeNull()
    })

    it('normalizes mixed-case hex in URL', () => {
        const result = parseCoolorsUrl('https://coolors.co/FF0000-00FF00')
        expect(result).toEqual(['#ff0000', '#00ff00'])
    })
})

describe('fetchLospecPalette', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('fetches and returns a parsed palette', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({name: 'Sweetie 16', colors: ['1a1c2c', 'ff0000', '00ff00']}),
        }))

        const result = await fetchLospecPalette('https://lospec.com/palette-list/sweetie-16')
        expect(result.name).toBe('Sweetie 16')
        expect(result.colors).toHaveLength(3)
        expect(result.colors[0].hex).toBe('#1a1c2c')
    })

    it('handles URL with .json suffix already', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({name: 'Test', colors: ['ff0000']}),
        }))

        const result = await fetchLospecPalette('https://lospec.com/palette-list/test.json')
        expect(result.name).toBe('Test')
        // Ensure fetch was called with .json (no double .json)
        expect(vi.mocked(fetch)).toHaveBeenCalledWith('https://lospec.com/palette-list/test.json')
    })

    it('throws for non-lospec hostname', async () => {
        await expect(fetchLospecPalette('https://example.com/palette-list/foo')).rejects.toThrow('Not a lospec.com URL')
    })

    it('throws on non-ok HTTP status', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
        }))

        await expect(fetchLospecPalette('https://lospec.com/palette-list/missing')).rejects.toThrow('404')
    })

    it('propagates network errors', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

        await expect(fetchLospecPalette('https://lospec.com/palette-list/foo')).rejects.toThrow('Network error')
    })
})
