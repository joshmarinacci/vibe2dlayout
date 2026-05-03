import type {TreeNode} from '@model/document'
import type {PixelAsset} from '@model/pixelAsset'
import type {FormShape, Shape} from '@model/shapes'
import type {Variable} from '@model/variable'
import {resolveVariableBindings} from '@model/variable'
import type {AppAction} from '@store/types'
import type {Dispatch} from 'react'
import {ButtonShapeComp} from './shapes/ButtonShape'
import {ChartMockShapeComp} from './shapes/ChartMockShape'
import {CheckboxShapeComp} from './shapes/CheckboxShape'
import {CircleShapeComp} from './shapes/CircleShape'
import {DialogShapeComp} from './shapes/DialogShape'
import {FrameShapeComp} from './shapes/FrameShape'
import {GroupShapeComp} from './shapes/GroupShape'
import {IconShapeComp} from './shapes/IconShape'
import {ImageMockShapeComp} from './shapes/ImageMockShape'
import {ImageShapeComp} from './shapes/ImageShape'
import {LabelShapeComp} from './shapes/LabelShape'
import {LineShapeComp} from './shapes/LineShape'
import {ListShapeComp} from './shapes/ListShape'
import {PageShapeComp} from './shapes/PageShape'
import {PanelShapeComp} from './shapes/PanelShape'
import {PixelImageShapeComp} from './shapes/PixelImageShape'
import {ProgressShapeComp} from './shapes/ProgressShape'
import {RadioShapeComp} from './shapes/RadioShape'
import {RectShape} from './shapes/RectShape'
import {ScrollPanelShapeComp} from './shapes/ScrollPanelShape'
import {SelectShapeComp} from './shapes/SelectShape'
import {SliderShapeComp} from './shapes/SliderShape'
import {StepperShapeComp} from './shapes/StepperShape'
import {StickyNoteShapeComp} from './shapes/StickyNoteShape'
import {TabbedPanelShapeComp} from './shapes/TabbedPanelShape'
import {TableShapeComp} from './shapes/TableShape'
import {TextFieldShapeComp} from './shapes/TextFieldShape'
import {TextShapeComp} from './shapes/TextShape'
import {ToggleShapeComp} from './shapes/ToggleShape'

interface Props {
    nodes: TreeNode[]
    shapes: Record<string, Shape>
    selectedIds: string[]
    editingTextId: string | null
    dispatch: Dispatch<AppAction>
    handDrawn: boolean
    themeFontFamily: string
    variables?: Variable[]
    pixelAssets?: Record<string, PixelAsset>
}

export function ShapeRenderer({
                                  nodes,
                                  shapes,
                                  selectedIds,
                                  editingTextId,
                                  dispatch,
                                  handDrawn,
                                  themeFontFamily,
                                  variables = [],
                                  pixelAssets = {}
                              }: Props) {
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
    variables: Variable[]
    pixelAssets: Record<string, PixelAsset>
}

