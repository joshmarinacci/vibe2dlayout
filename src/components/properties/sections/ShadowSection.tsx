import type {BoxShadow, Shape} from '@model/shapes'
import type {AppAction} from '@store/types'
import type {Dispatch} from 'react'
import {CollapsibleSection} from '../CollapsibleSection'
import {ColorInput} from '../inputs/ColorInput'
import inputStyles from '../inputs/inputs.module.css'
import {NumberInput} from '../inputs/NumberInput'

interface Props {
    shape: Shape
    dispatch: Dispatch<AppAction>
}

const DEFAULT_SHADOW: BoxShadow = {
    offsetX: 4,
    offsetY: 4,
    blur: 8,
    spread: 0,
    color: 'rgba(0,0,0,0.25)',
    inset: false,
}

export function ShadowSection({shape, dispatch}: Props) {
    const shadows = ((shape as unknown as { boxShadow?: BoxShadow[] }).boxShadow) ?? []

    const patchShadows = (arr: BoxShadow[]) =>
        dispatch({type: 'PATCH_SHAPE', id: shape.id, patch: {boxShadow: arr} as Partial<Shape>})

    const updateShadow = (idx: number, patch: Partial<BoxShadow>) =>
        patchShadows(shadows.map((s, i) => i === idx ? {...s, ...patch} : s))

    const removeShadow = (idx: number) =>
        patchShadows(shadows.filter((_, i) => i !== idx))

    return (
        <CollapsibleSection title="Shadow">
            <div className={inputStyles.field}>
                <span className={inputStyles.label}/>
                <button
                    onClick={() => patchShadows([...shadows, {...DEFAULT_SHADOW}])}
                    style={{
                        fontSize: 11,
                        border: '1px dashed var(--color-border)',
                        borderRadius: 3,
                        background: 'transparent',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        padding: '2px 8px',
                        width: '100%',
                    }}
                >+ Add Shadow
                </button>
            </div>

            {shadows.map((shadow, idx) => (
                <div key={idx} style={{
                    background: 'var(--color-bg-panel)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 4,
                    padding: '6px 6px 4px',
                    display: 'flex', flexDirection: 'column', gap: 3,
                    marginTop: 4,
                }}>
                    {/* Header row: label + remove */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 2
                    }}>
            <span style={{fontSize: 11, color: 'var(--color-text-disabled)', fontWeight: 500}}>
              Shadow {idx + 1}
            </span>
                        <button
                            onClick={() => removeShadow(idx)}
                            style={{
                                width: 16,
                                height: 16,
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--color-text-disabled)',
                                cursor: 'pointer',
                                fontSize: 14,
                                lineHeight: 1,
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            title="Remove shadow"
                        >×
                        </button>
                    </div>

                    <ColorInput
                        label="Color"
                        value={{color: shadow.color}}
                        onChange={ref => updateShadow(idx, {color: ref.color})}
                    />

                    {/* X and Y on one row */}
                    <div className={inputStyles.inputRow}>
                        <NumberInput label="X" value={shadow.offsetX} min={-100} max={100} step={1}
                                     unit="px"
                                     onChange={v => updateShadow(idx, {offsetX: v})}/>
                        <NumberInput label="Y" value={shadow.offsetY} min={-100} max={100} step={1}
                                     unit="px"
                                     onChange={v => updateShadow(idx, {offsetY: v})}/>
                    </div>

                    {/* Blur and Spread on one row */}
                    <div className={inputStyles.inputRow}>
                        <NumberInput label="Blur" value={shadow.blur} min={0} max={100} step={1}
                                     unit="px"
                                     onChange={v => updateShadow(idx, {blur: v})}/>
                        <NumberInput label="Spread" value={shadow.spread} min={-100} max={100}
                                     step={1} unit="px"
                                     onChange={v => updateShadow(idx, {spread: v})}/>
                    </div>

                    <div className={inputStyles.field}>
                        <span className={inputStyles.label}>Inset</span>
                        <input
                            type="checkbox"
                            className={inputStyles.checkbox}
                            checked={!!shadow.inset}
                            onChange={e => updateShadow(idx, {inset: e.target.checked})}
                        />
                    </div>
                </div>
            ))}
        </CollapsibleSection>
    )
}
