import type {CustomFont, TreeNode, VibeDocument} from '@model/document'
import {findNode, findParent, getAllIds, insertNode, removeNode} from '@model/document'
import type {DimensionAsset} from '@model/dimensionAsset'
import {DEFAULT_GRID_SETTINGS} from '@model/grid'
import type {ImageAsset} from '@model/imageAsset'
import {EMPTY_LIBRARY} from '@model/library'
import {
    DEFAULT_PAGE_DIMENSION_ID,
    findBuiltInPageDimension,
    resolvePageSize,
} from '@model/pageDimensions'
import {DEFAULT_PALETTE} from '@model/palette'
import type {ShapePowerUpEntry} from '@model/powerUps'
import type {GradientStop, ImageShape, PageShape, Shape} from '@model/shapes'
import {
    createDefaultFeatureSettings,
    createDocumentPowerUpEntry,
    createDefaultShapePowerUpEntry,
    getPowerUpDefinition,
    migrateDocumentPowerUps,
} from '@powerups/registry'
import type {Theme} from '@model/theme'
import {BUILT_IN_THEMES, getActiveTheme} from '@model/theme'
import {computeAlignedTransforms} from '@utils/alignment'
import {
  buildParentMap,
  getAbsoluteTransform,
  getParentContentOrigin,
  unionBoxes
} from '@utils/geometry'
import {generateId} from '@utils/idgen'
import {saveLibrary} from '@utils/libraryStorage'
import type {AppAction, AppState, DocumentAction, ViewTransform} from './types'
import {DEFAULT_SETTINGS} from './types'

function cloneSubtree(
    node: TreeNode,
    shapes: Record<string, Shape>,
    overrideId?: string,
): { node: TreeNode; newShapes: Record<string, Shape> } {
    const newId = overrideId ?? generateId()
    const shape = shapes[node.id]
    const newShapes: Record<string, Shape> = {}
    if (shape) {
        newShapes[newId] = {...shape, id: newId}
    }
    const newChildren: TreeNode[] = []
    for (const child of node.children) {
        const {node: childNode, newShapes: childShapes} = cloneSubtree(child, shapes)
        newChildren.push(childNode)
        Object.assign(newShapes, childShapes)
    }
    return {node: {id: newId, children: newChildren}, newShapes}
}

/** Find the nearest group-type ancestor of a shape, or null. */
function findGroupAncestor(
    id: string,
    shapes: Record<string, Shape>,
    parentMap: Record<string, string>,
): string | null {
    let current = id
    while (true) {
        const parentId = parentMap[current]
        if (!parentId) return null
        const parent = shapes[parentId]
        if (!parent || parent.type === 'page') return null
        if (parent.type === 'group') return parentId
        current = parentId
    }
}

/**
 * Recompute a group's bounding box to tightly wrap its children.
 * Adjusts children's local positions so their absolute positions are unchanged.
 */
function recomputeGroupBounds(groupId: string, doc: VibeDocument): VibeDocument {
    const groupNode = findNode(doc.rootNodes, groupId)
    if (!groupNode || groupNode.children.length === 0) return doc

    const group = doc.shapes[groupId]
    if (!group || group.type !== 'group') return doc

    // Compute union of children's local bounding boxes
    let union: { x: number; y: number; width: number; height: number } | null = null
    for (const childNode of groupNode.children) {
        const child = doc.shapes[childNode.id]
        if (!child || child.type === 'line') continue
        const t = child.transform
        if (!union) {
            union = {x: t.x, y: t.y, width: t.width, height: t.height}
        } else {
            union = unionBoxes(union, t)
        }
    }
    if (!union) return doc

    const newGroupTransform = {
        ...group.transform,
        x: group.transform.x + union.x,
        y: group.transform.y + union.y,
        width: union.width,
        height: union.height,
    }

    // Shift children so their absolute positions stay the same
    const dx = union.x
    const dy = union.y
    const newShapes = {...doc.shapes, [groupId]: {...group, transform: newGroupTransform}}
    for (const childNode of groupNode.children) {
        const child = newShapes[childNode.id]
        if (!child || child.type === 'line') continue
        newShapes[childNode.id] = {
            ...child,
            transform: {...child.transform, x: child.transform.x - dx, y: child.transform.y - dy},
        } as Shape
    }

    return {...doc, shapes: newShapes}
}

function pageSizeFromPreset(presetId: string): {width: number; height: number} | null {
    const preset = findBuiltInPageDimension(presetId)
    return preset ? {width: preset.width, height: preset.height} : null
}

function normalizePageShape(
    shape: PageShape,
    docDimensions: DimensionAsset[],
    libraryDimensions: DimensionAsset[],
): PageShape {
    const nextPageSize = shape.pageSize ?? (shape.fixedSize
        ? {kind: 'custom' as const, width: shape.fixedSize.width, height: shape.fixedSize.height}
        : null)
    const resolved = resolvePageSize(nextPageSize, docDimensions, libraryDimensions)
    const nextFixedSize = resolved ?? shape.fixedSize
    return {
        ...shape,
        pageSize: nextPageSize,
        fixedSize: nextFixedSize,
    }
}

function normalizePageShapes(doc: VibeDocument, libraryDimensions: DimensionAsset[]): VibeDocument {
    const docDimensions = doc.dimensions ?? []
    let changed = false
    const nextShapes: Record<string, Shape> = {...doc.shapes}
    for (const shape of Object.values(nextShapes)) {
        if (shape.type !== 'page') continue
        const normalized = normalizePageShape(shape, docDimensions, libraryDimensions)
        if (
            normalized.pageSize !== shape.pageSize ||
            JSON.stringify(normalized.fixedSize) !== JSON.stringify(shape.fixedSize)
        ) {
            nextShapes[shape.id] = normalized
            changed = true
        }
    }
    return changed ? {...doc, shapes: nextShapes} : doc
}

function dimensionAssetRefersToPage(shape: PageShape, assetId: string, scope: 'document' | 'library'): boolean {
    return shape.pageSize?.kind === 'asset' && shape.pageSize.assetId === assetId && shape.pageSize.scope === scope
}

function normalizeShapePowerUps(shape: Shape): ShapePowerUpEntry[] {
    if (!shape.powerUps) return []
    return shape.powerUps.map(entry => ({
        id: entry.id,
        version: typeof entry.version === 'number' ? entry.version : 1,
        features: entry.features ?? {},
    }))
}

// ─── Document reducer (pure) ───────────────────────────────────────────────

