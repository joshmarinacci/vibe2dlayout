import type {ImageCrop, ImageShape} from '@model/shapes'
import {useAppDispatch, useAppState} from '@store/context'
import {canvasToScreen} from '@store/reducer'
import type React from 'react'
import {useCallback, useEffect, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import {RULER_SIZE} from './CanvasRuler'

const HANDLE_SIZE = 10

type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

interface HandleDef {
    id: HandleId
    xFrac: number  // 0=left, 0.5=center, 1=right of crop rect
    yFrac: number  // 0=top, 0.5=middle, 1=bottom of crop rect
    cursor: string
}

const HANDLES: HandleDef[] = [
    {id: 'nw', xFrac: 0, yFrac: 0, cursor: 'nw-resize'},
    {id: 'n',  xFrac: 0.5, yFrac: 0, cursor: 'n-resize'},
    {id: 'ne', xFrac: 1, yFrac: 0, cursor: 'ne-resize'},
    {id: 'e',  xFrac: 1, yFrac: 0.5, cursor: 'e-resize'},
    {id: 'se', xFrac: 1, yFrac: 1, cursor: 'se-resize'},
    {id: 's',  xFrac: 0.5, yFrac: 1, cursor: 's-resize'},
    {id: 'sw', xFrac: 0, yFrac: 1, cursor: 'sw-resize'},
    {id: 'w',  xFrac: 0, yFrac: 0.5, cursor: 'w-resize'},
]

// Clamp local crop so the composed result stays within [0,1] in image space.
// base is the shape's existing absolute crop (or {0,0,1,1} if none).
// local values can be negative / >1 to expand beyond the current shape bounds.
function clampCrop(c: ImageCrop, base: ImageCrop): ImageCrop {
    const MIN = 0.05
    // Express full-image limits in local (current-shape) coordinates
    const minX = -base.x / base.width
    const minY = -base.y / base.height
    const maxRight  = minX + 1 / base.width   // local x where composed right edge = 1
    const maxBottom = minY + 1 / base.height

    let {x, y, width, height} = c
    width  = Math.max(MIN, Math.min(maxRight  - x, width))
    height = Math.max(MIN, Math.min(maxBottom - y, height))
    x = Math.max(minX, Math.min(maxRight  - width,  x))
    y = Math.max(minY, Math.min(maxBottom - height, y))
    return {x, y, width, height}
}

export function CropOverlay({containerRef}: {containerRef: React.RefObject<HTMLDivElement | null>}) {
    const {state} = useAppState()
    const dispatch = useAppDispatch()
    const shapeId = state.croppingShapeId
    const shape = shapeId ? state.document.shapes[shapeId] as ImageShape | undefined : undefined

    const [localCrop, setLocalCrop] = useState<ImageCrop | null>(null)
    // Capture the absolute crop at session start so clamp limits are stable during drag
    const baseCropRef = useRef<ImageCrop>({x: 0, y: 0, width: 1, height: 1})

    // Always start with the full shape bounds — the shape was already resized to the crop region
    useEffect(() => {
        if (!shape) return
        baseCropRef.current = shape.crop ?? {x: 0, y: 0, width: 1, height: 1}
        setLocalCrop({x: 0, y: 0, width: 1, height: 1})
    }, [shapeId]) // eslint-disable-line react-hooks/exhaustive-deps

    const dragRef = useRef<{
        handleId: HandleId
        startMouseX: number
        startMouseY: number
        startCrop: ImageCrop
        shapeScreenW: number
        shapeScreenH: number
    } | null>(null)

    const handleDone = useCallback(() => {
        if (shapeId && shape && localCrop) {
            // Compose localCrop (relative to current shape) with the existing absolute crop
            const base = shape.crop ?? {x: 0, y: 0, width: 1, height: 1}
            const composed: ImageCrop = {
                x: base.x + localCrop.x * base.width,
                y: base.y + localCrop.y * base.height,
                width:  localCrop.width  * base.width,
                height: localCrop.height * base.height,
            }
            const isFull = composed.x === 0 && composed.y === 0 && composed.width === 1 && composed.height === 1
            const newTransform = {
                ...shape.transform,
                x: shape.transform.x + localCrop.x * shape.transform.width,
                y: shape.transform.y + localCrop.y * shape.transform.height,
                width:  shape.transform.width  * localCrop.width,
                height: shape.transform.height * localCrop.height,
            }
            dispatch({
                type: 'PATCH_SHAPE',
                id: shapeId,
                patch: {
                    transform: newTransform,
                    crop: isFull ? undefined : composed,
                } as Partial<ImageShape>,
            })
        }
        dispatch({type: 'EXIT_CROP_MODE'})
    }, [dispatch, shapeId, shape, localCrop])

    const handleReset = useCallback(() => {
        setLocalCrop({x: 0, y: 0, width: 1, height: 1})
    }, [])

    const handleCancel = useCallback(() => {
        dispatch({type: 'EXIT_CROP_MODE'})
    }, [dispatch])

    // Keyboard escape cancels
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleCancel()
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [handleCancel])

    const onHandleMouseDown = useCallback((e: React.MouseEvent, handleId: HandleId) => {
        if (!shape || !localCrop) return
        e.stopPropagation()
        e.preventDefault()
        const vt = state.viewTransform
        const shapeScreenW = shape.transform.width * vt.zoom
        const shapeScreenH = shape.transform.height * vt.zoom
        dragRef.current = {
            handleId,
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            startCrop: {...localCrop},
            shapeScreenW,
            shapeScreenH,
        }
    }, [shape, localCrop, state.viewTransform])

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            const drag = dragRef.current
            if (!drag || !shape) return
            const dx = (e.clientX - drag.startMouseX) / drag.shapeScreenW  // fraction of shape width
            const dy = (e.clientY - drag.startMouseY) / drag.shapeScreenH
            const sc = drag.startCrop
            let {x, y, width, height} = sc

            switch (drag.handleId) {
                case 'nw': x += dx * sc.width; y += dy * sc.height; width -= dx * sc.width; height -= dy * sc.height; break
                case 'n':  y += dy * sc.height; height -= dy * sc.height; break
                case 'ne': y += dy * sc.height; width += dx * sc.width; height -= dy * sc.height; break
                case 'e':  width += dx * sc.width; break
                case 'se': width += dx * sc.width; height += dy * sc.height; break
                case 's':  height += dy * sc.height; break
                case 'sw': x += dx * sc.width; width -= dx * sc.width; height += dy * sc.height; break
                case 'w':  x += dx * sc.width; width -= dx * sc.width; break
            }

            setLocalCrop(clampCrop({x, y, width, height}, baseCropRef.current))
        }
        const onMouseUp = () => { dragRef.current = null }
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
        return () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }
    }, [shape])

    if (!shape || !localCrop || shape.locked) return null

    const vt = state.viewTransform
    const rect = containerRef.current?.getBoundingClientRect()
    const originX = (rect?.left ?? 0) + RULER_SIZE
    const originY = (rect?.top  ?? 0) + RULER_SIZE

    const {x: sx, y: sy} = canvasToScreen(vt, shape.transform.x, shape.transform.y)
    const sw = shape.transform.width * vt.zoom
    const sh = shape.transform.height * vt.zoom

    // Viewport-relative coords of crop region (for position:fixed elements)
    const cropLeft   = originX + sx + localCrop.x * sw
    const cropTop    = originY + sy + localCrop.y * sh
    const cropRight  = originX + sx + (localCrop.x + localCrop.width) * sw
    const cropBottom = originY + sy + (localCrop.y + localCrop.height) * sh
    const cropW = cropRight - cropLeft
    const cropH = cropBottom - cropTop

    // Full image boundary in viewport coords (how far handles can be dragged)
    const base = baseCropRef.current
    const imgLeft   = originX + sx - (base.x / base.width) * sw
    const imgTop    = originY + sy - (base.y / base.height) * sh
    const imgRight  = imgLeft + sw / base.width
    const imgBottom = imgTop  + sh / base.height

    const maskStyle = (l: number, t: number, w: number | string, h: number | string) => ({
        position: 'fixed' as const,
        left: l, top: t, width: w, height: h,
        background: 'rgba(0,0,0,0.5)',
        pointerEvents: 'none' as const,
    })

    return createPortal(
        <div
            style={{position: 'fixed', inset: 0, zIndex: 20000, cursor: 'default'}}
            onPointerDown={e => e.stopPropagation()}
            onPointerMove={e => e.stopPropagation()}
            onPointerUp={e => e.stopPropagation()}
            onMouseDown={e => { if (e.target === e.currentTarget) handleCancel() }}
        >
            {/* Dark masks outside crop region */}
            <div style={maskStyle(RULER_SIZE, RULER_SIZE, cropLeft - RULER_SIZE, '100vh')}/>
            <div style={maskStyle(cropRight, RULER_SIZE, `calc(100vw - ${cropRight}px)`, '100vh')}/>
            <div style={maskStyle(cropLeft, RULER_SIZE, cropW, cropTop - RULER_SIZE)}/>
            <div style={maskStyle(cropLeft, cropBottom, cropW, `calc(100vh - ${cropBottom}px)`)}/>

            {/* Full image boundary (dashed) — shows how far handles can expand */}
            <div style={{
                position: 'fixed',
                left: imgLeft, top: imgTop,
                width: imgRight - imgLeft, height: imgBottom - imgTop,
                border: '1px dashed rgba(255,255,255,0.4)',
                boxSizing: 'border-box',
                pointerEvents: 'none',
            }}/>

            {/* Crop border */}
            <div style={{
                position: 'fixed',
                left: cropLeft, top: cropTop, width: cropW, height: cropH,
                border: '2px solid white',
                boxSizing: 'border-box',
                pointerEvents: 'none',
            }}/>

            {/* Handles */}
            {HANDLES.map(h => (
                <div
                    key={h.id}
                    style={{
                        position: 'fixed',
                        left: cropLeft + h.xFrac * cropW - HANDLE_SIZE / 2,
                        top: cropTop + h.yFrac * cropH - HANDLE_SIZE / 2,
                        width: HANDLE_SIZE,
                        height: HANDLE_SIZE,
                        background: 'white',
                        border: '1px solid #333',
                        cursor: h.cursor,
                        zIndex: 20001,
                        boxSizing: 'border-box',
                    }}
                    onMouseDown={e => onHandleMouseDown(e, h.id)}
                />
            ))}

            {/* Buttons */}
            <div style={{
                position: 'fixed',
                left: cropLeft,
                top: cropBottom + 8,
                display: 'flex',
                gap: 6,
                zIndex: 20001,
            }}>
                <button
                    style={btnStyle('#1d4ed8', 'white')}
                    onClick={handleDone}
                >
                    Done
                </button>
                <button
                    style={btnStyle('#6b7280', 'white')}
                    onClick={handleReset}
                >
                    Reset
                </button>
                <button
                    style={btnStyle('#f3f4f6', '#374151')}
                    onClick={handleCancel}
                >
                    Cancel
                </button>
            </div>
        </div>,
        document.body
    )
}

function btnStyle(bg: string, color: string): React.CSSProperties {
    return {
        padding: '4px 12px',
        fontSize: 12,
        borderRadius: 4,
        border: 'none',
        cursor: 'pointer',
        background: bg,
        color,
        fontWeight: 500,
    }
}
