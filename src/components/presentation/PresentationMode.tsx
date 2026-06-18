import {ShapeRenderer} from '@components/canvas/ShapeRenderer'
import type {TreeNode} from '@model/document'
import type {PageShape} from '@model/shapes'
import {getActiveTheme} from '@model/theme'
import {useAppDispatch, useAppState} from '@store/context'
import {useEffect, useRef} from 'react'
import {createPortal} from 'react-dom'

export function PresentationMode() {
    const {state} = useAppState()
    const dispatch = useAppDispatch()
    const containerRef = useRef<HTMLDivElement>(null)

    const {presentationMode, presentationSlideIndex} = state
    const doc = state.document
    const {rootNodes, shapes} = doc

    const slides = rootNodes
        .map(node => ({node, shape: shapes[node.id]}))
        .filter((p): p is { node: TreeNode; shape: PageShape } =>
            p.shape?.type === 'page' && p.shape.fixedSize != null
        )

    const current = slides[presentationSlideIndex]
    const activeTheme = getActiveTheme(doc)

    useEffect(() => {
        if (!presentationMode) return

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault()
                e.stopImmediatePropagation()
                dispatch({type: 'NEXT_SLIDE', totalSlides: slides.length})
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault()
                e.stopImmediatePropagation()
                dispatch({type: 'PREV_SLIDE'})
            } else if (e.key === 'Escape') {
                e.stopImmediatePropagation()
                dispatch({type: 'SET_PRESENTATION_MODE', active: false})
            }
        }

        window.addEventListener('keydown', onKey, {capture: true})
        return () => window.removeEventListener('keydown', onKey, {capture: true})
    }, [presentationMode, slides.length, dispatch])

    useEffect(() => {
        if (presentationMode) {
            containerRef.current?.focus()
        }
    }, [presentationMode])

    if (!presentationMode || !current) return null

    const {width, height} = current.shape.fixedSize!
    const vw = window.innerWidth
    const vh = window.innerHeight
    const scale = Math.min(vw / width, vh / height)

    const overlay = (
        <div
            ref={containerRef}
            tabIndex={-1}
            onClick={() => dispatch({type: 'NEXT_SLIDE', totalSlides: slides.length})}
            style={{
                position: 'fixed',
                inset: 0,
                background: '#000',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none',
            }}
        >
            <div
                style={{
                    position: 'relative',
                    width,
                    height,
                    background: current.shape.background,
                    overflow: 'hidden',
                    transform: `scale(${scale})`,
                    transformOrigin: 'center',
                    flexShrink: 0,
                }}
                onClick={e => e.stopPropagation()}
            >
                <ShapeRenderer
                    nodes={current.node.children}
                    shapes={shapes}
                    selectedIds={[]}
                    editingTextId={null}
                    dispatch={() => {}}
                    handDrawn={activeTheme.handDrawn}
                    themeFontFamily={activeTheme.fontFamily}
                />
            </div>
        </div>
    )

    return createPortal(overlay, window.document.body)
}
