import type { AppState, AppAction, DocumentAction, ViewTransform } from './types'
import type { VibeDocument, TreeNode } from '@model/document'
import type { Shape } from '@model/shapes'
import { findNode, findParent, removeNode, insertNode, getAllIds } from '@model/document'
import { generateId } from '@utils/idgen'

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
      return { ...doc, shapes: newShapes }
    }

    case 'SET_TRANSFORM': {
      const shape = doc.shapes[action.id]
      if (!shape || shape.type === 'line' || shape.locked) return doc
      return {
        ...doc,
        shapes: { ...doc.shapes, [action.id]: { ...shape, transform: action.transform } },
      }
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
      return {
        ...doc,
        shapes: { ...doc.shapes, [action.id]: { ...shape, ...action.patch } as Shape },
      }
    }

    case 'REPARENT_SHAPE': {
      const node = findNode(doc.rootNodes, action.id)
      if (!node) return doc
      const withoutNode = removeNode(doc.rootNodes, action.id)
      const withNode = insertNode(withoutNode, action.newParentId, node, action.index)
      return { ...doc, rootNodes: withNode }
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
      if (
        shape.type === 'label' || shape.type === 'textfield' ||
        shape.type === 'checkbox' || shape.type === 'toggle' || shape.type === 'radio' ||
        shape.type === 'select'
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

    case 'LOAD_DOCUMENT':
      return action.document

    default:
      return doc
  }
}

// ─── Initial state ─────────────────────────────────────────────────────────

export function createInitialDocument(): VibeDocument {
  const pageId = generateId()
  return {
    version: 1,
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
  documentId: null,
  documentName: 'Untitled',
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
    case 'LOAD_DOCUMENT':
      return {
        ...state,
        document: applyDocumentAction(state.document, action),
      }

    // ── Selection actions ──────────────────────────────────────────────
    case 'SELECT_SHAPES':
      return {
        ...state,
        selection: {
          ...state.selection,
          ids: action.additive
            ? [...new Set([...state.selection.ids, ...action.ids])]
            : action.ids,
        },
      }
    case 'DESELECT_ALL':
      return { ...state, selection: { ids: [], editingTextId: null } }
    case 'SELECT_ALL': {
      const allIds = getAllIds(state.document.rootNodes)
      return { ...state, selection: { ...state.selection, ids: allIds } }
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
      return { ...state, activePageId: action.pageId }
    case 'TOGGLE_SHORTCUTS_MODAL':
      return { ...state, showShortcutsModal: !state.showShortcutsModal }
    case 'SET_DOCUMENT_META':
      return { ...state, documentId: action.id, documentName: action.name }

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
