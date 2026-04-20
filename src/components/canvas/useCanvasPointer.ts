import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { useAppState, useAppDispatch } from '@store/context'
import { screenToCanvas } from '@store/reducer'
import type { ShapeType } from '@model/shapes'
import { createShape } from '@utils/shapeFactory'
import { getActiveTheme } from '@model/theme'
import { generateId } from '@utils/idgen'
import { pointInBox, pointNearLine, buildParentMap, getAbsoluteTransform, getContentOrigin } from '@utils/geometry'
import { findNode, getAllIds } from '@model/document'
import type { VibeDocument } from '@model/document'
import { resolveEndpoint } from '@utils/connectors'
import { RULER_SIZE } from './CanvasRuler'

interface GhostRect {
  x: number
  y: number
  width: number
  height: number
}

export interface CanvasContextMenuState {
  screenX: number
  screenY: number
  canvasX: number
  canvasY: number
  shapeId: string | null
  selectedIds: string[]
}

// Map tool mode to shape type
const TOOL_SHAPE: Partial<Record<string, ShapeType>> = {
  'insert-rect': 'rect',
  'insert-circle': 'circle',
  'insert-text': 'text',
  'insert-image': 'image',
  'insert-line': 'line',
  'insert-button': 'button',
  'insert-panel': 'panel',
  'insert-slider': 'slider',
  'insert-label': 'label',
  'insert-textfield': 'textfield',
  'insert-checkbox': 'checkbox',
  'insert-toggle': 'toggle',
  'insert-frame': 'frame',
  'insert-dialog': 'dialog',
  'insert-radio': 'radio',
  'insert-select': 'select',
  'insert-progress': 'progress',
  'insert-stepper': 'stepper',
  'insert-stickynote': 'stickynote',
  'insert-list': 'list',
  'insert-scrollpanel': 'scrollpanel',
  'insert-table': 'table',
  'insert-group': 'group',
}

/**
 * Find the deepest frame or panel whose bounding box contains (cx, cy),
 * excluding the dragged shape and its descendants. Returns null when the
 * shape belongs at the page level (no container found).
 */
function findDropTarget(
  cx: number,
  cy: number,
  draggedId: string,
  doc: VibeDocument,
  parentMap: Record<string, string>,
): string | null {
  const draggedNode = findNode(doc.rootNodes, draggedId)
  const excluded = new Set(draggedNode ? getAllIds(draggedNode.children) : [])
  excluded.add(draggedId)

  const candidates: string[] = []
  function walk(nodes: typeof doc.rootNodes) {
    for (const n of nodes) {
      const shape = doc.shapes[n.id]
      if (shape && (shape.type === 'frame' || shape.type === 'panel' || shape.type === 'dialog' || shape.type === 'scrollpanel' || shape.type === 'group')) {
        candidates.push(n.id)
      }
      walk(n.children)
    }
  }
  for (const page of doc.rootNodes) walk(page.children)

  let best: string | null = null
  for (const id of candidates) {
    if (excluded.has(id)) continue
    const abs = getAbsoluteTransform(id, doc.shapes, parentMap)
    if (!abs) continue
    if (cx >= abs.x && cx <= abs.x + abs.width && cy >= abs.y && cy <= abs.y + abs.height) {
      best = id
    }
  }
  return best
}