export function applyDocumentAction(doc: VibeDocument, action: DocumentAction): VibeDocument {
    switch (action.type) {
        case 'ADD_SHAPE': {
            const node: TreeNode = {id: action.shape.id, children: []}
            return {
                ...doc,
                shapes: {...doc.shapes, [action.shape.id]: action.shape},
                rootNodes: insertNode(doc.rootNodes, action.parentId, node, action.index),
            }
        }

        case 'DELETE_SHAPES': {
            const idsSet = new Set(action.ids)
            // Also collect children
            const toDelete = new Set<string>()
            const collectDescendants = (nodes: TreeNode[]) => {
                for (const n of nodes) {
                    if (idsSet.has(n.id)) {
                        const all = getAllIds([n])
                        all.forEach(id => toDelete.add(id))
                    } else {
                        collectDescendants(n.children)
                    }
                }
            }
            collectDescendants(doc.rootNodes)
            // Also delete line shapes that reference deleted shapes
            const newShapes = {...doc.shapes}
            for (const id of Object.keys(newShapes)) {
                if (toDelete.has(id)) {
                    delete newShapes[id]
                }
            }
            let newRoots = doc.rootNodes
            for (const id of toDelete) {
                newRoots = removeNode(newRoots, id)
            }
            return {...doc, shapes: newShapes, rootNodes: newRoots}
        }

        case 'MOVE_SHAPES': {
            const newShapes = {...doc.shapes}
            for (const id of action.ids) {
                const shape = newShapes[id]
                if (!shape || shape.locked) continue
                if (shape.type === 'line') {
                    const start = shape.start.kind === 'free'
                        ? {
                            kind: 'free' as const,
                            point: {
                                x: shape.start.point.x + action.dx,
                                y: shape.start.point.y + action.dy
                            }
                        }
                        : shape.start
                    const end = shape.end.kind === 'free'
                        ? {
                            kind: 'free' as const,
                            point: {
                                x: shape.end.point.x + action.dx,
                                y: shape.end.point.y + action.dy
                            }
                        }
                        : shape.end
                    newShapes[id] = {...shape, start, end}
                } else {
                    const t = shape.transform
                    newShapes[id] = {
                        ...shape,
                        transform: {...t, x: t.x + action.dx, y: t.y + action.dy}
                    }
                }
            }
            let newDoc: VibeDocument = {...doc, shapes: newShapes}
            // Recompute bounds for any group ancestors of moved shapes
            const parentMap = buildParentMap(doc.rootNodes)
            const groupsToRecompute = new Set<string>()
            for (const id of action.ids) {
                const gid = findGroupAncestor(id, doc.shapes, parentMap)
                if (gid) groupsToRecompute.add(gid)
            }
            for (const gid of groupsToRecompute) {
                newDoc = recomputeGroupBounds(gid, newDoc)
            }
            return newDoc
        }

        case 'SET_TRANSFORM': {
            const shape = doc.shapes[action.id]
            if (!shape || shape.type === 'line' || shape.locked) return doc
            let newDoc: VibeDocument = {
                ...doc,
                shapes: {...doc.shapes, [action.id]: {...shape, transform: action.transform}},
            }
            const parentMap = buildParentMap(doc.rootNodes)
            const gid = findGroupAncestor(action.id, doc.shapes, parentMap)
            if (gid) newDoc = recomputeGroupBounds(gid, newDoc)
            return newDoc
        }

        case 'SET_CONNECTOR_START': {
            const shape = doc.shapes[action.id]
            if (!shape || shape.type !== 'line') return doc
            return {
                ...doc,
                shapes: {...doc.shapes, [action.id]: {...shape, start: action.endpoint}},
            }
        }

        case 'SET_CONNECTOR_END': {
            const shape = doc.shapes[action.id]
            if (!shape || shape.type !== 'line') return doc
            return {
                ...doc,
                shapes: {...doc.shapes, [action.id]: {...shape, end: action.endpoint}},
            }
        }

        case 'PATCH_SHAPE': {
            const shape = doc.shapes[action.id]
            // Allow patching locked/visible even when locked; block everything else
            if (!shape) return doc
            if (shape.locked && !('locked' in action.patch) && !('visible' in action.patch)) return doc
            const patched = {...shape, ...action.patch} as Shape
            return {
                ...doc,
                shapes: {...doc.shapes, [action.id]: patched},
            }
        }

        case 'REPARENT_SHAPE': {
            const node = findNode(doc.rootNodes, action.id)
            if (!node) return doc
            const withoutNode = removeNode(doc.rootNodes, action.id)
            const withNode = insertNode(withoutNode, action.newParentId, node, action.index)
            // If this shape is a page, remove it from any folder it was in
            const shape = doc.shapes[action.id]
            const pageFolders = shape?.type === 'page'
                ? doc.pageFolders.map(f => ({
                    ...f,
                    pageIds: f.pageIds.filter(pid => pid !== action.id),
                }))
                : doc.pageFolders
            if (action.x === undefined && action.y === undefined) {
                return {...doc, rootNodes: withNode, pageFolders}
            }
            if (!shape || !('transform' in shape)) return {...doc, rootNodes: withNode, pageFolders}
            const updatedShape = {
                ...shape,
                transform: {
                    ...shape.transform,
                    x: action.x ?? shape.transform.x,
                    y: action.y ?? shape.transform.y
                }
            }
            return {
                ...doc,
                rootNodes: withNode,
                shapes: {...doc.shapes, [action.id]: updatedShape},
                pageFolders
            }
        }

        case 'REORDER_SHAPE': {
            const reorderId = action.id
            const reorderDir = action.direction

            function reorderInList(nodes: TreeNode[]): TreeNode[] {
                const idx = nodes.findIndex(n => n.id === reorderId)
                if (idx === -1) {
                    return nodes.map(n => ({...n, children: reorderInList(n.children)}))
                }
                const arr = [...nodes]
                const [item] = arr.splice(idx, 1)
                let newIdx: number
                switch (reorderDir) {
                    case 'up':
                        newIdx = Math.max(0, idx - 1);
                        break
                    case 'down':
                        newIdx = Math.min(arr.length, idx + 1);
                        break
                    case 'to-front':
                        newIdx = arr.length;
                        break
                    case 'to-back':
                        newIdx = 0;
                        break
                    default:
                        newIdx = idx
                }
                arr.splice(newIdx, 0, item)
                return arr
            }

            return {...doc, rootNodes: reorderInList(doc.rootNodes)}
        }

        case 'COMMIT_TEXT_EDIT': {
            const shape = doc.shapes[action.id]
            if (!shape) return doc
            if (shape.type === 'text') {
                return {
                    ...doc,
                    shapes: {
                        ...doc.shapes,
                        [action.id]: {...shape, text: {...shape.text, content: action.content}}
                    },
                }
            }
            if (shape.type === 'button') {
                return {
                    ...doc,
                    shapes: {
                        ...doc.shapes,
                        [action.id]: {...shape, text: {...shape.text, content: action.content}}
                    },
                }
            }
            if (shape.type === 'panel' && shape.text) {
                return {
                    ...doc,
                    shapes: {
                        ...doc.shapes,
                        [action.id]: {...shape, text: {...shape.text, content: action.content}}
                    },
                }
            }
            if (shape.type === 'tabbed-panel') {
                return {
                    ...doc,
                    shapes: {
                        ...doc.shapes,
                        [action.id]: {...shape, text: {...shape.text, content: action.content}}
                    },
                }
            }
            if (
                shape.type === 'label' || shape.type === 'textfield' ||
                shape.type === 'checkbox' || shape.type === 'toggle' || shape.type === 'radio' ||
                shape.type === 'select' || shape.type === 'stickynote' || shape.type === 'list' || shape.type === 'table'
            ) {
                return {
                    ...doc,
                    shapes: {
                        ...doc.shapes,
                        [action.id]: {...shape, text: {...shape.text, content: action.content}}
                    },
                }
            }
            return doc
        }

        case 'DUPLICATE_SHAPES': {
            let newDoc = doc
            for (let i = 0; i < action.ids.length; i++) {
                const id = action.ids[i]
                const node = findNode(newDoc.rootNodes, id)
                if (!node) continue
                const overrideId = action.rootIds?.[i]
                const {node: clonedNode, newShapes} = cloneSubtree(node, newDoc.shapes, overrideId)
                // Offset the root clone by (10, 10) in local space
                const rootShape = newShapes[clonedNode.id]
                if (rootShape && rootShape.type !== 'line' && rootShape.type !== 'page') {
                    newShapes[clonedNode.id] = {
                        ...rootShape,
                        transform: {
                            ...rootShape.transform,
                            x: rootShape.transform.x + 10,
                            y: rootShape.transform.y + 10
                        },
                    }
                }
                if (rootShape?.type === 'page') {
                    newShapes[clonedNode.id] = {...rootShape, id: clonedNode.id, name: `${rootShape.name} copy`}
                }
                // Insert after the original
                const parentNode = findParent(newDoc.rootNodes, id)
                const parentId = parentNode?.id ?? null
                const siblings = parentNode ? parentNode.children : newDoc.rootNodes
                const idx = siblings.findIndex(n => n.id === id)
                const insertIndex = idx >= 0 ? idx + 1 : siblings.length
                newDoc = {
                    ...newDoc,
                    shapes: {...newDoc.shapes, ...newShapes},
                    rootNodes: insertNode(newDoc.rootNodes, parentId, clonedNode, insertIndex),
                }
            }
            return newDoc
        }

        case 'PLACE_SHAPE_TEMPLATE': {
            const {template, parentId, x, y} = action
            const {node: clonedNode, newShapes} = cloneSubtree(template.rootNode, template.shapes)
            const rootShape = newShapes[clonedNode.id]
            if (rootShape && rootShape.type !== 'line' && 'transform' in rootShape) {
                newShapes[clonedNode.id] = {
                    ...rootShape,
                    transform: {...(rootShape as {transform: object}).transform, x, y},
                } as typeof rootShape
            }
            const siblings = parentId ? (findNode(doc.rootNodes, parentId)?.children ?? []) : doc.rootNodes
            return {
                ...doc,
                shapes: {...doc.shapes, ...newShapes},
                rootNodes: insertNode(doc.rootNodes, parentId, clonedNode, siblings.length),
            }
        }

        case 'PLACE_PAGE_TEMPLATE': {
            const {template, newPageId} = action
            const {node: clonedNode, newShapes} = cloneSubtree(template.rootNode, template.shapes, newPageId)
            const rootShape = newShapes[clonedNode.id]
            if (rootShape?.type === 'page') {
                newShapes[clonedNode.id] = {...rootShape, id: clonedNode.id, name: `${rootShape.name} copy`}
            }
            return {
                ...doc,
                shapes: {...doc.shapes, ...newShapes},
                rootNodes: [...doc.rootNodes, clonedNode],
            }
        }

        case 'ALIGN_SHAPES': {
            const updates = computeAlignedTransforms(action.ids, doc.shapes, doc.rootNodes, action.alignment)
            let newShapes = {...doc.shapes}
            for (const {id, transform} of updates) {
                const shape = newShapes[id]
                if (shape && shape.type !== 'line') {
                    newShapes = {...newShapes, [id]: {...shape, transform} as Shape}
                }
            }
            return {...doc, shapes: newShapes}
        }

        case 'LOAD_DOCUMENT': {
            const d = action.document
            // Auto-create image assets for existing image shapes in old documents
            let images: ImageAsset[] = d.images ?? []
            let shapes = d.shapes
            if (images.length === 0) {
                const newImages: ImageAsset[] = []
                const patchedShapes: Record<string, Shape> = {...shapes}
                for (const shape of Object.values(shapes)) {
                    if (shape.type === 'image' && !(shape as ImageShape).assetId) {
                        const asset: ImageAsset = {
                            id: generateId(),
                            name: shape.name,
                            src: (shape as ImageShape).src,
                            mimeType: (shape as ImageShape).mimeType,
                        }
                        newImages.push(asset)
                        patchedShapes[shape.id] = {...shape, assetId: asset.id} as Shape
                    }
                }
                images = newImages
                shapes = patchedShapes
            }
            let normalizedDocument: VibeDocument = {
                ...d,
                shapes,
                themes: d.themes ?? [...BUILT_IN_THEMES],
                activeThemeId: d.activeThemeId ?? 'hand-drawn',
                gridSettings: d.gridSettings ?? {...DEFAULT_GRID_SETTINGS},
                pageFolders: d.pageFolders ?? [],
                images,
                dimensions: d.dimensions ?? [],
                customFonts: (d.customFonts ?? []).map((f: unknown) =>
                    typeof f === 'string' ? {
                        id: crypto.randomUUID(),
                        name: f,
                        metadataVersion: 0,
                        isVariable: null as null,
                        axes: []
                    } : f as CustomFont
                ),
                powerUps: (d.powerUps ?? []).map(entry => ({
                    id: entry.id,
                    version: typeof entry.version === 'number' ? entry.version : 1,
                    settings: entry.settings ?? {},
                })),
            }
            normalizedDocument = {
                ...normalizedDocument,
                shapes: Object.fromEntries(
                    Object.entries(normalizedDocument.shapes).map(([id, shape]) => [
                        id,
                        {...shape, powerUps: normalizeShapePowerUps(shape)} as Shape,
                    ]),
                ),
            }
            normalizedDocument = normalizePageShapes(normalizedDocument, normalizedDocument.dimensions ?? [])
            return migrateDocumentPowerUps(normalizedDocument)
        }

        case 'UPDATE_GRID_SETTINGS':
            return {...doc, gridSettings: {...doc.gridSettings, ...action.patch}}

        case 'ADD_PAGE_FOLDER':
            return {...doc, pageFolders: [...doc.pageFolders, action.folder]}

        case 'DELETE_PAGE_FOLDER': {
            const folder = doc.pageFolders.find(f => f.id === action.folderId)
            if (!folder) return {
                ...doc,
                pageFolders: doc.pageFolders.filter(f => f.id !== action.folderId)
            }
            if (action.deletionMode === 'unfolder') {
                return {...doc, pageFolders: doc.pageFolders.filter(f => f.id !== action.folderId)}
            }
            // delete-pages: remove all pages in the folder and their descendants
            const idsToDelete = folder.pageIds
            let newDoc = applyDocumentAction(doc, {type: 'DELETE_SHAPES', ids: idsToDelete})
            return {
                ...newDoc,
                pageFolders: newDoc.pageFolders.filter(f => f.id !== action.folderId)
            }
        }

        case 'RENAME_PAGE_FOLDER':
            return {
                ...doc,
                pageFolders: doc.pageFolders.map(f =>
                    f.id === action.folderId ? {...f, name: action.name} : f
                ),
            }

        case 'ASSIGN_PAGES_TO_FOLDER': {
            const newPageIds = new Set(action.pageIds)
            // Remove these page IDs from any other folder
            const updatedFolders = doc.pageFolders.map(f => {
                if (f.id === action.folderId) {
                    const existing = new Set(f.pageIds)
                    for (const id of newPageIds) existing.add(id)
                    return {...f, pageIds: [...existing]}
                }
                return {...f, pageIds: f.pageIds.filter(id => !newPageIds.has(id))}
            })
            return {...doc, pageFolders: updatedFolders}
        }

        case 'REMOVE_PAGES_FROM_FOLDER': {
            const toRemove = new Set(action.pageIds)
            return {
                ...doc,
                pageFolders: doc.pageFolders.map(f =>
                    f.id === action.folderId
                        ? {...f, pageIds: f.pageIds.filter(id => !toRemove.has(id))}
                        : f
                ),
            }
        }

        case 'REORDER_PAGE_FOLDER': {
            const idx = doc.pageFolders.findIndex(f => f.id === action.folderId)
            if (idx === -1) return doc
            const arr = [...doc.pageFolders]
            const [item] = arr.splice(idx, 1)
            const newIdx = action.direction === 'up' ? Math.max(0, idx - 1) : Math.min(arr.length, idx + 1)
            arr.splice(newIdx, 0, item)
            return {...doc, pageFolders: arr}
        }

        case 'ADD_IMAGE_ASSET':
            return {...doc, images: [...(doc.images ?? []), action.asset]}

        case 'UPDATE_IMAGE_ASSET': {
            const newImages = (doc.images ?? []).map(a => a.id === action.asset.id ? action.asset : a)
            // Propagate src/mimeType change to all linked shapes
            const newShapes = {...doc.shapes}
            for (const [id, shape] of Object.entries(doc.shapes)) {
                if (shape.type === 'image' && (shape as ImageShape).assetId === action.asset.id) {
                    newShapes[id] = {
                        ...shape,
                        src: action.asset.src,
                        mimeType: action.asset.mimeType
                    } as Shape
                }
            }
            return {...doc, images: newImages, shapes: newShapes}
        }

        case 'DELETE_IMAGE_ASSET': {
            const newImages = (doc.images ?? []).filter(a => a.id !== action.assetId)
            // Unlink shapes (keep their current src, just clear assetId)
            const newShapes = {...doc.shapes}
            for (const [id, shape] of Object.entries(doc.shapes)) {
                if (shape.type === 'image' && (shape as ImageShape).assetId === action.assetId) {
                    const {assetId: _, ...rest} = shape as ImageShape
                    newShapes[id] = rest as unknown as Shape
                }
            }
            return {...doc, images: newImages, shapes: newShapes}
        }

        case 'ADD_DIMENSION_ASSET': {
            const dimensions = [...(doc.dimensions ?? []), action.asset]
            return normalizePageShapes({...doc, dimensions}, dimensions)
        }

        case 'UPDATE_DIMENSION_ASSET': {
            const dimensions = (doc.dimensions ?? []).map(a => a.id === action.asset.id ? action.asset : a)
            return normalizePageShapes({...doc, dimensions}, dimensions)
        }

        case 'DELETE_DIMENSION_ASSET': {
            const dimensions = (doc.dimensions ?? []).filter(a => a.id !== action.assetId)
            const newShapes = {...doc.shapes}
            for (const shape of Object.values(newShapes)) {
                if (shape.type !== 'page') continue
                if (dimensionAssetRefersToPage(shape, action.assetId, 'document')) {
                    const fallback = shape.fixedSize ?? pageSizeFromPreset(DEFAULT_PAGE_DIMENSION_ID) ?? {width: 800, height: 600}
                    newShapes[shape.id] = {
                        ...shape,
                        pageSize: {kind: 'custom', width: fallback.width, height: fallback.height},
                        fixedSize: {width: fallback.width, height: fallback.height},
                    }
                }
            }
            return normalizePageShapes({...doc, dimensions, shapes: newShapes}, dimensions)
        }

        case 'ADD_PIXEL_ASSET':
            return {...doc, pixelAssets: [...(doc.pixelAssets ?? []), action.asset]}

        case 'UPDATE_PIXEL_ASSET':
            return {
                ...doc,
                pixelAssets: (doc.pixelAssets ?? []).map(a => a.id === action.asset.id ? action.asset : a)
            }

        case 'DELETE_PIXEL_ASSET': {
            const remaining = (doc.pixelAssets ?? []).filter(a => a.id !== action.assetId)
            // Also remove shapes that reference this asset
            const newShapes = {...doc.shapes}
            for (const [id, shape] of Object.entries(doc.shapes)) {
                if (shape.type === 'pixelimage' && shape.assetId === action.assetId) {
                    delete newShapes[id]
                }
            }
            return {...doc, pixelAssets: remaining, shapes: newShapes}
        }

        case 'ADD_GUIDE': {
            const page = doc.shapes[action.pageId]
            if (!page || page.type !== 'page') return doc
            const guides = [...(page.guides ?? []), action.guide]
            return {...doc, shapes: {...doc.shapes, [action.pageId]: {...page, guides}}}
        }

        case 'DELETE_GUIDE': {
            const page = doc.shapes[action.pageId]
            if (!page || page.type !== 'page') return doc
            const guides = (page.guides ?? []).filter(g => g.id !== action.guideId)
            return {...doc, shapes: {...doc.shapes, [action.pageId]: {...page, guides}}}
        }

        case 'MOVE_GUIDE': {
            const page = doc.shapes[action.pageId]
            if (!page || page.type !== 'page') return doc
            const guides = (page.guides ?? []).map(g =>
                g.id === action.guideId ? {...g, position: action.position} : g)
            return {...doc, shapes: {...doc.shapes, [action.pageId]: {...page, guides}}}
        }

        case 'ADD_CUSTOM_FONT': {
            const existing = doc.customFonts ?? []
            if (existing.some(f => f.name === action.font.name)) return doc
            return {...doc, customFonts: [...existing, action.font]}
        }
        case 'DELETE_CUSTOM_FONT':
            return {
                ...doc,
                customFonts: (doc.customFonts ?? []).filter(f => f.name !== action.fontName)
            }
        case 'UPDATE_CUSTOM_FONT_META':
            return {
                ...doc,
                customFonts: (doc.customFonts ?? []).map(f =>
                    f.name === action.fontName ? {...f, ...action.patch} : f
                ),
            }

        case 'ADD_GRADIENT':
            return {...doc, gradients: [...(doc.gradients ?? []), action.gradient]}
        case 'UPDATE_GRADIENT': {
            const newGradients = (doc.gradients ?? []).map(g => g.id === action.gradient.id ? action.gradient : g)
            const newShapes = applyGradientToShapes(doc.shapes, action.gradient.id, action.gradient.stops)
            return {...doc, gradients: newGradients, shapes: newShapes}
        }
        case 'DELETE_GRADIENT':
            return {...doc, gradients: (doc.gradients ?? []).filter(g => g.id !== action.gradientId)}

        case 'ADD_SKETCH_STYLE':
            return {...doc, sketchStyles: [...(doc.sketchStyles ?? []), action.style]}
        case 'UPDATE_SKETCH_STYLE':
            return {
                ...doc,
                sketchStyles: (doc.sketchStyles ?? []).map(s => s.id === action.style.id ? action.style : s),
            }
        case 'DELETE_SKETCH_STYLE':
            return {...doc, sketchStyles: (doc.sketchStyles ?? []).filter(s => s.id !== action.styleId)}

        case 'ADD_DOCUMENT_POWER_UP': {
            if ((doc.powerUps ?? []).some(p => p.id === action.powerUpId)) return doc
            const entry = createDocumentPowerUpEntry(action.powerUpId)
            if (!entry) return doc
            return {...doc, powerUps: [...(doc.powerUps ?? []), entry]}
        }

        case 'REMOVE_DOCUMENT_POWER_UP': {
            if (!(doc.powerUps ?? []).some(p => p.id === action.powerUpId)) return doc
            const powerUps = (doc.powerUps ?? []).filter(p => p.id !== action.powerUpId)
            const shapes = Object.fromEntries(
                Object.entries(doc.shapes).map(([id, shape]) => {
                    if (!shape.powerUps || shape.powerUps.length === 0) return [id, shape]
                    const remaining = shape.powerUps.filter(entry => entry.id !== action.powerUpId)
                    if (remaining.length === shape.powerUps.length) return [id, shape]
                    return [id, {...shape, powerUps: remaining} as Shape]
                }),
            )
            return {...doc, powerUps, shapes}
        }

        case 'UPDATE_DOCUMENT_POWER_UP_SETTINGS': {
            const powerUps = (doc.powerUps ?? []).map(entry =>
                entry.id === action.powerUpId
                    ? {...entry, settings: {...entry.settings, ...action.patch}}
                    : entry,
            )
            return {...doc, powerUps}
        }

        case 'ADD_SHAPE_POWER_UP_FEATURE': {
            if (!(doc.powerUps ?? []).some(p => p.id === action.powerUpId)) return doc
            const shape = doc.shapes[action.shapeId]
            if (!shape) return doc
            const definition = getPowerUpDefinition(action.powerUpId)
            if (!definition) return doc
            const feature = definition.nodeFeatures?.find(f => f.id === action.featureId)
            if (!feature) return doc
            if (feature.canAttachToShape && !feature.canAttachToShape(shape)) return doc

            const shapePowerUps = normalizeShapePowerUps(shape)
            const existingIdx = shapePowerUps.findIndex(entry => entry.id === action.powerUpId)
            const featureDefaults = createDefaultFeatureSettings(action.powerUpId, action.featureId)
            if (!featureDefaults) return doc

            let nextShapePowerUps = shapePowerUps
            if (existingIdx === -1) {
                const defaults = createDefaultShapePowerUpEntry(action.powerUpId)
                if (!defaults) return doc
                nextShapePowerUps = [...shapePowerUps, defaults]
            }

            const idx = nextShapePowerUps.findIndex(entry => entry.id === action.powerUpId)
            const entry = nextShapePowerUps[idx]
            if (entry.features[action.featureId]) return doc
            nextShapePowerUps = [...nextShapePowerUps]
            nextShapePowerUps[idx] = {
                ...entry,
                version: definition.version,
                features: {
                    ...entry.features,
                    [action.featureId]: featureDefaults,
                },
            }
            return {
                ...doc,
                shapes: {
                    ...doc.shapes,
                    [shape.id]: {...shape, powerUps: nextShapePowerUps},
                },
            }
        }

        case 'REMOVE_SHAPE_POWER_UP_FEATURE': {
            const shape = doc.shapes[action.shapeId]
            if (!shape || !shape.powerUps || shape.powerUps.length === 0) return doc
            const entry = shape.powerUps.find(p => p.id === action.powerUpId)
            if (!entry || !(action.featureId in entry.features)) return doc
            const remainingFeatures = {...entry.features}
            delete remainingFeatures[action.featureId]
            const nextEntries = Object.keys(remainingFeatures).length === 0
                ? shape.powerUps.filter(p => p.id !== action.powerUpId)
                : shape.powerUps.map(p => p.id === action.powerUpId ? {...p, features: remainingFeatures} : p)
            return {
                ...doc,
                shapes: {
                    ...doc.shapes,
                    [shape.id]: {...shape, powerUps: nextEntries},
                },
            }
        }

        case 'UPDATE_SHAPE_POWER_UP_FEATURE_SETTINGS': {
            const shape = doc.shapes[action.shapeId]
            if (!shape || !shape.powerUps || shape.powerUps.length === 0) return doc
            const entry = shape.powerUps.find(p => p.id === action.powerUpId)
            if (!entry) return doc
            const currentSettings = entry.features[action.featureId]
            if (!currentSettings) return doc
            const nextEntries = shape.powerUps.map(p => {
                if (p.id !== action.powerUpId) return p
                return {
                    ...p,
                    features: {
                        ...p.features,
                        [action.featureId]: {
                            ...currentSettings,
                            ...action.patch,
                        },
                    },
                }
            })
            return {
                ...doc,
                shapes: {
                    ...doc.shapes,
                    [shape.id]: {...shape, powerUps: nextEntries},
                },
            }
        }

        case 'ADD_THEME':
            return {...doc, themes: [...doc.themes, action.theme]}

        case 'UPDATE_THEME':
            return {
                ...doc,
                themes: doc.themes.map(t => t.id === action.theme.id ? action.theme : t),
            }

        case 'DELETE_THEME': {
            const remaining = doc.themes.filter(t => t.id !== action.themeId)
            const activeId = doc.activeThemeId === action.themeId
                ? (remaining[0]?.id ?? 'hand-drawn')
                : doc.activeThemeId
            return {...doc, themes: remaining, activeThemeId: activeId}
        }

        case 'SET_ACTIVE_THEME':
            return {...doc, activeThemeId: action.themeId}

        case 'APPLY_THEME_TO_ALL_SHAPES': {
            const theme = getActiveTheme(doc)
            const newShapes = {...doc.shapes}
            for (const id of Object.keys(newShapes)) {
                const patch = buildThemeResetPatch(newShapes[id], theme)
                if (Object.keys(patch).length > 0) {
                    newShapes[id] = {...newShapes[id], ...patch} as Shape
                }
            }
            return {...doc, shapes: newShapes}
        }

        case 'GROUP_SHAPES': {
            if (action.ids.length === 0) return doc

            const parentMap = buildParentMap(doc.rootNodes)

            // Compute absolute bounding boxes for all shapes upfront
            const absTransforms: Record<string, {
                x: number;
                y: number;
                width: number;
                height: number
            }> = {}
            let groupUnion: { x: number; y: number; width: number; height: number } | null = null
            for (const id of action.ids) {
                const shape = doc.shapes[id]
                if (!shape || shape.type === 'line') continue
                const abs = getAbsoluteTransform(id, doc.shapes, parentMap)
                if (!abs) continue
                absTransforms[id] = abs
                if (!groupUnion) {
                    groupUnion = {x: abs.x, y: abs.y, width: abs.width, height: abs.height}
                } else {
                    groupUnion = unionBoxes(groupUnion, abs)
                }
            }
            if (!groupUnion) return doc

            // Place group as sibling of first shape
            const firstId = action.ids[0]
            const firstParentId = parentMap[firstId] ?? null
            const parentContentOrigin = getParentContentOrigin(firstId, doc.shapes, parentMap)

            const groupId = generateId()
            const groupShape: Shape = {
                id: groupId,
                name: 'Group',
                locked: false,
                visible: true,
                type: 'group',
                transform: {
                    x: groupUnion.x - parentContentOrigin.x,
                    y: groupUnion.y - parentContentOrigin.y,
                    width: groupUnion.width,
                    height: groupUnion.height,
                    rotation: 0,
                },
            }

            let newDoc: VibeDocument = {
                ...doc,
                shapes: {...doc.shapes, [groupId]: groupShape},
                rootNodes: insertNode(doc.rootNodes, firstParentId, {id: groupId, children: []}),
            }

            // Reparent each shape into the group with group-local coordinates
            for (const id of action.ids) {
                const abs = absTransforms[id]
                if (!abs) continue
                const newX = abs.x - groupUnion.x
                const newY = abs.y - groupUnion.y
                const groupNode = findNode(newDoc.rootNodes, groupId)
                const insertIdx = groupNode ? groupNode.children.length : 0
                newDoc = applyDocumentAction(newDoc, {
                    type: 'REPARENT_SHAPE',
                    id,
                    newParentId: groupId,
                    index: insertIdx,
                    x: newX,
                    y: newY,
                })
            }

            return newDoc
        }

        case 'UNGROUP_SHAPES': {
            const groupNode = findNode(doc.rootNodes, action.id)
            if (!groupNode) return doc
            const group = doc.shapes[action.id]
            if (!group || group.type !== 'group') return doc

            const parentMap = buildParentMap(doc.rootNodes)
            const groupParentId = parentMap[action.id] ?? null
            const parentContentOrigin = getParentContentOrigin(action.id, doc.shapes, parentMap)

            // Compute absolute positions of all children before any reparenting
            const groupAbs = getAbsoluteTransform(action.id, doc.shapes, parentMap)
            if (!groupAbs) return doc

            const childMoves: { id: string; newX: number; newY: number }[] = []
            for (const childNode of groupNode.children) {
                const child = doc.shapes[childNode.id]
                if (!child || child.type === 'line') continue
                // Child absolute = group absolute + child local (group has no content offset)
                const absX = groupAbs.x + child.transform.x
                const absY = groupAbs.y + child.transform.y
                childMoves.push({
                    id: childNode.id,
                    newX: absX - parentContentOrigin.x,
                    newY: absY - parentContentOrigin.y,
                })
            }

            // Find group's index among siblings for insertion order
            const parentNode = groupParentId ? findNode(doc.rootNodes, groupParentId) : null
            const siblings = parentNode ? parentNode.children : doc.rootNodes
            const groupIndex = siblings.findIndex(n => n.id === action.id)

            let newDoc = doc
            for (let i = 0; i < childMoves.length; i++) {
                const {id, newX, newY} = childMoves[i]
                newDoc = applyDocumentAction(newDoc, {
                    type: 'REPARENT_SHAPE',
                    id,
                    newParentId: groupParentId,
                    index: groupIndex + i,
                    x: newX,
                    y: newY,
                })
            }

            // Delete the now-empty group
            return applyDocumentAction(newDoc, {type: 'DELETE_SHAPES', ids: [action.id]})
        }

        case 'RESET_SHAPES_TO_THEME': {
            const theme = getActiveTheme(doc)
            let newShapes = {...doc.shapes}
            for (const id of action.ids) {
                const shape = newShapes[id]
                if (!shape) continue
                const patch = buildThemeResetPatch(shape, theme)
                if (Object.keys(patch).length > 0) {
                    newShapes = {...newShapes, [id]: {...shape, ...patch} as Shape}
                }
            }
            return {...doc, shapes: newShapes}
        }

        case 'ADD_PALETTE':
            return {...doc, palettes: [...doc.palettes, action.palette]}

        case 'DELETE_PALETTE':
            return {...doc, palettes: doc.palettes.filter(p => p.id !== action.paletteId)}

        case 'RENAME_PALETTE':
            return {
                ...doc,
                palettes: doc.palettes.map(p =>
                    p.id === action.paletteId ? {...p, name: action.name} : p
                ),
            }

        case 'ADD_PALETTE_COLOR':
            return {
                ...doc,
                palettes: doc.palettes.map(p =>
                    p.id === action.paletteId ? {...p, colors: [...p.colors, action.color]} : p
                ),
            }

        case 'DELETE_PALETTE_COLOR':
            return {
                ...doc,
                palettes: doc.palettes.map(p =>
                    p.id === action.paletteId
                        ? {...p, colors: p.colors.filter(c => c.id !== action.colorId)}
                        : p
                ),
            }

        case 'UPDATE_PALETTE_COLOR': {
            const newPalettes = doc.palettes.map(p =>
                p.id === action.paletteId
                    ? {
                        ...p,
                        colors: p.colors.map(c =>
                            c.id === action.colorId
                                ? {...c, ...(action.color !== undefined && {color: action.color}), ...(action.name !== undefined && {name: action.name})}
                                : c
                        ),
                    }
                    : p
            )
            const newShapes = action.color !== undefined
                ? applyPaletteColorToShapes(doc.shapes, action.colorId, action.color)
                : doc.shapes
            return {...doc, palettes: newPalettes, shapes: newShapes}
        }

        default:
            return doc
    }
}

