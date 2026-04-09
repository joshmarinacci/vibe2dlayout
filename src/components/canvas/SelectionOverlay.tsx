import { useRef, useCallback, type RefObject } from 'react'
import { useAppState, useAppDispatch } from '@store/context'
import { screenToCanvas } from '@store/reducer'
import type { BoundingBox, Anchor } from '@model/transform'
import { anchorPoint, buildParentMap, getAbsoluteTransform, getParentContentOrigin } from '@utils/geometry'
import { RULER_SIZE } from './CanvasRuler'

const HANDLE_PX = 8  // visual size in screen pixels

const ANCHORS: Anchor[] = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
]

const CURSOR_MAP: Record<Anchor, string> = {
  'top-left': 'nwse-resize',
  'top-center': 'ns-resize',
  'top-right': 'nesw-resize',
  'middle-left': 'ew-resize',
  'middle-center': 'move',
  'middle-right': 'ew-resize',
  'bottom-left': 'nesw-resize',
  'bottom-center': 'ns-resize',
  'bottom-right': 'nwse-resize',
}

interface Props {
  containerRef: RefObject<HTMLDivElement | null>
}

export function SelectionOverlay({ containerRef }: Props) {
  const { state } = useAppState()
  const dispatch = useAppDispatch()
  const { ids } = state.selection
  const { zoom } = state.viewTransform

  if (ids.length === 0) return null

  // Compute aggregate bounding box in canvas space (accounting for nesting)
  const parentMap = buildParentMap(state.document.rootNodes)
  let bbox: BoundingBox | null = null
  for (const id of ids) {
    const t = getAbsoluteTransform(id, state.document.shapes, parentMap)
    if (!t) continue
    if (!bbox) {
      bbox = { ...t }
    } else {
      const x = Math.min(bbox.x, t.x)
      const y = Math.min(bbox.y, t.y)
      const x2 = Math.max(bbox.x + bbox.width, t.x + t.width)
      const y2 = Math.max(bbox.y + bbox.height, t.y + t.height)
      bbox = { x, y, width: x2 - x, height: y2 - y, rotation: 0 }
    }
  }
  if (!bbox) return null

  // We are rendered inside the CSS-transformed canvas div, so positions are
  // in canvas space. Handle size must be divided by zoom to stay visually constant.
  const handleSize = HANDLE_PX / zoom

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* Selection border */}
      <div style={{
        position: 'absolute',
        left: bbox.x,
        top: bbox.y,
        width: bbox.width,
        height: bbox.height,
        border: `${1 / zoom}px solid #3b82f6`,
        pointerEvents: 'none',
        boxSizing: 'border-box',
      }} />

      {/* Resize handles */}
      {ANCHORS.map(anchor => {
        const pt = anchorPoint(bbox!, anchor)
        return (
          <ResizeHandle
            key={anchor}
            anchor={anchor}
            cx={pt.x}
            cy={pt.y}
            handleSize={handleSize}
            bbox={bbox!}
            ids={ids.filter(id => state.document.shapes[id]?.type !== 'line')}
            containerRef={containerRef}
            dispatch={dispatch}
            state={state}
          />
        )
      })}
    </div>
  )
}

interface ResizeHandleProps {
  anchor: Anchor
  cx: number  // canvas-space center x
  cy: number  // canvas-space center y
  handleSize: number
  bbox: BoundingBox
  ids: string[]
  containerRef: RefObject<HTMLDivElement | null>
  dispatch: ReturnType<typeof useAppDispatch>
  state: ReturnType<typeof useAppState>['state']
}

function ResizeHandle({ anchor, cx, cy, handleSize, bbox, ids, containerRef, dispatch, state }: ResizeHandleProps) {
  const dragStart = useRef<{ sx: number; sy: number; bbox: BoundingBox } | null>(null)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStart.current = { sx: e.clientX, sy: e.clientY, bbox: { ...bbox } }
  }, [bbox])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return
    const { sx, sy, bbox: startBbox } = dragStart.current
    const rect = containerRef.current!.getBoundingClientRect()

    const startCanvas = screenToCanvas(state.viewTransform, sx - rect.left - RULER_SIZE, sy - rect.top - RULER_SIZE)
    const curCanvas = screenToCanvas(state.viewTransform, e.clientX - rect.left - RULER_SIZE, e.clientY - rect.top - RULER_SIZE)
    const dx = curCanvas.x - startCanvas.x
    const dy = curCanvas.y - startCanvas.y

    let { x, y, width, height } = startBbox

    switch (anchor) {
      case 'top-left':      x += dx; y += dy; width -= dx; height -= dy; break
      case 'top-center':    y += dy; height -= dy; break
      case 'top-right':     y += dy; width += dx; height -= dy; break
      case 'middle-left':   x += dx; width -= dx; break
      case 'middle-right':  width += dx; break
      case 'bottom-left':   x += dx; width -= dx; height += dy; break
      case 'bottom-center': height += dy; break
      case 'bottom-right':  width += dx; height += dy; break
    }

    // Shift: constrain to square, keeping the anchor's fixed corner in place
    if (e.shiftKey) {
      const size = Math.max(Math.abs(width), Math.abs(height))
      switch (anchor) {
        case 'top-left':
          x = startBbox.x + startBbox.width - size
          y = startBbox.y + startBbox.height - size
          width = size; height = size; break
        case 'top-right':
          y = startBbox.y + startBbox.height - size
          width = size; height = size; break
        case 'bottom-left':
          x = startBbox.x + startBbox.width - size
          width = size; height = size; break
        case 'bottom-right':
          width = size; height = size; break
        case 'middle-left':
        case 'middle-right':
          height = size; width = size
          y = startBbox.y + (startBbox.height - size) / 2
          if (anchor === 'middle-left') x = startBbox.x + startBbox.width - size
          break
        case 'top-center':
        case 'bottom-center':
          width = size; height = size
          x = startBbox.x + (startBbox.width - size) / 2
          if (anchor === 'top-center') y = startBbox.y + startBbox.height - size
          break
      }
    }

    width = Math.max(4, width)
    height = Math.max(4, height)

    if (ids.length === 1) {
      const parentMap = buildParentMap(state.document.rootNodes)
      const origin = getParentContentOrigin(ids[0], state.document.shapes, parentMap)
      dispatch({ type: 'SET_TRANSFORM', id: ids[0], transform: {
        x: x - origin.x,
        y: y - origin.y,
        width,
        height,
        rotation: startBbox.rotation,
      }})
    }
  }, [anchor, ids, containerRef, dispatch, state.viewTransform])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    dragStart.current = null
  }, [])

  return (
    <div
      style={{
        position: 'absolute',
        left: cx - handleSize / 2,
        top: cy - handleSize / 2,
        width: handleSize,
        height: handleSize,
        background: 'white',
        border: `${1 / state.viewTransform.zoom}px solid #3b82f6`,
        borderRadius: 1 / state.viewTransform.zoom,
        cursor: CURSOR_MAP[anchor],
        pointerEvents: 'all',
        zIndex: 100,
        boxSizing: 'border-box',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />
  )
}
