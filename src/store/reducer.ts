import type { AppState, AppAction, DocumentAction, ViewTransform } from './types'
import { DEFAULT_SETTINGS } from './types'
import type { VibeDocument, TreeNode, CustomFont } from '@model/document'
import type { Shape, ImageShape } from '@model/shapes'
import type { ImageAsset } from '@model/imageAsset'
import { findNode, findParent, removeNode, insertNode, getAllIds } from '@model/document'
import { BUILT_IN_TEXT_STYLES, TEXT_STYLE_FIELDS, resolveTextStyle } from '@model/textStyle'
import { generateId } from '@utils/idgen'
import { computeAlignedTransforms } from '@utils/alignment'
import { DEFAULT_PALETTE } from '@model/palette'
import { BUILT_IN_THEMES, getActiveTheme } from '@model/theme'
import type { Theme } from '@model/theme'
import { buildParentMap, getAbsoluteTransform, getParentContentOrigin, unionBoxes } from '@utils/geometry'
import { DEFAULT_GRID_SETTINGS } from '@model/grid'

function cloneSubtree(
  node: TreeNode,
  shapes: Record<string, Shape>,
  overrideId?: string,
): { node: TreeNode; newShapes: Record<string, Shape> } {
  const newId = overrideId ?? generateId()
  const shape = shapes[node.id]
  const newShapes: Record<string, Shape> = {}
  if (shape) {
    newShapes[newId] = { ...shape, id: newId }
  }
  const newChildren: TreeNode[] = []
  for (const child of node.children) {
    const { node: childNode, newShapes: childShapes } = cloneSubtree(child, shapes)
    newChildren.push(childNode)
    Object.assign(newShapes, childShapes)
  }
  return { node: { id: newId, children: newChildren }, newShapes }
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
      union = { x: t.x, y: t.y, width: t.width, height: t.height }
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
  const newShapes = { ...doc.shapes, [groupId]: { ...group, transform: newGroupTransform } }
  for (const childNode of groupNode.children) {
    const child = newShapes[childNode.id]
    if (!child || child.type === 'line') continue
    newShapes[childNode.id] = {
      ...child,
      transform: { ...child.transform, x: child.transform.x - dx, y: child.transform.y - dy },
    } as Shape
  }

  return { ...doc, shapes: newShapes }
}

// ─── Document reducer (pure) ───────────────────────────────────────────────

