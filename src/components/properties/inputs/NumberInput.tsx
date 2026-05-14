import type {Variable} from '@model/variable'
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
    // Variable binding (all optional — existing call sites unchanged)
    variableId?: string | null
    variables?: Variable[]
    onVariableChange?: (id: string | null) => void
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
                                variableId,
                                variables,
                                onVariableChange,
                                className,
                            }: Props) {
    const [localText, setLocalText] = useState(String(value))
    const [isFocused, setIsFocused] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const wrapRef = useRef<HTMLDivElement>(null)
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
            const {isFocused, localText, step, min, max, onChange} = wheelStateRef.current
            if (!isFocused || localText.startsWith('@')) return
            e.preventDefault()
            const current = parseFloat(localText)
            if (isNaN(current)) return
            const delta = e.deltaY < 0 ? step : -step
            const next = current + delta
            const clamped = min !== undefined ? Math.max(min, next) : next
            const final = max !== undefined ? Math.min(max, clamped) : clamped
            setLocalText(String(final))
            onChange(final)
        }
        el.addEventListener('wheel', handler, {passive: false})
        return () => el.removeEventListener('wheel', handler)
    }, []) // mount/unmount only — handler always reads latest state via ref

    // Close dropdown on outside click
    useEffect(() => {
        if (!showDropdown) return
        const handler = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [showDropdown])

    const hasVars = variables && variables.length > 0
    const boundVariable = variableId ? variables?.find(v => v.id === variableId) : null

    const query = showDropdown && localText.startsWith('@') ? localText.slice(1).toLowerCase() : ''
    const filteredVars = showDropdown
        ? (variables ?? []).filter(v => !query || v.name.toLowerCase().includes(query))
        : []

    const commitValue = (text: string) => {
        const v = parseFloat(text)
        if (!isNaN(v)) {
            const clamped = min !== undefined ? Math.max(min, v) : v
            const final = max !== undefined ? Math.min(max, clamped) : clamped
            onChange(final)
        }
    }

    // When bound, show @varName display
    if (boundVariable && onVariableChange) {
        return (
            <>
                <label>{label}</label>
                <span className={styles.varName}>@{boundVariable.name}</span>
                <button className={styles.varClear} onClick={() => onVariableChange(null)}
                        title="Clear variable binding">×
                </button>
            </>
        )
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
                    if (!showDropdown) commitValue(localText)
                }}
                onChange={e => {
                    const text = e.target.value
                    setLocalText(text)
                    if (text.startsWith('@') && hasVars) {
                        setShowDropdown(true)
                    } else {
                        setShowDropdown(false)
                    }
                }}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        if (showDropdown && filteredVars.length > 0 && onVariableChange) {
                            onVariableChange(filteredVars[0].id)
                            setShowDropdown(false)
                            setLocalText(String(value))
                        } else {
                            commitValue(localText)
                            setShowDropdown(false)
                        }
                        e.currentTarget.blur()
                    }
                    if (e.key === 'Escape') {
                        setShowDropdown(false)
                        setLocalText(String(value))
                        e.currentTarget.blur()
                    }
                    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !localText.startsWith('@')) {
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
