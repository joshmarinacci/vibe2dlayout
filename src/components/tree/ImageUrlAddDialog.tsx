import type {ImageAsset} from '@model/imageAsset'
import {generateId} from '@utils/idgen'
import type {RefObject} from 'react'
import {useEffect, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import styles from './AssetsSection.module.css'

interface Props {
    open: boolean
    anchorRef: RefObject<HTMLElement | null>
    title: string
    onCancel: () => void
    onCreate: (asset: ImageAsset) => void
}

function guessMimeType(url: string, fallback: ImageAsset['mimeType']): ImageAsset['mimeType'] {
    const ext = url.split('.').pop()?.toLowerCase() ?? ''
    const map: Record<string, ImageAsset['mimeType']> = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
    }
    return map[ext] ?? fallback
}

export function ImageUrlAddDialog({open, anchorRef, title, onCancel, onCreate}: Props) {
    const [name, setName] = useState('')
    const [url, setUrl] = useState('')
    const [position, setPosition] = useState<{left: number; top: number} | null>(null)
    const dialogRef = useRef<HTMLDivElement>(null)

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
        setName('')
        setUrl('')
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

    const submit = () => {
        const trimmedUrl = url.trim()
        if (!trimmedUrl) return
        onCreate({
            id: generateId(),
            name: name.trim() || title,
            src: trimmedUrl,
            mimeType: guessMimeType(trimmedUrl, 'image/png'),
        })
        onCancel()
    }

    if (!open || !position) return null

    return createPortal(
        <div
            ref={dialogRef}
            className={styles.addUrlMenu}
            style={{
                position: 'fixed',
                left: position.left,
                top: position.top,
                right: 'auto',
                zIndex: 5000,
            }}
        >
            <div className={styles.addUrlField}>
                <label className={styles.addUrlLabel}>Name</label>
                <input
                    className={styles.addUrlInput}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={`${title} name`}
                />
            </div>
            <div className={styles.addUrlField}>
                <label className={styles.addUrlLabel}>URL</label>
                <input
                    className={styles.addUrlInput}
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://..."
                    onKeyDown={e => {
                        if (e.key === 'Enter') submit()
                    }}
                    autoFocus
                />
            </div>
            <div className={styles.addUrlActions}>
                <button className={styles.addUrlCancel} onClick={onCancel}>Cancel</button>
                <button className={styles.addUrlConfirm} onClick={submit}>Add</button>
            </div>
        </div>,
        document.body,
    )
}