// Builds a partial patch that resets a shape's theme-managed properties to current theme values.
function buildThemeResetPatch(shape: Shape, theme: Theme): Partial<Shape> {
    const patch: Record<string, unknown> = {}

    if ('fill' in shape && shape.fill) {
        patch.fill = {...shape.fill, color: theme.background}
    }
    if ('stroke' in shape && shape.stroke) {
        patch.stroke = {...shape.stroke, color: theme.border, width: theme.borderWidth}
    }
    if ('cornerRadius' in shape) {
        patch.cornerRadius = theme.borderRadius
    }
    if ('text' in shape && shape.text && typeof shape.text === 'object') {
        patch.text = {
            ...shape.text,
            fontFamily: theme.fontFamily,
            fontSize: theme.fontSize,
            color: theme.foreground
        }
    }
    if ('title' in shape && shape.title && typeof shape.title === 'object') {
        patch.title = {
            ...(shape.title as object),
            fontFamily: theme.fontFamily,
            fontSize: theme.fontSize,
            color: theme.foreground
        }
    }
    if ('titleFontFamily' in shape) {
        patch.titleFontFamily = theme.fontFamily
        patch.titleFontSize = theme.fontSize
        patch.titleColor = theme.foreground
    }
    // Reset handDrawn override so shape inherits from theme
    patch.handDrawn = undefined

    return patch as Partial<Shape>
}

