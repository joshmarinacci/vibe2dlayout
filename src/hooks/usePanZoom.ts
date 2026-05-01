import {RULER_SIZE} from '@components/canvas/CanvasRuler'
import {useAppDispatch, useAppState} from '@store/context'
import {useCallback} from 'react'

const MIN_ZOOM = 0.05
const MAX_ZOOM = 20

export function usePanZoom() {
    const {state} = useAppState()
    const dispatch = useAppDispatch()

    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault()

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        // Subtract ruler offset so zoom origin is in canvas div space
        const originX = e.clientX - rect.left - RULER_SIZE
        const originY = e.clientY - rect.top - RULER_SIZE

        if (e.ctrlKey || e.metaKey) {
            // Zoom — pinch gesture (deltaMode 0, continuous pixel values) vs mouse wheel (deltaMode 1, discrete steps)
            const {pinchZoomSpeed, wheelZoomStep} = state.settings
            const delta = e.deltaMode === 0
                ? 1 - e.deltaY * pinchZoomSpeed
                : e.deltaY < 0 ? 1 + wheelZoomStep : 1 - wheelZoomStep
            const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, state.viewTransform.zoom * delta))
            dispatch({type: 'ZOOM_TO', zoom: newZoom, origin: {x: originX, y: originY}})
        } else {
            // Pan
            dispatch({type: 'PAN_BY', dx: -e.deltaX, dy: -e.deltaY})
        }
    }, [state.viewTransform.zoom, state.settings, dispatch])

    return {handleWheel}
}
