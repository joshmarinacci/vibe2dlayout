import type {TreeNode} from '@model/document'
import {createEmptyPixelAsset} from '@model/pixelAsset'
import type {ImageShape, Shape, ShapeType} from '@model/shapes'
import {getActiveTheme} from '@model/theme'
import {useAppState} from '@store/context'
import type {AlignType, AppAction} from '@store/types'
import {exportGroupAsPng} from '@utils/exportPng'
import {buildParentMap, getAbsoluteTransform} from '@utils/geometry'
import {generateId} from '@utils/idgen'
import {createShape} from '@utils/shapeFactory'
import {textStyleToCss} from '@utils/textShapeCss'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  ArrowLeftRight,
  ArrowUpDown,
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  ChevronUp,
  Code2,
  Copy,
  Crop,
  Eye,
  EyeOff,
  FileImage,
  Group,
  Lock,
  Maximize2,
  Trash2,
  Ungroup,
  Unlock,
} from 'lucide-react'
import type {Dispatch} from 'react'
import {createPortal} from 'react-dom'
import {ContextMenu, type ContextMenuGroup} from '../tree/ContextMenu'
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

const BASIC_SHAPES: { type: ShapeType; label: string }[] = [
    {type: 'rect', label: 'Rectangle'},
    {type: 'circle', label: 'Circle'},
    {type: 'line', label: 'Line'},
    {type: 'text', label: 'Text'},
    {type: 'image', label: 'Image'},
    {type: 'pixelimage', label: 'Pixel Image'},
]

const CONTAINER_TYPES: { type: ShapeType; label: string }[] = [
    {type: 'panel', label: 'Titled Panel'},
    {type: 'tabbed-panel', label: 'Tabbed Panel'},
    {type: 'frame', label: 'Panel'},
    {type: 'dialog', label: 'Dialog'},
    {type: 'stickynote', label: 'Sticky Note'},
    {type: 'scrollpanel', label: 'Scroll Panel'},
]

const FORM_CONTROLS: { type: ShapeType; label: string }[] = [
    {type: 'button', label: 'Button'},
    {type: 'icon', label: 'Icon'},
    {type: 'slider', label: 'Slider'},
    {type: 'label', label: 'Label'},
    {type: 'textfield', label: 'Text Field'},
    {type: 'checkbox', label: 'Checkbox'},
    {type: 'toggle', label: 'Toggle'},
    {type: 'radio', label: 'Radio Button'},
    {type: 'select', label: 'Select'},
    {type: 'progress', label: 'Progress Bar'},
    {type: 'stepper', label: 'Number Stepper'},
    {type: 'list', label: 'List'},
    {type: 'table', label: 'Table'},
]

