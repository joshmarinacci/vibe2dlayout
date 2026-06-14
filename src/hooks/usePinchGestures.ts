import {RULER_SIZE} from '@components/canvas/CanvasRuler'
import {useAppDispatch, useAppState} from '@store/context'
import type {MutableRefObject, RefObject} from 'react'
import {useEffect, useRef} from 'react'
import {MAX_ZOOM, MIN_ZOOM} from './usePanZoom'

export function usePinchGestures(
    containerRef: RefObject<HTMLDivElement | null>,
    multiTouchActiveRef: MutableRefObject<boolean>
) {
    const {state} = useAppState()
    const dispatch = useAppDispatch()

    // Keep stable refs so the effect closure never goes stale
    const zoomRef = useRef(state.viewTransform.zoom)
    zoomRef.current = state.viewTransform.zoom
    const dispatchRef = useRef(dispatch)
    dispatchRef.current = dispatch

    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const pointers = new Map<number, {x: number; y: number}>()
        let prevDist = 0
        let prevCentroid = {x: 0, y: 0}

        const getDist = (a: {x: number; y: number}, b: {x: number; y: number}) =>
            Math.hypot(b.x - a.x, b.y - a.y)
        const getMid = (a: {x: number; y: number}, b: {x: number; y: number}) =>
            ({x: (a.x + b.x) / 2, y: (a.y + b.y) / 2})

        const onPointerDown = (e: PointerEvent) => {
            el.setPointerCapture(e.pointerId)
            pointers.set(e.pointerId, {x: e.clientX, y: e.clientY})

            if (pointers.size === 2) {
                multiTouchActiveRef.current = true
                const [p1, p2] = [...pointers.values()]
                prevDist = getDist(p1, p2)
                prevCentroid = getMid(p1, p2)
                e.preventDefault()
            }
        }

        const onPointerMove = (e: PointerEvent) => {
            if (!pointers.has(e.pointerId)) return
            pointers.set(e.pointerId, {x: e.clientX, y: e.clientY})
            if (pointers.size < 2) return
            e.preventDefault()

            const [p1, p2] = [...pointers.values()]
            const newDist = getDist(p1, p2)
            const newCentroid = getMid(p1, p2)

            if (prevDist > 0) {
                const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current * (newDist / prevDist)))
                const rect = el.getBoundingClientRect()
                dispatchRef.current({
                    type: 'ZOOM_TO',
                    zoom: newZoom,
                    origin: {
                        x: newCentroid.x - rect.left - RULER_SIZE,
                        y: newCentroid.y - rect.top - RULER_SIZE,
                    },
                })
            }

            const dx = newCentroid.x - prevCentroid.x
            const dy = newCentroid.y - prevCentroid.y
            if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
                dispatchRef.current({type: 'PAN_BY', dx, dy})
            }

            prevDist = newDist
            prevCentroid = newCentroid
        }

        const onPointerUp = (e: PointerEvent) => {
            el.releasePointerCapture(e.pointerId)
            pointers.delete(e.pointerId)

            if (pointers.size < 2) {
                prevDist = 0
                // Defer clearing so React's synthetic handlers (useCanvasPointer) still see
                // multiTouchActive = true in the same synchronous flush and skip committing any drag
                queueMicrotask(() => {
                    if (pointers.size < 2) multiTouchActiveRef.current = false
                })
            }
        }

        el.addEventListener('pointerdown', onPointerDown, {passive: false})
        el.addEventListener('pointermove', onPointerMove, {passive: false})
        el.addEventListener('pointerup', onPointerUp)
        el.addEventListener('pointercancel', onPointerUp)

        return () => {
            el.removeEventListener('pointerdown', onPointerDown)
            el.removeEventListener('pointermove', onPointerMove)
            el.removeEventListener('pointerup', onPointerUp)
            el.removeEventListener('pointercancel', onPointerUp)
        }
    }, [containerRef, multiTouchActiveRef])
}