export function applyDocumentAction(doc: VibeDocument, action: DocumentAction): VibeDocument {
  switch (action.type) {
    case 'ADD_SHAPE': {
      const node: TreeNode = { id: action.shape.id, children: [] }
      return {
        ...doc,
        shapes: { ...doc.shapes, [action.shape.id]: action.shape },
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
      const newShapes = { ...doc.shapes }
      for (const id of Object.keys(newShapes)) {
        if (toDelete.has(id)) {
          delete newShapes[id]
        }
      }
      let newRoots = doc.rootNodes
      for (const id of toDelete) {
        newRoots = removeNode(newRoots, id)
      }
      return { ...doc, shapes: newShapes, rootNodes: newRoots }
    }

    case 'MOVE_SHAPES': {
      const newShapes = { ...doc.shapes }
      for (const id of action.ids) {
        const shape = newShapes[id]
        if (!shape || shape.locked) continue
        if (shape.type === 'line') {
          const start = shape.start.kind === 'free'
            ? { kind: 'free' as const, point: { x: shape.start.point.x + action.dx, y: shape.start.point.y + action.dy } }
            : shape.start
          const end = shape.end.kind === 'free'
            ? { kind: 'free' as const, point: { x: shape.end.point.x + action.dx, y: shape.end.point.y + action.dy } }
            : shape.end
          newShapes[id] = { ...shape, start, end }
        } else {
          const t = shape.transform
          newShapes[id] = { ...shape, transform: { ...t, x: t.x + action.dx, y: t.y + action.dy } }
        }
      }
      let newDoc: VibeDocument = { ...doc, shapes: newShapes }
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
        shapes: { ...doc.shapes, [action.id]: { ...shape, transform: action.transform } },
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
        shapes: { ...doc.shapes, [action.id]: { ...shape, start: action.endpoint } },
      }
    }

    case 'SET_CONNECTOR_END': {
      const shape = doc.shapes[action.id]
      if (!shape || shape.type !== 'line') return doc
      return {
        ...doc,
        shapes: { ...doc.shapes, [action.id]: { ...shape, end: action.endpoint } },
      }
    }

    case 'PATCH_SHAPE': {
      const shape = doc.shapes[action.id]
      // Allow patching locked/visible even when locked; block everything else
      if (!shape) return doc
      if (shape.locked && !('locked' in action.patch) && !('visible' in action.patch)) return doc
      let patched = { ...shape, ...action.patch } as Shape
      // Auto-track text style overrides: if shape has a textStyleId and the patch touches
      // style-able text fields, add those fields to textStyleOverrides
      const patchedRec = patched as unknown as Record<string, unknown>
      const patchRec = (action.patch as unknown as Record<string, unknown>)
      const patchedText = patchedRec['text'] as (typeof patched extends { text: infer T } ? T : never) | undefined
      if (patchedText && (patchedText as { textStyleId?: string }).textStyleId && patchRec['text']) {
        const oldText = (shape as unknown as Record<string, unknown>)['text'] as typeof patchedText | undefined
        const newText = patchedText
        const changedFields = TEXT_STYLE_FIELDS.filter(f => {
          const oldVal = oldText ? (oldText as Record<string, unknown>)[f] : undefined
          const newVal = (newText as unknown as Record<string, unknown>)[f]
          return newVal !== oldVal
        })
        if (changedFields.length > 0) {
          const existingOverrides = new Set((newText as { textStyleOverrides?: string[] }).textStyleOverrides ?? [])
          for (const f of changedFields) existingOverrides.add(f)
          patched = { ...patched, text: { ...(newText as object), textStyleOverrides: [...existingOverrides] } } as Shape
        }
      }
      return {
        ...doc,
        shapes: { ...doc.shapes, [action.id]: patched },
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
        return { ...doc, rootNodes: withNode, pageFolders }
      }
      if (!shape || !('transform' in shape)) return { ...doc, rootNodes: withNode, pageFolders }
      const updatedShape = { ...shape, transform: { ...shape.transform, x: action.x ?? shape.transform.x, y: action.y ?? shape.transform.y } }
      return { ...doc, rootNodes: withNode, shapes: { ...doc.shapes, [action.id]: updatedShape }, pageFolders }
    }

    case 'REORDER_SHAPE': {
      const reorderId = action.id
      const reorderDir = action.direction
      function reorderInList(nodes: TreeNode[]): TreeNode[] {
        const idx = nodes.findIndex(n => n.id === reorderId)
        if (idx === -1) {
          return nodes.map(n => ({ ...n, children: reorderInList(n.children) }))
        }
        const arr = [...nodes]
        const [item] = arr.splice(idx, 1)
        let newIdx: number
        switch (reorderDir) {
          case 'up':       newIdx = Math.max(0, idx - 1); break
          case 'down':     newIdx = Math.min(arr.length, idx + 1); break
          case 'to-front': newIdx = arr.length; break
          case 'to-back':  newIdx = 0; break
          default:         newIdx = idx
        }
        arr.splice(newIdx, 0, item)
        return arr
      }
      return { ...doc, rootNodes: reorderInList(doc.rootNodes) }
    }

    case 'COMMIT_TEXT_EDIT': {
      const shape = doc.shapes[action.id]
      if (!shape) return doc
      if (shape.type === 'text') {
        return {
          ...doc,
          shapes: { ...doc.shapes, [action.id]: { ...shape, text: { ...shape.text, content: action.content } } },
        }
      }
      if (shape.type === 'button') {
        return {
          ...doc,
          shapes: { ...doc.shapes, [action.id]: { ...shape, text: { ...shape.text, content: action.content } } },
        }
      }
      if (shape.type === 'panel' && shape.title) {
        return {
          ...doc,
          shapes: { ...doc.shapes, [action.id]: { ...shape, title: { ...shape.title, content: action.content } } },
        }
      }
      if (shape.type === 'tabbed-panel') {
        return {
          ...doc,
          shapes: { ...doc.shapes, [action.id]: { ...shape, tabs: { ...shape.tabs, content: action.content } } },
        }
      }
      if (
        shape.type === 'label' || shape.type === 'textfield' ||
        shape.type === 'checkbox' || shape.type === 'toggle' || shape.type === 'radio' ||
        shape.type === 'select' || shape.type === 'stickynote' || shape.type === 'list' || shape.type === 'table'
      ) {
        return {
          ...doc,
          shapes: { ...doc.shapes, [action.id]: { ...shape, text: { ...shape.text, content: action.content } } },
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
        const { node: clonedNode, newShapes } = cloneSubtree(node, newDoc.shapes, overrideId)
        // Offset the root clone by (10, 10) in local space
        const rootShape = newShapes[clonedNode.id]
        if (rootShape && rootShape.type !== 'line' && rootShape.type !== 'page') {
          newShapes[clonedNode.id] = {
            ...rootShape,
            transform: { ...rootShape.transform, x: rootShape.transform.x + 10, y: rootShape.transform.y + 10 },
          }
        }
        // Insert after the original
        const parentNode = findParent(newDoc.rootNodes, id)
        const parentId = parentNode?.id ?? null
        const siblings = parentNode ? parentNode.children : newDoc.rootNodes
        const idx = siblings.findIndex(n => n.id === id)
        const insertIndex = idx >= 0 ? idx + 1 : siblings.length
        newDoc = {
          ...newDoc,
          shapes: { ...newDoc.shapes, ...newShapes },
          rootNodes: insertNode(newDoc.rootNodes, parentId, clonedNode, insertIndex),
        }
      }
      return newDoc
    }

    case 'ALIGN_SHAPES': {
      const updates = computeAlignedTransforms(action.ids, doc.shapes, doc.rootNodes, action.alignment)
      let newShapes = { ...doc.shapes }
      for (const { id, transform } of updates) {
        const shape = newShapes[id]
        if (shape && shape.type !== 'line') {
          newShapes = { ...newShapes, [id]: { ...shape, transform } as Shape }
        }
      }
      return { ...doc, shapes: newShapes }
    }

    case 'LOAD_DOCUMENT': {
      const d = action.document
      // Auto-create image assets for existing image shapes in old documents
      let images: ImageAsset[] = d.images ?? []
      let shapes = d.shapes
      if (images.length === 0) {
        const newImages: ImageAsset[] = []
        const patchedShapes: Record<string, Shape> = { ...shapes }
        for (const shape of Object.values(shapes)) {
          if (shape.type === 'image' && !(shape as ImageShape).assetId) {
            const asset: ImageAsset = {
              id: generateId(),
              name: shape.name,
              src: (shape as ImageShape).src,
              mimeType: (shape as ImageShape).mimeType,
            }
            newImages.push(asset)
            patchedShapes[shape.id] = { ...shape, assetId: asset.id } as Shape
          }
        }
        images = newImages
        shapes = patchedShapes
      }
      return {
        ...d,
        shapes,
        themes: d.themes ?? [...BUILT_IN_THEMES],
        activeThemeId: d.activeThemeId ?? 'hand-drawn',
        gridSettings: d.gridSettings ?? { ...DEFAULT_GRID_SETTINGS },
        pageFolders: d.pageFolders ?? [],
        textStyles: d.textStyles ?? [...BUILT_IN_TEXT_STYLES],
        variables: d.variables ?? [],
        images,
        customFonts: (d.customFonts ?? []).map((f: unknown) =>
          typeof f === 'string' ? { name: f, isVariable: null as null, axes: [] } : f as CustomFont
        ),
      }
    }

    case 'UPDATE_GRID_SETTINGS':
      return { ...doc, gridSettings: { ...doc.gridSettings, ...action.patch } }

    case 'ADD_PAGE_FOLDER':
      return { ...doc, pageFolders: [...doc.pageFolders, action.folder] }

    case 'DELETE_PAGE_FOLDER': {
      const folder = doc.pageFolders.find(f => f.id === action.folderId)
      if (!folder) return { ...doc, pageFolders: doc.pageFolders.filter(f => f.id !== action.folderId) }
      if (action.deletionMode === 'unfolder') {
        return { ...doc, pageFolders: doc.pageFolders.filter(f => f.id !== action.folderId) }
      }
      // delete-pages: remove all pages in the folder and their descendants
      const idsToDelete = folder.pageIds
      let newDoc = applyDocumentAction(doc, { type: 'DELETE_SHAPES', ids: idsToDelete })
      return { ...newDoc, pageFolders: newDoc.pageFolders.filter(f => f.id !== action.folderId) }
    }

    case 'RENAME_PAGE_FOLDER':
      return {
        ...doc,
        pageFolders: doc.pageFolders.map(f =>
          f.id === action.folderId ? { ...f, name: action.name } : f
        ),
      }

    case 'ASSIGN_PAGES_TO_FOLDER': {
      const newPageIds = new Set(action.pageIds)
      // Remove these page IDs from any other folder
      const updatedFolders = doc.pageFolders.map(f => {
        if (f.id === action.folderId) {
          const existing = new Set(f.pageIds)
          for (const id of newPageIds) existing.add(id)
          return { ...f, pageIds: [...existing] }
        }
        return { ...f, pageIds: f.pageIds.filter(id => !newPageIds.has(id)) }
      })
      return { ...doc, pageFolders: updatedFolders }
    }

    case 'REMOVE_PAGES_FROM_FOLDER': {
      const toRemove = new Set(action.pageIds)
      return {
        ...doc,
        pageFolders: doc.pageFolders.map(f =>
          f.id === action.folderId
            ? { ...f, pageIds: f.pageIds.filter(id => !toRemove.has(id)) }
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
      return { ...doc, pageFolders: arr }
    }

    case 'ADD_TEXT_STYLE':
      return { ...doc, textStyles: [...doc.textStyles, action.style] }

    case 'UPDATE_TEXT_STYLE':
      return {
        ...doc,
        textStyles: doc.textStyles.map(s => s.id === action.style.id ? action.style : s),
      }

    case 'DELETE_TEXT_STYLE': {
      // Bake resolved text into every shape referencing this style, then disconnect
      const newShapes = { ...doc.shapes }
      for (const id of Object.keys(newShapes)) {
        const shape = newShapes[id]
        const shapeRec = shape as unknown as Record<string, unknown>
        const textVal = shapeRec['text'] as { textStyleId?: string } | undefined
        if (textVal && textVal.textStyleId === action.styleId) {
          const baked = resolveTextStyle(textVal as Parameters<typeof resolveTextStyle>[0], doc.textStyles)
          newShapes[id] = { ...shape, text: { ...baked, textStyleId: undefined, textStyleOverrides: undefined } } as unknown as Shape
        }
        const titleVal = shapeRec['title']
        if (titleVal && typeof titleVal === 'object' && (titleVal as { textStyleId?: string }).textStyleId === action.styleId) {
          const baked = resolveTextStyle(titleVal as Parameters<typeof resolveTextStyle>[0], doc.textStyles)
          newShapes[id] = { ...shape, title: { ...baked, textStyleId: undefined, textStyleOverrides: undefined } } as unknown as Shape
        }
      }
      return { ...doc, shapes: newShapes, textStyles: doc.textStyles.filter(s => s.id !== action.styleId) }
    }

    case 'REORDER_TEXT_STYLE': {
      const idx = doc.textStyles.findIndex(s => s.id === action.styleId)
      if (idx === -1) return doc
      const arr = [...doc.textStyles]
      const [item] = arr.splice(idx, 1)
      const newIdx = action.direction === 'up' ? Math.max(0, idx - 1) : Math.min(arr.length, idx + 1)
      arr.splice(newIdx, 0, item)
      return { ...doc, textStyles: arr }
    }

    case 'APPLY_TEXT_STYLE': {
      const shape = doc.shapes[action.shapeId]
      if (!shape) return doc
      const shapeRec = shape as unknown as Record<string, unknown>
      const oldText = shapeRec['text'] as { textStyleId?: string; textStyleOverrides?: string[] } | undefined
      if (!oldText) return doc
      return {
        ...doc,
        shapes: {
          ...doc.shapes,
          [action.shapeId]: {
            ...shape,
            text: { ...oldText, textStyleId: action.textStyleId ?? undefined, textStyleOverrides: [] },
          } as unknown as Shape,
        },
      }
    }

    case 'CLEAR_TEXT_OVERRIDE': {
      const shape = doc.shapes[action.shapeId]
      if (!shape) return doc
      const shapeRec = shape as unknown as Record<string, unknown>
      const oldText = shapeRec['text'] as { textStyleOverrides?: string[] } | undefined
      if (!oldText) return doc
      const overrides = (oldText.textStyleOverrides ?? []).filter(f => f !== action.field)
      return {
        ...doc,
        shapes: {
          ...doc.shapes,
          [action.shapeId]: {
            ...shape,
            text: { ...oldText, textStyleOverrides: overrides },
          } as unknown as Shape,
        },
      }
    }

    case 'ADD_VARIABLE':
      return { ...doc, variables: [...(doc.variables ?? []), action.variable] }

    case 'UPDATE_VARIABLE':
      return {
        ...doc,
        variables: (doc.variables ?? []).map(v => v.id === action.variable.id ? action.variable : v),
      }

    case 'DELETE_VARIABLE': {
      const newVariables = (doc.variables ?? []).filter(v => v.id !== action.variableId)
      // Remove all bindings pointing to this variable from every shape
      const newShapes = { ...doc.shapes }
      for (const [id, shape] of Object.entries(doc.shapes)) {
        const bindings = (shape as unknown as { variableBindings?: Record<string, string> }).variableBindings
        if (!bindings) continue
        const filtered = Object.fromEntries(
          Object.entries(bindings).filter(([, vId]) => vId !== action.variableId)
        )
        newShapes[id] = {
          ...shape,
          variableBindings: Object.keys(filtered).length > 0 ? filtered : undefined,
        } as Shape
      }
      return { ...doc, variables: newVariables, shapes: newShapes }
    }

    case 'REORDER_VARIABLE': {
      const vars = [...(doc.variables ?? [])]
      const idx = vars.findIndex(v => v.id === action.variableId)
      if (idx < 0) return doc
      const swapIdx = action.direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= vars.length) return doc
      ;[vars[idx], vars[swapIdx]] = [vars[swapIdx], vars[idx]]
      return { ...doc, variables: vars }
    }

    case 'ADD_IMAGE_ASSET':
      return { ...doc, images: [...(doc.images ?? []), action.asset] }

    case 'UPDATE_IMAGE_ASSET': {
      const newImages = (doc.images ?? []).map(a => a.id === action.asset.id ? action.asset : a)
      // Propagate src/mimeType change to all linked shapes
      const newShapes = { ...doc.shapes }
      for (const [id, shape] of Object.entries(doc.shapes)) {
        if (shape.type === 'image' && (shape as ImageShape).assetId === action.asset.id) {
          newShapes[id] = { ...shape, src: action.asset.src, mimeType: action.asset.mimeType } as Shape
        }
      }
      return { ...doc, images: newImages, shapes: newShapes }
    }

    case 'DELETE_IMAGE_ASSET': {
      const newImages = (doc.images ?? []).filter(a => a.id !== action.assetId)
      // Unlink shapes (keep their current src, just clear assetId)
      const newShapes = { ...doc.shapes }
      for (const [id, shape] of Object.entries(doc.shapes)) {
        if (shape.type === 'image' && (shape as ImageShape).assetId === action.assetId) {
          const { assetId: _, ...rest } = shape as ImageShape
          newShapes[id] = rest as unknown as Shape
        }
      }
      return { ...doc, images: newImages, shapes: newShapes }
    }

    case 'ADD_PIXEL_ASSET':
      return { ...doc, pixelAssets: [...(doc.pixelAssets ?? []), action.asset] }

    case 'UPDATE_PIXEL_ASSET':
      return { ...doc, pixelAssets: (doc.pixelAssets ?? []).map(a => a.id === action.asset.id ? action.asset : a) }

    case 'DELETE_PIXEL_ASSET': {
      const remaining = (doc.pixelAssets ?? []).filter(a => a.id !== action.assetId)
      // Also remove shapes that reference this asset
      const newShapes = { ...doc.shapes }
      for (const [id, shape] of Object.entries(doc.shapes)) {
        if (shape.type === 'pixelimage' && shape.assetId === action.assetId) {
          delete newShapes[id]
        }
      }
      return { ...doc, pixelAssets: remaining, shapes: newShapes }
    }

    case 'BIND_VARIABLE': {
      const shape = doc.shapes[action.shapeId]
      if (!shape) return doc
      const bindings = { ...((shape as unknown as { variableBindings?: Record<string, string> }).variableBindings ?? {}) }
      if (action.variableId === null) {
        delete bindings[action.propPath]
      } else {
        bindings[action.propPath] = action.variableId
      }
      const updatedShape = {
        ...shape,
        variableBindings: Object.keys(bindings).length > 0 ? bindings : undefined,
      } as Shape
      return { ...doc, shapes: { ...doc.shapes, [action.shapeId]: updatedShape } }
    }

    case 'ADD_GUIDE': {
      const page = doc.shapes[action.pageId]
      if (!page || page.type !== 'page') return doc
      const guides = [...(page.guides ?? []), action.guide]
      return { ...doc, shapes: { ...doc.shapes, [action.pageId]: { ...page, guides } } }
    }

    case 'DELETE_GUIDE': {
      const page = doc.shapes[action.pageId]
      if (!page || page.type !== 'page') return doc
      const guides = (page.guides ?? []).filter(g => g.id !== action.guideId)
      return { ...doc, shapes: { ...doc.shapes, [action.pageId]: { ...page, guides } } }
    }

    case 'MOVE_GUIDE': {
      const page = doc.shapes[action.pageId]
      if (!page || page.type !== 'page') return doc
      const guides = (page.guides ?? []).map(g =>
        g.id === action.guideId ? { ...g, position: action.position } : g)
      return { ...doc, shapes: { ...doc.shapes, [action.pageId]: { ...page, guides } } }
    }

    case 'ADD_CUSTOM_FONT': {
      const existing = doc.customFonts ?? []
      if (existing.some(f => f.name === action.font.name)) return doc
      return { ...doc, customFonts: [...existing, action.font] }
    }
    case 'DELETE_CUSTOM_FONT':
      return { ...doc, customFonts: (doc.customFonts ?? []).filter(f => f.name !== action.fontName) }
    case 'UPDATE_CUSTOM_FONT_META':
      return {
        ...doc,
        customFonts: (doc.customFonts ?? []).map(f =>
          f.name === action.fontName ? { ...f, ...action.patch } : f
        ),
      }

    case 'ADD_THEME':
      return { ...doc, themes: [...doc.themes, action.theme] }

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
      return { ...doc, themes: remaining, activeThemeId: activeId }
    }

    case 'SET_ACTIVE_THEME':
      return { ...doc, activeThemeId: action.themeId }

    case 'APPLY_THEME_TO_ALL_SHAPES': {
      const theme = getActiveTheme(doc)
      const newShapes = { ...doc.shapes }
      for (const id of Object.keys(newShapes)) {
        const patch = buildThemeResetPatch(newShapes[id], theme)
        if (Object.keys(patch).length > 0) {
          newShapes[id] = { ...newShapes[id], ...patch } as Shape
        }
      }
      return { ...doc, shapes: newShapes }
    }

    case 'GROUP_SHAPES': {
      if (action.ids.length === 0) return doc

      const parentMap = buildParentMap(doc.rootNodes)

      // Compute absolute bounding boxes for all shapes upfront
      const absTransforms: Record<string, { x: number; y: number; width: number; height: number }> = {}
      let groupUnion: { x: number; y: number; width: number; height: number } | null = null
      for (const id of action.ids) {
        const shape = doc.shapes[id]
        if (!shape || shape.type === 'line') continue
        const abs = getAbsoluteTransform(id, doc.shapes, parentMap)
        if (!abs) continue
        absTransforms[id] = abs
        if (!groupUnion) {
          groupUnion = { x: abs.x, y: abs.y, width: abs.width, height: abs.height }
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
        shapes: { ...doc.shapes, [groupId]: groupShape },
        rootNodes: insertNode(doc.rootNodes, firstParentId, { id: groupId, children: [] }),
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
        const { id, newX, newY } = childMoves[i]
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
      return applyDocumentAction(newDoc, { type: 'DELETE_SHAPES', ids: [action.id] })
    }

    case 'RESET_SHAPES_TO_THEME': {
      const theme = getActiveTheme(doc)
      let newShapes = { ...doc.shapes }
      for (const id of action.ids) {
        const shape = newShapes[id]
        if (!shape) continue
        const patch = buildThemeResetPatch(shape, theme)
        if (Object.keys(patch).length > 0) {
          newShapes = { ...newShapes, [id]: { ...shape, ...patch } as Shape }
        }
      }
      return { ...doc, shapes: newShapes }
    }

    case 'ADD_PALETTE':
      return { ...doc, palettes: [...doc.palettes, action.palette] }

    case 'DELETE_PALETTE':
      return { ...doc, palettes: doc.palettes.filter(p => p.id !== action.paletteId) }

    case 'RENAME_PALETTE':
      return {
        ...doc,
        palettes: doc.palettes.map(p =>
          p.id === action.paletteId ? { ...p, name: action.name } : p
        ),
      }

    case 'ADD_PALETTE_COLOR':
      return {
        ...doc,
        palettes: doc.palettes.map(p =>
          p.id === action.paletteId ? { ...p, colors: [...p.colors, action.color] } : p
        ),
      }

    case 'DELETE_PALETTE_COLOR':
      return {
        ...doc,
        palettes: doc.palettes.map(p =>
          p.id === action.paletteId
            ? { ...p, colors: p.colors.filter(c => c.id !== action.colorId) }
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
                  ? { ...c, ...(action.color !== undefined && { color: action.color }), ...(action.name !== undefined && { name: action.name }) }
                  : c
              ),
            }
          : p
      )
      const newShapes = action.color !== undefined
        ? applyPaletteColorToShapes(doc.shapes, action.colorId, action.color)
        : doc.shapes
      return { ...doc, palettes: newPalettes, shapes: newShapes }
    }

    default:
      return doc
  }
}

// Builds a partial patch that resets a shape's theme-managed properties to current theme values.
function buildThemeResetPatch(shape: Shape, theme: Theme): Partial<Shape> {
  const patch: Record<string, unknown> = {}

  if ('fill' in shape && shape.fill) {
    patch.fill = { ...shape.fill, color: theme.background }
  }
  if ('stroke' in shape && shape.stroke) {
    patch.stroke = { ...shape.stroke, color: theme.border, width: theme.borderWidth }
  }
  if ('cornerRadius' in shape) {
    patch.cornerRadius = theme.borderRadius
  }
  if ('text' in shape && shape.text && typeof shape.text === 'object') {
    patch.text = { ...shape.text, fontFamily: theme.fontFamily, fontSize: theme.fontSize, color: theme.foreground }
  }
  if ('title' in shape && shape.title && typeof shape.title === 'object') {
    patch.title = { ...(shape.title as object), fontFamily: theme.fontFamily, fontSize: theme.fontSize, color: theme.foreground }
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
  const result = { ...shapes }
  for (const id of Object.keys(result)) {
    const shape = result[id]
    let updated: Shape = shape

    if ('fill' in shape && shape.fill.paletteColorId === colorId) {
      updated = { ...updated, fill: { ...shape.fill, color: newHex } } as Shape
    }
    if ('stroke' in shape && shape.stroke.paletteColorId === colorId) {
      updated = { ...updated, stroke: { ...shape.stroke, color: newHex } } as Shape
    }
    if ('trackFill' in shape && shape.trackFill.paletteColorId === colorId) {
      updated = { ...updated, trackFill: { ...shape.trackFill, color: newHex } } as Shape
    }
    if ('thumbFill' in shape && shape.thumbFill.paletteColorId === colorId) {
      updated = { ...updated, thumbFill: { ...shape.thumbFill, color: newHex } } as Shape
    }
    if ('text' in shape && shape.text.paletteColorId === colorId) {
      updated = { ...updated, text: { ...shape.text, color: newHex } } as Shape
    }
    if ('title' in shape && shape.title && typeof shape.title === 'object' && (shape.title as { paletteColorId?: string }).paletteColorId === colorId) {
      updated = { ...updated, title: { ...(shape.title as object), color: newHex } } as Shape
    }
    if (shape.type === 'page' && shape.backgroundPaletteColorId === colorId) {
      updated = { ...updated, background: newHex } as Shape
    }

    if (updated !== shape) result[id] = updated
  }
  return result
}

// ─── Initial state ─────────────────────────────────────────────────────────

export function createInitialDocument(): VibeDocument {
  const pageId = generateId()
  return {
    version: 2,
    rootNodes: [{ id: pageId, children: [] }],
    shapes: {
      [pageId]: {
        id: pageId,
        name: 'Page 1',
        type: 'page',
        locked: false,
        visible: true,
        transform: { x: 0, y: 0, width: 800, height: 600, rotation: 0 },
        fixedSize: null,
        background: '#ffffff',
        clipChildren: false,
      },
    },
    palettes: [{ ...DEFAULT_PALETTE, colors: [...DEFAULT_PALETTE.colors] }],
    themes: [...BUILT_IN_THEMES],
    activeThemeId: 'hand-drawn',
    gridSettings: { ...DEFAULT_GRID_SETTINGS },
    pageFolders: [],
    textStyles: [...BUILT_IN_TEXT_STYLES],
    variables: [],
    images: [],
    pixelAssets: [],
    customFonts: [],
  }
}

export const initialDocument = createInitialDocument()

export const initialState: AppState = {
  document: initialDocument,
  selection: { ids: [], editingTextId: null },
  viewTransform: { panX: 0, panY: 0, zoom: 1 },
  toolMode: 'select',
  activePageId: initialDocument.rootNodes[0]?.id ?? null,
  showShortcutsModal: false,
  showPaletteModal: false,
  showSettingsModal: false,
  showThemeModal: false,
  showDocumentSettingsModal: false,
  settings: { ...DEFAULT_SETTINGS },
  drilledInContainerStack: [],
  documentId: null,
  documentName: 'Untitled',
  isDirty: false,
  documentSelected: false,
  selectedStyleId: null,
  selectedVariableId: null,
  selectedAssetId: null,
  selectedPixelAssetId: null,
  editingPixelAssetId: null,
  selectedFontName: null,
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
    case 'ADD_TEXT_STYLE':
    case 'UPDATE_TEXT_STYLE':
    case 'DELETE_TEXT_STYLE':
    case 'REORDER_TEXT_STYLE':
    case 'APPLY_TEXT_STYLE':
    case 'CLEAR_TEXT_OVERRIDE':
    case 'ADD_VARIABLE':
    case 'UPDATE_VARIABLE':
    case 'DELETE_VARIABLE':
    case 'REORDER_VARIABLE':
    case 'BIND_VARIABLE':
    case 'ADD_IMAGE_ASSET':
    case 'UPDATE_IMAGE_ASSET':
    case 'DELETE_IMAGE_ASSET':
    case 'ADD_PIXEL_ASSET':
    case 'UPDATE_PIXEL_ASSET':
    case 'DELETE_PIXEL_ASSET':
    case 'ADD_GUIDE':
    case 'DELETE_GUIDE':
    case 'MOVE_GUIDE':
    case 'ADD_CUSTOM_FONT':
    case 'DELETE_CUSTOM_FONT':
    case 'UPDATE_CUSTOM_FONT_META':
    case 'MOVE_SHAPES_START':
      return {
        ...state,
        document: applyDocumentAction(state.document, action),
      }

    // DRAG_SHAPES: same move logic as MOVE_SHAPES but NOT recorded in undo history.
    // The undo anchor is set by MOVE_SHAPES_START which fires once at drag start.
    case 'DRAG_SHAPES':
      return {
        ...state,
        document: applyDocumentAction(state.document, { type: 'MOVE_SHAPES', ids: action.ids, dx: action.dx, dy: action.dy }),
      }

    // ── Selection actions ──────────────────────────────────────────────
    case 'SELECT_SHAPES':
      return {
        ...state,
        documentSelected: false,
        selectedStyleId: null,
        selectedVariableId: null,
        selectedAssetId: null,
        selectedPixelAssetId: null,
        selectedFontName: null,
        selection: {
          ...state.selection,
          ids: action.additive
            ? [...new Set([...state.selection.ids, ...action.ids])]
            : action.ids,
        },
      }
    case 'DESELECT_ALL':
      return { ...state, documentSelected: false, selectedStyleId: null, selectedVariableId: null, selectedAssetId: null, selectedPixelAssetId: null, selectedFontName: null, selection: { ids: [], editingTextId: null } }
    case 'SELECT_ALL': {
      const allIds = getAllIds(state.document.rootNodes)
      return { ...state, documentSelected: false, selectedStyleId: null, selectedVariableId: null, selectedAssetId: null, selectedPixelAssetId: null, selectedFontName: null, selection: { ...state.selection, ids: allIds } }
    }
    case 'START_TEXT_EDIT':
      return { ...state, selection: { ...state.selection, editingTextId: action.id } }
    case 'STOP_TEXT_EDIT':
      return { ...state, selection: { ...state.selection, editingTextId: null } }

    // ── View actions ───────────────────────────────────────────────────
    case 'SET_TOOL_MODE':
      return { ...state, toolMode: action.mode }
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
      const { zoom, origin } = action
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
      return { ...state, viewTransform: { panX: 0, panY: 0, zoom: 1 } }
    case 'SET_ACTIVE_PAGE':
      return { ...state, activePageId: action.pageId, drilledInContainerStack: [] }
    case 'TOGGLE_SHORTCUTS_MODAL':
      return { ...state, showShortcutsModal: !state.showShortcutsModal }
    case 'TOGGLE_PALETTE_MODAL':
      return { ...state, showPaletteModal: !state.showPaletteModal }
    case 'TOGGLE_SETTINGS_MODAL':
      return { ...state, showSettingsModal: !state.showSettingsModal }
    case 'TOGGLE_THEME_MODAL':
      return { ...state, showThemeModal: !state.showThemeModal }
    case 'TOGGLE_DOCUMENT_SETTINGS_MODAL':
      return { ...state, showDocumentSettingsModal: !state.showDocumentSettingsModal }
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch } }
    case 'SET_DOCUMENT_META':
      return { ...state, documentId: action.id, documentName: action.name, isDirty: false }
    case 'ENTER_DRILL_MODE':
      return {
        ...state,
        drilledInContainerStack: [...state.drilledInContainerStack, action.containerId],
        selection: { ids: [], editingTextId: null },
      }
    case 'EXIT_DRILL_MODE':
      return {
        ...state,
        drilledInContainerStack: state.drilledInContainerStack.slice(0, -1),
        selection: { ids: [], editingTextId: null },
      }
    case 'SELECT_DOCUMENT':
      return {
        ...state,
        documentSelected: true,
        selectedStyleId: null,
        selectedVariableId: null,
        selectedAssetId: null,
        selectedPixelAssetId: null,
        selectedFontName: null,
        selection: { ids: [], editingTextId: null },
      }
    case 'SELECT_STYLE':
      return {
        ...state,
        selectedStyleId: action.styleId,
        selectedVariableId: null,
        selectedAssetId: null,
        selectedPixelAssetId: null,
        selectedFontName: null,
        documentSelected: false,
        selection: { ids: [], editingTextId: null },
      }
    case 'SELECT_VARIABLE':
      return {
        ...state,
        selectedVariableId: action.variableId,
        selectedStyleId: null,
        selectedAssetId: null,
        selectedPixelAssetId: null,
        selectedFontName: null,
        documentSelected: false,
        selection: { ids: [], editingTextId: null },
      }
    case 'SELECT_IMAGE_ASSET':
      return {
        ...state,
        selectedAssetId: action.assetId,
        selectedPixelAssetId: null,
        selectedVariableId: null,
        selectedStyleId: null,
        selectedFontName: null,
        documentSelected: false,
        selection: { ids: [], editingTextId: null },
      }
    case 'SELECT_PIXEL_ASSET':
      return {
        ...state,
        selectedPixelAssetId: action.assetId,
        selectedAssetId: null,
        selectedVariableId: null,
        selectedStyleId: null,
        selectedFontName: null,
        documentSelected: false,
        selection: { ids: [], editingTextId: null },
      }
    case 'SELECT_FONT':
      return {
        ...state,
        selectedFontName: action.fontName,
        selectedAssetId: null,
        selectedPixelAssetId: null,
        selectedVariableId: null,
        selectedStyleId: null,
        documentSelected: false,
        selection: { ids: [], editingTextId: null },
      }
    case 'START_PIXEL_EDIT':
      return { ...state, editingPixelAssetId: action.assetId }
    case 'STOP_PIXEL_EDIT':
      return { ...state, editingPixelAssetId: null }
    case 'SET_FOLDER_COLLAPSED':
      return {
        ...state,
        document: {
          ...state.document,
          pageFolders: state.document.pageFolders.map(f =>
            f.id === action.folderId ? { ...f, collapsed: action.collapsed } : f
          ),
        },
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
