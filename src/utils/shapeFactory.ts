import type { Shape, ShapeType } from '@model/shapes'
import {
  defaultFill, defaultStroke, defaultText, defaultTransform,
} from '@model/shapes'
import { generateId } from './idgen'

export function createShape(type: ShapeType, x = 50, y = 50): Shape {
  const id = generateId()
  const base = { id, name: type, locked: false, visible: true }

  switch (type) {
    case 'rect':
      return {
        ...base, type: 'rect',
        transform: defaultTransform(x, y, 120, 80),
        fill: defaultFill(),
        stroke: defaultStroke(),
        cornerRadius: 0,
        clipChildren: false,
      }
    case 'circle':
      return {
        ...base, type: 'circle',
        transform: defaultTransform(x, y, 80, 80),
        fill: defaultFill(),
        stroke: defaultStroke(),
        clipChildren: false,
      }
    case 'line':
      return {
        ...base, type: 'line',
        start: { kind: 'free', point: { x, y } },
        end: { kind: 'free', point: { x: x + 100, y: y + 60 } },
        route: { mode: 'straight', waypoints: [] },
        stroke: { ...defaultStroke(), width: 2 },
        startArrow: 'none',
        endArrow: 'arrow',
      }
    case 'text':
      return {
        ...base, type: 'text',
        transform: defaultTransform(x, y, 150, 40),
        text: defaultText('Text'),
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
        transform: defaultTransform(x, y, 800, 600),
        fixedSize: null,
        background: '#f8f8f8',
        clipChildren: false,
      }
    case 'button':
      return {
        ...base, type: 'button',
        transform: defaultTransform(x, y, 100, 36),
        fill: { color: '#3b82f6', opacity: 1 },
        stroke: defaultStroke(),
        cornerRadius: 6,
        text: { ...defaultText('Button'), fontFamily: 'Caveat, cursive', fontSize: 16, color: '#ffffff' },
        icon: null,
      }
    case 'panel':
      return {
        ...base, type: 'panel',
        transform: defaultTransform(x, y, 200, 150),
        fill: { color: '#ffffff', opacity: 1 },
        stroke: defaultStroke(),
        cornerRadius: 4,
        title: { ...defaultText('Panel'), fontFamily: 'Caveat, cursive', align: 'left', fontSize: 15, fontWeight: 'bold' },
        clipChildren: false,
      }
    case 'slider':
      return {
        ...base, type: 'slider',
        transform: defaultTransform(x, y, 160, 24),
        value: 0.5,
        trackFill: { color: '#e5e7eb', opacity: 1 },
        thumbFill: { color: '#3b82f6', opacity: 1 },
        stroke: defaultStroke(),
      }
    case 'label':
      return {
        ...base, type: 'label',
        transform: defaultTransform(x, y, 100, 20),
        text: { ...defaultText('Label'), fontFamily: 'Caveat, cursive', fontSize: 15, align: 'left', color: '#555555' },
      }
    case 'textfield':
      return {
        ...base, type: 'textfield',
        transform: defaultTransform(x, y, 160, 32),
        placeholder: 'Placeholder...',
        text: { ...defaultText(''), fontFamily: 'Caveat, cursive', fontSize: 15, align: 'left', color: '#333333' },
        fill: { color: '#ffffff', opacity: 1 },
        stroke: defaultStroke(),
      }
    case 'checkbox':
      return {
        ...base, type: 'checkbox',
        transform: defaultTransform(x, y, 120, 20),
        checked: false,
        text: { ...defaultText('Checkbox'), fontFamily: 'Caveat, cursive', fontSize: 15, align: 'left', color: '#333333' },
        fill: { color: '#ffffff', opacity: 1 },
        stroke: defaultStroke(),
      }
    case 'toggle':
      return {
        ...base, type: 'toggle',
        transform: defaultTransform(x, y, 130, 24),
        checked: false,
        text: { ...defaultText('Toggle'), fontFamily: 'Caveat, cursive', fontSize: 15, align: 'left', color: '#333333' },
        trackFill: { color: '#e5e7eb', opacity: 1 },
        thumbFill: { color: '#3b82f6', opacity: 1 },
        stroke: defaultStroke(),
      }
    case 'frame':
      return {
        ...base, name: 'Frame', type: 'frame',
        transform: defaultTransform(x, y, 200, 150),
        fill: { color: '#ffffff', opacity: 1 },
        stroke: defaultStroke(),
        cornerRadius: 4,
        clipChildren: false,
      }
    case 'dialog':
      return {
        ...base, name: 'Dialog', type: 'dialog',
        transform: defaultTransform(x, y, 320, 220),
        fill: { color: '#ffffff', opacity: 1 },
        stroke: defaultStroke(),
        title: 'Dialog',
        titleFontSize: 15,
        okLabel: 'OK',
        cancelLabel: 'Cancel',
      }
    case 'radio':
      return {
        ...base, name: 'Radio', type: 'radio',
        transform: defaultTransform(x, y, 120, 20),
        checked: false,
        text: { ...defaultText('Option'), fontFamily: 'Caveat, cursive', fontSize: 15, align: 'left', color: '#333333' },
        fill: { color: '#ffffff', opacity: 1 },
        stroke: defaultStroke(),
      }
    case 'select':
      return {
        ...base, name: 'Select', type: 'select',
        transform: defaultTransform(x, y, 160, 32),
        value: '',
        placeholder: 'Select...',
        text: { ...defaultText(''), fontFamily: 'Caveat, cursive', fontSize: 15, align: 'left', color: '#333333' },
        fill: { color: '#ffffff', opacity: 1 },
        stroke: defaultStroke(),
      }
    case 'progress':
      return {
        ...base, name: 'Progress', type: 'progress',
        transform: defaultTransform(x, y, 200, 16),
        value: 60,
        fill: { color: '#3b82f6', opacity: 1 },
        trackFill: { color: '#e5e7eb', opacity: 1 },
        stroke: defaultStroke(),
      }
    case 'stepper':
      return {
        ...base, name: 'Stepper', type: 'stepper',
        transform: defaultTransform(x, y, 140, 32),
        value: 0,
        text: { ...defaultText('0'), fontFamily: 'Caveat, cursive', fontSize: 15, color: '#333333', align: 'center', verticalAlign: 'middle' },
        fill: { color: '#ffffff', opacity: 1 },
        stroke: defaultStroke(),
      }
  }
}
