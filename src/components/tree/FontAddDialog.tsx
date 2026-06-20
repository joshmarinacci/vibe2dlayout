import type {CustomFont} from '@model/document'
import type {RefObject} from 'react'
import {useEffect, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import styles from './FontsSection.module.css'

interface Props {
    open: boolean
    anchorRef: RefObject<HTMLElement | null>
    title: string
    onCancel: () => void
    onCreate: (font: CustomFont) => void
}

export function FontAddDialog({open, anchorRef, title, onCancel, onCreate}: Props) {
    const [fontInput, setFontInput] = useState('')
    const [validating, setValidating] = useState(false)
    const [validationError, setValidationError] = useState<string | null>(null)
    const [position, setPosition] = useState<{left: number; top: number} | null>(null)
    const dialogRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!open) return
        const rect = anchorRef.current?.getBoundingClientRect()
        if (!rect) {
            setPosition({left: 8, top: 8})
            return
        }
        const dialogWidth = 260
        const viewportPadding = 8
        const left = Math.min(
            Math.max(viewportPadding, rect.left),
            Math.max(viewportPadding, window.innerWidth - dialogWidth - viewportPadding),
        )
        setPosition({left, top: rect.bottom + 4})
    }, [open, anchorRef])

    useEffect(() => {
        if (!open) return
        setFontInput('')
        setValidationError(null)
        setValidating(false)
        setTimeout(() => inputRef.current?.focus(), 0)
    }, [open])

    useEffect(() => {
        if (!open) return
        const handlePointerDown = (e: PointerEvent) => {
            if (dialogRef.current?.contains(e.target as Node)) return
            onCancel()
        }
        window.addEventListener('pointerdown', handlePointerDown, {capture: true})
        return () => window.removeEventListener('pointerdown', handlePointerDown, {capture: true})
    }, [open, onCancel])

    const submit = async () => {
        const name = fontInput.trim()
        if (!name || validating) return
        setValidating(true)
        setValidationError(null)
        let valid = false
        try {
            const encoded = name.replace(/ /g, '+')
            const resp = await fetch(`https://fonts.googleapis.com/css2?family=${encoded}:wght@400&display=swap`)
            if (resp.ok) {
                const css = await resp.text()
                valid = css.includes('@font-face')
            }
        } catch {
            // network failure — treat as invalid
        }
        setValidating(false)
        if (!valid) {
            setValidationError(`"${name}" was not found in Google Fonts.`)
            return
        }
        onCreate({
            id: crypto.randomUUID(),
            name,
            metadataVersion: 0,
            isVariable: null,
            axes: [],
        })
        onCancel()
    }

    if (!open || !position) return null

    return createPortal(
        <div
            ref={dialogRef}
            className={styles.addMenu}
            style={{
                position: 'fixed',
                left: position.left,
                top: position.top,
                right: 'auto',
                zIndex: 5000,
            }}
        >
            <input
                ref={inputRef}
                className={styles.addInput}
                placeholder={`${title} name (e.g. Roboto)`}
                value={fontInput}
                onChange={e => {
                    setFontInput(e.target.value)
                    setValidationError(null)
                }}
                onKeyDown={e => {
                    if (e.key === 'Enter' && !validating) void submit()
                    if (e.key === 'Escape') onCancel()
                }}
            />
            {validationError && (
                <div className={styles.error}>{validationError}</div>
            )}
            <div className={styles.addActions}>
                <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
                <button className={styles.confirmBtn} onClick={() => void submit()} disabled={validating}>
                    {validating ? 'Checking…' : 'Add'}
                </button>
            </div>
        </div>,
        document.body,
    )
}