// Updates every color field in every shape that references the given paletteColorId.
function applyPaletteColorToShapes(
    shapes: Record<string, Shape>,
    colorId: string,
    newHex: string,
): Record<string, Shape> {
    const result = {...shapes}
    for (const id of Object.keys(result)) {
        const shape = result[id]
        let updated: Shape = shape

        if ('fill' in shape) {
            const fill = shape.fill
            if (fill.type === 'color' && fill.paletteColorId === colorId) {
                updated = {...updated, fill: {...fill, color: newHex}} as Shape
            } else if (fill.type === 'gradient') {
                const newStops = fill.stops.map(s => s.paletteColorId === colorId ? {...s, color: newHex} : s)
                if (newStops !== fill.stops) {
                    updated = {...updated, fill: {...fill, stops: newStops}} as Shape
                }
            }
        }
        if ('stroke' in shape && 'paletteColorId' in shape.stroke && shape.stroke.paletteColorId === colorId) {
            updated = {...updated, stroke: {...shape.stroke, color: newHex}} as Shape
        }
        if ('progressFill' in shape && shape.progressFill.type === 'color' && shape.progressFill.paletteColorId === colorId) {
            updated = {...updated, progressFill: {...shape.progressFill, color: newHex}} as Shape
        }
        if ('thumbFill' in shape && shape.thumbFill.type === 'color' && shape.thumbFill.paletteColorId === colorId) {
            updated = {...updated, thumbFill: {...shape.thumbFill, color: newHex}} as Shape
        }
        if ('text' in shape && shape.text.paletteColorId === colorId) {
            updated = {...updated, text: {...shape.text, color: newHex}} as Shape
        }
        if (shape.type === 'page' && shape.backgroundPaletteColorId === colorId) {
            updated = {...updated, background: newHex} as Shape
        }

        if (updated !== shape) result[id] = updated
    }
    return result
}

