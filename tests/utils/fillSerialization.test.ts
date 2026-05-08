import {describe, expect, it} from 'vitest'
import {fromJSON} from '../../src/utils/serialization'

describe('fromJSON fill migration', () => {
    const baseDoc = {
        version: 2,
        rootNodes: [],
        shapes: {},
        palettes: [],
        pageFolders: [],
        variables: [],
        images: [],
        pixelAssets: [],
        customFonts: [],
        gridSettings: {snapAlignment: true},
        gradients: [],
        sketchStyles: [],
    }

    it('passes through ColorFill with type discriminator', () => {
        const doc = {
            ...baseDoc,
            shapes: {
                s1: {
                    id: 's1', type: 'rect', name: 'r', locked: false, visible: true,
                    transform: {x:0,y:0,width:100,height:100,rotation:0},
                    fill: {type: 'color', color: '#ff0000', opacity: 1},
                    stroke: {type:'solid',color:'#000',width:1,opacity:1,dash:[]},
                    cornerRadius: 0,
                    boxShadow: [],
                }
            }
        }
        const loaded = fromJSON(JSON.stringify(doc))
        const s = loaded.shapes['s1'] as {fill: {type: string; color: string}}
        expect(s.fill.type).toBe('color')
        expect(s.fill.color).toBe('#ff0000')
    })

    it('migrates legacy fill {color, opacity} to ColorFill', () => {
        const doc = {
            ...baseDoc,
            shapes: {
                s1: {
                    id: 's1', type: 'rect', name: 'r', locked: false, visible: true,
                    transform: {x:0,y:0,width:100,height:100,rotation:0},
                    fill: {color: '#aabbcc', opacity: 0.5},
                    stroke: {type:'solid',color:'#000',width:1,opacity:1,dash:[]},
                    cornerRadius: 0,
                    boxShadow: [],
                }
            }
        }
        const loaded = fromJSON(JSON.stringify(doc))
        const s = loaded.shapes['s1'] as {fill: {type: string; color: string; opacity: number}}
        expect(s.fill.type).toBe('color')
        expect(s.fill.color).toBe('#aabbcc')
        expect(s.fill.opacity).toBe(0.5)
    })

    it('migrates legacy gradient fill to GradientFill', () => {
        const doc = {
            ...baseDoc,
            shapes: {
                s1: {
                    id: 's1', type: 'rect', name: 'r', locked: false, visible: true,
                    transform: {x:0,y:0,width:100,height:100,rotation:0},
                    fill: {
                        color: '#ff0000',
                        opacity: 1,
                        gradient: {
                            type: 'linear',
                            angle: 45,
                            stops: [{color: '#ff0000', position: 0}, {color: '#0000ff', position: 1}]
                        }
                    },
                    stroke: {type:'solid',color:'#000',width:1,opacity:1,dash:[]},
                    cornerRadius: 0,
                    boxShadow: [],
                }
            }
        }
        const loaded = fromJSON(JSON.stringify(doc))
        const s = loaded.shapes['s1'] as {fill: {type: string; gradientType: string; angle: number}}
        expect(s.fill.type).toBe('gradient')
        expect(s.fill.gradientType).toBe('linear')
        expect(s.fill.angle).toBe(45)
    })

    it('adds missing gradients and sketchStyles arrays', () => {
        const doc = {
            version: 2,
            rootNodes: [],
            shapes: {},
            palettes: [],
            pageFolders: [],
            variables: [],
            images: [],
            pixelAssets: [],
            customFonts: [],
            gridSettings: {snapAlignment: true},
        }
        const loaded = fromJSON(JSON.stringify(doc))
        expect(Array.isArray(loaded.gradients)).toBe(true)
        expect(Array.isArray(loaded.sketchStyles)).toBe(true)
    })
})