const MOCKUP_SHAPES: { type: ShapeType; label: string }[] = [
    {type: 'imagemock', label: 'Image Mock'},
    {type: 'chartmock', label: 'Chart Mock'},
]

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
    const {screenX, screenY, canvasX, canvasY, shapeId, selectedIds} = menuState
    const shape = shapeId ? shapes[shapeId] : null
    const isMultiSelect = selectedIds.length > 1

    const imageAsset = shape?.type === 'image' && (shape as ImageShape).assetId
        ? state.document.images.find(a => a.id === (shape as ImageShape).assetId)
        : null
    const imageCrop = shape?.type === 'image' ? (shape as ImageShape).crop : undefined
    const actualW = imageAsset?.width  ? (imageCrop ? Math.round(imageAsset.width  * imageCrop.width)  : imageAsset.width)  : null
    const actualH = imageAsset?.height ? (imageCrop ? Math.round(imageAsset.height * imageCrop.height) : imageAsset.height) : null

    const addShape = (type: ShapeType, parentId: string | null) => {
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

    const parentId = shapeId ?? activePageId

    const basicItems = BASIC_SHAPES.map(opt => ({
        label: opt.label,
        onClick: () => addShape(opt.type, parentId),
    }))

    const containerItems = CONTAINER_TYPES.map(opt => ({
        label: opt.label,
        onClick: () => addShape(opt.type, parentId),
    }))

    const formItems = FORM_CONTROLS.map(opt => ({
        label: opt.label,
        onClick: () => addShape(opt.type, parentId),
    }))

    const mockupItems = MOCKUP_SHAPES.map(opt => ({
        label: opt.label,
        onClick: () => addShape(opt.type, parentId),
    }))

    const addShapeGroups: ContextMenuGroup[] = [
        {
            items: [
                {label: 'Shapes', submenu: basicItems},
                {
                    label: 'Forms', submenu: [
                        ...containerItems,
                        {label: '', divider: true},
                        ...formItems,
                        {label: '', divider: true},
                        ...mockupItems,
                    ]
                },
            ],
        },
    ]

    const align = (alignment: AlignType) => dispatch({
        type: 'ALIGN_SHAPES',
        ids: selectedIds,
        alignment
    })

    const multiSelectGroups: ContextMenuGroup[] = [
        {
            items: [
                {
                    label: 'Duplicate',
                    icon: <Copy size={14}/>,
                    onClick: () => dispatch({type: 'DUPLICATE_SHAPES', ids: selectedIds}),
                },
                {
                    label: 'Group',
                    icon: <Group size={14}/>,
                    onClick: () => dispatch({type: 'GROUP_SHAPES', ids: selectedIds}),
                },
            ],
        },
        {
            items: [
                {label: 'Align Left', icon: <AlignLeft size={14}/>, onClick: () => align('left')},
                {
                    label: 'Align Center',
                    icon: <AlignCenter size={14}/>,
                    onClick: () => align('center-h')
                },
                {
                    label: 'Align Right',
                    icon: <AlignRight size={14}/>,
                    onClick: () => align('right')
                },
                {
                    label: 'Align Top',
                    icon: <AlignVerticalJustifyStart size={14}/>,
                    onClick: () => align('top')
                },
                {
                    label: 'Align Middle',
                    icon: <AlignVerticalJustifyCenter size={14}/>,
                    onClick: () => align('middle-v')
                },
                {
                    label: 'Align Bottom',
                    icon: <AlignVerticalJustifyEnd size={14}/>,
                    onClick: () => align('bottom')
                },
                {
                    label: 'Match Width',
                    icon: <ArrowLeftRight size={14}/>,
                    onClick: () => align('match-width')
                },
                {
                    label: 'Match Height',
                    icon: <ArrowUpDown size={14}/>,
                    onClick: () => align('match-height')
                },
            ],
        },
        {
            items: [
                {
                    label: 'Delete',
                    icon: <Trash2 size={14}/>,
                    danger: true,
                    onClick: () => {
                        dispatch({type: 'DELETE_SHAPES', ids: selectedIds})
                        dispatch({type: 'DESELECT_ALL'})
                    },
                },
            ],
        },
    ]

    let groups: ContextMenuGroup[]

    if (isMultiSelect) {
        groups = multiSelectGroups
    } else if (shape && shape.type !== 'page') {
        groups = [
            ...addShapeGroups,
            {
                items: [
                    {
                        label: 'Duplicate',
                        icon: <Copy size={14}/>,
                        onClick: () => dispatch({type: 'DUPLICATE_SHAPES', ids: [shapeId!]}),
                    },
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
                            onClick: () => dispatch({type: 'UNGROUP_SHAPES', id: shapeId!}),
                        },
                        {
                            label: 'Export as PNG',
                            icon: <FileImage size={14}/>,
                            onClick: () => exportGroupAsPng(shapeId!, state),
                        },
                    ] : []),
                ],
            },
            {
                items: [
                    {
                        label: 'Bring to Front',
                        icon: <ChevronsUp size={14}/>,
                        onClick: () => dispatch({
                            type: 'REORDER_SHAPE',
                            id: shapeId!,
                            direction: 'to-front'
                        }),
                    },
                    {
                        label: 'Send to Back',
                        icon: <ChevronsDown size={14}/>,
                        onClick: () => dispatch({
                            type: 'REORDER_SHAPE',
                            id: shapeId!,
                            direction: 'to-back'
                        }),
                    },
                    {
                        label: 'Move Up',
                        icon: <ChevronUp size={14}/>,
                        onClick: () => dispatch({
                            type: 'REORDER_SHAPE',
                            id: shapeId!,
                            direction: 'up'
                        }),
                    },
                    {
                        label: 'Move Down',
                        icon: <ChevronDown size={14}/>,
                        onClick: () => dispatch({
                            type: 'REORDER_SHAPE',
                            id: shapeId!,
                            direction: 'down'
                        }),
                    },
                ],
            },
            {
                items: [
                    {
                        label: shape.visible ? 'Hide' : 'Show',
                        icon: shape.visible ? <Eye size={14}/> : <EyeOff size={14}/>,
                        onClick: () => dispatch({
                            type: 'PATCH_SHAPE',
                            id: shapeId!,
                            patch: {visible: !shape.visible}
                        }),
                    },
                    {
                        label: shape.locked ? 'Unlock' : 'Lock',
                        icon: shape.locked ? <Unlock size={14}/> : <Lock size={14}/>,
                        onClick: () => dispatch({
                            type: 'PATCH_SHAPE',
                            id: shapeId!,
                            patch: {locked: !shape.locked}
                        }),
                    },
                ],
            },
            {
                items: [
                    {
                        label: 'Delete',
                        icon: <Trash2 size={14}/>,
                        danger: true,
                        onClick: () => {
                            dispatch({type: 'DELETE_SHAPES', ids: [shapeId!]})
                            dispatch({type: 'DESELECT_ALL'})
                        },
                    },
                ],
            },
        ]
    } else {
        // Empty canvas or page shape — add to active page
        groups = addShapeGroups
    }

    return createPortal(
        <ContextMenu x={screenX} y={screenY} groups={groups} onClose={onClose}/>,
        document.body,
    )
}
