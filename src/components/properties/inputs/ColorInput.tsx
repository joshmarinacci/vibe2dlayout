import type {Variable} from '@model/variable'
import {useAppState} from '@store/context'
import {useRef, useState} from 'react'
import swatchStyles from './ColorInput.module.css'
import styles from './inputs.module.css'

export interface ColorRef {
    color: string
    paletteColorId?: string
}

interface Props {
    label?: string
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
                           }: Props) {
    const {state} = useAppState()
    const palettes = state.document.palettes ?? []

    const [activePaletteId, setActivePaletteId] = useState<string>(() => palettes[0]?.id ?? '')
    const wrapRef = useRef<HTMLDivElement>(null)

    const activePalette = palettes.find(p => p.id === activePaletteId) ?? palettes[0]

    return (
        <>
            <span className={styles.label} style={{gridColumn:'1'}}>{label}</span>
            <div className={styles.inputRow} ref={wrapRef} style={{gridColumn: '1'}}>
                <input
                    type="color"
                    className={styles.colorSwatch}
                    value={value.color === 'transparent' ? '#ffffff' : value.color}
                    onChange={e => onChange({color: e.target.value, paletteColorId: undefined})}
                />
                <input
                    type="text"
                    className={styles.textInput}
                    value={value.color}
                    onChange={e => onChange({color: e.target.value, paletteColorId: undefined})}
                    spellCheck={false}
                />
            </div>
            {palettes.length > 0 && (
                <>
                    {palettes.length > 1 && (
                        <div className={'full'}>
                            {palettes.map(p => (
                                <button key={p.id} className={`${swatchStyles.paletteTab} ${p.id === activePalette?.id ? swatchStyles.paletteTabActive : ''}`}
                                    onClick={() => setActivePaletteId(p.id)}
                                >{p.name}</button>
                            ))}
                        </div>
                    )}
                    {activePalette && (
                        <div className={swatchStyles.swatchRow + ' full'}>
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
        </>
    )
}
