import {canvasContextMenuManager} from '@actions/managers/canvasContextMenuManager'
import type {TreeNode} from '@model/document'
import {getAllIds} from '@model/document'
import type {PageTemplate, ShapeTemplate} from '@model/library'
import {createEmptyPixelAsset} from '@model/pixelAsset'
import type {ImageShape, Shape} from '@model/shapes'
import {getActiveTheme} from '@model/theme'
import {useShapeRegistry} from '@powerups/shapeRegistry'
import {useAppState} from '@store/context'
import type {AppAction} from '@store/types'
import {exportGroupAsPng} from '@utils/exportPng'
import {buildParentMap, getAbsoluteTransform} from '@utils/geometry'
import {generateId} from '@utils/idgen'
import {createShape} from '@utils/shapeFactory'
import {
    buildAddShapeGroups,
    buildMultiSelectGroups,
    buildPageGroups,
    buildSingleShapeGroups,
} from '@utils/shapeMenuGroups'
import {textStyleToCss} from '@utils/textShapeCss'
import {
    Code2,
    Crop,
    FileImage,
    Maximize2,
    Ungroup,
} from 'lucide-react'
import type {Dispatch} from 'react'
import {createPortal} from 'react-dom'
import {ContextMenu} from '../tree/ContextMenu'
import type {CanvasContextMenuState} from './useCanvasPointer'

export interface CssDialogState {
    css: string
    name: string
}

interface Props {
    menuState: CanvasContextMenuState
    shapes: Record<string, Shape>
    rootNodes: TreeNode[]
    activePageId: string | null
    dispatch: Dispatch<AppAction>
    onClose: () => void
    onShowCssDialog: (state: CssDialogState) => void
}