function ShapeNode({
                       node,
                       shape,
                       shapes,
                       selectedIds,
                       editingTextId,
                       dispatch,
                       handDrawn,
                       themeFontFamily,
                       variables,
                       pixelAssets
                   }: ShapeNodeProps) {
    const isSelected = selectedIds.includes(shape.id)
    const isEditingText = editingTextId === shape.id
    // Per-shape override takes precedence over theme-level setting
    let effectiveHandDrawn = false;
    if ('stroke' in shape) {
        let formShape = shape as FormShape;
        if (formShape.stroke.type === 'sketch') {
            effectiveHandDrawn = true
        }
    }
    const resolvedShape = resolveVariableBindings(shape, variables)

    const onClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        dispatch({type: 'SELECT_SHAPES', ids: [shape.id], additive: e.shiftKey})
    }

    const TEXT_EDITABLE = new Set(['text', 'button', 'panel', 'label', 'textfield', 'checkbox', 'toggle', 'radio', 'select', 'stickynote', 'list', 'table'])
    const DRILLABLE = new Set(['frame', 'panel', 'tabbed-panel', 'dialog', 'scrollpanel', 'group'])

    const onDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (TEXT_EDITABLE.has(shape.type)) {
            dispatch({type: 'START_TEXT_EDIT', id: shape.id})
        } else if (DRILLABLE.has(shape.type)) {
            dispatch({type: 'ENTER_DRILL_MODE', containerId: shape.id})
        } else if (shape.type === 'pixelimage') {
            dispatch({type: 'START_PIXEL_EDIT', assetId: shape.assetId})
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
            variables={variables}
            pixelAssets={pixelAssets}
        />
    ) : null

    const commonProps = {isSelected, onClick, onDoubleClick}

    switch (resolvedShape.type) {
        case 'rect':
            return <RectShape shape={resolvedShape} {...commonProps}>{children}</RectShape>
        case 'circle':
            return <CircleShapeComp
                shape={resolvedShape} {...commonProps}>{children}</CircleShapeComp>
        case 'line':
            return <LineShapeComp shape={resolvedShape} shapes={shapes} isSelected={isSelected}
                                  onClick={onClick} dispatch={dispatch}/>
        case 'text':
            return <TextShapeComp shape={resolvedShape} isEditing={isEditingText}
                                  dispatch={dispatch} {...commonProps} />
        case 'image':
            return <ImageShapeComp shape={resolvedShape} {...commonProps} />
        case 'page':
            return <PageShapeComp shape={resolvedShape} {...commonProps}>{children}</PageShapeComp>
        case 'button':
            return <ButtonShapeComp shape={resolvedShape} isEditing={isEditingText}
                                    dispatch={dispatch}
                                    handDrawn={effectiveHandDrawn} {...commonProps} />
        case 'icon':
            return <IconShapeComp shape={resolvedShape} {...commonProps} />
        case 'panel':
            return <PanelShapeComp shape={resolvedShape} isEditing={isEditingText}
                                   dispatch={dispatch}
                                   handDrawn={effectiveHandDrawn} {...commonProps}>{children}</PanelShapeComp>
        case 'tabbed-panel':
            return <TabbedPanelShapeComp shape={resolvedShape} isEditing={isEditingText}
                                         dispatch={dispatch}
                                         handDrawn={effectiveHandDrawn} {...commonProps}>{children}</TabbedPanelShapeComp>
        case 'slider':
            return <SliderShapeComp shape={resolvedShape}
                                    handDrawn={effectiveHandDrawn} {...commonProps} />
        case 'label':
            return <LabelShapeComp shape={resolvedShape} isEditing={isEditingText}
                                   dispatch={dispatch}
                                   handDrawn={effectiveHandDrawn} {...commonProps} />
        case 'textfield':
            return <TextFieldShapeComp shape={resolvedShape} isEditing={isEditingText}
                                       dispatch={dispatch}
                                       handDrawn={effectiveHandDrawn} {...commonProps} />
        case 'checkbox':
            return <CheckboxShapeComp shape={resolvedShape} isEditing={isEditingText}
                                      dispatch={dispatch}
                                      handDrawn={effectiveHandDrawn} {...commonProps} />
        case 'toggle':
            return <ToggleShapeComp shape={resolvedShape} isEditing={isEditingText}
                                    dispatch={dispatch}
                                    handDrawn={effectiveHandDrawn} {...commonProps} />
        case 'frame':
            return <FrameShapeComp shape={resolvedShape} dispatch={dispatch}
                                   handDrawn={effectiveHandDrawn} {...commonProps}>{children}</FrameShapeComp>
        case 'dialog':
            return <DialogShapeComp shape={resolvedShape} dispatch={dispatch}
                                    handDrawn={effectiveHandDrawn} {...commonProps}>{children}</DialogShapeComp>
        case 'radio':
            return <RadioShapeComp shape={resolvedShape} isEditing={isEditingText}
                                   dispatch={dispatch}
                                   handDrawn={effectiveHandDrawn} {...commonProps} />
        case 'select':
            return <SelectShapeComp shape={resolvedShape} isEditing={isEditingText}
                                    dispatch={dispatch}
                                    handDrawn={effectiveHandDrawn} {...commonProps} />
        case 'progress':
            return <ProgressShapeComp shape={resolvedShape} dispatch={dispatch}
                                      handDrawn={effectiveHandDrawn} {...commonProps} />
        case 'stepper':
            return <StepperShapeComp shape={resolvedShape} dispatch={dispatch}
                                     handDrawn={effectiveHandDrawn} {...commonProps} />
        case 'stickynote':
            return <StickyNoteShapeComp shape={resolvedShape} isEditing={isEditingText}
                                        dispatch={dispatch}
                                        handDrawn={effectiveHandDrawn} {...commonProps} />
        case 'list':
            return <ListShapeComp shape={resolvedShape} isEditing={isEditingText}
                                  dispatch={dispatch}
                                  handDrawn={effectiveHandDrawn} {...commonProps} />
        case 'scrollpanel':
            return <ScrollPanelShapeComp shape={resolvedShape} isEditing={isEditingText}
                                         dispatch={dispatch}
                                         handDrawn={effectiveHandDrawn} {...commonProps}>{children}</ScrollPanelShapeComp>
        case 'table':
            return <TableShapeComp shape={resolvedShape} isEditing={isEditingText}
                                   dispatch={dispatch}
                                   handDrawn={effectiveHandDrawn} {...commonProps} />
        case 'group':
            return <GroupShapeComp shape={resolvedShape} isSelected={isSelected} onClick={onClick}
                                   onDoubleClick={onDoubleClick}>{children}</GroupShapeComp>
        case 'imagemock':
            return <ImageMockShapeComp shape={resolvedShape}
                                       handDrawn={effectiveHandDrawn} {...commonProps} />
        case 'chartmock':
            return <ChartMockShapeComp shape={resolvedShape}
                                       handDrawn={effectiveHandDrawn} {...commonProps} />
        case 'pixelimage':
            return <PixelImageShapeComp shape={resolvedShape}
                                        asset={pixelAssets[resolvedShape.assetId]} {...commonProps} />
    }
}
