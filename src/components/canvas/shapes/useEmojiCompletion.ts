import type {EmojiMatch} from '@utils/emojiData'
import {searchEmojis} from '@utils/emojiData'
import type React from 'react'
import {useEffect, useRef, useState} from 'react'

export type {EmojiMatch}

export interface EmojiCompletionState {
    visible: boolean
    query: string
    results: EmojiMatch[]
    selectedIndex: number
    anchorRect: DOMRect | null
}

const CLOSED: EmojiCompletionState = {
    visible: false,
    query: '',
    results: [],
    selectedIndex: 0,
    anchorRect: null,
}

export interface UseEmojiCompletionReturn {
    emojiState: EmojiCompletionState
    onEmojiChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
    onEmojiKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => boolean
    onSelectEmoji: (match: EmojiMatch) => void
    setSelectedIndex: (i: number) => void
    closeEmoji: () => void
    setPopupRef: (el: HTMLDivElement | null) => void
}

/** Directly mutates the textarea value and moves the cursor, then fires a synthetic
 *  'input' event so React's onChange / editValueRef stay in sync.
 *  Only use for UNCONTROLLED textareas (defaultValue). For controlled textareas,
 *  pass onValueChange to useEmojiCompletion instead. */
export function insertEmoji(
    textarea: HTMLTextAreaElement,
    char: string,
    colonStart: number,
    queryEnd: number,
): void {
    const before = textarea.value.slice(0, colonStart)
    const after = textarea.value.slice(queryEnd)
    textarea.value = before + char + after
    const pos = colonStart + char.length
    textarea.setSelectionRange(pos, pos)
    textarea.dispatchEvent(new Event('input', {bubbles: true}))
}

/**
 * @param textareaRef - ref to the textarea element
 * @param onValueChange - optional callback for controlled textareas: called with
 *   (newValue, newCursorPos) instead of DOM mutation + synthetic event.
 *   Use this when the textarea has a `value` prop managed by React state.
 */
export function useEmojiCompletion(
    textareaRef: React.RefObject<HTMLTextAreaElement | null>,
    onValueChange?: (newValue: string, newCursorPos: number) => void,
): UseEmojiCompletionReturn {
    const [state, setState] = useState<EmojiCompletionState>(CLOSED)
    const popupRef = useRef<HTMLDivElement | null>(null)

    // Keep callback ref fresh to avoid stale closures
    const onValueChangeRef = useRef(onValueChange)
    onValueChangeRef.current = onValueChange

    const setPopupRef = (el: HTMLDivElement | null) => {
        popupRef.current = el
    }

    const closeEmoji = () => setState(CLOSED)

    // Choose insertion strategy based on whether a callback is provided
    const doInsert = (textarea: HTMLTextAreaElement, char: string, colonStart: number, queryEnd: number) => {
        if (onValueChangeRef.current) {
            const before = textarea.value.slice(0, colonStart)
            const after = textarea.value.slice(queryEnd)
            onValueChangeRef.current(before + char + after, colonStart + char.length)
        } else {
            insertEmoji(textarea, char, colonStart, queryEnd)
        }
    }

    // Close on outside click while popup is open
    useEffect(() => {
        if (!state.visible) return
        const handler = (e: MouseEvent) => {
            const target = e.target as Node
            if (popupRef.current?.contains(target)) return
            if (textareaRef.current?.contains(target)) return
            closeEmoji()
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [state.visible])

    const onEmojiChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const textarea = e.currentTarget
        const pos = textarea.selectionStart
        const textBeforeCursor = textarea.value.slice(0, pos)

        // Find the most recent ':' with no whitespace between it and the cursor
        const colonIdx = textBeforeCursor.lastIndexOf(':')
        if (colonIdx === -1) {
            setState(CLOSED)
            return
        }

        const between = textBeforeCursor.slice(colonIdx + 1)
        if (/[\s\n]/.test(between)) {
            setState(CLOSED)
            return
        }

        // Auto-replace when the user types the closing ':' (e.g. ':fire:')
        if (between.length > 1 && between.endsWith(':')) {
            const candidateName = between.slice(0, -1)
            const exact = searchEmojis(candidateName).find(m => m.name === candidateName)
            if (exact) {
                doInsert(textarea, exact.char, colonIdx, pos)
                setState(CLOSED)
                return
            }
        }

        if (between.length === 0) {
            setState(CLOSED)
            return
        }

        const results = searchEmojis(between)
        if (results.length === 0) {
            setState(CLOSED)
            return
        }

        setState({
            visible: true,
            query: between,
            results,
            selectedIndex: 0,
            anchorRect: textarea.getBoundingClientRect(),
        })
    }

    const onEmojiKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): boolean => {
        if (!state.visible) return false

        const visibleCount = Math.min(state.results.length, 8)

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setState(s => ({...s, selectedIndex: Math.min(s.selectedIndex + 1, visibleCount - 1)}))
                return true
            case 'ArrowUp':
                e.preventDefault()
                setState(s => ({...s, selectedIndex: Math.max(s.selectedIndex - 1, 0)}))
                return true
            case 'Enter':
            case 'Tab': {
                e.preventDefault()
                const match = state.results[state.selectedIndex]
                const textarea = textareaRef.current
                if (match && textarea) {
                    const pos = textarea.selectionStart
                    const colonIdx = textarea.value.slice(0, pos).lastIndexOf(':')
                    if (colonIdx !== -1) doInsert(textarea, match.char, colonIdx, pos)
                }
                setState(CLOSED)
                return true
            }
            case 'Escape':
                // Close popup but do NOT propagate — prevents useTextEdit from cancelling the edit
                e.stopPropagation()
                setState(CLOSED)
                return true
            default:
                return false
        }
    }

    const onSelectEmoji = (match: EmojiMatch) => {
        const textarea = textareaRef.current
        if (!textarea) return
        const pos = textarea.selectionStart
        const colonIdx = textarea.value.slice(0, pos).lastIndexOf(':')
        if (colonIdx !== -1) doInsert(textarea, match.char, colonIdx, pos)
        setState(CLOSED)
    }

    const setSelectedIndex = (i: number) => setState(s => ({...s, selectedIndex: i}))

    return {emojiState: state, onEmojiChange, onEmojiKeyDown, onSelectEmoji, setSelectedIndex, closeEmoji, setPopupRef}
}
