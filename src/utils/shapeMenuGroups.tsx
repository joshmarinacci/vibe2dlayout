import type {Shape, ShapeType} from '@model/shapes'
import type {PowerUpShapeTypeDefinition} from '@powerups/types'
import type {AppAction, AppState, AlignType} from '@store/types'
import {exportPageAsHtml} from '@utils/exportHtml'
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    AlignVerticalJustifyCenter,
    AlignVerticalJustifyEnd,
    AlignVerticalJustifyStart,
    ArrowLeftRight,
    ArrowUpDown,
    BookTemplate,
    ChevronDown,
    ChevronsDown,
    ChevronsUp,
    ChevronUp,
    Copy,
    Eye,
    EyeOff,
    FileCode,
    FileText,
    Group,
    Lock,
    Trash2,
    Unlock,
} from 'lucide-react'
import type {Dispatch} from 'react'
import type {ContextMenuGroup, ContextMenuItem} from '@components/tree/ContextMenu'

export const BASIC_SHAPES: { type: ShapeType; label: string }[] = [
    {type: 'rect', label: 'Rectangle'},
    {type: 'circle', label: 'Circle'},
    {type: 'line', label: 'Line'},
    {type: 'text', label: 'Text'},
    {type: 'image', label: 'Image'},
    {type: 'pixelimage', label: 'Pixel Image'},
]

export function buildAddShapeGroups(
    addShape: (type: string) => void,
    registeredShapes: PowerUpShapeTypeDefinition[],
): ContextMenuGroup[] {
    const basicItems = BASIC_SHAPES.map(opt => ({
        label: opt.label,
        onClick: () => addShape(opt.type),
    }))
    const containerItems = registeredShapes
        .filter(s => s.category === 'containers')
        .map(s => ({label: s.name, onClick: () => addShape(s.type)}))
    const formItems = registeredShapes
        .filter(s => s.category === 'forms')
        .map(s => ({label: s.name, onClick: () => addShape(s.type)}))
    const mockupItems = registeredShapes
        .filter(s => s.category === 'mockups')
        .map(s => ({label: s.name, onClick: () => addShape(s.type)}))

    return [{
        items: [
            {label: 'Shapes', submenu: basicItems},
            ...(containerItems.length > 0 ? [{label: 'Containers', submenu: containerItems}] : []),
            ...(formItems.length > 0 ? [{label: 'Form Controls', submenu: formItems}] : []),
            ...(mockupItems.length > 0 ? [{label: 'Mockups', submenu: mockupItems}] : []),
        ],
    }]
}

export function buildSingleShapeGroups(opts: {
    shape: Shape
    shapeId: string
    dispatch: Dispatch<AppAction>
    addShapeGroups: ContextMenuGroup[]
    onSaveToLibrary: () => void
    extraActionItems?: ContextMenuItem[]
}): ContextMenuGroup[] {
    const {shape, shapeId, dispatch, addShapeGroups, onSaveToLibrary, extraActionItems = []} = opts
    return [
        ...addShapeGroups,
        {
            items: [
                {
                    label: 'Duplicate',
                    icon: <Copy size={14}/>,
                    shortcut: '⌘D',
                    onClick: () => dispatch({type: 'DUPLICATE_SHAPES', ids: [shapeId]}),
                },
                {
                    label: 'Save to Library',
                    icon: <BookTemplate size={14}/>,
                    onClick: onSaveToLibrary,
                },
                ...extraActionItems,
            ],
        },
        {
            items: [
                {
                    label: 'Move Up',
                    icon: <ChevronUp size={14}/>,
                    shortcut: '⌘]',
                    onClick: () => dispatch({type: 'REORDER_SHAPE', id: shapeId, direction: 'up'}),
                },
                {
                    label: 'Move Down',
                    icon: <ChevronDown size={14}/>,
                    shortcut: '⌘[',
                    onClick: () => dispatch({type: 'REORDER_SHAPE', id: shapeId, direction: 'down'}),
                },
                {
                    label: 'Bring to Front',
                    icon: <ChevronsUp size={14}/>,
                    onClick: () => dispatch({type: 'REORDER_SHAPE', id: shapeId, direction: 'to-front'}),
                },
                {
                    label: 'Send to Back',
                    icon: <ChevronsDown size={14}/>,
                    onClick: () => dispatch({type: 'REORDER_SHAPE', id: shapeId, direction: 'to-back'}),
                },
            ],
        },
        {
            items: [
                {
                    label: shape.visible ? 'Hide' : 'Show',
                    icon: shape.visible ? <Eye size={14}/> : <EyeOff size={14}/>,
                    onClick: () => dispatch({type: 'PATCH_SHAPE', id: shapeId, patch: {visible: !shape.visible}}),
                },
                {
                    label: shape.locked ? 'Unlock' : 'Lock',
                    icon: shape.locked ? <Unlock size={14}/> : <Lock size={14}/>,
                    onClick: () => dispatch({type: 'PATCH_SHAPE', id: shapeId, patch: {locked: !shape.locked}}),
                },
            ],
        },
        {
            items: [
                {
                    label: 'Delete',
                    icon: <Trash2 size={14}/>,
                    shortcut: '⌫',
                    danger: true,
                    onClick: () => {
                        dispatch({type: 'DELETE_SHAPES', ids: [shapeId]})
                        dispatch({type: 'DESELECT_ALL'})
                    },
                },
            ],
        },
    ]
}

