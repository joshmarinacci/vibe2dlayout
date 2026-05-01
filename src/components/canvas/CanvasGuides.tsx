import type {CanvasGuide} from '@model/guide'
import type {AppAction} from '@store/types'
import type {Dispatch} from 'react'
import {useCallback, useState} from 'react'

interface Props {
    guides: CanvasGuide[]
    previewGuide: CanvasGuide | null
    zoom: number
    pageId: string
    dispatch: Dispatch<AppAction>
}

const EXTENT = 50000
const GUIDE_COLOR = '#4d94ff'
const GUIDE_OPACITY = 0.8

interface DragState {
    guideId: string
    startPos: number
}

export function CanvasGuides({guides, previewGuide, zoom, pageId, dispatch}: Props) {
    const [dragging, setDragging] = useState<DragState | null>(null)
    const [livePos, setLivePos] = useState<number>(0)

    const sw = 1 / zoom
    const hitW = 8 / zoom  // hit area half-width in canvas pixels

    const onGuidePointerDown = useCallback((e: React.PointerEvent, guide: CanvasGuide) => {
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)
        setDragging({guideId: guide.id, startPos: guide.position})
        setLivePos(guide.position)
    }, [])

    const onGuidePointerMove = useCallback((e: React.PointerEvent, guide: CanvasGuide) => {
        if (!dragging || dragging.guideId !== guide.id) return
        e.stopPropagation()
        // The SVG is inside the canvas transform, so pointer coords are already in canvas space.
        // We read from the SVG's own coordinate system via getScreenCTM.
        const svg = (e.currentTarget.closest('svg') as SVGSVGElement | null)
        if (!svg) return
        const pt = svg.createSVGPoint()
        pt.x = e.clientX
        pt.y = e.clientY
        const ctm = svg.getScreenCTM()
        if (!ctm) return
        const canvasPt = pt.matrixTransform(ctm.inverse())
        const newPos = guide.orientation === 'v' ? canvasPt.x : canvasPt.y
        setLivePos(newPos)
    }, [dragging])

    const onGuidePointerUp = useCallback((e: React.PointerEvent, guide: CanvasGuide) => {
        if (!dragging || dragging.guideId !== guide.id) return
        e.stopPropagation()
        e.currentTarget.releasePointerCapture(e.pointerId)
        dispatch({type: 'MOVE_GUIDE', pageId, guideId: guide.id, position: livePos})
        setDragging(null)
    }, [dragging, livePos, pageId, dispatch])

    const onGuideDoubleClick = useCallback((e: React.MouseEvent, guide: CanvasGuide) => {
        e.stopPropagation()
        dispatch({type: 'DELETE_GUIDE', pageId, guideId: guide.id})
    }, [pageId, dispatch])

    const allGuides = previewGuide ? [...guides, previewGuide] : guides

    if (allGuides.length === 0) return null

    return (
        <svg
            style={{
                position: 'absolute',
                inset: 0,
                width: 0,
                height: 0,
                overflow: 'visible',
                zIndex: 10,
            }}
        >
            {allGuides.map(guide => {
                const isPreview = guide.id === '__preview__'
                const isDraggingThis = dragging?.guideId === guide.id
                const pos = isDraggingThis ? livePos : guide.position
                const isV = guide.orientation === 'v'
                const cursor = isV ? 'ew-resize' : 'ns-resize'

                return (
                    <g key={guide.id}>
                        {/* Visible line */}
                        {isV ? (
                            <line
                                x1={pos} y1={-EXTENT} x2={pos} y2={EXTENT}
                                stroke={GUIDE_COLOR}
                                strokeWidth={sw}
                                opacity={isPreview ? 0.5 : GUIDE_OPACITY}
                                pointerEvents="none"
                            />
                        ) : (
                            <line
                                x1={-EXTENT} y1={pos} x2={EXTENT} y2={pos}
                                stroke={GUIDE_COLOR}
                                strokeWidth={sw}
                                opacity={isPreview ? 0.5 : GUIDE_OPACITY}
                                pointerEvents="none"
                            />
                        )}
                        {/* Invisible hit area (only for non-preview guides) */}
                        {!isPreview && (isV ? (
                            <line
                                x1={pos} y1={-EXTENT} x2={pos} y2={EXTENT}
                                stroke="transparent"
                                strokeWidth={hitW}
                                style={{cursor}}
                                onPointerDown={e => onGuidePointerDown(e, guide)}
                                onPointerMove={e => onGuidePointerMove(e, guide)}
                                onPointerUp={e => onGuidePointerUp(e, guide)}
                                onDoubleClick={e => onGuideDoubleClick(e, guide)}
                            />
                        ) : (
                            <line
                                x1={-EXTENT} y1={pos} x2={EXTENT} y2={pos}
                                stroke="transparent"
                                strokeWidth={hitW}
                                style={{cursor}}
                                onPointerDown={e => onGuidePointerDown(e, guide)}
                                onPointerMove={e => onGuidePointerMove(e, guide)}
                                onPointerUp={e => onGuidePointerUp(e, guide)}
                                onDoubleClick={e => onGuideDoubleClick(e, guide)}
                            />
                        ))}
                    </g>
                )
            })}
        </svg>
    )
}
