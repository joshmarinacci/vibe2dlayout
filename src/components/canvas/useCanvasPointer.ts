import { useCallback, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { useAppState, useAppDispatch } from '@store/context'
import { screenToCanvas } from '@store/reducer'
import type { ShapeType } from '@model/shapes'
import { createShape } from '@utils/shapeFactory'
import { pointInBox, pointNearLine, buildParentMap, getAbsoluteTransform } from '@utils/geometry'
import { resolveEndpoint } from '@utils/connectors'

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
  'insert-page': 'page',
}

export function useCanvasPointer(containerRef: RefObject<HTMLDivElement | null>) {
  const { state } = useAppState()
  const dispatch = useAppDispatch()

  const dragStart = useRef<{ sx: number; sy: number; cx: number; cy: number } | null>(null)
  const draggingIds = useRef<string[]>([])
  const lastCanvasPos = useRef<{ x: number; y: number } | null>(null)
  const isDragging = useRef(false)

  const [ghostRect, setGhostRect] = useState<GhostRect | null>(null)
  const [contextMenu, setContextMenu] = useState<CanvasContextMenuState | null>(null)

  const getCanvasPos = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    return { sx, sy, ...screenToCanvas(state.viewTransform, sx, sy) }
  }, [state.viewTransform, containerRef])

  const hitTestShapes = useCallback((cx: number, cy: number): string | null => {
    if (!state.activePageId) return null
    const activeNode = state.document.rootNodes.find(n => n.id === state.activePageId)
    if (!activeNode) return null

    // Check children in reverse order (top shape first)
    const allIds: string[] = []
    function collect(nodes: { id: string; children: typeof nodes }[]) {
      for (const n of nodes) {
        allIds.push(n.id)
        collect(n.children)
      }
    }
    collect(activeNode.children)

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
        return id
      }
    }
    return null
  }, [state.document, state.activePageId, state.viewTransform.zoom])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    containerRef.current?.setPointerCapture(e.pointerId)

    const pos = getCanvasPos(e)
    dragStart.current = { sx: e.clientX, sy: e.clientY, cx: pos.x, cy: pos.y }
    lastCanvasPos.current = { x: pos.x, y: pos.y }
    isDragging.current = false

    const shapeType = TOOL_SHAPE[state.toolMode]
    if (shapeType) {
      // Insert mode: ghost starts here
      return
    }

    if (state.toolMode === 'pan') {
      return
    }

    // Select mode
    const hitId = hitTestShapes(pos.x, pos.y)
    if (hitId) {
      const alreadySelected = state.selection.ids.includes(hitId)
      if (!alreadySelected) {
        dispatch({ type: 'SELECT_SHAPES', ids: [hitId], additive: e.shiftKey })
      }
      draggingIds.current = e.shiftKey && alreadySelected
        ? state.selection.ids.filter(id => id !== hitId)
        : alreadySelected
          ? state.selection.ids
          : [hitId]
    } else {
      dispatch({ type: 'DESELECT_ALL' })
      draggingIds.current = []
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

    if (state.toolMode === 'pan') {
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

    // Move selected shapes
    if (draggingIds.current.length > 0 && lastCanvasPos.current) {
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

    if (shapeType && isDragging.current) {
      // Commit insert
      const startCx = dragStart.current.cx
      const startCy = dragStart.current.cy
      const x = Math.min(startCx, pos.x)
      const y = Math.min(startCy, pos.y)
      const w = Math.max(20, Math.abs(pos.x - startCx))
      const h = Math.max(20, Math.abs(pos.y - startCy))

      if (shapeType === 'line') {
        const shape = createShape('line', startCx, startCy)
        if (shape.type === 'line') {
          const newShape = {
            ...shape,
            start: { kind: 'free' as const, point: { x: startCx, y: startCy } },
            end: { kind: 'free' as const, point: { x: pos.x, y: pos.y } },
          }
          dispatch({ type: 'ADD_SHAPE', parentId: state.activePageId, shape: newShape })
          dispatch({ type: 'SELECT_SHAPES', ids: [newShape.id], additive: false })
        }
      } else {
        const shape = createShape(shapeType, x, y)
        if (shape.type !== 'line') {
          const newShape = { ...shape, transform: { ...shape.transform, x, y, width: w, height: h } }
          dispatch({ type: 'ADD_SHAPE', parentId: state.activePageId, shape: newShape })
          dispatch({ type: 'SELECT_SHAPES', ids: [newShape.id], additive: false })
        }
      }
      dispatch({ type: 'SET_TOOL_MODE', mode: 'select' })
    } else if (shapeType && !isDragging.current) {
      // Single click insert with default size
      const shape = createShape(shapeType, pos.x - 60, pos.y - 30)
      dispatch({ type: 'ADD_SHAPE', parentId: state.activePageId, shape })
      dispatch({ type: 'SELECT_SHAPES', ids: [shape.id], additive: false })
      dispatch({ type: 'SET_TOOL_MODE', mode: 'select' })
    }

    setGhostRect(null)
    dragStart.current = null
    isDragging.current = false
    draggingIds.current = []
    lastCanvasPos.current = null
  }, [state, dispatch, getCanvasPos, containerRef])

  const getMouseCanvasPos = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current!.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    return screenToCanvas(state.viewTransform, sx, sy)
  }, [state.viewTransform, containerRef])

  const TEXT_EDITABLE = new Set(['text', 'button', 'panel'])

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    if (state.toolMode !== 'select') return
    const pos = getMouseCanvasPos(e)
    const hitId = hitTestShapes(pos.x, pos.y)
    if (hitId) {
      const shape = state.document.shapes[hitId]
      if (shape && TEXT_EDITABLE.has(shape.type)) {
        dispatch({ type: 'START_TEXT_EDIT', id: hitId })
      }
    }
  }, [state, dispatch, getMouseCanvasPos, hitTestShapes])

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const pos = getMouseCanvasPos(e)
    const shapeId = hitTestShapes(pos.x, pos.y)
    if (shapeId) {
      dispatch({ type: 'SELECT_SHAPES', ids: [shapeId], additive: false })
    }
    setContextMenu({ screenX: e.clientX, screenY: e.clientY, canvasX: pos.x, canvasY: pos.y, shapeId })
  }, [getMouseCanvasPos, hitTestShapes, dispatch])

  return { onPointerDown, onPointerMove, onPointerUp, onDoubleClick, onContextMenu, ghostRect, contextMenu, closeContextMenu: () => setContextMenu(null) }
}