function applyGradientToShapes(
    shapes: Record<string, Shape>,
    gradientId: string,
    newStops: GradientStop[],
): Record<string, Shape> {
    const result = {...shapes}
    for (const id of Object.keys(result)) {
        const shape = result[id]
        let updated: Shape = shape

        if ('fill' in shape && shape.fill.type === 'gradient' && shape.fill.gradientId === gradientId) {
            updated = {...updated, fill: {...shape.fill, stops: newStops}} as Shape
        }
        if ('thumbFill' in shape && shape.thumbFill.type === 'gradient' && (shape.thumbFill as {gradientId?: string}).gradientId === gradientId) {
            updated = {...updated, thumbFill: {...shape.thumbFill, stops: newStops}} as Shape
        }
        if ('progressFill' in shape && shape.progressFill.type === 'gradient' && (shape.progressFill as {gradientId?: string}).gradientId === gradientId) {
            updated = {...updated, progressFill: {...shape.progressFill, stops: newStops}} as Shape
        }

        if (updated !== shape) result[id] = updated
    }
    return result
}

// ─── Initial state ─────────────────────────────────────────────────────────

export function createInitialDocument(): VibeDocument {
    const pageId = generateId()
    const preset = findBuiltInPageDimension(DEFAULT_PAGE_DIMENSION_ID)!
    return {
        version: 4,
        rootNodes: [{id: pageId, children: []}],
        shapes: {
            [pageId]: {
                id: pageId,
                name: 'Page 1',
                type: 'page',
                locked: false,
                visible: true,
                transform: {x: 0, y: 0, width: preset.width, height: preset.height, rotation: 0},
                fixedSize: {width: preset.width, height: preset.height},
                pageSize: {kind: 'preset', presetId: preset.id},
                background: '#ffffff',
                clipChildren: false,
            },
        },
        palettes: [{...DEFAULT_PALETTE, colors: [...DEFAULT_PALETTE.colors]}],
        themes: [...BUILT_IN_THEMES],
        activeThemeId: 'hand-drawn',
        gridSettings: {...DEFAULT_GRID_SETTINGS},
        pageFolders: [],
        images: [],
        dimensions: [],
        pixelAssets: [],
        customFonts: [],
        gradients: [
            {id: generateId(), name: 'Sunset',    stops: [{color: '#ff6b6b', position: 0}, {color: '#ffd93d', position: 1}]},
            {id: generateId(), name: 'Ocean',     stops: [{color: '#0077b6', position: 0}, {color: '#00b4d8', position: 1}]},
            {id: generateId(), name: 'Forest',    stops: [{color: '#1b4332', position: 0}, {color: '#52b788', position: 1}]},
            {id: generateId(), name: 'Grayscale', stops: [{color: '#000000', position: 0}, {color: '#ffffff', position: 1}]},
        ],
        sketchStyles: [
            {id: generateId(), name: 'Solid',       fillStyle: 'solid',   hachureAngle: 45, hachureGap: 4},
            {id: generateId(), name: 'Hatched',     fillStyle: 'hatched', hachureAngle: 45, hachureGap: 4},
            {id: generateId(), name: 'Cross Hatch', fillStyle: 'hatched', hachureAngle: 90, hachureGap: 4},
            {id: generateId(), name: 'No Fill',     fillStyle: 'none',    hachureAngle: 45, hachureGap: 4},
        ],
        powerUps: [],
    }
}

