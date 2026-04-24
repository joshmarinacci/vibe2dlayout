import type { Shape, ShapeType } from '@model/shapes'
import {
  defaultStroke, defaultText, defaultTransform,
} from '@model/shapes'
import { generateId } from './idgen'
import type { Theme } from '@model/theme'

export function createShape(type: ShapeType, x = 50, y = 50, theme?: Theme): Shape {
  const id = generateId()
  const base = { id, name: type, locked: false, visible: true }

  // Theme-derived defaults (fall back to original hand-drawn defaults)
  const fg    = theme?.foreground   ?? '#333333'
  const bg    = theme?.background   ?? '#ffffff'
  const bdr   = theme?.border       ?? '#333333'
  const bdrW  = theme?.borderWidth  ?? 1.5
  const bdrR  = theme?.borderRadius ?? 4
  const font  = theme?.fontFamily   ?? 'Caveat, cursive'
  const size  = theme?.fontSize     ?? 16

  const themeStroke = () => ({ ...defaultStroke(), color: bdr, width: bdrW })
  const themeFill   = () => ({ color: bg, opacity: 1 })
  const themeText   = (content: string) => ({
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
        clipChildren: false,
      }
    case 'circle':
      return {
        ...base, type: 'circle',
        transform: defaultTransform(x, y, 80, 80),
        fill: themeFill(),
        stroke: themeStroke(),
        clipChildren: false,
      }
    case 'line':
      return {
        ...base, type: 'line',
        start: { kind: 'free', point: { x, y } },
        end: { kind: 'free', point: { x: x + 100, y: y + 60 } },
        route: { mode: 'straight', waypoints: [] },
        stroke: { ...themeStroke(), width: Math.max(bdrW, 2) },
        startArrow: 'none',
        endArrow: 'arrow',
      }
    case 'text':
      return {
        ...base, type: 'text',
        transform: defaultTransform(x, y, 150, 40),
        text: { ...themeText('Text'), align: 'left' },
        fill: { color: 'transparent', opacity: 0 },
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
        fill: { color: theme ? bg : '#3b82f6', opacity: 1 },
        stroke: themeStroke(),
        cornerRadius: bdrR,
        text: { ...themeText('Button'), color: theme ? fg : '#ffffff' },
        icon: null,
      }
    case 'icon':
      return {
        ...base, type: 'icon',
        transform: defaultTransform(x, y, 40, 40),
        icon: { name: 'Star' },
        fill: { color: theme ? fg : '#333333', opacity: 1 },
        stroke: { color: theme ? fg : '#333333', width: 0, dash: [], opacity: 1 },
      }
    case 'panel':
      return {
        ...base, type: 'panel',
        transform: defaultTransform(x, y, 200, 150),
        fill: themeFill(),
        stroke: themeStroke(),
        cornerRadius: bdrR,
        title: { ...themeText('Panel'), align: 'left', fontWeight: 'bold' },
        clipChildren: false,
      }
    case 'slider':
      return {
        ...base, type: 'slider',
        transform: defaultTransform(x, y, 160, 24),
        value: 0.5,
        ticks: 0,
        trackFill: { color: '#e5e7eb', opacity: 1 },
        thumbFill: { color: theme ? bdr : '#3b82f6', opacity: 1 },
        stroke: themeStroke(),
      }
    case 'label':
      return {
        ...base, type: 'label',
        transform: defaultTransform(x, y, 100, 20),
        text: { ...themeText('Label'), align: 'left', color: theme ? fg : '#555555' },
      }
    case 'textfield':
      return {
        ...base, type: 'textfield',
        transform: defaultTransform(x, y, 160, 32),
        placeholder: 'Placeholder...',
        text: { ...themeText(''), align: 'left', color: theme ? fg : '#333333' },
        fill: themeFill(),
        stroke: themeStroke(),
      }
    case 'checkbox':
      return {
        ...base, type: 'checkbox',
        transform: defaultTransform(x, y, 120, 20),
        checked: false,
        text: { ...themeText('Checkbox'), align: 'left', color: theme ? fg : '#333333' },
        fill: themeFill(),
        stroke: themeStroke(),
      }
    case 'toggle':
      return {
        ...base, type: 'toggle',
        transform: defaultTransform(x, y, 130, 24),
        checked: false,
        text: { ...themeText('Toggle'), align: 'left', color: theme ? fg : '#333333' },
        trackFill: { color: '#e5e7eb', opacity: 1 },
        thumbFill: { color: theme ? bdr : '#3b82f6', opacity: 1 },
        stroke: themeStroke(),
      }
    case 'frame':
      return {
        ...base, name: 'Frame', type: 'frame',
        transform: defaultTransform(x, y, 200, 150),
        fill: themeFill(),
        stroke: themeStroke(),
        cornerRadius: bdrR,
        clipChildren: false,
      }
    case 'dialog':
      return {
        ...base, name: 'Dialog', type: 'dialog',
        transform: defaultTransform(x, y, 320, 220),
        fill: themeFill(),
        stroke: themeStroke(),
        title: 'Dialog',
        titleFontSize: size,
        titleFontFamily: font,
        titleColor: fg,
        okLabel: 'OK',
        cancelLabel: 'Cancel',
      }
    case 'radio':
      return {
        ...base, name: 'Radio', type: 'radio',
        transform: defaultTransform(x, y, 120, 20),
        checked: false,
        text: { ...themeText('Option'), align: 'left', color: theme ? fg : '#333333' },
        fill: themeFill(),
        stroke: themeStroke(),
      }
    case 'select':
      return {
        ...base, name: 'Select', type: 'select',
        transform: defaultTransform(x, y, 160, 32),
        value: '',
        placeholder: 'Select...',
        text: { ...themeText(''), align: 'left', color: theme ? fg : '#333333' },
        fill: themeFill(),
        stroke: themeStroke(),
      }
    case 'progress':
      return {
        ...base, name: 'Progress', type: 'progress',
        transform: defaultTransform(x, y, 200, 16),
        value: 60,
        ticks: 0,
        fill: { color: theme ? bdr : '#3b82f6', opacity: 1 },
        trackFill: { color: '#e5e7eb', opacity: 1 },
        stroke: themeStroke(),
      }
    case 'stepper':
      return {
        ...base, name: 'Stepper', type: 'stepper',
        transform: defaultTransform(x, y, 140, 32),
        value: 0,
        text: { ...themeText('0'), color: theme ? fg : '#333333', align: 'center', verticalAlign: 'middle' },
        fill: themeFill(),
        stroke: themeStroke(),
      }
    case 'table':
      return {
        ...base, name: 'Table', type: 'table',
        transform: defaultTransform(x, y, 240, 120),
        fill: themeFill(),
        stroke: themeStroke(),
        text: { ...themeText('Name,Age,City\nAlice,30,NYC\nBob,25,LA'), align: 'left', verticalAlign: 'top', color: theme ? fg : '#333333' },
      }
    case 'stickynote':
      return {
        ...base, name: 'Sticky Note', type: 'stickynote',
        transform: defaultTransform(x, y, 160, 140),
        fill: { color: theme ? bg : '#fef08a', opacity: 1 },
        stroke: themeStroke(),
        text: { ...themeText('Note...'), align: 'left', verticalAlign: 'top', color: theme ? fg : '#333333' },
      }
    case 'list':
      return {
        ...base, name: 'List', type: 'list',
        transform: defaultTransform(x, y, 180, 160),
        fill: themeFill(),
        stroke: themeStroke(),
        text: { ...themeText('Item One\nItem Two\nItem Three'), align: 'left', verticalAlign: 'top', color: theme ? fg : '#333333' },
        selectedIndex: 0,
      }
    case 'scrollpanel':
      return {
        ...base, name: 'Scroll Panel', type: 'scrollpanel',
        transform: defaultTransform(x, y, 200, 180),
        fill: themeFill(),
        stroke: themeStroke(),
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
        stroke: themeStroke(),
      }
    case 'chartmock':
      return {
        ...base, name: 'Chart Mock', type: 'chartmock',
        transform: defaultTransform(x, y, 200, 140),
        fill: { color: theme ? bdr : '#3b82f6', opacity: 1 },
        stroke: themeStroke(),
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
