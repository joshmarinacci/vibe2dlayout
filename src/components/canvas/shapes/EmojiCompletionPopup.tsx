import type {EmojiCompletionState, EmojiMatch} from './useEmojiCompletion'
import {useEffect, useLayoutEffect, useRef, useState} from 'react'
import {createPortal} from 'react-dom'

interface Props {
    state: EmojiCompletionState
    onSelect: (match: EmojiMatch) => void
    onClose: () => void
    setPopupRef: (el: HTMLDivElement | null) => void
    setSelectedIndex: (i: number) => void
}

export function EmojiCompletionPopup(props: Props) {
    if (!props.state.visible || !props.state.anchorRect) return null
    return createPortal(<PopupContent {...props}/>, document.body)
}

function PopupContent({state, onSelect, setPopupRef, setSelectedIndex}: Props) {
    const divRef = useRef<HTMLDivElement>(null)
    const [pos, setPos] = useState<{left: number; top: number} | null>(null)

    // Register the popup element with the hook for outside-click detection
    useEffect(() => {
        setPopupRef(divRef.current)
        return () => setPopupRef(null)
    }, [])

    // Position the popup below the textarea, clamping to viewport edges
    useLayoutEffect(() => {
        const popup = divRef.current
        if (!popup || !state.anchorRect) return
        const {left, bottom, top} = state.anchorRect
        const pw = popup.offsetWidth || 240
        const ph = popup.offsetHeight || 200
        const vw = window.innerWidth
        const vh = window.innerHeight

        let l = left
        let t = bottom + 4
        if (l + pw > vw - 8) l = vw - pw - 8
        if (l < 8) l = 8
        if (t + ph > vh - 8) t = top - ph - 4
        if (t < 8) t = 8
        setPos({left: l, top: t})
    }, [state.anchorRect, state.results])

    const displayed = state.results.slice(0, 8)

    return (
        <div
            ref={divRef}
            onMouseDown={e => e.preventDefault()}
            style={{
                position: 'fixed',
                left: pos?.left ?? state.anchorRect!.left,
                top: pos?.top ?? (state.anchorRect!.bottom + 4),
                zIndex: 9999,
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                boxShadow: '0 4px 12px var(--color-shadow)',
                minWidth: 220,
                maxHeight: 248,
                overflowY: 'auto',
                fontSize: 12,
                userSelect: 'none',
            }}
        >
            {displayed.map((m, i) => (
                <div
                    key={m.name}
                    onMouseEnter={() => setSelectedIndex(i)}
                    onMouseDown={() => onSelect(m)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '5px 10px',
                        cursor: 'pointer',
                        background: i === state.selectedIndex ? 'var(--color-accent-bg)' : undefined,
                        color: i === state.selectedIndex ? 'var(--color-accent)' : 'var(--color-text-primary)',
                    }}
                >
                    <span style={{fontSize: 18, lineHeight: 1, flexShrink: 0}}>{m.char}</span>
                    <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{m.name}</span>
                </div>
            ))}
        </div>
    )
}