export const initialDocument = createInitialDocument()

export const initialState: AppState = {
    document: initialDocument,
    selection: {ids: [], editingTextId: null},
    viewTransform: {panX: 0, panY: 0, zoom: 1},
    toolMode: 'select',
    activePageId: initialDocument.rootNodes[0]?.id ?? null,
    showShortcutsModal: false,
    showPaletteModal: false,
    showSettingsModal: false,
    showThemeModal: false,
    showDocumentSettingsModal: false,
    showLogConsole: false,
    settings: {...DEFAULT_SETTINGS},
    drilledInContainerStack: [],
    documentId: null,
    documentName: 'Untitled',
    currentFilePath: null,
    isDirty: false,
    documentSelected: false,
    selectedAssetId: null,
    selectedDimensionAssetId: null,
    selectedPixelAssetId: null,
    editingPixelAssetId: null,
    selectedFontName: null,
    pendingDocumentsModalMode: null,
    showGradientModal: false,
    showSketchStyleModal: false,
    croppingShapeId: null,
    selectedGradientId: null,
    library: {...EMPTY_LIBRARY},
    selectedLibraryItemId: null,
    selectedLibraryItemType: null,
    physicsSimulationRunning: false,
    leftPanelVisible: true,
    rightPanelVisible: true,
    presentationMode: false,
    presentationSlideIndex: 0,
    notesVisible: false,
}

// ─── Main reducer ──────────────────────────────────────────────────────────