export function buildPageGroups(opts: {
    shape: Shape
    nodeId: string
    dispatch: Dispatch<AppAction>
    addShapeGroups: ContextMenuGroup[]
    isActivePage: boolean
    appState: AppState
    onSaveAsTemplate: () => void
}): ContextMenuGroup[] {
    const {shape, nodeId, dispatch, addShapeGroups, isActivePage, appState, onSaveAsTemplate} = opts
    const pageShape = shape.type === 'page' ? shape : null
    return [
        {
            items: [
                {
                    label: 'Set as Active Page',
                    icon: <FileText size={14}/>,
                    onClick: () => dispatch({type: 'SET_ACTIVE_PAGE', pageId: nodeId}),
                    disabled: isActivePage,
                },
                {
                    label: 'Export HTML…',
                    icon: <FileCode size={14}/>,
                    onClick: () => exportPageAsHtml({...appState, activePageId: nodeId}),
                    disabled: !pageShape?.fixedSize,
                },
                {
                    label: 'Save as Template',
                    icon: <BookTemplate size={14}/>,
                    onClick: onSaveAsTemplate,
                },
            ],
        },
        ...addShapeGroups,
        {
            items: [
                {
                    label: shape.visible ? 'Hide' : 'Show',
                    icon: shape.visible ? <Eye size={14}/> : <EyeOff size={14}/>,
                    onClick: () => dispatch({type: 'PATCH_SHAPE', id: nodeId, patch: {visible: !shape.visible}}),
                },
                {
                    label: shape.locked ? 'Unlock' : 'Lock',
                    icon: shape.locked ? <Unlock size={14}/> : <Lock size={14}/>,
                    onClick: () => dispatch({type: 'PATCH_SHAPE', id: nodeId, patch: {locked: !shape.locked}}),
                },
            ],
        },
        {
            items: [
                {
                    label: 'Duplicate',
                    icon: <Copy size={14}/>,
                    onClick: () => dispatch({type: 'DUPLICATE_SHAPES', ids: [nodeId]}),
                },
            ],
        },
        {
            items: [
                {
                    label: 'Move Up',
                    icon: <ChevronUp size={14}/>,
                    onClick: () => dispatch({type: 'REORDER_SHAPE', id: nodeId, direction: 'up'}),
                },
                {
                    label: 'Move Down',
                    icon: <ChevronDown size={14}/>,
                    onClick: () => dispatch({type: 'REORDER_SHAPE', id: nodeId, direction: 'down'}),
                },
                {
                    label: 'Bring to Front',
                    icon: <ChevronsUp size={14}/>,
                    onClick: () => dispatch({type: 'REORDER_SHAPE', id: nodeId, direction: 'to-front'}),
                },
                {
                    label: 'Send to Back',
                    icon: <ChevronsDown size={14}/>,
                    onClick: () => dispatch({type: 'REORDER_SHAPE', id: nodeId, direction: 'to-back'}),
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
                        dispatch({type: 'DELETE_SHAPES', ids: [nodeId]})
                        dispatch({type: 'DESELECT_ALL'})
                    },
                },
            ],
        },
    ]
}

export function buildMultiSelectGroups(opts: {
    selectedIds: string[]
    dispatch: Dispatch<AppAction>
}): ContextMenuGroup[] {
    const {selectedIds, dispatch} = opts
    const align = (alignment: AlignType) => dispatch({type: 'ALIGN_SHAPES', ids: selectedIds, alignment})
    return [
        {
            items: [
                {
                    label: 'Duplicate',
                    icon: <Copy size={14}/>,
                    shortcut: '⌘D',
                    onClick: () => dispatch({type: 'DUPLICATE_SHAPES', ids: selectedIds}),
                },
                {
                    label: 'Group',
                    icon: <Group size={14}/>,
                    shortcut: '⌘G',
                    onClick: () => dispatch({type: 'GROUP_SHAPES', ids: selectedIds}),
                },
            ],
        },
        {
            items: [
                {label: 'Align Left', icon: <AlignLeft size={14}/>, onClick: () => align('left')},
                {label: 'Align Center', icon: <AlignCenter size={14}/>, onClick: () => align('center-h')},
                {label: 'Align Right', icon: <AlignRight size={14}/>, onClick: () => align('right')},
                {label: 'Align Top', icon: <AlignVerticalJustifyStart size={14}/>, onClick: () => align('top')},
                {label: 'Align Middle', icon: <AlignVerticalJustifyCenter size={14}/>, onClick: () => align('middle-v')},
                {label: 'Align Bottom', icon: <AlignVerticalJustifyEnd size={14}/>, onClick: () => align('bottom')},
                {label: 'Match Width', icon: <ArrowLeftRight size={14}/>, onClick: () => align('match-width')},
                {label: 'Match Height', icon: <ArrowUpDown size={14}/>, onClick: () => align('match-height')},
            ],
        },
        {
            items: [
                {
                    label: 'Delete',
                    icon: <Trash2 size={14}/>,
                    shortcut: '⌫',
                    danger: true,
                    onClick: () => {
                        dispatch({type: 'DELETE_SHAPES', ids: selectedIds})
                        dispatch({type: 'DESELECT_ALL'})
                    },
                },
            ],
        },
    ]
}
