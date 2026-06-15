import type {TreeNode} from '@model/document'
import type {PixelAsset} from '@model/pixelAsset'
import type {FormShape, Shape} from '@model/shapes'
import {shapeRegistry, useShapeRegistry} from '@powerups/shapeRegistry'
import type {AppAction} from '@store/types'
import type {Dispatch} from 'react'
import {CircleShapeComp} from './shapes/CircleShape'
import {GroupShapeComp} from './shapes/GroupShape'
import {ImageShapeComp} from './shapes/ImageShape'
import {LineShapeComp} from './shapes/LineShape'
import {PageShapeComp} from './shapes/PageShape'
import {PixelImageShapeComp} from './shapes/PixelImageShape'
import {RectShape} from './shapes/RectShape'
import {TextShapeComp} from './shapes/TextShape'
import {rendererLogger} from '@logging'

interface Props {
    nodes: TreeNode[]
    shapes: Record<string, Shape>
    selectedIds: string[]
    editingTextId: string | null
    dispatch: Dispatch<AppAction>
    handDrawn: boolean
    themeFontFamily: string
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
                                  pixelAssets = {}
                              }: Props) {
    useShapeRegistry() // subscribe to registry changes so form shapes render when powerup loads
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
    const resolvedShape = shape

    const onClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        dispatch({type: 'SELECT_SHAPES', ids: [shape.id], additive: e.shiftKey})
    }

    const TEXT_EDITABLE = new Set(['text'])
    const DRILLABLE = new Set(['group'])

    const onDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (TEXT_EDITABLE.has(shape.type)) {
            dispatch({type: 'START_TEXT_EDIT', id: shape.id})
        } else if (DRILLABLE.has(shape.type)) {
            dispatch({type: 'ENTER_DRILL_MODE', containerId: shape.id})
        } else if (shape.type === 'pixelimage') {
            dispatch({type: 'START_PIXEL_EDIT', assetId: shape.assetId})
        } else {
            const regDef = shapeRegistry.get(shape.type)
            if (regDef?.isTextEditable) {
                dispatch({type: 'START_TEXT_EDIT', id: shape.id})
            } else if (regDef?.isDrillable) {
                dispatch({type: 'ENTER_DRILL_MODE', containerId: shape.id})
            }
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
        case 'group':
            return <GroupShapeComp shape={resolvedShape} isSelected={isSelected} onClick={onClick}
                                   onDoubleClick={onDoubleClick}>{children}</GroupShapeComp>
        case 'pixelimage':
            return <PixelImageShapeComp shape={resolvedShape}
                                        asset={pixelAssets[resolvedShape.assetId]} {...commonProps} />
        default: {
            const regDef = shapeRegistry.get(resolvedShape.type)
            if (regDef) {
                return <>{regDef.renderShape({
                    shape: resolvedShape,
                    isSelected,
                    isEditingText: isEditingText,
                    handDrawn: effectiveHandDrawn,
                    dispatch,
                    onClick,
                    onDoubleClick,
                    children,
                })}</>
            }
            rendererLogger.warn('No renderer registered for shape type', {
                shapeId: resolvedShape.id,
                shapeType: resolvedShape.type,
            })
            return null
        }
    }
}
