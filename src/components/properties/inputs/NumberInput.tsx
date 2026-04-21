import { useState, useEffect, useRef } from 'react'
import type { Variable } from '@model/variable'
import styles from './inputs.module.css'

interface Props {
  label: string
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
}

export function NumberInput({ label, value, onChange, min, max, step = 1, unit, variableId, variables, onVariableChange }: Props) {
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
      <div className={styles.field}>
        <label className={styles.label}>{label}</label>
        <div className={styles.varBound}>
          <span className={styles.varName}>@{boundVariable.name}</span>
          <button className={styles.varClear} onClick={() => onVariableChange(null)} title="Clear variable binding">×</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <div className={styles.inputRow}>
        <div className={styles.varDropdownWrap} ref={wrapRef}>
          <input
            type="text"
            className={styles.numberInput}
            value={localText}
            style={{ textAlign: 'right' }}
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
            }}
            min={min}
            max={max}
            step={step}
          />
          {showDropdown && (
            <div className={styles.varDropdown}>
              {filteredVars.length === 0 ? (
                <div className={styles.varDropdownEmpty}>No matching variables</div>
              ) : (
                filteredVars.map(v => (
                  <div
                    key={v.id}
                    className={styles.varDropdownItem}
                    onMouseDown={e => {
                      e.preventDefault()
                      if (onVariableChange) {
                        onVariableChange(v.id)
                        setShowDropdown(false)
                        setLocalText(String(value))
                      }
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
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
    </div>
  )
}
