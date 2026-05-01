import type {Variable} from '@model/variable'
import {useAppState} from '@store/context'
import {useEffect, useRef, useState} from 'react'
import swatchStyles from './ColorInput.module.css'
import styles from './inputs.module.css'

export interface ColorRef {
    color: string
    paletteColorId?: string
}

interface Props {
    label: string
    value: ColorRef
    onChange: (v: ColorRef) => void
    // Variable binding (all optional — existing call sites unchanged)
    variableId?: string | null
    variables?: Variable[]
    onVariableChange?: (id: string | null) => void
}

export function ColorInput({
                               label,
                               value,
                               onChange,
                               variableId,
                               variables,
                               onVariableChange
                           }: Props) {
    const {state} = useAppState()
    const palettes = state.document.palettes ?? []

    const [activePaletteId, setActivePaletteId] = useState<string>(() => palettes[0]?.id ?? '')
    const [showDropdown, setShowDropdown] = useState(false)
    const [varQuery, setVarQuery] = useState('')
    const wrapRef = useRef<HTMLDivElement>(null)

    const activePalette = palettes.find(p => p.id === activePaletteId) ?? palettes[0]

    const hasVars = variables && variables.length > 0
    const boundVariable = variableId ? variables?.find(v => v.id === variableId) : null

    // Close dropdown on outside click
    useEffect(() => {
        if (!showDropdown) return
        const handler = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setShowDropdown(false)
                setVarQuery('')
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [showDropdown])

    const filteredVars = (variables ?? []).filter(v =>
        !varQuery || v.name.toLowerCase().includes(varQuery.toLowerCase())
    )

    // When bound, show @varName + color swatch + clear button
    if (boundVariable && onVariableChange) {
        return (
            <div className={styles.field}
                 style={{flexDirection: 'column', alignItems: 'stretch', gap: 4}}>
                <span className={styles.label}>{label}</span>
                <div className={styles.inputRow}>
                    <div className={styles.varBound} style={{flex: 1}}>
                        <div
                            className={styles.varColorSwatch}
                            style={{background: String(boundVariable.value)}}
                        />
                        <span className={styles.varName}>@{boundVariable.name}</span>
                        <button className={styles.varClear} onClick={() => onVariableChange(null)}
                                title="Clear variable binding">×
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.field}
             style={{flexDirection: 'column', alignItems: 'stretch', gap: 4}}>
            <span className={styles.label}>{label}</span>
            {palettes.length > 0 && (
                <>
                    {palettes.length > 1 && (
                        <div className={swatchStyles.paletteTabs}>
                            {palettes.map(p => (
                                <button
                                    key={p.id}
                                    className={`${swatchStyles.paletteTab} ${p.id === activePalette?.id ? swatchStyles.paletteTabActive : ''}`}
                                    onClick={() => setActivePaletteId(p.id)}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    )}
                    {activePalette && (
                        <div className={swatchStyles.swatchRow}>
                            {activePalette.colors.map(pc => (
                                <button
                                    key={pc.id}
                                    className={`${swatchStyles.paletteSwatch} ${value.paletteColorId === pc.id ? swatchStyles.paletteSwatchActive : ''}`}
                                    style={{background: pc.color}}
                                    title={pc.name}
                                    onClick={() => onChange({
                                        color: pc.color,
                                        paletteColorId: pc.id
                                    })}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
            <div className={styles.inputRow} ref={wrapRef} style={{position: 'relative'}}>
                <input
                    type="color"
                    className={styles.colorSwatch}
                    value={value.color === 'transparent' ? '#ffffff' : value.color}
                    onChange={e => onChange({color: e.target.value, paletteColorId: undefined})}
                />
                <input
                    type="text"
                    className={styles.textInput}
                    value={showDropdown ? `@${varQuery}` : value.color}
                    onChange={e => {
                        const text = e.target.value
                        if (text.startsWith('@') && hasVars) {
                            setShowDropdown(true)
                            setVarQuery(text.slice(1))
                        } else {
                            setShowDropdown(false)
                            setVarQuery('')
                            onChange({color: text, paletteColorId: undefined})
                        }
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Escape') {
                            setShowDropdown(false)
                            setVarQuery('')
                        }
                        if (e.key === 'Enter' && showDropdown && filteredVars.length > 0 && onVariableChange) {
                            onVariableChange(filteredVars[0].id)
                            setShowDropdown(false)
                            setVarQuery('')
                        }
                    }}
                    spellCheck={false}
                />
                {hasVars && onVariableChange && !showDropdown && (
                    <button
                        className={styles.varAtBtn}
                        title="Bind to variable"
                        onClick={() => {
                            setShowDropdown(true);
                            setVarQuery('')
                        }}
                    >@</button>
                )}
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
                                            setVarQuery('')
                                        }
                                    }}
                                >
                                    <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                                        <div className={styles.varColorSwatch}
                                             style={{background: String(v.value)}}/>
                                        <span>@{v.name}</span>
                                    </div>
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
