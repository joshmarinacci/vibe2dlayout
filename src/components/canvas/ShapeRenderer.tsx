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
import { FrameShapeComp } from './shapes/FrameShape'
import { DialogShapeComp } from './shapes/DialogShape'
import { RadioShapeComp } from './shapes/RadioShape'
import { SelectShapeComp } from './shapes/SelectShape'
import { ProgressShapeComp } from './shapes/ProgressShape'
import { StepperShapeComp } from './shapes/StepperShape'
import { StickyNoteShapeComp } from './shapes/StickyNoteShape'
import { ListShapeComp } from './shapes/ListShape'
import { ScrollPanelShapeComp } from './shapes/ScrollPanelShape'
import { TableShapeComp } from './shapes/TableShape'

interface Props {
  nodes: TreeNode[]
  shapes: Record<string, Shape>
  selectedIds: string[]
  editingTextId: string | null
  dispatch: Dispatch<AppAction>
  handDrawn: boolean
  themeFontFamily: string
}

export function ShapeRenderer({ nodes, shapes, selectedIds, editingTextId, dispatch, handDrawn, themeFontFamily }: Props) {
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
            handDrawn={handDrawn}
            themeFontFamily={themeFontFamily}
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
  handDrawn: boolean
  themeFontFamily: string
}

function ShapeNode({ node, shape, shapes, selectedIds, editingTextId, dispatch, handDrawn, themeFontFamily }: ShapeNodeProps) {
  const isSelected = selectedIds.includes(shape.id)
  const isEditingText = editingTextId === shape.id
  // Per-shape override takes precedence over theme-level setting
  const effectiveHandDrawn = shape.handDrawn ?? handDrawn

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: 'SELECT_SHAPES', ids: [shape.id], additive: e.shiftKey })
  }

  const TEXT_EDITABLE = new Set(['text', 'button', 'panel', 'label', 'textfield', 'checkbox', 'toggle', 'radio', 'select', 'stickynote', 'list', 'table'])
  const DRILLABLE = new Set(['frame', 'panel', 'dialog', 'scrollpanel'])

  const onDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (TEXT_EDITABLE.has(shape.type)) {
      dispatch({ type: 'START_TEXT_EDIT', id: shape.id })
    } else if (DRILLABLE.has(shape.type)) {
      dispatch({ type: 'ENTER_DRILL_MODE', containerId: shape.id })
    }
  }

  const children = node.children.length > 0 ? (
    <ShapeRenderer
      nodes={node.children}
      shapes={shapes}
      selectedIds={selectedIds}
      editingTextId={editingTextId}
      dispatch={dispatch}
      handDrawn={handDrawn}
      themeFontFamily={themeFontFamily}
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
      return <ButtonShapeComp shape={shape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'panel':
      return <PanelShapeComp shape={shape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps}>{children}</PanelShapeComp>
    case 'slider':
      return <SliderShapeComp shape={shape} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'label':
      return <LabelShapeComp shape={shape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'textfield':
      return <TextFieldShapeComp shape={shape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'checkbox':
      return <CheckboxShapeComp shape={shape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'toggle':
      return <ToggleShapeComp shape={shape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'frame':
      return <FrameShapeComp shape={shape} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps}>{children}</FrameShapeComp>
    case 'dialog':
      return <DialogShapeComp shape={shape} dispatch={dispatch} handDrawn={effectiveHandDrawn} themeFontFamily={themeFontFamily} {...commonProps}>{children}</DialogShapeComp>
    case 'radio':
      return <RadioShapeComp shape={shape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'select':
      return <SelectShapeComp shape={shape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'progress':
      return <ProgressShapeComp shape={shape} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'stepper':
      return <StepperShapeComp shape={shape} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'stickynote':
      return <StickyNoteShapeComp shape={shape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'list':
      return <ListShapeComp shape={shape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'scrollpanel':
      return <ScrollPanelShapeComp shape={shape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps}>{children}</ScrollPanelShapeComp>
    case 'table':
      return <TableShapeComp shape={shape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
  }
}
