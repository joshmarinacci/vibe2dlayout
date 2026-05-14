import type {Variable} from '@model/variable'
import {useEffect, useRef, useState} from 'react'
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

    // Keep localText in sync when value changes externally (not while focused)
    useEffect(() => {
        if (!isFocused) setLocalText(String(value))
    }, [value, isFocused])

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
