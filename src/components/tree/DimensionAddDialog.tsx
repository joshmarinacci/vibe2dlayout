import type {DimensionAsset} from '@model/dimensionAsset'
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
    onCreate: (asset: DimensionAsset) => void
}

export function DimensionAddDialog({open, anchorRef, title, onCancel, onCreate}: Props) {
    const [name, setName] = useState('')
    const [width, setWidth] = useState('800')
    const [height, setHeight] = useState('600')
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
        setWidth('800')
        setHeight('600')
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
        const parsedWidth = Number(width)
        const parsedHeight = Number(height)
        if (!Number.isFinite(parsedWidth) || !Number.isFinite(parsedHeight) || parsedWidth <= 0 || parsedHeight <= 0) return
        onCreate({
            id: generateId(),
            name: name.trim() || title,
            width: Math.round(parsedWidth),
            height: Math.round(parsedHeight),
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
                <label className={styles.addUrlLabel}>Width</label>
                <input
                    className={styles.addUrlInput}
                    value={width}
                    onChange={e => setWidth(e.target.value)}
                    placeholder="800"
                    onKeyDown={e => {
                        if (e.key === 'Enter') submit()
                    }}
                    autoFocus
                />
            </div>
            <div className={styles.addUrlField}>
                <label className={styles.addUrlLabel}>Height</label>
                <input
                    className={styles.addUrlInput}
                    value={height}
                    onChange={e => setHeight(e.target.value)}
                    placeholder="600"
                    onKeyDown={e => {
                        if (e.key === 'Enter') submit()
                    }}
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
