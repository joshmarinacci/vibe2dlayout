import type {Variable} from '@model/variable'
import {useEffect, useRef, useState} from 'react'
import styles from './inputs.module.css'

interface Props {
    label: string
    value: boolean
    onChange: (v: boolean) => void
    // Variable binding (all optional — existing call sites unchanged)
    variableId?: string | null
    variables?: Variable[]
    onVariableChange?: (id: string | null) => void
    className?: string
}

export function ToggleInput({
                                label,
                                value,
                                onChange,
                                variableId,
                                variables,
                                onVariableChange,
                                className,
                            }: Props) {
    const [showDropdown, setShowDropdown] = useState(false)
    const wrapRef = useRef<HTMLDivElement>(null)

    const hasVars = variables && variables.length > 0
    const boundVariable = variableId ? variables?.find(v => v.id === variableId) : null

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

    if (boundVariable && onVariableChange) {
        return (
            <div className={styles.field}>
                <label className={styles.label}>{label}</label>
                <div className={styles.varBound}>
                    <span className={styles.varName}>@{boundVariable.name}</span>
                    <button className={styles.varClear} onClick={() => onVariableChange(null)}
                            title="Clear variable binding">×
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.field + (className?(' ' + className):'')}>
            <label className={styles.label}>{label}</label>
            <div style={{display: 'flex', alignItems: 'center', gap: 6, position: 'relative'}}
                 ref={wrapRef}>
                <input
                    type="checkbox"
                    checked={value}
                    onChange={e => onChange(e.target.checked)}
                    className={styles.checkbox}
                />
                {hasVars && onVariableChange && (
                    <button
                        className={styles.varAtBtn}
                        title="Bind to variable"
                        onClick={() => setShowDropdown(v => !v)}
                    >@</button>
                )}
                {showDropdown && variables && onVariableChange && (
                    <div className={styles.varDropdown}
                         style={{top: 'calc(100% + 4px)', left: 0, minWidth: 140}}>
                        {variables.length === 0 ? (
                            <div className={styles.varDropdownEmpty}>No boolean variables</div>
                        ) : (
                            variables.map(v => (
                                <div
                                    key={v.id}
                                    className={styles.varDropdownItem}
                                    onMouseDown={e => {
                                        e.preventDefault()
                                        onVariableChange(v.id)
                                        setShowDropdown(false)
                                    }}
                                >
                                    <span>@{v.name}</span>
                                    <span className={styles.varDropdownVal}>{String(v.value)}</span>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
