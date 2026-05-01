import {buildGoogleFontHref, parseGoogleFontMetadata} from '@utils/fontFeatures'
import {describe, expect, it} from 'vitest'

describe('buildGoogleFontHref', () => {
    it('uses the legacy weight request for static fonts', () => {
        expect(buildGoogleFontHref({
            name: 'Roboto',
            isVariable: false,
            axes: [],
        })).toBe('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap')
    })

    it('builds an alphabetized variable request and expands ital into tuples', () => {
        expect(buildGoogleFontHref({
            name: 'Roboto Flex',
            isVariable: true,
            axes: [
                {tag: 'wght', min: 100, max: 1000, default: 400},
                {tag: 'ital', min: 0, max: 1, default: 0},
                {tag: 'wdth', min: 25, max: 151, default: 100},
            ],
        })).toBe(
            'https://fonts.googleapis.com/css2?family=Roboto+Flex:ital,wdth,wght@0,25..151,100..1000;1,25..151,100..1000&display=swap'
        )
    })

    it('keeps custom axes in the CSS request', () => {
        expect(buildGoogleFontHref({
            name: 'Roboto Flex',
            isVariable: true,
            axes: [
                {tag: 'GRAD', min: -200, max: 150, default: 0},
                {tag: 'XOPQ', min: 27, max: 175, default: 96},
                {tag: 'XTRA', min: 323, max: 603, default: 468},
                {tag: 'YOPQ', min: 25, max: 135, default: 79},
                {tag: 'YTAS', min: 649, max: 854, default: 750},
                {tag: 'YTDE', min: -305, max: -98, default: -203},
                {tag: 'YTFI', min: 560, max: 788, default: 738},
                {tag: 'YTLC', min: 416, max: 570, default: 514},
                {tag: 'YTUC', min: 528, max: 760, default: 712},
                {tag: 'opsz', min: 8, max: 144, default: 14},
                {tag: 'slnt', min: -10, max: 0, default: 0},
                {tag: 'wdth', min: 25, max: 151, default: 100},
                {tag: 'wght', min: 100, max: 1000, default: 400},
            ],
        })).toBe(
            'https://fonts.googleapis.com/css2?family=Roboto+Flex:GRAD,XOPQ,XTRA,YOPQ,YTAS,YTDE,YTFI,YTLC,YTUC,opsz,slnt,wdth,wght@-200..150,27..175,323..603,25..135,649..854,-305..-98,560..788,416..570,528..760,8..144,-10..0,25..151,100..1000&display=swap'
        )
    })

    it('builds a variable request for fonts with only custom axes', () => {
        expect(buildGoogleFontHref({
            name: 'Honk',
            isVariable: true,
            axes: [
                {tag: 'MORF', min: 0, max: 45, default: 15},
                {tag: 'SHLN', min: 0, max: 100, default: 50},
            ],
        })).toBe(
            'https://fonts.googleapis.com/css2?family=Honk:MORF,SHLN@0..45,0..100&display=swap'
        )
    })
})

describe('parseGoogleFontMetadata', () => {
    it('parses the Google Fonts metadata preamble', () => {
        const parsed = parseGoogleFontMetadata(`)]}'
{"family":"Roboto Flex","axes":[{"tag":"GRAD","min":-200,"max":150,"defaultValue":0}]}`)
        expect(parsed).toEqual({
            family: 'Roboto Flex',
            axes: [{tag: 'GRAD', min: -200, max: 150, defaultValue: 0}],
        })
    })
})
