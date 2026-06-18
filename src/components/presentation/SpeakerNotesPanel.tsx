import {useAppDispatch, useAppState} from '@store/context'
import {useCallback, useEffect, useRef, useState} from 'react'
import {createPortal} from 'react-dom'

const SLIDES_POWERUP_ID = 'slides'
const NOTES_FEATURE_ID = 'speaker-notes'

function getNotesContent(shapes: Record<string, unknown>, pageId: string | null): string {
    if (!pageId) return ''
    const shape = shapes[pageId] as {powerUps?: Array<{id: string; features?: Record<string, {content?: string}>}>} | undefined
    if (!shape?.powerUps) return ''
    const entry = shape.powerUps.find(p => p.id === SLIDES_POWERUP_ID)
    return (entry?.features?.[NOTES_FEATURE_ID]?.content as string) ?? ''
}

export function SpeakerNotesPanel() {
    const {state} = useAppState()
    const dispatch = useAppDispatch()
    const {notesVisible, activePageId, document: doc} = state
    const {shapes} = doc

    const [pos, setPos] = useState({x: 240, y: 80})
    const dragRef = useRef<{startX: number; startY: number; startPosX: number; startPosY: number} | null>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const notesContent = getNotesContent(shapes as Record<string, unknown>, activePageId)
    const [localContent, setLocalContent] = useState(notesContent)

    useEffect(() => {
        setLocalContent(notesContent)
    }, [activePageId, notesContent])

    const onChange = useCallback((value: string) => {
        setLocalContent(value)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            if (!activePageId) return
            const shape = shapes[activePageId] as {powerUps?: Array<{id: string; features?: Record<string, unknown>}>} | undefined
            const entry = shape?.powerUps?.find(p => p.id === SLIDES_POWERUP_ID)
            const hasFeature = entry?.features?.[NOTES_FEATURE_ID] !== undefined
            if (!hasFeature) {
                dispatch({
                    type: 'ADD_SHAPE_POWER_UP_FEATURE',
                    shapeId: activePageId,
                    powerUpId: SLIDES_POWERUP_ID,
                    featureId: NOTES_FEATURE_ID,
                })
            }
            dispatch({
                type: 'UPDATE_SHAPE_POWER_UP_FEATURE_SETTINGS',
                shapeId: activePageId,
                powerUpId: SLIDES_POWERUP_ID,
                featureId: NOTES_FEATURE_ID,
                patch: {content: value},
            })
        }, 300)
    }, [activePageId, shapes, dispatch])

    const onHeaderPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault()
        dragRef.current = {startX: e.clientX, startY: e.clientY, startPosX: pos.x, startPosY: pos.y}
        e.currentTarget.setPointerCapture(e.pointerId)
    }, [pos])

    const onHeaderPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragRef.current) return
        const dx = e.clientX - dragRef.current.startX
        const dy = e.clientY - dragRef.current.startY
        setPos({x: dragRef.current.startPosX + dx, y: dragRef.current.startPosY + dy})
    }, [])

    const onHeaderPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        dragRef.current = null
        e.currentTarget.releasePointerCapture(e.pointerId)
    }, [])

    if (!notesVisible) return null

    const panel = (
        <div
            style={{
                position: 'fixed',
                left: pos.x,
                top: pos.y,
                width: 400,
                background: 'var(--color-surface, #1e1e2e)',
                border: '1px solid var(--color-border, #444)',
                borderRadius: 8,
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                zIndex: 8000,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            <div
                onPointerDown={onHeaderPointerDown}
                onPointerMove={onHeaderPointerMove}
                onPointerUp={onHeaderPointerUp}
                style={{
                    padding: '8px 12px',
                    background: 'var(--color-surface-raised, #2a2a3e)',
                    cursor: 'move',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none',
                    borderBottom: '1px solid var(--color-border, #444)',
                }}
            >
                <span style={{fontSize: 12, fontWeight: 600, color: 'var(--color-text, #ccc)'}}>
                    Speaker Notes
                </span>
                <button
                    onClick={() => dispatch({type: 'TOGGLE_NOTES_PANEL'})}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-text-muted, #888)',
                        fontSize: 16,
                        lineHeight: 1,
                        padding: '0 2px',
                    }}
                    title="Close"
                >
                    ×
                </button>
            </div>
            <textarea
                value={localContent}
                onChange={e => onChange(e.target.value)}
                placeholder={activePageId ? 'Add speaker notes for this slide...' : 'Select a page to add notes'}
                disabled={!activePageId}
                style={{
                    width: '100%',
                    height: 200,
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    background: 'transparent',
                    color: 'var(--color-text, #ccc)',
                    border: 'none',
                    resize: 'none',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    outline: 'none',
                }}
            />
        </div>
    )

    return createPortal(panel, window.document.body)
}