export function useCanvasPointer(containerRef: RefObject<HTMLDivElement | null>) {
  const { state } = useAppState()
  const dispatch = useAppDispatch()

  // Current innermost drilled container (top of stack), or null if not drilled in
  const drilledInContainerId = state.drilledInContainerStack[state.drilledInContainerStack.length - 1] ?? null

  const dragStart = useRef<{ sx: number; sy: number; cx: number; cy: number } | null>(null)
  const draggingIds = useRef<string[]>([])
  const lastCanvasPos = useRef<{ x: number; y: number } | null>(null)
  const isDragging = useRef(false)
  const metaDownAtStart = useRef(false)
  const hasDuplicated = useRef(false)
  const spaceDown = useRef(false)
  const spacePanning = useRef(false)
  const [spaceHeld, setSpaceHeld] = useState(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement === containerRef.current) {
        e.preventDefault()
        spaceDown.current = true
        setSpaceHeld(true)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceDown.current = false
        spacePanning.current = false
        setSpaceHeld(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [containerRef])

  const [ghostRect, setGhostRect] = useState<GhostRect | null>(null)
  const [marqueeRect, setMarqueeRect] = useState<GhostRect | null>(null)
  const marqueeStart = useRef<{ cx: number; cy: number; sx: number; sy: number } | null>(null)
  const [contextMenu, setContextMenu] = useState<CanvasContextMenuState | null>(null)

  const getCanvasPos = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    return { sx, sy, ...screenToCanvas(state.viewTransform, sx - RULER_SIZE, sy - RULER_SIZE) }
  }, [state.viewTransform, containerRef])

  const hitTestShapes = useCallback((cx: number, cy: number): string | null => {
    if (!state.activePageId) return null
    const activeNode = state.document.rootNodes.find(n => n.id === state.activePageId)
    if (!activeNode) return null

    // When drilled in, scope hit testing to the drilled container's children only
    const scopeNode = drilledInContainerId
      ? findNode(activeNode.children, drilledInContainerId)
      : null
    const childrenToTest = scopeNode ? scopeNode.children : activeNode.children

    // Check children in reverse order (top shape first)
    const allIds: string[] = []
    function collect(nodes: { id: string; children: typeof nodes }[]) {
      for (const n of nodes) {
        allIds.push(n.id)
        collect(n.children)
      }
    }
    collect(childrenToTest)

    const parentMap = buildParentMap(state.document.rootNodes)

    for (let i = allIds.length - 1; i >= 0; i--) {
      const id = allIds[i]
      const shape = state.document.shapes[id]
      if (!shape || !shape.visible) continue
      if (shape.type === 'line') {
        const p1 = resolveEndpoint(shape.start, state.document.shapes)
        const p2 = resolveEndpoint(shape.end, state.document.shapes)
        const tolerance = 8 / state.viewTransform.zoom
        if (pointNearLine({ x: cx, y: cy }, p1, p2, tolerance)) {
          return id
        }
        continue
      }
      const absTransform = getAbsoluteTransform(id, state.document.shapes, parentMap)
      if (absTransform && pointInBox({ x: cx, y: cy }, absTransform)) {
        // Bubble up to the nearest group ancestor that is not the currently drilled-in container
        let resultId = id
        let current = id
        while (true) {
          const parentId = parentMap[current]
          if (!parentId) break
          const parent = state.document.shapes[parentId]
          if (!parent || parent.type === 'page') break
          if (parent.type === 'group' && parentId !== drilledInContainerId) {
            resultId = parentId
          }
          current = parentId
        }
        return resultId
      }
    }
    return null
  }, [state.document, state.activePageId, state.drilledInContainerStack, state.viewTransform.zoom])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    containerRef.current?.setPointerCapture(e.pointerId)

    const pos = getCanvasPos(e)
    dragStart.current = { sx: e.clientX, sy: e.clientY, cx: pos.x, cy: pos.y }
    lastCanvasPos.current = { x: pos.x, y: pos.y }
    isDragging.current = false

    if (spaceDown.current) {
      spacePanning.current = true
      return
    }

    const shapeType = TOOL_SHAPE[state.toolMode]
    if (shapeType) {
      // Insert mode: ghost starts here
      return
    }

    if (state.toolMode === 'pan') {
      return
    }

    // Select mode
    metaDownAtStart.current = e.metaKey
    hasDuplicated.current = false
    const hitId = hitTestShapes(pos.x, pos.y)
    if (hitId) {
      const alreadySelected = state.selection.ids.includes(hitId)
      if (!alreadySelected) {
        dispatch({ type: 'SELECT_SHAPES', ids: [hitId], additive: e.shiftKey })
      } else if (e.shiftKey) {
        dispatch({ type: 'SELECT_SHAPES', ids: state.selection.ids.filter(id => id !== hitId), additive: false })
      }
      draggingIds.current = e.shiftKey && alreadySelected
        ? state.selection.ids.filter(id => id !== hitId)
        : alreadySelected
          ? state.selection.ids
          : [hitId]
    } else {
      if (!e.shiftKey) dispatch({ type: 'DESELECT_ALL' })
      draggingIds.current = []
      marqueeStart.current = { cx: pos.x, cy: pos.y, sx: pos.sx, sy: pos.sy }
    }
  }, [state, dispatch, getCanvasPos, hitTestShapes, containerRef])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return

    const pos = getCanvasPos(e)
    const dx = e.clientX - dragStart.current.sx
    const dy = e.clientY - dragStart.current.sy

    if (!isDragging.current && Math.sqrt(dx * dx + dy * dy) > 4) {
      isDragging.current = true
    }
    if (!isDragging.current) return

    if (state.toolMode === 'pan' || spacePanning.current) {
      dispatch({ type: 'PAN_BY', dx, dy })
      dragStart.current = { sx: e.clientX, sy: e.clientY, cx: pos.x, cy: pos.y }
      return
    }

    const shapeType = TOOL_SHAPE[state.toolMode]
    if (shapeType) {
      const { sx, sy } = dragStart.current
      const rect = containerRef.current!.getBoundingClientRect()
      const startScreenX = sx - rect.left
      const startScreenY = sy - rect.top
      const curScreenX = e.clientX - rect.left
      const curScreenY = e.clientY - rect.top
      setGhostRect({
        x: Math.min(startScreenX, curScreenX),
        y: Math.min(startScreenY, curScreenY),
        width: Math.abs(curScreenX - startScreenX),
        height: Math.abs(curScreenY - startScreenY),
      })
      return
    }

    // Marquee selection drag
    if (marqueeStart.current) {
      const containerRect = containerRef.current!.getBoundingClientRect()
      const curSx = e.clientX - containerRect.left
      const curSy = e.clientY - containerRect.top
      setMarqueeRect({
        x: Math.min(marqueeStart.current.sx, curSx),
        y: Math.min(marqueeStart.current.sy, curSy),
        width: Math.abs(curSx - marqueeStart.current.sx),
        height: Math.abs(curSy - marqueeStart.current.sy),
      })
      return
    }

    // Move selected shapes (with optional Cmd+drag duplicate)
    if (draggingIds.current.length > 0 && lastCanvasPos.current) {
      if (metaDownAtStart.current && !hasDuplicated.current) {
        const newRootIds = draggingIds.current.map(() => generateId())
        dispatch({ type: 'DUPLICATE_SHAPES', ids: draggingIds.current, rootIds: newRootIds })
        dispatch({ type: 'SELECT_SHAPES', ids: newRootIds, additive: false })
        draggingIds.current = newRootIds
        hasDuplicated.current = true
      }
      const canvasDx = pos.x - lastCanvasPos.current.x
      const canvasDy = pos.y - lastCanvasPos.current.y
      dispatch({ type: 'MOVE_SHAPES', ids: draggingIds.current, dx: canvasDx, dy: canvasDy })
    }
    lastCanvasPos.current = { x: pos.x, y: pos.y }
  }, [state.toolMode, dispatch, getCanvasPos, containerRef])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return
    containerRef.current?.releasePointerCapture(e.pointerId)

    const pos = getCanvasPos(e)
    const shapeType = TOOL_SHAPE[state.toolMode]
    const activeTheme = getActiveTheme(state.document)

    if (shapeType && isDragging.current) {
      // Commit insert
      const startCx = dragStart.current.cx
      const startCy = dragStart.current.cy
      const x = Math.min(startCx, pos.x)
      const y = Math.min(startCy, pos.y)
      const w = Math.max(20, Math.abs(pos.x - startCx))
      const h = Math.max(20, Math.abs(pos.y - startCy))

      // When drilled into a container, add shapes as children of that container
      const drillParentId = shapeType === 'page' ? null : (drilledInContainerId ?? state.activePageId)
      const parentMap = buildParentMap(state.document.rootNodes)
      const origin = getContentOrigin(drillParentId, state.document.shapes, parentMap)

      if (shapeType === 'line') {
        const shape = createShape('line', startCx, startCy, activeTheme)
        if (shape.type === 'line') {
          const newShape = {
            ...shape,
            start: { kind: 'free' as const, point: { x: startCx - origin.x, y: startCy - origin.y } },
            end: { kind: 'free' as const, point: { x: pos.x - origin.x, y: pos.y - origin.y } },
          }
          dispatch({ type: 'ADD_SHAPE', parentId: drillParentId, shape: newShape })
          dispatch({ type: 'SELECT_SHAPES', ids: [newShape.id], additive: false })
        }
      } else {
        const lx = x - origin.x
        const ly = y - origin.y
        const shape = createShape(shapeType, lx, ly, activeTheme)
        if (shape.type !== 'line') {
          const newShape = { ...shape, transform: { ...shape.transform, x: lx, y: ly, width: w, height: h } }
          dispatch({ type: 'ADD_SHAPE', parentId: drillParentId, shape: newShape })
          dispatch({ type: 'SELECT_SHAPES', ids: [newShape.id], additive: false })
          if (shapeType === 'page') dispatch({ type: 'SET_ACTIVE_PAGE', pageId: newShape.id })
        }
      }
      dispatch({ type: 'SET_TOOL_MODE', mode: 'select' })
    } else if (shapeType && !isDragging.current) {
      // Single click insert with default size
      const drillParentId = shapeType === 'page' ? null : (drilledInContainerId ?? state.activePageId)
      const parentMap = buildParentMap(state.document.rootNodes)
      const origin = getContentOrigin(drillParentId, state.document.shapes, parentMap)
      const lx = pos.x - 60 - origin.x
      const ly = pos.y - 30 - origin.y
      const shape = createShape(shapeType, lx, ly, activeTheme)
      dispatch({ type: 'ADD_SHAPE', parentId: drillParentId, shape })
      dispatch({ type: 'SELECT_SHAPES', ids: [shape.id], additive: false })
      if (shapeType === 'page') dispatch({ type: 'SET_ACTIVE_PAGE', pageId: shape.id })
      dispatch({ type: 'SET_TOOL_MODE', mode: 'select' })
    }

    // Commit marquee selection
    if (marqueeStart.current && isDragging.current && state.activePageId) {
      const { cx: startCx, cy: startCy } = marqueeStart.current
      const x1 = Math.min(startCx, pos.x)
      const y1 = Math.min(startCy, pos.y)
      const x2 = Math.max(startCx, pos.x)
      const y2 = Math.max(startCy, pos.y)

      const activeNode = state.document.rootNodes.find(n => n.id === state.activePageId)
      if (activeNode) {
        // When drilled in, scope marquee to the drilled container's children
        const scopeNode = drilledInContainerId
          ? findNode(activeNode.children, drilledInContainerId)
          : null
        const childrenToMarquee = scopeNode ? scopeNode.children : activeNode.children

        const allIds: string[] = []
        const collect = (nodes: { id: string; children: typeof nodes }[]) => {
          for (const n of nodes) { allIds.push(n.id); collect(n.children) }
        }
        collect(childrenToMarquee)

        const parentMap = buildParentMap(state.document.rootNodes)
        const selected = allIds.filter(id => {
          const shape = state.document.shapes[id]
          if (!shape || !shape.visible || shape.type === 'line') return false
          const abs = getAbsoluteTransform(id, state.document.shapes, parentMap)
          if (!abs) return false
          return abs.x < x2 && abs.x + abs.width > x1 && abs.y < y2 && abs.y + abs.height > y1
        })
        if (selected.length > 0) {
          dispatch({ type: 'SELECT_SHAPES', ids: selected, additive: e.shiftKey })
        }
      }
    }

    // Canvas drag-to-reparent: check if shapes moved into or out of a frame/panel
    if (isDragging.current && draggingIds.current.length > 0 && state.activePageId) {
      const parentMap = buildParentMap(state.document.rootNodes)
      for (const shapeId of draggingIds.current) {
        const currentParentId = parentMap[shapeId] ?? null
        const currentParent = currentParentId ? state.document.shapes[currentParentId] : null
        const effectiveCurrentParent = currentParent?.type === 'page' ? null : currentParentId

        const abs = getAbsoluteTransform(shapeId, state.document.shapes, parentMap)
        if (!abs) continue
        const centerX = abs.x + abs.width / 2
        const centerY = abs.y + abs.height / 2

        const newParentId = findDropTarget(centerX, centerY, shapeId, state.document, parentMap)

        if (newParentId !== effectiveCurrentParent) {
          const origin = getContentOrigin(newParentId, state.document.shapes, parentMap)
          const newX = abs.x - origin.x
          const newY = abs.y - origin.y
          const resolvedParentId = newParentId ?? state.activePageId
          const parentNode = findNode(state.document.rootNodes, resolvedParentId)
          const index = parentNode ? parentNode.children.length : 0
          dispatch({ type: 'REPARENT_SHAPE', id: shapeId, newParentId: resolvedParentId, index, x: newX, y: newY })
        }
      }
    }

    marqueeStart.current = null
    setMarqueeRect(null)
    setGhostRect(null)
    dragStart.current = null
    isDragging.current = false
    draggingIds.current = []
    lastCanvasPos.current = null
    spacePanning.current = false
    metaDownAtStart.current = false
    hasDuplicated.current = false
  }, [state, dispatch, getCanvasPos, containerRef])

  const getMouseCanvasPos = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current!.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    return screenToCanvas(state.viewTransform, sx - RULER_SIZE, sy - RULER_SIZE)
  }, [state.viewTransform, containerRef])

  const DRILLABLE = new Set(['frame', 'panel', 'dialog', 'scrollpanel', 'group'])
  const TEXT_EDITABLE = new Set(['text', 'button', 'panel', 'label', 'textfield', 'checkbox', 'toggle', 'radio', 'select', 'stickynote', 'list', 'table'])

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    if (state.toolMode !== 'select') return
    const pos = getMouseCanvasPos(e)

    if (drilledInContainerId) {
      // Already drilled in — hitTestShapes is scoped to container children
      const hitId = hitTestShapes(pos.x, pos.y)
      if (hitId) {
        const shape = state.document.shapes[hitId]
        if (shape && TEXT_EDITABLE.has(shape.type)) {
          dispatch({ type: 'START_TEXT_EDIT', id: hitId })
        }
      } else {
        // Missed all children — check if click was outside the container bounds
        const parentMap = buildParentMap(state.document.rootNodes)
        const containerAbs = getAbsoluteTransform(
          drilledInContainerId, state.document.shapes, parentMap)
        if (!containerAbs || !pointInBox({ x: pos.x, y: pos.y }, containerAbs)) {
          dispatch({ type: 'EXIT_DRILL_MODE' })
        }
        // Click on empty space inside container: do nothing
      }
    } else {
      // Not drilled in — normal hit test against the full page
      const hitId = hitTestShapes(pos.x, pos.y)
      if (hitId) {
        const shape = state.document.shapes[hitId]
        if (!shape) return
        if (DRILLABLE.has(shape.type)) {
          dispatch({ type: 'ENTER_DRILL_MODE', containerId: hitId })
        } else if (TEXT_EDITABLE.has(shape.type)) {
          dispatch({ type: 'START_TEXT_EDIT', id: hitId })
        }
      }
    }
  }, [state, dispatch, getMouseCanvasPos, hitTestShapes])

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const pos = getMouseCanvasPos(e)
    const shapeId = hitTestShapes(pos.x, pos.y)
    const currentIds = state.selection.ids
    const isAlreadyInMultiSelect = shapeId !== null && currentIds.length > 1 && currentIds.includes(shapeId)
    let selectedIds: string[]
    if (isAlreadyInMultiSelect) {
      selectedIds = currentIds
    } else {
      if (shapeId) {
        dispatch({ type: 'SELECT_SHAPES', ids: [shapeId], additive: false })
      }
      selectedIds = shapeId ? [shapeId] : []
    }
    setContextMenu({ screenX: e.clientX, screenY: e.clientY, canvasX: pos.x, canvasY: pos.y, shapeId, selectedIds })
  }, [getMouseCanvasPos, hitTestShapes, dispatch, state.selection.ids])

  return { onPointerDown, onPointerMove, onPointerUp, onDoubleClick, onContextMenu, ghostRect, marqueeRect, contextMenu, closeContextMenu: () => setContextMenu(null), spaceHeld }
}
