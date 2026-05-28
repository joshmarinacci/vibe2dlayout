import type {BoundingBox} from '@model/transform'
import {useEffect, useRef, useState} from 'react'
import {CollapsibleSection} from '../CollapsibleSection'
import styles from '../PropertiesPanel.module.css'

interface Props {
    transform: BoundingBox
    onChange: (t: BoundingBox) => void
}

interface WheelState {
    localText: string
    min?: number
    onChange: (v: number) => void
}

export function TField({
                    label, value, onChange, min,
                }: {
    label: string
    value: number | null
    onChange: (v: number) => void
    min?: number
}) {
    const [localText, setLocalText] = useState(value !== null ? String(Math.round(value)) : '')
    const [isFocused, setIsFocused] = useState(false)
    const wrapRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const wheelStateRef = useRef<WheelState>({localText, min, onChange})

    useEffect(() => {
        if (!isFocused) setLocalText(value !== null ? String(Math.round(value)) : '')
    }, [value, isFocused])

    wheelStateRef.current = {localText, min, onChange}

    useEffect(() => {
        const el = inputRef.current
        if (!el) return
        const handler = (e: WheelEvent) => {
            e.preventDefault()
            const {localText, min, onChange} = wheelStateRef.current
            const current = parseFloat(localText)
            if (isNaN(current)) return
            const rawDelta = e.deltaY !== 0 ? e.deltaY : e.deltaX
            const delta = rawDelta < 0 ? -(e.shiftKey ? 10 : 1) : (e.shiftKey ? 10 : 1)
            const next = current + delta
            const clamped = min !== undefined ? Math.max(min, next) : next
            setLocalText(String(clamped))
            onChange(clamped)
        }
        el.addEventListener('wheel', handler, {passive: false})
        return () => el.removeEventListener('wheel', handler)
    }, [])

    const commit = (text: string) => {
        const v = parseFloat(text)
        if (!isNaN(v)) onChange(min !== undefined ? Math.max(min, v) : v)
    }

    return (
        <div className={styles.tfield} ref={wrapRef} style={{position: 'relative'}}>
            <span className={styles.tlabel}>{label}</span>
            <input
                ref={inputRef}
                type="text"
                className={styles.tinput}
                value={localText}
                onFocus={() => {
                    setIsFocused(true)
                }}
                onBlur={() => {
                    setIsFocused(false)
                    if (!localText.startsWith('@')) commit(localText)
                    else setLocalText(value !== null ? String(Math.round(value)) : '')
                }}
                onChange={e => {
                    const text = e.target.value
                    setLocalText(text)
                }}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        commit(localText)
                        ;
                        (e.target as HTMLInputElement).blur()
                    } else if (e.key === 'Escape') {
                        setLocalText(value !== null ? String(Math.round(value)) : '')
                        ;(e.target as HTMLInputElement).blur()
                    } else if (e.key === 'ArrowUp' && !localText.startsWith('@')) {
                        e.preventDefault()
                        const v = parseFloat(localText)
                        if (!isNaN(v)) {
                            const next = v + (e.shiftKey ? 10 : 1);
                            setLocalText(String(next));
                            onChange(min !== undefined ? Math.max(min, next) : next)
                        }
                    } else if (e.key === 'ArrowDown' && !localText.startsWith('@')) {
                        e.preventDefault()
                        const v = parseFloat(localText)
                        if (!isNaN(v)) {
                            const next = v - (e.shiftKey ? 10 : 1);
                            setLocalText(String(next));
                            onChange(min !== undefined ? Math.max(min, next) : next)
                        }
                    }
                }}
            />
            <span className={styles.tlabel}>px</span>
        </div>
    )
}

export function TransformSection({transform, onChange}: Props) {
    const set = (key: keyof BoundingBox) => (v: number) =>
        onChange({...transform, [key]: v})

    return (
        <CollapsibleSection title="Transform">
            <div className={styles.transformGrid}>
                <TField label="X" value={Math.round(transform.x)} onChange={set('x')}/>
                <TField label="Y" value={Math.round(transform.y)} onChange={set('y')}/>
                <TField label="W" value={Math.round(transform.width)} onChange={set('width')} min={1}/>
                <TField label="H" value={Math.round(transform.height)} onChange={set('height')} min={1} />
                <TField label="SX" value={Math.round((transform.scaleX ?? 1) * 100)}
                        onChange={v => onChange({...transform, scaleX: v / 100})} min={-500}/>
                <TField label="SY" value={Math.round((transform.scaleY ?? 1) * 100)}
                        onChange={v => onChange({...transform, scaleY: v / 100})} min={-500}/>
                <TField label="KX" value={transform.skewX ?? 0} onChange={set('skewX')}/>
                <TField label="KY" value={transform.skewY ?? 0} onChange={set('skewY')}/>
                <TField label="°" value={transform.rotation} onChange={set('rotation')}/>
            </div>
            <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: 4}}>
                <button
                    title="Reset rotation, scale, and skew"
                    style={{fontSize: 11, padding: '2px 6px', cursor: 'pointer'}}
                    onClick={() => onChange({
                        ...transform,
                        rotation: 0,
                        scaleX: 1,
                        scaleY: 1,
                        skewX: 0,
                        skewY: 0
                    })}
                >
                    Reset transform
                </button>
            </div>
        </CollapsibleSection>
    )
}
