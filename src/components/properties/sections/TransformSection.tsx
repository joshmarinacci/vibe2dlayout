import type {BoundingBox} from '@model/transform'
import type {Variable} from '@model/variable'
import {useEffect, useRef, useState} from 'react'
import {CollapsibleSection} from '../CollapsibleSection'
import inputStyles from '../inputs/inputs.module.css'
import styles from '../PropertiesPanel.module.css'

interface VarProps {
    variableId?: string | null
    variables?: Variable[]
    onVariableChange?: (id: string | null) => void
}

interface Props {
    transform: BoundingBox
    onChange: (t: BoundingBox) => void
    xVar?: VarProps
    yVar?: VarProps
    wVar?: VarProps
    hVar?: VarProps
}

function TField({
                    label, value, onChange, min,
                    variableId, variables, onVariableChange,
                }: {
    label: string
    value: number
    onChange: (v: number) => void
    min?: number
    variableId?: string | null
    variables?: Variable[]
    onVariableChange?: (id: string | null) => void
}) {
    const [localText, setLocalText] = useState(String(Math.round(value)))
    const [isFocused, setIsFocused] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const wrapRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isFocused) setLocalText(String(Math.round(value)))
    }, [value, isFocused])

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

    const boundVariable = variableId ? variables?.find(v => v.id === variableId) : null

    const commit = (text: string) => {
        const v = parseFloat(text)
        if (!isNaN(v)) onChange(min !== undefined ? Math.max(min, v) : v)
    }

    if (boundVariable && onVariableChange) {
        return (
            <div className={styles.tfield}>
                <span className={styles.tlabel}>{label}</span>
                <div className={inputStyles.varBound} style={{flex: 1}}>
                    <span className={inputStyles.varName}>@{boundVariable.name}</span>
                    <button className={inputStyles.varClear} onClick={() => onVariableChange(null)}
                            title="Clear variable binding">×
                    </button>
                </div>
            </div>
        )
    }

    const query = localText.startsWith('@') ? localText.slice(1).toLowerCase() : ''
    const filteredVars = variables?.filter(v => v.name.toLowerCase().includes(query)) ?? []

    return (
        <div className={styles.tfield} ref={wrapRef} style={{position: 'relative'}}>
            <span className={styles.tlabel}>{label}</span>
            <input
                type="text"
                className={styles.tinput}
                value={localText}
                onFocus={() => {
                    setIsFocused(true)
                }}
                onBlur={() => {
                    setIsFocused(false)
                    setShowDropdown(false)
                    if (!localText.startsWith('@')) commit(localText)
                    else setLocalText(String(Math.round(value)))
                }}
                onChange={e => {
                    const text = e.target.value
                    setLocalText(text)
                    if (text.startsWith('@') && variables && variables.length > 0) {
                        setShowDropdown(true)
                    } else {
                        setShowDropdown(false)
                    }
                }}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        if (!localText.startsWith('@')) commit(localText)
                        ;
                        (e.target as HTMLInputElement).blur()
                    } else if (e.key === 'Escape') {
                        setLocalText(String(Math.round(value)))
                        setShowDropdown(false)
                        ;(e.target as HTMLInputElement).blur()
                    } else if (e.key === 'ArrowUp' && !localText.startsWith('@')) {
                        e.preventDefault()
                        const v = parseFloat(localText)
                        if (!isNaN(v)) {
                            const next = v + 1;
                            setLocalText(String(next));
                            onChange(min !== undefined ? Math.max(min, next) : next)
                        }
                    } else if (e.key === 'ArrowDown' && !localText.startsWith('@')) {
                        e.preventDefault()
                        const v = parseFloat(localText)
                        if (!isNaN(v)) {
                            const next = v - 1;
                            setLocalText(String(next));
                            onChange(min !== undefined ? Math.max(min, next) : next)
                        }
                    }
                }}
            />
            {showDropdown && onVariableChange && (
                <div className={inputStyles.varDropdown}
                     style={{top: 'calc(100% + 2px)', left: 0, right: 0, minWidth: 120}}>
                    {filteredVars.length === 0 ? (
                        <div className={inputStyles.varDropdownEmpty}>No matches</div>
                    ) : (
                        filteredVars.map(v => (
                            <div
                                key={v.id}
                                className={inputStyles.varDropdownItem}
                                onMouseDown={e => {
                                    e.preventDefault()
                                    onVariableChange(v.id)
                                    setShowDropdown(false)
                                    setLocalText(String(Math.round(value)))
                                }}
                            >
                                <span>@{v.name}</span>
                                <span
                                    className={inputStyles.varDropdownVal}>{String(v.value)}</span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

export function TransformSection({transform, onChange, xVar, yVar, wVar, hVar}: Props) {
    const set = (key: keyof BoundingBox) => (v: number) =>
        onChange({...transform, [key]: v})

    return (
        <CollapsibleSection title="Transform">
            <div className={styles.transformGrid}>
                <TField label="X" value={Math.round(transform.x)} onChange={set('x')} {...xVar} />
                <TField label="Y" value={Math.round(transform.y)} onChange={set('y')} {...yVar} />
                <TField label="W" value={Math.round(transform.width)} onChange={set('width')}
                        min={1} {...wVar} />
                <TField label="H" value={Math.round(transform.height)} onChange={set('height')}
                        min={1} {...hVar} />
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