export function CanvasContextMenu({
                                      menuState,
                                      shapes,
                                      rootNodes,
                                      activePageId,
                                      dispatch,
                                      onClose,
                                      onShowCssDialog
                                  }: Props) {
    const {state} = useAppState()
    const registeredShapes = useShapeRegistry()
    const {screenX, screenY, canvasX, canvasY, shapeId, selectedIds} = menuState
    const shape = shapeId ? shapes[shapeId] : null
    const isMultiSelect = selectedIds.length > 1

    const imageAsset = shape?.type === 'image' && (shape as ImageShape).assetId
        ? state.document.images.find(a => a.id === (shape as ImageShape).assetId)
        : null
    const imageCrop = shape?.type === 'image' ? (shape as ImageShape).crop : undefined
    const actualW = imageAsset?.width  ? (imageCrop ? Math.round(imageAsset.width  * imageCrop.width)  : imageAsset.width)  : null
    const actualH = imageAsset?.height ? (imageCrop ? Math.round(imageAsset.height * imageCrop.height) : imageAsset.height) : null

    const addShape = (type: string, parentId: string | null) => {
        let localX = canvasX
        let localY = canvasY
        if (parentId && parentId !== activePageId) {
            const parentMap = buildParentMap(rootNodes)
            const parentAbs = getAbsoluteTransform(parentId, shapes, parentMap)
            if (parentAbs) {
                const parent = shapes[parentId]
                const contentOffsetY = parent?.type === 'panel' && parent.text ? parent.text.fontSize + 12 : 0
                localX = canvasX - parentAbs.x
                localY = canvasY - parentAbs.y - contentOffsetY
            }
        }
        const newShape = createShape(type, localX, localY, getActiveTheme(state.document))
        if (newShape.type === 'pixelimage') {
            const asset = createEmptyPixelAsset(generateId(), 'Pixel Image')
            const shapeWithAsset = {...newShape, assetId: asset.id}
            dispatch({type: 'ADD_PIXEL_ASSET', asset})
            dispatch({type: 'ADD_SHAPE', parentId, shape: shapeWithAsset})
            dispatch({type: 'SELECT_SHAPES', ids: [shapeWithAsset.id], additive: false})
            return
        }
        dispatch({type: 'ADD_SHAPE', parentId, shape: newShape})
        dispatch({type: 'SELECT_SHAPES', ids: [newShape.id], additive: false})
    }

    const saveShapeToLibrary = (id: string) => {
        const node = rootNodes.flatMap(function walk(n: TreeNode): TreeNode[] {
            return n.id === id ? [n] : n.children.flatMap(walk)
        })[0]
        if (!node) return
        const ids = getAllIds([node])
        const templateShapes: Record<string, Shape> = {}
        for (const sid of ids) {
            if (shapes[sid]) templateShapes[sid] = shapes[sid]
        }
        const template: ShapeTemplate = {id: generateId(), name: shapes[id]?.name ?? 'Shape', rootNode: node, shapes: templateShapes}
        dispatch({type: 'ADD_LIBRARY_SHAPE_TEMPLATE', template})
    }

    const parentId = shapeId ?? activePageId
    const addShapeGroups = buildAddShapeGroups(
        (type) => addShape(type, parentId),
        registeredShapes,
    )

    let groups
    if (isMultiSelect) {
        groups = buildMultiSelectGroups({selectedIds, dispatch})
    } else if (shape && shape.type === 'page') {
        const savePageAsTemplate = () => {
            const node = rootNodes.flatMap(function walk(n: TreeNode): TreeNode[] {
                return n.id === shapeId ? [n] : n.children.flatMap(walk)
            })[0]
            if (!node) return
            const ids = getAllIds([node])
            const templateShapes: Record<string, Shape> = {}
            for (const sid of ids) {
                if (shapes[sid]) templateShapes[sid] = shapes[sid]
            }
            const template: PageTemplate = {id: generateId(), name: shape.name, rootNode: node, shapes: templateShapes}
            dispatch({type: 'ADD_LIBRARY_PAGE_TEMPLATE', template})
        }
        groups = buildPageGroups({
            shape,
            nodeId: shapeId!,
            dispatch,
            addShapeGroups,
            isActivePage: shapeId === activePageId,
            appState: state,
            onSaveAsTemplate: savePageAsTemplate,
        })
    } else if (shape) {
        const actionCtx = {state, dispatch}
        const registryItems = canvasContextMenuManager(actionCtx)
        const extraActionItems = [
            ...(shape.type === 'text' ? [
                {
                    label: 'Export CSS',
                    icon: <Code2 size={14}/>,
                    onClick: () => {
                        const selector = `.${shape.name.toLowerCase().replace(/\s+/g, '-') || 'text'}`
                        const css = textStyleToCss(shape.text, selector)
                        onShowCssDialog({css, name: shape.name})
                        onClose()
                    },
                },
            ] : []),
            ...(shape.type === 'image' && (shape as ImageShape).src && !shape.locked ? [
                {
                    label: (shape as ImageShape).crop ? 'Edit Crop' : 'Crop',
                    icon: <Crop size={14}/>,
                    onClick: () => dispatch({type: 'ENTER_CROP_MODE', shapeId: shapeId!}),
                },
            ] : []),
            ...(shape.type === 'image' && actualW && actualH ? [
                {
                    label: `Actual Size (${actualW} × ${actualH})`,
                    icon: <Maximize2 size={14}/>,
                    onClick: () => dispatch({
                        type: 'PATCH_SHAPE',
                        id: shapeId!,
                        patch: {transform: {...shape.transform, width: actualW, height: actualH}} as Partial<ImageShape>,
                    }),
                },
            ] : []),
            ...(shape.type === 'group' ? [
                {
                    label: 'Ungroup',
                    icon: <Ungroup size={14}/>,
                    shortcut: '⌘⇧G',
                    onClick: () => dispatch({type: 'UNGROUP_SHAPES', id: shapeId!}),
                },
                {
                    label: 'Export as PNG',
                    icon: <FileImage size={14}/>,
                    onClick: () => exportGroupAsPng(shapeId!, state),
                },
            ] : []),
        ]
        groups = buildSingleShapeGroups({
            shape,
            shapeId: shapeId!,
            dispatch,
            addShapeGroups,
            onSaveToLibrary: () => saveShapeToLibrary(shapeId!),
            extraActionItems,
            registryItems,
            actionCtx,
            onClose,
        })
    } else {
        // Empty canvas — add to active page
        groups = addShapeGroups
    }

    return createPortal(
        <ContextMenu x={screenX} y={screenY} groups={groups} onClose={onClose}/>,
        document.body,
    )
}
