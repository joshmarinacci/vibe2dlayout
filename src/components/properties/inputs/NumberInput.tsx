import {useEffect, useRef, useState} from 'react'

// Keep a ref map so the wheel handler always reads the latest values without
// stale closure issues (the native listener can't be cheaply re-registered).
interface WheelState {
    isFocused: boolean
    localText: string
    step: number
    min?: number
    max?: number
    onChange: (v: number) => void
}
import styles from './inputs.module.css'

interface Props {
    label?: string
    value: number
    onChange: (v: number) => void
    min?: number
    max?: number
    step?: number
    unit?: string
    className?: string
}

export function NumberInput({
                                label,
                                value,
                                onChange,
                                min,
                                max,
                                step = 1,
                                unit,
                                className,
                            }: Props) {
    const [localText, setLocalText] = useState(String(value))
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const wheelStateRef = useRef<WheelState>({isFocused, localText, step, min, max, onChange})

    // Keep localText in sync when value changes externally (not while focused)
    useEffect(() => {
        if (!isFocused) setLocalText(String(value))
    }, [value, isFocused])

    // Always keep the wheel state ref current so the native handler never goes stale
    wheelStateRef.current = {isFocused, localText, step, min, max, onChange}

    // Non-passive native wheel listener so preventDefault() actually stops panel scroll
    useEffect(() => {
        const el = inputRef.current
        if (!el) return
        const handler = (e: WheelEvent) => {
            const {localText, step, min, max, onChange} = wheelStateRef.current
            e.preventDefault()
            const current = parseFloat(localText)
            if (isNaN(current)) return
            const delta = e.deltaY < 0 ? -step : step
            const next = current + delta
            const clamped = min !== undefined ? Math.max(min, next) : next
            const final = max !== undefined ? Math.min(max, clamped) : clamped
            setLocalText(String(final))
            onChange(final)
        }
        el.addEventListener('wheel', handler, {passive: false})
        return () => el.removeEventListener('wheel', handler)
    }, []) // mount/unmount only — handler always reads latest state via ref

    const commitValue = (text: string) => {
        const v = parseFloat(text)
        if (!isNaN(v)) {
            const clamped = min !== undefined ? Math.max(min, v) : v
            const final = max !== undefined ? Math.min(max, clamped) : clamped
            onChange(final)
        }
    }

    return (
        <div className={'hbox ' + (className?className:'')}>
            {label && <label>{label}</label>}
            <input
                ref={inputRef}
                type="text"
                className={styles.numberInput}
                value={localText}
                style={{textAlign: 'right'}}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                    setIsFocused(false)
                    commitValue(localText)
                }}
                onChange={e => {
                    const text = e.target.value
                    setLocalText(text)
                }}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        commitValue(localText)
                        e.currentTarget.blur()
                    }
                    if (e.key === 'Escape') {
                        setLocalText(String(value))
                        e.currentTarget.blur()
                    }
                    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                        e.preventDefault()
                        const current = parseFloat(localText)
                        if (!isNaN(current)) {
                            const delta = e.key === 'ArrowUp' ? step : -step
                            const next = current + delta
                            const clamped = min !== undefined ? Math.max(min, next) : next
                            const final = max !== undefined ? Math.min(max, clamped) : clamped
                            setLocalText(String(final))
                            onChange(final)
                        }
                    }
                }}
                min={min}
                max={max}
                step={step}
            />
            {unit && <span className={styles.unit}>{unit}</span>}
        </div>
    )
}
