import { createPortal } from 'react-dom'
import type { Dispatch } from 'react'
import type { AppAction } from '@store/types'
import type { Shape, ShapeType } from '@model/shapes'
import { createShape } from '@utils/shapeFactory'
import { ContextMenu, type ContextMenuGroup } from '../tree/ContextMenu'
import type { CanvasContextMenuState } from './useCanvasPointer'

interface Props {
  menuState: CanvasContextMenuState
  shapes: Record<string, Shape>
  activePageId: string | null
  dispatch: Dispatch<AppAction>
  onClose: () => void
}

const ADD_SHAPE_TYPES: { type: ShapeType; label: string }[] = [
  { type: 'rect',   label: 'Rectangle' },
  { type: 'circle', label: 'Circle' },
  { type: 'line',   label: 'Line' },
  { type: 'text',   label: 'Text' },
  { type: 'image',  label: 'Image' },
  { type: 'button', label: 'Button' },
  { type: 'panel',  label: 'Panel' },
  { type: 'slider', label: 'Slider' },
]

export function CanvasContextMenu({ menuState, shapes, activePageId, dispatch, onClose }: Props) {
  const { screenX, screenY, canvasX, canvasY, shapeId } = menuState
  const shape = shapeId ? shapes[shapeId] : null

  const addShape = (type: ShapeType, parentId: string | null) => {
    const newShape = createShape(type, canvasX, canvasY)
    dispatch({ type: 'ADD_SHAPE', parentId, shape: newShape })
    dispatch({ type: 'SELECT_SHAPES', ids: [newShape.id], additive: false })
  }

  const addItems = ADD_SHAPE_TYPES.map(opt => ({
    label: opt.label,
    onClick: () => addShape(opt.type, shapeId ?? activePageId),
  }))

  let groups: ContextMenuGroup[]

  if (shape && shape.type !== 'page') {
    groups = [
      {
        items: [
          { label: 'Add Child Shape', onClick: () => {}, disabled: true },
          ...addItems,
        ],
      },
      {
        items: [
          {
            label: 'Bring to Front',
            icon: '⬆',
            onClick: () => dispatch({ type: 'REORDER_SHAPE', id: shapeId!, direction: 'to-front' }),
          },
          {
            label: 'Send to Back',
            icon: '⬇',
            onClick: () => dispatch({ type: 'REORDER_SHAPE', id: shapeId!, direction: 'to-back' }),
          },
          {
            label: 'Move Up',
            icon: '↑',
            onClick: () => dispatch({ type: 'REORDER_SHAPE', id: shapeId!, direction: 'up' }),
          },
          {
            label: 'Move Down',
            icon: '↓',
            onClick: () => dispatch({ type: 'REORDER_SHAPE', id: shapeId!, direction: 'down' }),
          },
        ],
      },
      {
        items: [
          {
            label: shape.visible ? 'Hide' : 'Show',
            icon: shape.visible ? '👁' : '🚫',
            onClick: () => dispatch({ type: 'PATCH_SHAPE', id: shapeId!, patch: { visible: !shape.visible } }),
          },
          {
            label: shape.locked ? 'Unlock' : 'Lock',
            icon: shape.locked ? '🔓' : '🔒',
            onClick: () => dispatch({ type: 'PATCH_SHAPE', id: shapeId!, patch: { locked: !shape.locked } }),
          },
        ],
      },
      {
        items: [
          {
            label: 'Delete',
            icon: '✕',
            danger: true,
            onClick: () => {
              dispatch({ type: 'DELETE_SHAPES', ids: [shapeId!] })
              dispatch({ type: 'DESELECT_ALL' })
            },
          },
        ],
      },
    ]
  } else {
    // Empty canvas or page shape — add to active page
    groups = [
      {
        items: [
          { label: 'Add Shape', onClick: () => {}, disabled: true },
          ...addItems,
        ],
      },
    ]
  }

  return createPortal(
    <ContextMenu x={screenX} y={screenY} groups={groups} onClose={onClose} />,
    document.body,
  )
}
