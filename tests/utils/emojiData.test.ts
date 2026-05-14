import {describe, expect, it} from 'vitest'
import {searchEmojis} from '@utils/emojiData'

describe('searchEmojis', () => {
    it('returns empty array for empty query', () => {
        expect(searchEmojis('')).toEqual([])
    })

    it('finds exact prefix match', () => {
        const results = searchEmojis('fire')
        expect(results.length).toBeGreaterThan(0)
        expect(results[0].name).toBe('fire')
        expect(results[0].char).toBe('🔥')
    })

    it('prefix matches come before contains matches', () => {
        const results = searchEmojis('heart')
        const firstContainsIdx = results.findIndex(r => !r.name.startsWith('heart'))
        if (firstContainsIdx !== -1) {
            // Everything before the first contains match must be a prefix match
            for (let i = 0; i < firstContainsIdx; i++) {
                expect(results[i].name.startsWith('heart')).toBe(true)
            }
            // Everything from the first contains match on must include 'heart'
            for (let i = firstContainsIdx; i < results.length; i++) {
                expect(results[i].name.includes('heart')).toBe(true)
            }
        }
        // 'heart-decoration' is a prefix match and should be present
        expect(results.some(r => r.name === 'heart-decoration')).toBe(true)
    })

    it('is case-insensitive', () => {
        const lower = searchEmojis('fire')
        const upper = searchEmojis('FIRE')
        expect(lower).toEqual(upper)
    })

    it('finds thumbs-up by query thumbs', () => {
        const results = searchEmojis('thumbs')
        const names = results.map(r => r.name)
        expect(names).toContain('thumbs-up')
        expect(names).toContain('thumbs-down')
    })

    it('returns no more than 20 results', () => {
        const results = searchEmojis('face')
        expect(results.length).toBeLessThanOrEqual(20)
    })

    it('returns empty for query with no matches', () => {
        expect(searchEmojis('xyzzy-does-not-exist')).toEqual([])
    })

    it('finds emoji by partial name', () => {
        const results = searchEmojis('rocket')
        expect(results.length).toBeGreaterThan(0)
        expect(results[0].char).toBe('🚀')
    })

    it('finds contains match when no prefix match', () => {
        // 'up' is in 'thumbs-up' but 'up-button' starts with 'up'
        const results = searchEmojis('up')
        const upButton = results.find(r => r.name === 'up-button')
        const thumbsUp = results.find(r => r.name === 'thumbs-up')
        expect(upButton).toBeDefined()
        expect(thumbsUp).toBeDefined()
        // up-button is a prefix match, should come before thumbs-up (contains)
        const upButtonIdx = results.indexOf(upButton!)
        const thumbsUpIdx = results.indexOf(thumbsUp!)
        expect(upButtonIdx).toBeLessThan(thumbsUpIdx)
    })
})
