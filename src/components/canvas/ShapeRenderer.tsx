import type { Dispatch } from 'react'
import type { TreeNode } from '@model/document'
import type { Shape } from '@model/shapes'
import type { AppAction } from '@store/types'
import { RectShape } from './shapes/RectShape'
import { CircleShapeComp } from './shapes/CircleShape'
import { LineShapeComp } from './shapes/LineShape'
import { TextShapeComp } from './shapes/TextShape'
import { ImageShapeComp } from './shapes/ImageShape'
import { PageShapeComp } from './shapes/PageShape'
import { ButtonShapeComp } from './shapes/ButtonShape'
import { PanelShapeComp } from './shapes/PanelShape'
import { SliderShapeComp } from './shapes/SliderShape'
import { LabelShapeComp } from './shapes/LabelShape'
import { TextFieldShapeComp } from './shapes/TextFieldShape'
import { CheckboxShapeComp } from './shapes/CheckboxShape'
import { ToggleShapeComp } from './shapes/ToggleShape'

interface Props {
  nodes: TreeNode[]
  shapes: Record<string, Shape>
  selectedIds: string[]
  editingTextId: string | null
  dispatch: Dispatch<AppAction>
}

export function ShapeRenderer({ nodes, shapes, selectedIds, editingTextId, dispatch }: Props) {
  return (
    <>
      {nodes.map(node => {
        const shape = shapes[node.id]
        if (!shape || !shape.visible) return null
        return (
          <ShapeNode
            key={node.id}
            node={node}
            shape={shape}
            shapes={shapes}
            selectedIds={selectedIds}
            editingTextId={editingTextId}
            dispatch={dispatch}
          />
        )
      })}
    </>
  )
}

interface ShapeNodeProps {
  node: TreeNode
  shape: Shape
  shapes: Record<string, Shape>
  selectedIds: string[]
  editingTextId: string | null
  dispatch: Dispatch<AppAction>
}

function ShapeNode({ node, shape, shapes, selectedIds, editingTextId, dispatch }: ShapeNodeProps) {
  const isSelected = selectedIds.includes(shape.id)
  const isEditingText = editingTextId === shape.id

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: 'SELECT_SHAPES', ids: [shape.id], additive: e.shiftKey })
  }

  const TEXT_EDITABLE = new Set(['text', 'button', 'panel', 'label', 'textfield', 'checkbox', 'toggle'])

  const onDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (TEXT_EDITABLE.has(shape.type)) {
      dispatch({ type: 'START_TEXT_EDIT', id: shape.id })
    }
  }

  const children = node.children.length > 0 ? (
    <ShapeRenderer
      nodes={node.children}
      shapes={shapes}
      selectedIds={selectedIds}
      editingTextId={editingTextId}
      dispatch={dispatch}
    />
  ) : null

  const commonProps = { isSelected, onClick, onDoubleClick }

  switch (shape.type) {
    case 'rect':
      return <RectShape shape={shape} {...commonProps}>{children}</RectShape>
    case 'circle':
      return <CircleShapeComp shape={shape} {...commonProps}>{children}</CircleShapeComp>
    case 'line':
      return <LineShapeComp shape={shape} shapes={shapes} isSelected={isSelected} onClick={onClick} dispatch={dispatch} />
    case 'text':
      return <TextShapeComp shape={shape} isEditing={isEditingText} dispatch={dispatch} {...commonProps} />
    case 'image':
      return <ImageShapeComp shape={shape} {...commonProps} />
    case 'page':
      return <PageShapeComp shape={shape} {...commonProps}>{children}</PageShapeComp>
    case 'button':
      return <ButtonShapeComp shape={shape} isEditing={isEditingText} dispatch={dispatch} {...commonProps} />
    case 'panel':
      return <PanelShapeComp shape={shape} isEditing={isEditingText} dispatch={dispatch} {...commonProps}>{children}</PanelShapeComp>
    case 'slider':
      return <SliderShapeComp shape={shape} {...commonProps} />
    case 'label':
      return <LabelShapeComp shape={shape} isEditing={isEditingText} dispatch={dispatch} {...commonProps} />
    case 'textfield':
      return <TextFieldShapeComp shape={shape} isEditing={isEditingText} dispatch={dispatch} {...commonProps} />
    case 'checkbox':
      return <CheckboxShapeComp shape={shape} isEditing={isEditingText} dispatch={dispatch} {...commonProps} />
    case 'toggle':
      return <ToggleShapeComp shape={shape} isEditing={isEditingText} dispatch={dispatch} {...commonProps} />
  }
}
