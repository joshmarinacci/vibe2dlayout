import type { Dispatch } from 'react'
import type { TreeNode } from '@model/document'
import type { Shape } from '@model/shapes'
import type { AppAction } from '@store/types'
import type { TextStyleDef } from '@model/textStyle'
import { resolveShapeText } from '@model/textStyle'
import type { Variable } from '@model/variable'
import { resolveVariableBindings } from '@model/variable'
import { RectShape } from './shapes/RectShape'
import { CircleShapeComp } from './shapes/CircleShape'
import { LineShapeComp } from './shapes/LineShape'
import { TextShapeComp } from './shapes/TextShape'
import { ImageShapeComp } from './shapes/ImageShape'
import { PageShapeComp } from './shapes/PageShape'
import { ButtonShapeComp } from './shapes/ButtonShape'
import { IconShapeComp } from './shapes/IconShape'
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
import { GroupShapeComp } from './shapes/GroupShape'
import { ImageMockShapeComp } from './shapes/ImageMockShape'
import { ChartMockShapeComp } from './shapes/ChartMockShape'
import { PixelImageShapeComp } from './shapes/PixelImageShape'
import type { PixelAsset } from '@model/pixelAsset'

interface Props {
  nodes: TreeNode[]
  shapes: Record<string, Shape>
  selectedIds: string[]
  editingTextId: string | null
  dispatch: Dispatch<AppAction>
  handDrawn: boolean
  themeFontFamily: string
  textStyles?: TextStyleDef[]
  variables?: Variable[]
  pixelAssets?: Record<string, PixelAsset>
}

export function ShapeRenderer({ nodes, shapes, selectedIds, editingTextId, dispatch, handDrawn, themeFontFamily, textStyles = [], variables = [], pixelAssets = {} }: Props) {
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
            textStyles={textStyles}
            variables={variables}
            pixelAssets={pixelAssets}
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
  textStyles: TextStyleDef[]
  variables: Variable[]
  pixelAssets: Record<string, PixelAsset>
}

function ShapeNode({ node, shape, shapes, selectedIds, editingTextId, dispatch, handDrawn, themeFontFamily, textStyles, variables, pixelAssets }: ShapeNodeProps) {
  const isSelected = selectedIds.includes(shape.id)
  const isEditingText = editingTextId === shape.id
  // Per-shape override takes precedence over theme-level setting
  const effectiveHandDrawn = shape.handDrawn ?? handDrawn
  // Resolve text style references, then variable bindings, before rendering
  const resolvedShape = resolveVariableBindings(resolveShapeText(shape, textStyles), variables)

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: 'SELECT_SHAPES', ids: [shape.id], additive: e.shiftKey })
  }

  const TEXT_EDITABLE = new Set(['text', 'button', 'panel', 'label', 'textfield', 'checkbox', 'toggle', 'radio', 'select', 'stickynote', 'list', 'table'])
  const DRILLABLE = new Set(['frame', 'panel', 'dialog', 'scrollpanel', 'group'])

  const onDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (TEXT_EDITABLE.has(shape.type)) {
      dispatch({ type: 'START_TEXT_EDIT', id: shape.id })
    } else if (DRILLABLE.has(shape.type)) {
      dispatch({ type: 'ENTER_DRILL_MODE', containerId: shape.id })
    } else if (shape.type === 'pixelimage') {
      dispatch({ type: 'START_PIXEL_EDIT', assetId: shape.assetId })
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
      textStyles={textStyles}
      variables={variables}
      pixelAssets={pixelAssets}
    />
  ) : null

  const commonProps = { isSelected, onClick, onDoubleClick }

  switch (resolvedShape.type) {
    case 'rect':
      return <RectShape shape={resolvedShape} {...commonProps}>{children}</RectShape>
    case 'circle':
      return <CircleShapeComp shape={resolvedShape} {...commonProps}>{children}</CircleShapeComp>
    case 'line':
      return <LineShapeComp shape={resolvedShape} shapes={shapes} isSelected={isSelected} onClick={onClick} dispatch={dispatch} />
    case 'text':
      return <TextShapeComp shape={resolvedShape} isEditing={isEditingText} dispatch={dispatch} {...commonProps} />
    case 'image':
      return <ImageShapeComp shape={resolvedShape} {...commonProps} />
    case 'page':
      return <PageShapeComp shape={resolvedShape} {...commonProps}>{children}</PageShapeComp>
    case 'button':
      return <ButtonShapeComp shape={resolvedShape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'icon':
      return <IconShapeComp shape={resolvedShape} {...commonProps} />
    case 'panel':
      return <PanelShapeComp shape={resolvedShape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps}>{children}</PanelShapeComp>
    case 'slider':
      return <SliderShapeComp shape={resolvedShape} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'label':
      return <LabelShapeComp shape={resolvedShape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'textfield':
      return <TextFieldShapeComp shape={resolvedShape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'checkbox':
      return <CheckboxShapeComp shape={resolvedShape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'toggle':
      return <ToggleShapeComp shape={resolvedShape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'frame':
      return <FrameShapeComp shape={resolvedShape} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps}>{children}</FrameShapeComp>
    case 'dialog':
      return <DialogShapeComp shape={resolvedShape} dispatch={dispatch} handDrawn={effectiveHandDrawn} themeFontFamily={themeFontFamily} {...commonProps}>{children}</DialogShapeComp>
    case 'radio':
      return <RadioShapeComp shape={resolvedShape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'select':
      return <SelectShapeComp shape={resolvedShape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'progress':
      return <ProgressShapeComp shape={resolvedShape} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'stepper':
      return <StepperShapeComp shape={resolvedShape} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'stickynote':
      return <StickyNoteShapeComp shape={resolvedShape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'list':
      return <ListShapeComp shape={resolvedShape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'scrollpanel':
      return <ScrollPanelShapeComp shape={resolvedShape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps}>{children}</ScrollPanelShapeComp>
    case 'table':
      return <TableShapeComp shape={resolvedShape} isEditing={isEditingText} dispatch={dispatch} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'group':
      return <GroupShapeComp shape={resolvedShape} isSelected={isSelected} onClick={onClick} onDoubleClick={onDoubleClick}>{children}</GroupShapeComp>
    case 'imagemock':
      return <ImageMockShapeComp shape={resolvedShape} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'chartmock':
      return <ChartMockShapeComp shape={resolvedShape} handDrawn={effectiveHandDrawn} {...commonProps} />
    case 'pixelimage':
      return <PixelImageShapeComp shape={resolvedShape} asset={pixelAssets[resolvedShape.assetId]} {...commonProps} />
  }
}