export function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        // ── Document actions (handled by history wrapper) ──────────────────
        case 'ADD_SHAPE':
        case 'DELETE_SHAPES':
        case 'MOVE_SHAPES':
        case 'SET_TRANSFORM':
        case 'SET_CONNECTOR_START':
        case 'SET_CONNECTOR_END':
        case 'PATCH_SHAPE':
        case 'REPARENT_SHAPE':
        case 'REORDER_SHAPE':
        case 'COMMIT_TEXT_EDIT':
        case 'DUPLICATE_SHAPES':
        case 'ALIGN_SHAPES':
        case 'LOAD_DOCUMENT':
        case 'ADD_PALETTE':
        case 'DELETE_PALETTE':
        case 'RENAME_PALETTE':
        case 'ADD_PALETTE_COLOR':
        case 'DELETE_PALETTE_COLOR':
        case 'UPDATE_PALETTE_COLOR':
        case 'ADD_THEME':
        case 'UPDATE_THEME':
        case 'DELETE_THEME':
        case 'SET_ACTIVE_THEME':
        case 'APPLY_THEME_TO_ALL_SHAPES':
        case 'RESET_SHAPES_TO_THEME':
        case 'GROUP_SHAPES':
        case 'UNGROUP_SHAPES':
        case 'UPDATE_GRID_SETTINGS':
        case 'ADD_PAGE_FOLDER':
        case 'DELETE_PAGE_FOLDER':
        case 'RENAME_PAGE_FOLDER':
        case 'ASSIGN_PAGES_TO_FOLDER':
        case 'REMOVE_PAGES_FROM_FOLDER':
        case 'REORDER_PAGE_FOLDER':
        case 'ADD_IMAGE_ASSET':
        case 'UPDATE_IMAGE_ASSET':
        case 'DELETE_IMAGE_ASSET':
        case 'ADD_DIMENSION_ASSET':
        case 'UPDATE_DIMENSION_ASSET':
        case 'DELETE_DIMENSION_ASSET':
        case 'ADD_PIXEL_ASSET':
        case 'UPDATE_PIXEL_ASSET':
        case 'DELETE_PIXEL_ASSET':
        case 'ADD_GUIDE':
        case 'DELETE_GUIDE':
        case 'MOVE_GUIDE':
        case 'ADD_CUSTOM_FONT':
        case 'DELETE_CUSTOM_FONT':
        case 'UPDATE_CUSTOM_FONT_META':
        case 'ADD_GRADIENT':
        case 'UPDATE_GRADIENT':
        case 'DELETE_GRADIENT':
        case 'ADD_SKETCH_STYLE':
        case 'UPDATE_SKETCH_STYLE':
        case 'DELETE_SKETCH_STYLE':
        case 'ADD_DOCUMENT_POWER_UP':
        case 'REMOVE_DOCUMENT_POWER_UP':
        case 'UPDATE_DOCUMENT_POWER_UP_SETTINGS':
        case 'ADD_SHAPE_POWER_UP_FEATURE':
        case 'REMOVE_SHAPE_POWER_UP_FEATURE':
        case 'UPDATE_SHAPE_POWER_UP_FEATURE_SETTINGS':
        case 'MOVE_SHAPES_START':
        case 'PLACE_SHAPE_TEMPLATE':
            return {
                ...state,
                document: applyDocumentAction(state.document, action),
            }

        case 'PLACE_PAGE_TEMPLATE': {
            const newDoc = applyDocumentAction(state.document, action)
            return {
                ...state,
                document: newDoc,
                activePageId: action.newPageId,
            }
        }

        // DRAG_SHAPES: same move logic as MOVE_SHAPES but NOT recorded in undo history.
        // The undo anchor is set by MOVE_SHAPES_START which fires once at drag start.
        case 'DRAG_SHAPES':
            return {
                ...state,
                document: applyDocumentAction(state.document, {
                    type: 'MOVE_SHAPES',
                    ids: action.ids,
                    dx: action.dx,
                    dy: action.dy
                }),
            }

        // ── Selection actions ──────────────────────────────────────────────
        case 'SELECT_SHAPES':
            return {
                ...state,
                documentSelected: false,
                selectedAssetId: null,
                selectedDimensionAssetId: null,
                selectedPixelAssetId: null,
                selectedFontName: null,
                selectedGradientId: null,
                selectedLibraryItemId: null,
                selectedLibraryItemType: null,
                selection: {
                    ...state.selection,
                    ids: action.additive
                        ? [...new Set([...state.selection.ids, ...action.ids])]
                        : action.ids,
                },
            }
        case 'DESELECT_ALL':
            return {
                ...state,
                documentSelected: false,
                selectedAssetId: null,
                selectedDimensionAssetId: null,
                selectedPixelAssetId: null,
                selectedFontName: null,
                selectedGradientId: null,
                selectedLibraryItemId: null,
                selectedLibraryItemType: null,
                selection: {ids: [], editingTextId: null}
            }
        case 'SELECT_ALL': {
            const allIds = getAllIds(state.document.rootNodes)
            return {
                ...state,
                documentSelected: false,
                selectedAssetId: null,
                selectedDimensionAssetId: null,
                selectedPixelAssetId: null,
                selectedFontName: null,
                selectedGradientId: null,
                selectedLibraryItemId: null,
                selectedLibraryItemType: null,
                selection: {...state.selection, ids: allIds}
            }
        }
        case 'START_TEXT_EDIT':
            return {...state, selection: {...state.selection, editingTextId: action.id}}
        case 'STOP_TEXT_EDIT':
            return {...state, selection: {...state.selection, editingTextId: null}}

        // ── View actions ───────────────────────────────────────────────────
        case 'SET_TOOL_MODE':
            return {...state, toolMode: action.mode}
        case 'PAN_BY':
            return {
                ...state,
                viewTransform: {
                    ...state.viewTransform,
                    panX: state.viewTransform.panX + action.dx,
                    panY: state.viewTransform.panY + action.dy,
                },
            }
        case 'ZOOM_TO': {
            const {zoom, origin} = action
            const oldZoom = state.viewTransform.zoom
            const scale = zoom / oldZoom
            return {
                ...state,
                viewTransform: {
                    zoom,
                    panX: origin.x - (origin.x - state.viewTransform.panX) * scale,
                    panY: origin.y - (origin.y - state.viewTransform.panY) * scale,
                },
            }
        }
        case 'RESET_VIEW':
            return {...state, viewTransform: {panX: 0, panY: 0, zoom: 1}}
        case 'SET_ACTIVE_PAGE':
            return {...state, activePageId: action.pageId, drilledInContainerStack: []}
        case 'TOGGLE_SHORTCUTS_MODAL':
            return {...state, showShortcutsModal: !state.showShortcutsModal}
        case 'TOGGLE_PALETTE_MODAL':
            return {...state, showPaletteModal: !state.showPaletteModal}
        case 'TOGGLE_SETTINGS_MODAL':
            return {...state, showSettingsModal: !state.showSettingsModal}
        case 'TOGGLE_THEME_MODAL':
            return {...state, showThemeModal: !state.showThemeModal}
        case 'TOGGLE_DOCUMENT_SETTINGS_MODAL':
            return {...state, showDocumentSettingsModal: !state.showDocumentSettingsModal}
        case 'TOGGLE_LOG_CONSOLE':
            return {...state, showLogConsole: !state.showLogConsole}
        case 'REQUEST_DOCUMENTS_MODAL':
            return {...state, pendingDocumentsModalMode: action.mode}
        case 'CLEAR_DOCUMENTS_MODAL_REQUEST':
            return {...state, pendingDocumentsModalMode: null}
        case 'TOGGLE_GRADIENT_MODAL':
            return {...state, showGradientModal: !state.showGradientModal}
        case 'SELECT_GRADIENT':
            return {
                ...state,
                selectedGradientId: action.gradientId,
                selectedAssetId: null,
                selectedDimensionAssetId: null,
                selectedPixelAssetId: null,
                selectedFontName: null,
                selectedLibraryItemId: null,
                selectedLibraryItemType: null,
                documentSelected: false,
                selection: {ids: [], editingTextId: null},
            }
        case 'TOGGLE_SKETCH_STYLE_MODAL':
            return {...state, showSketchStyleModal: !state.showSketchStyleModal}
        case 'SET_FILE_PATH':
            return {...state, currentFilePath: action.path}
        case 'UPDATE_SETTINGS':
            return {...state, settings: {...state.settings, ...action.patch}}
        case 'TOGGLE_LEFT_PANEL':
            return {...state, leftPanelVisible: !state.leftPanelVisible}
        case 'TOGGLE_RIGHT_PANEL':
            return {...state, rightPanelVisible: !state.rightPanelVisible}
        case 'SET_PRESENTATION_MODE':
            return {
                ...state,
                presentationMode: action.active,
                presentationSlideIndex: action.slideIndex ?? state.presentationSlideIndex,
            }
        case 'NEXT_SLIDE':
            return {
                ...state,
                presentationSlideIndex: Math.min(state.presentationSlideIndex + 1, action.totalSlides - 1),
            }
        case 'PREV_SLIDE':
            return {
                ...state,
                presentationSlideIndex: Math.max(state.presentationSlideIndex - 1, 0),
            }
        case 'TOGGLE_NOTES_PANEL':
            return {...state, notesVisible: !state.notesVisible}
        case 'SET_DOCUMENT_META':
            return {...state, documentId: action.id, documentName: action.name, isDirty: false}
        case 'ENTER_DRILL_MODE':
            return {
                ...state,
                drilledInContainerStack: [...state.drilledInContainerStack, action.containerId],
                selection: {ids: [], editingTextId: null},
            }
        case 'EXIT_DRILL_MODE':
            return {
                ...state,
                drilledInContainerStack: state.drilledInContainerStack.slice(0, -1),
                selection: {ids: [], editingTextId: null},
            }
        case 'SELECT_DOCUMENT':
            return {
                ...state,
                documentSelected: true,
                selectedAssetId: null,
                selectedDimensionAssetId: null,
                selectedPixelAssetId: null,
                selectedFontName: null,
                selectedGradientId: null,
                selectedLibraryItemId: null,
                selectedLibraryItemType: null,
                selection: {ids: [], editingTextId: null},
            }
        case 'SELECT_IMAGE_ASSET':
            return {
                ...state,
                selectedAssetId: action.assetId,
                selectedDimensionAssetId: null,
                selectedPixelAssetId: null,
                selectedFontName: null,
                selectedGradientId: null,
                selectedLibraryItemId: null,
                selectedLibraryItemType: null,
                documentSelected: false,
                selection: {ids: [], editingTextId: null},
            }
        case 'SELECT_DIMENSION_ASSET':
            return {
                ...state,
                selectedDimensionAssetId: action.assetId,
                selectedAssetId: null,
                selectedPixelAssetId: null,
                selectedFontName: null,
                selectedGradientId: null,
                selectedLibraryItemId: null,
                selectedLibraryItemType: null,
                documentSelected: false,
                selection: {ids: [], editingTextId: null},
            }
        case 'SELECT_PIXEL_ASSET':
            return {
                ...state,
                selectedPixelAssetId: action.assetId,
                selectedAssetId: null,
                selectedDimensionAssetId: null,
                selectedFontName: null,
                selectedGradientId: null,
                selectedLibraryItemId: null,
                selectedLibraryItemType: null,
                documentSelected: false,
                selection: {ids: [], editingTextId: null},
            }
        case 'SELECT_FONT':
            return {
                ...state,
                selectedFontName: action.fontName,
                selectedAssetId: null,
                selectedDimensionAssetId: null,
                selectedPixelAssetId: null,
                selectedGradientId: null,
                selectedLibraryItemId: null,
                selectedLibraryItemType: null,
                documentSelected: false,
                selection: {ids: [], editingTextId: null},
            }
        case 'START_PIXEL_EDIT':
            return {...state, editingPixelAssetId: action.assetId}
        case 'STOP_PIXEL_EDIT':
            return {...state, editingPixelAssetId: null}
        case 'ENTER_CROP_MODE':
            return {...state, croppingShapeId: action.shapeId}
        case 'EXIT_CROP_MODE':
            return {...state, croppingShapeId: null}
        case 'SET_PHYSICS_SIMULATION_RUNNING':
            return {...state, physicsSimulationRunning: action.running}
        case 'APPLY_PHYSICS_TRANSFORMS': {
            if (action.updates.length === 0) return state
            const updatesById = new Map(action.updates.map(update => [update.id, update]))
            let changed = false
            const shapes = Object.fromEntries(
                Object.entries(state.document.shapes).map(([id, shape]) => {
                    const update = updatesById.get(id)
                    if (!update) return [id, shape]
                    if (!('transform' in shape)) return [id, shape]
                    const previous = shape.transform
                    if (
                        previous.x === update.x &&
                        previous.y === update.y &&
                        previous.rotation === update.rotation
                    ) {
                        return [id, shape]
                    }
                    changed = true
                    return [id, {
                        ...shape,
                        transform: {
                            ...previous,
                            x: update.x,
                            y: update.y,
                            rotation: update.rotation,
                        },
                    } as Shape]
                }),
            )
            if (!changed) return state
            return {
                ...state,
                document: {
                    ...state.document,
                    shapes,
                },
            }
        }
        case 'SET_FOLDER_COLLAPSED':
            return {
                ...state,
                document: {
                    ...state.document,
                    pageFolders: state.document.pageFolders.map(f =>
                        f.id === action.folderId ? {...f, collapsed: action.collapsed} : f
                    ),
                },
            }

        // ── Library actions ────────────────────────────────────────────────
        case 'LOAD_LIBRARY': {
            const library = {
                ...EMPTY_LIBRARY,
                ...action.library,
                dimensions: action.library.dimensions ?? [],
                shapeTemplates: action.library.shapeTemplates ?? [],
                pageTemplates: action.library.pageTemplates ?? [],
            }
            return {
                ...state,
                library,
                document: normalizePageShapes(state.document, library.dimensions),
            }
        }

        case 'SELECT_LIBRARY_ITEM':
            return {
                ...state,
                selectedLibraryItemId: action.id,
                selectedLibraryItemType: action.itemType,
                selectedGradientId: null,
                selection: {ids: [], editingTextId: null},
                documentSelected: false,
                selectedAssetId: null,
                selectedDimensionAssetId: null,
                selectedPixelAssetId: null,
                selectedFontName: null,
            }

        case 'DESELECT_LIBRARY_ITEM':
            return {...state, selectedLibraryItemId: null, selectedLibraryItemType: null}

        case 'ADD_LIBRARY_GRADIENT': {
            const lib = {...state.library, gradients: [...state.library.gradients, action.gradient]}
            saveLibrary(lib)
            return {...state, library: lib, selectedLibraryItemId: action.gradient.id, selectedLibraryItemType: 'gradient'}
        }

        case 'UPDATE_LIBRARY_GRADIENT': {
            const lib = {...state.library, gradients: state.library.gradients.map(g => g.id === action.gradient.id ? action.gradient : g)}
            saveLibrary(lib)
            return {...state, library: lib}
        }

        case 'DELETE_LIBRARY_GRADIENT': {
            const lib = {...state.library, gradients: state.library.gradients.filter(g => g.id !== action.id)}
            saveLibrary(lib)
            const wasSelected = state.selectedLibraryItemId === action.id
            return {
                ...state,
                library: lib,
                selectedLibraryItemId: wasSelected ? null : state.selectedLibraryItemId,
                selectedLibraryItemType: wasSelected ? null : state.selectedLibraryItemType,
            }
        }

        case 'ADD_LIBRARY_IMAGE': {
            const lib = {...state.library, images: [...state.library.images, action.image]}
            saveLibrary(lib)
            return {...state, library: lib, selectedLibraryItemId: action.image.id, selectedLibraryItemType: 'image'}
        }

        case 'UPDATE_LIBRARY_IMAGE': {
            const lib = {...state.library, images: state.library.images.map(i => i.id === action.image.id ? action.image : i)}
            saveLibrary(lib)
            return {...state, library: lib}
        }

        case 'DELETE_LIBRARY_IMAGE': {
            const lib = {...state.library, images: state.library.images.filter(i => i.id !== action.id)}
            saveLibrary(lib)
            const wasSelected = state.selectedLibraryItemId === action.id
            return {
                ...state,
                library: lib,
                selectedLibraryItemId: wasSelected ? null : state.selectedLibraryItemId,
                selectedLibraryItemType: wasSelected ? null : state.selectedLibraryItemType,
            }
        }

        case 'ADD_LIBRARY_DIMENSION': {
            const lib = {...state.library, dimensions: [...state.library.dimensions, action.dimension]}
            saveLibrary(lib)
            return {
                ...state,
                library: lib,
                document: normalizePageShapes(state.document, lib.dimensions),
                selectedLibraryItemId: action.dimension.id,
                selectedLibraryItemType: 'dimension',
            }
        }

        case 'UPDATE_LIBRARY_DIMENSION': {
            const lib = {...state.library, dimensions: state.library.dimensions.map(d => d.id === action.dimension.id ? action.dimension : d)}
            saveLibrary(lib)
            return {
                ...state,
                library: lib,
                document: normalizePageShapes(state.document, lib.dimensions),
            }
        }

        case 'DELETE_LIBRARY_DIMENSION': {
            const lib = {...state.library, dimensions: state.library.dimensions.filter(d => d.id !== action.id)}
            saveLibrary(lib)
            const nextDocument = {
                ...state.document,
                shapes: Object.fromEntries(
                    Object.entries(state.document.shapes).map(([id, shape]) => {
                        if (shape.type !== 'page') return [id, shape]
                        if (!dimensionAssetRefersToPage(shape, action.id, 'library')) return [id, shape]
                        const fallback = shape.fixedSize ?? pageSizeFromPreset(DEFAULT_PAGE_DIMENSION_ID) ?? {width: 800, height: 600}
                        return [id, {
                            ...shape,
                            pageSize: {kind: 'custom', width: fallback.width, height: fallback.height},
                            fixedSize: {width: fallback.width, height: fallback.height},
                        }]
                    }),
                ),
            }
            const wasSelected = state.selectedLibraryItemId === action.id
            return {
                ...state,
                library: lib,
                document: normalizePageShapes(nextDocument, lib.dimensions),
                selectedLibraryItemId: wasSelected ? null : state.selectedLibraryItemId,
                selectedLibraryItemType: wasSelected ? null : state.selectedLibraryItemType,
            }
        }

        case 'ADD_LIBRARY_FONT': {
            const lib = {...state.library, fonts: [...state.library.fonts, action.font]}
            saveLibrary(lib)
            return {...state, library: lib, selectedLibraryItemId: action.font.id, selectedLibraryItemType: 'font'}
        }

        case 'UPDATE_LIBRARY_FONT': {
            const lib = {...state.library, fonts: state.library.fonts.map(f => f.id === action.font.id ? action.font : f)}
            saveLibrary(lib)
            return {...state, library: lib}
        }

        case 'DELETE_LIBRARY_FONT': {
            const lib = {...state.library, fonts: state.library.fonts.filter(f => f.id !== action.id)}
            saveLibrary(lib)
            const wasSelected = state.selectedLibraryItemId === action.id
            return {
                ...state,
                library: lib,
                selectedLibraryItemId: wasSelected ? null : state.selectedLibraryItemId,
                selectedLibraryItemType: wasSelected ? null : state.selectedLibraryItemType,
            }
        }

        case 'RENAME_LIBRARY_ITEM': {
            let lib = state.library
            if (action.itemType === 'gradient') {
                lib = {...lib, gradients: lib.gradients.map(g => g.id === action.id ? {...g, name: action.name} : g)}
            } else if (action.itemType === 'image') {
                lib = {...lib, images: lib.images.map(i => i.id === action.id ? {...i, name: action.name} : i)}
            } else if (action.itemType === 'dimension') {
                lib = {...lib, dimensions: lib.dimensions.map(d => d.id === action.id ? {...d, name: action.name} : d)}
            } else if (action.itemType === 'font') {
                lib = {...lib, fonts: lib.fonts.map(f => f.id === action.id ? {...f, name: action.name} : f)}
            } else if (action.itemType === 'shape-template') {
                lib = {...lib, shapeTemplates: lib.shapeTemplates.map(t => t.id === action.id ? {...t, name: action.name} : t)}
            } else if (action.itemType === 'page-template') {
                lib = {...lib, pageTemplates: lib.pageTemplates.map(t => t.id === action.id ? {...t, name: action.name} : t)}
            }
            saveLibrary(lib)
            return {
                ...state,
                library: lib,
                document: normalizePageShapes(state.document, lib.dimensions),
            }
        }

        case 'ADD_LIBRARY_SHAPE_TEMPLATE': {
            const lib = {...state.library, shapeTemplates: [...state.library.shapeTemplates, action.template]}
            saveLibrary(lib)
            return {...state, library: lib, selectedLibraryItemId: action.template.id, selectedLibraryItemType: 'shape-template'}
        }

        case 'DELETE_LIBRARY_SHAPE_TEMPLATE': {
            const lib = {...state.library, shapeTemplates: state.library.shapeTemplates.filter(t => t.id !== action.id)}
            saveLibrary(lib)
            const wasSelected = state.selectedLibraryItemId === action.id
            return {
                ...state,
                library: lib,
                selectedLibraryItemId: wasSelected ? null : state.selectedLibraryItemId,
                selectedLibraryItemType: wasSelected ? null : state.selectedLibraryItemType,
            }
        }

        case 'ADD_LIBRARY_PAGE_TEMPLATE': {
            const lib = {...state.library, pageTemplates: [...state.library.pageTemplates, action.template]}
            saveLibrary(lib)
            return {...state, library: lib, selectedLibraryItemId: action.template.id, selectedLibraryItemType: 'page-template'}
        }

        case 'DELETE_LIBRARY_PAGE_TEMPLATE': {
            const lib = {...state.library, pageTemplates: state.library.pageTemplates.filter(t => t.id !== action.id)}
            saveLibrary(lib)
            const wasSelected = state.selectedLibraryItemId === action.id
            return {
                ...state,
                library: lib,
                selectedLibraryItemId: wasSelected ? null : state.selectedLibraryItemId,
                selectedLibraryItemType: wasSelected ? null : state.selectedLibraryItemType,
            }
        }

        // ── Undo/Redo (handled by history wrapper) ─────────────────────────
        case 'UNDO':
        case 'REDO':
            return state  // handled in historyReducer

        default:
            return state
    }
}

// ─── View transform helpers ────────────────────────────────────────────────

export function screenToCanvas(vt: ViewTransform, screenX: number, screenY: number) {
    return {
        x: (screenX - vt.panX) / vt.zoom,
        y: (screenY - vt.panY) / vt.zoom,
    }
}

export function canvasToScreen(vt: ViewTransform, canvasX: number, canvasY: number) {
    return {
        x: canvasX * vt.zoom + vt.panX,
        y: canvasY * vt.zoom + vt.panY,
    }
}
