import type {ColorFill, Shape, ShapeType, StrokeStyle} from '@model/shapes'
import {defaultStroke, defaultText, defaultTransform,} from '@model/shapes'
import type {Theme} from '@model/theme'
import {generateId} from './idgen'

export function createShape(type: ShapeType, x = 50, y = 50, theme?: Theme): Shape {
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
    const formStroke = () => ({
        ...defaultStroke(),
        type: 'sketch',
        color: '#000000',
        width: 1
    } as StrokeStyle)
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
        case 'button':
            return {
                ...base, type: 'button',
                transform: defaultTransform(x, y, 100, 36),
                fill: {type: 'color', color: theme ? bg : '#3b82f6', opacity: 1},
                stroke: formStroke(),
                cornerRadius: bdrR,
                text: {...themeText('Button'), color: theme ? fg : '#ffffff'},
                icon: null,
            }
        case 'icon':
            return {
                ...base, type: 'icon',
                transform: defaultTransform(x, y, 40, 40),
                icon: {name: 'Star'},
                fill: {type: 'color', color: theme ? fg : '#333333', opacity: 1},
                stroke: {
                    type: 'solid',
                    color: theme ? fg : '#333333',
                    width: 0,
                    dash: [],
                    opacity: 1
                },
            }
        case 'panel':
            return {
                ...base, type: 'panel',
                transform: defaultTransform(x, y, 200, 150),
                fill: themeFill(),
                stroke: formStroke(),
                cornerRadius: bdrR,
                text: {...themeText('Panel'), align: 'left', fontWeight: 'bold'},
                clipChildren: false,
            }
        case 'tabbed-panel':
            return {
                ...base, name: 'Tabbed Panel', type: 'tabbed-panel',
                transform: defaultTransform(x, y, 240, 180),
                fill: themeFill(),
                stroke: formStroke(),
                cornerRadius: bdrR,
                text: {...themeText('Tab 1, Tab 2, Tab 3'), align: 'center', fontWeight: 'normal'},
                activeTab: 0,
                clipChildren: false,
            }
        case 'slider':
            return {
                ...base, type: 'slider',
                transform: defaultTransform(x, y, 160, 24),
                value: 0.5,
                ticks: 0,
                fill: {type: 'color', color: '#e5e7eb', opacity: 1},
                thumbFill: {type: 'color', color: theme ? bdr : '#3b82f6', opacity: 1},
                stroke: formStroke(),
            }
        case 'label':
            return {
                ...base, type: 'label',
                transform: defaultTransform(x, y, 100, 20),
                text: {...themeText('Label'), align: 'left', color: theme ? fg : '#555555'},
                fill: themeFill(),
                stroke: formStroke(),
            }
        case 'textfield':
            return {
                ...base, type: 'textfield',
                transform: defaultTransform(x, y, 160, 32),
                placeholder: 'Placeholder...',
                text: {...themeText(''), align: 'left', color: theme ? fg : '#333333'},
                fill: themeFill(),
                stroke: formStroke(),
            }
        case 'checkbox':
            return {
                ...base, type: 'checkbox',
                transform: defaultTransform(x, y, 120, 20),
                checked: false,
                text: {...themeText('Checkbox'), align: 'left', color: theme ? fg : '#333333'},
                fill: themeFill(),
                stroke: formStroke(),
            }
        case 'toggle':
            return {
                ...base, type: 'toggle',
                transform: defaultTransform(x, y, 130, 24),
                checked: false,
                text: {...themeText('Toggle'), align: 'left', color: theme ? fg : '#333333'},
                thumbFill: {type: 'color', color: theme ? bdr : '#3b82f6', opacity: 1},
                fill: themeFill(),
                stroke: formStroke(),
            }
        case 'frame':
            return {
                ...base, name: 'Frame', type: 'frame',
                transform: defaultTransform(x, y, 200, 150),
                fill: themeFill(),
                stroke: formStroke(),
                cornerRadius: bdrR,
                clipChildren: false,
            }
        case 'dialog':
            return {
                ...base, name: 'Dialog', type: 'dialog',
                transform: defaultTransform(x, y, 320, 220),
                fill: themeFill(),
                stroke: formStroke(),
                title: 'Dialog',
                text: {...themeText('Checkbox'), align: 'left', color: theme ? fg : '#333333'},
                okLabel: 'OK',
                cancelLabel: 'Cancel',
            }
        case 'radio':
            return {
                ...base, name: 'Radio', type: 'radio',
                transform: defaultTransform(x, y, 120, 20),
                checked: false,
                text: {...themeText('Option'), align: 'left', color: theme ? fg : '#333333'},
                fill: themeFill(),
                stroke: formStroke(),
            }
        case 'select':
            return {
                ...base, name: 'Select', type: 'select',
                transform: defaultTransform(x, y, 160, 32),
                value: '',
                placeholder: 'Select...',
                text: {...themeText(''), align: 'left', color: theme ? fg : '#333333'},
                fill: themeFill(),
                stroke: formStroke(),
            }
        case 'progress':
            return {
                ...base, name: 'Progress', type: 'progress',
                transform: defaultTransform(x, y, 200, 16),
                value: 60,
                ticks: 0,
                fill: {type: 'color', color: theme ? bdr : '#3b82f6', opacity: 1},
                progressFill: {type: 'color', color: '#e5e7eb', opacity: 1},
                stroke: formStroke(),
            }
        case 'stepper':
            return {
                ...base, name: 'Stepper', type: 'stepper',
                transform: defaultTransform(x, y, 140, 32),
                value: 0,
                text: {
                    ...themeText('0'),
                    color: theme ? fg : '#333333',
                    align: 'center',
                    verticalAlign: 'middle'
                },
                fill: themeFill(),
                stroke: formStroke(),
            }
        case 'table':
            return {
                ...base, name: 'Table', type: 'table',
                transform: defaultTransform(x, y, 240, 120),
                fill: themeFill(),
                stroke: formStroke(),
                text: {
                    ...themeText('Name,Age,City\nAlice,30,NYC\nBob,25,LA'),
                    align: 'left',
                    verticalAlign: 'top',
                    color: theme ? fg : '#333333'
                },
            }
        case 'stickynote':
            return {
                ...base, name: 'Sticky Note', type: 'stickynote',
                transform: defaultTransform(x, y, 160, 140),
                fill: {type: 'color', color: theme ? bg : '#fef08a', opacity: 1},
                stroke: formStroke(),
                text: {
                    ...themeText('Note...'),
                    align: 'left',
                    verticalAlign: 'top',
                    color: theme ? fg : '#333333'
                },
            }
        case 'list':
            return {
                ...base, name: 'List', type: 'list',
                transform: defaultTransform(x, y, 180, 160),
                fill: themeFill(),
                stroke: formStroke(),
                text: {
                    ...themeText('Item One\nItem Two\nItem Three'),
                    align: 'left',
                    verticalAlign: 'top',
                    color: theme ? fg : '#333333'
                },
                selectedIndex: 0,
            }
        case 'scrollpanel':
            return {
                ...base, name: 'Scroll Panel', type: 'scrollpanel',
                transform: defaultTransform(x, y, 200, 180),
                fill: themeFill(),
                stroke: formStroke(),
                cornerRadius: bdrR,
                scrollPosition: 0.2,
                clipChildren: false,
            }
        case 'group':
            return {
                ...base, name: 'Group', type: 'group',
                transform: defaultTransform(x, y, 100, 100),
            }
        case 'imagemock':
            return {
                ...base, name: 'Image Mock', type: 'imagemock',
                transform: defaultTransform(x, y, 160, 120),
                fill: themeFill(),
                stroke: formStroke(),
            }
        case 'chartmock':
            return {
                ...base, name: 'Chart Mock', type: 'chartmock',
                transform: defaultTransform(x, y, 200, 140),
                fill: {type: 'color', color: theme ? bdr : '#3b82f6', opacity: 1},
                stroke: formStroke(),
                chartType: 'bar',
            }
        case 'pixelimage':
            return {
                ...base, name: 'Pixel Image', type: 'pixelimage',
                transform: defaultTransform(x, y, 128, 128),
                assetId: '',
            }
    }
}
