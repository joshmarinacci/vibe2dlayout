import {shapeRegistry} from '@powerups/shapeRegistry'
import type {ColorFill, Shape, ShapeType} from '@model/shapes'
import {defaultStroke, defaultText, defaultTransform,} from '@model/shapes'
import type {Theme} from '@model/theme'
import {generateId} from './idgen'

export function createShape(type: ShapeType | string, x = 50, y = 50, theme?: Theme): Shape {
    const id = generateId()
    const base = {id, name: type, locked: false, visible: true, powerUps: []}

    // Theme-derived defaults (fall back to original hand-drawn defaults)
    const fg = theme?.foreground ?? '#333333'
    const bg = theme?.background ?? '#ffffff'
    const bdr = theme?.border ?? '#333333'
    const bdrW = theme?.borderWidth ?? 1.5
    const bdrR = theme?.borderRadius ?? 4
    const font = theme?.fontFamily ?? 'Caveat, cursive'
    const size = theme?.fontSize ?? 16

    const themeStroke = () => ({...defaultStroke(), color: bdr, width: bdrW})
    const themeFill = (): ColorFill => ({type: 'color', color: bg, opacity: 1})
    const themeText = (content: string) => ({
        ...defaultText(content),
        fontFamily: font,
        fontSize: size,
        color: fg,
    })

    switch (type) {
        case 'rect':
            return {
                ...base, type: 'rect',
                transform: defaultTransform(x, y, 120, 80),
                fill: themeFill(),
                stroke: themeStroke(),
                cornerRadius: bdrR,
            }
        case 'circle':
            return {
                ...base, type: 'circle',
                transform: defaultTransform(x, y, 80, 80),
                fill: themeFill(),
                stroke: themeStroke(),
            }
        case 'line':
            return {
                ...base, type: 'line',
                start: {kind: 'free', point: {x, y}},
                end: {kind: 'free', point: {x: x + 100, y: y + 60}},
                route: {mode: 'straight', waypoints: []},
                stroke: {...themeStroke(), width: Math.max(bdrW, 2)},
                startArrow: 'none',
                endArrow: 'arrow',
            }
        case 'text':
            return {
                ...base, type: 'text',
                transform: defaultTransform(x, y, 150, 40),
                text: {...themeText('Text'), align: 'left'},
                fill: {type: 'color', color: 'transparent', opacity: 1},
            }
        case 'image':
            return {
                ...base, type: 'image',
                transform: defaultTransform(x, y, 200, 150),
                src: '',
                mimeType: 'image/png',
                preserveAspectRatio: true,
                opacity: 1,
            }
        case 'page':
            return {
                ...base, type: 'page',
                transform: defaultTransform(0, 0, 800, 600),
                fixedSize: null,
                background: '#f8f8f8',
                clipChildren: false,
            }
        case 'group':
            return {
                ...base, name: 'Group', type: 'group',
                transform: defaultTransform(x, y, 100, 100),
            }
        case 'pixelimage':
            return {
                ...base, name: 'Pixel Image', type: 'pixelimage',
                transform: defaultTransform(x, y, 128, 128),
                assetId: '',
            }
        default: {
            const regDef = shapeRegistry.get(type)
            if (regDef) return regDef.createDefault(x, y, theme)
            throw new Error(`Unknown shape type: ${type}`)
        }
    }
}
