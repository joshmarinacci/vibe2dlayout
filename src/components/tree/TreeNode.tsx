import type {TreeNode} from '@model/document'
import {findAncestorPage, getAllIds} from '@model/document'
import type {Shape} from '@model/shapes'
import type {ShapeTemplate, PageTemplate} from '@model/library'
import {getActiveTheme} from '@model/theme'
import {createEmptyPixelAsset} from '@model/pixelAsset'
import {useShapeRegistry} from '@powerups/shapeRegistry'
import {useAppState} from '@store/context'
import type {AppAction} from '@store/types'
import {generateId} from '@utils/idgen'
import {buildParentMap, getAbsoluteTransform, getContentOrigin} from '@utils/geometry'
import {createShape} from '@utils/shapeFactory'
import {buildAddShapeGroups, buildPageGroups, buildSingleShapeGroups} from '@utils/shapeMenuGroups'
import {
    AppWindow,
    BarChart2,
    CheckSquare,
    ChevronDown,
    ChevronRight,
    Circle,
    CircleDot,
    Eye,
    EyeOff,
    FileText,
    GanttChart,
    Grid2X2,
    Hash,
    Image,
    ImageIcon,
    LayoutPanelLeft,
    List,
    Lock,
    Minus,
    PanelLeft,
    RectangleHorizontal,
    SlidersHorizontal,
    Square,
    Tag,
    TextCursorInput,
    ToggleLeft,
    Trash2,
    Type,
    Unlock,
} from 'lucide-react'
import {type Dispatch, useCallback, useEffect, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import {ContextMenu} from './ContextMenu'
import styles from './TreeNode.module.css'

const SHAPE_ICON_MAP: Record<string, React.ReactNode> = {
    rect: <Square size={11}/>,
    circle: <Circle size={11}/>,
    line: <Minus size={11}/>,
    text: <Type size={11}/>,
    image: <Image size={11}/>,
    page: <FileText size={11}/>,
    button: <RectangleHorizontal size={11}/>,
    panel: <PanelLeft size={11}/>,
    slider: <SlidersHorizontal size={11}/>,
    label: <Tag size={11}/>,
    textfield: <TextCursorInput size={11}/>,
    checkbox: <CheckSquare size={11}/>,
    toggle: <ToggleLeft size={11}/>,
    frame: <LayoutPanelLeft size={11}/>,
    dialog: <AppWindow size={11}/>,
    radio: <CircleDot size={11}/>,
    select: <List size={11}/>,
    progress: <GanttChart size={11}/>,
    stepper: <Hash size={11}/>,
    imagemock: <ImageIcon size={11}/>,
    chartmock: <BarChart2 size={11}/>,
    pixelimage: <Grid2X2 size={11}/>,
}

interface DragPayload {
    id: string
    parentId: string | null
    index: number
}

const DRAG_TYPE = 'application/vibe-tree-drag'
// Tracks whether the currently active drag is a page shape.
// Set at dragstart (where shape type is known) so dragover handlers can
// suppress the 'into' indicator and reject invalid drop targets visually.
let draggingPageFlag = false

interface Props {
    node: TreeNode
    rootNodes: TreeNode[]
    shapes: Record<string, Shape>
    depth: number
    selectedIds: string[]
    activePageId: string | null
    dispatch: Dispatch<AppAction>
    parentId: string | null
    nodeIndex: number
}

export function TreeNodeComp({
                                 node,
                                 rootNodes,
                                 shapes,
                                 depth,
                                 selectedIds,
                                 activePageId,
                                 dispatch,
                                 parentId,
                                 nodeIndex
                             }: Props) {
    const {state} = useAppState()
    const registeredShapes = useShapeRegistry()
    const shape = shapes[node.id]
    if (!shape) return null

    const isSelected = selectedIds.includes(node.id)
    const isActivePage = node.id === activePageId
    const isPage = shape.type === 'page'
    const [expanded, setExpanded] = useState(true)
    const hasChildren = node.children.length > 0

    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
    const [dropZone, setDropZone] = useState<'before' | 'into' | 'after' | null>(null)
    const dropZoneRef = useRef<'before' | 'into' | 'after' | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState(shape.name)
    const nameInputRef = useRef<HTMLInputElement>(null)
    const isDraggingSelf = useRef(false)

    const startRename = useCallback(() => {
        setEditName(shape.name)
        setIsEditing(true)
        setTimeout(() => nameInputRef.current?.select(), 0)
    }, [shape.name])

    useEffect(() => {
        if (!isSelected || isPage) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'F2') {
                e.preventDefault()
                startRename()
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [isSelected, isPage, startRename])

    const commitRename = useCallback(() => {
        const trimmed = editName.trim()
        if (trimmed && trimmed !== shape.name) {
            dispatch({type: 'PATCH_SHAPE', id: node.id, patch: {name: trimmed}})
        }
        setIsEditing(false)
    }, [dispatch, editName, node.id, shape.name])

    const handleDragStart = (e: React.DragEvent) => {
        e.stopPropagation()
        isDraggingSelf.current = true
        draggingPageFlag = shape.type === 'page'
        const payload: DragPayload = {id: node.id, parentId, index: nodeIndex}
        e.dataTransfer.setData(DRAG_TYPE, JSON.stringify(payload))
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragEnd = () => {
        isDraggingSelf.current = false
        draggingPageFlag = false
        dropZoneRef.current = null
        setDropZone(null)
    }

    const VALID_CONTAINERS = new Set(['page', 'frame', 'panel', 'scrollpanel', 'group', 'tabbed-panel'])

    const handleDragOver = (e: React.DragEvent) => {
        if (!e.dataTransfer.types.includes(DRAG_TYPE)) return
        e.stopPropagation()

        // Pages must stay at root level — reject drops on nested nodes entirely
        if (draggingPageFlag && parentId !== null) {
            dropZoneRef.current = null
            setDropZone(null)
            return  // no preventDefault → browser shows "not allowed" cursor
        }

        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        // Compute zone relative to the inner .node row, not the full wrapper
        const nodeEl = (e.currentTarget as HTMLElement).querySelector(`.${styles.node}`) as HTMLElement | null
        const rect = nodeEl ? nodeEl.getBoundingClientRect() : (e.currentTarget as HTMLElement).getBoundingClientRect()
        const ratio = (e.clientY - rect.top) / rect.height
        let zone: 'before' | 'into' | 'after' = ratio < 0.25 ? 'before' : ratio > 0.75 ? 'after' : 'into'
        // Pages can't be nested — suppress 'into' indicator
        if (draggingPageFlag && zone === 'into') zone = 'after'
        dropZoneRef.current = zone
        setDropZone(zone)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
            dropZoneRef.current = null
            setDropZone(null)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const raw = e.dataTransfer.getData(DRAG_TYPE)
        // Read synchronously from ref before clearing
        let zone = dropZoneRef.current
        dropZoneRef.current = null
        setDropZone(null)
        if (!raw || !zone) return
        const drag: DragPayload = JSON.parse(raw)
        if (drag.id === node.id) return  // dropped on self

        // Validate: pages must stay at root level
        const draggedShape = shapes[drag.id]
        if (draggedShape?.type === 'page') {
            // 'into' would nest the page; parentId !== null means the target is inside another node
            if (zone === 'into' || parentId !== null) return
        }

        // Validate: non-container shapes can't receive children
        if (zone === 'into' && !VALID_CONTAINERS.has(shape.type)) zone = 'after'

        let newParentId: string | null
        let insertIndex: number

        if (zone === 'into') {
            newParentId = node.id
            insertIndex = node.children.length
        } else {
            // before / after: insert as sibling of this node
            newParentId = parentId
            const targetIndex = nodeIndex
            if (zone === 'before') {
                // if drag came from same parent and was before target, target shifts left after removal
                insertIndex = drag.parentId === newParentId && drag.index < targetIndex
                    ? targetIndex - 1
                    : targetIndex
            } else {
                // after
                insertIndex = drag.parentId === newParentId && drag.index < targetIndex
                    ? targetIndex        // target shifted left, "after" = same index
                    : targetIndex + 1
            }
        }

        const parentMap = buildParentMap(rootNodes)
        const abs = getAbsoluteTransform(drag.id, shapes, parentMap)
        let newX: number | undefined
        let newY: number | undefined
        if (abs) {
            const origin = getContentOrigin(newParentId, shapes, parentMap)
            newX = abs.x - origin.x
            newY = abs.y - origin.y
        }
        dispatch({
            type: 'REPARENT_SHAPE',
            id: drag.id,
            newParentId,
            index: insertIndex,
            x: newX,
            y: newY
        })
    }

    const handleClick = (e: React.MouseEvent) => {
        if (isPage) {
            dispatch({type: 'SET_ACTIVE_PAGE', pageId: node.id})
        } else {
            const ancestorPageId = findAncestorPage(rootNodes, node.id, shapes)
            if (ancestorPageId && ancestorPageId !== activePageId) {
                dispatch({type: 'SET_ACTIVE_PAGE', pageId: ancestorPageId})
            }
        }
        dispatch({type: 'SELECT_SHAPES', ids: [node.id], additive: e.shiftKey})
    }

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation()
        dispatch({type: 'DELETE_SHAPES', ids: [node.id]})
        dispatch({type: 'DESELECT_ALL'})
    }

    const toggleVisibility = (e: React.MouseEvent) => {
        e.stopPropagation()
        dispatch({type: 'PATCH_SHAPE', id: node.id, patch: {visible: !shape.visible}})
    }

    const toggleLock = (e: React.MouseEvent) => {
        e.stopPropagation()
        dispatch({type: 'PATCH_SHAPE', id: node.id, patch: {locked: !shape.locked}})
    }

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setContextMenu({x: e.clientX, y: e.clientY})
    }

    const saveShapeToLibrary = () => {
        const ids = getAllIds([node])
        const templateShapes: Record<string, Shape> = {}
        for (const id of ids) {
            if (shapes[id]) templateShapes[id] = shapes[id]
        }
        const template: ShapeTemplate = {id: generateId(), name: shape.name, rootNode: node, shapes: templateShapes}
        dispatch({type: 'ADD_LIBRARY_SHAPE_TEMPLATE', template})
    }

    const savePageAsTemplate = () => {
        const ids = getAllIds([node])
        const templateShapes: Record<string, Shape> = {}
        for (const id of ids) {
            if (shapes[id]) templateShapes[id] = shapes[id]
        }
        const template: PageTemplate = {id: generateId(), name: shape.name, rootNode: node, shapes: templateShapes}
        dispatch({type: 'ADD_LIBRARY_PAGE_TEMPLATE', template})
    }

    const addShapeTo = useCallback((parentId: string, type: string) => {
        const newShape = createShape(type, 50, 50, getActiveTheme(state.document))
        if (newShape.type === 'pixelimage') {
            const asset = createEmptyPixelAsset(generateId(), 'Pixel Image')
            const shapeWithAsset = {...newShape, assetId: asset.id}
            dispatch({type: 'ADD_PIXEL_ASSET', asset})
            dispatch({type: 'ADD_SHAPE', parentId, shape: shapeWithAsset})
            dispatch({type: 'SELECT_SHAPES', ids: [shapeWithAsset.id], additive: false})
        } else {
            dispatch({type: 'ADD_SHAPE', parentId, shape: newShape})
            dispatch({type: 'SELECT_SHAPES', ids: [newShape.id], additive: false})
        }
        if (!expanded) setExpanded(true)
    }, [dispatch, expanded, state.document])

    const buildContextMenuGroups = () => {
        const addShapeGroups = buildAddShapeGroups(
            (type) => addShapeTo(node.id, type),
            registeredShapes,
        )
        if (isPage) {
            return buildPageGroups({
                shape,
                nodeId: node.id,
                dispatch,
                addShapeGroups,
                isActivePage,
                appState: state,
                onSaveAsTemplate: savePageAsTemplate,
            })
        }
        return buildSingleShapeGroups({
            shape,
            shapeId: node.id,
            dispatch,
            addShapeGroups,
            onSaveToLibrary: saveShapeToLibrary,
        })
    }

    return (
        <div
            className={styles.nodeWrapper}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div
                className={[
                    styles.node,
                    isSelected ? styles.selected : '',
                    isActivePage ? styles.activePage : '',
                    dropZone === 'before' ? styles.dropBefore : '',
                    dropZone === 'into' ? styles.dropInto : '',
                    dropZone === 'after' ? styles.dropAfter : '',
                ].join(' ')}
                style={{paddingLeft: 8 + depth * 14}}
                draggable={!isEditing}
                onClick={handleClick}
                onDoubleClick={e => {
                    e.stopPropagation();
                    startRename()
                }}
                onContextMenu={handleContextMenu}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                {hasChildren ? (
                    <button
                        className={styles.expander}
                        onClick={e => {
                            e.stopPropagation();
                            setExpanded(v => !v)
                        }}
                    >
                        {expanded ? <ChevronDown size={11}/> : <ChevronRight size={11}/>}
                    </button>
                ) : (
                    <span className={styles.expanderSpacer}/>
                )}

                <span className={styles.icon}>{SHAPE_ICON_MAP[shape.type] ??
                    <Square size={11}/>}</span>
                {isEditing ? (
                    <input
                        ref={nameInputRef}
                        className={styles.nameInput}
                        value={editName}
                        autoFocus
                        onChange={e => setEditName(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                commitRename()
                            }
                            if (e.key === 'Escape') setIsEditing(false)
                        }}
                        onClick={e => e.stopPropagation()}
                    />
                ) : (
                    <span
                        className={`${styles.name} ${!shape.visible ? styles.hidden : ''}`}>{shape.name}</span>
                )}

                <div className={styles.actions}>
                    <button
                        className={styles.actionBtn}
                        onClick={toggleVisibility}
                        title={shape.visible ? 'Hide' : 'Show'}
                    >{shape.visible ? <Eye size={11}/> : <EyeOff size={11}/>}</button>
                    <button
                        className={styles.actionBtn}
                        onClick={toggleLock}
                        title={shape.locked ? 'Unlock' : 'Lock'}
                    >{shape.locked ? <Lock size={11}/> : <Unlock size={11}/>}</button>
                    <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={handleDelete}
                        title="Delete"
                    ><Trash2 size={11}/></button>
                </div>
            </div>

            {expanded && hasChildren && (
                <div className={styles.children}>
                    {node.children.map((child, i) => (
                        <TreeNodeComp
                            key={child.id}
                            node={child}
                            rootNodes={rootNodes}
                            shapes={shapes}
                            depth={depth + 1}
                            selectedIds={selectedIds}
                            activePageId={activePageId}
                            dispatch={dispatch}
                            parentId={node.id}
                            nodeIndex={i}
                        />
                    ))}
                </div>
            )}

            {contextMenu && createPortal(
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    groups={buildContextMenuGroups()}
                    onClose={() => setContextMenu(null)}
                />,
                document.body,
            )}
        </div>
    )
}
