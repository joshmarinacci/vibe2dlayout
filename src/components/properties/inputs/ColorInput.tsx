import { useState } from 'react'
import { useAppState } from '@store/context'
import styles from './inputs.module.css'
import swatchStyles from './ColorInput.module.css'

export interface ColorRef {
  color: string
  paletteColorId?: string
}

interface Props {
  label: string
  value: ColorRef
  onChange: (v: ColorRef) => void
}

export function ColorInput({ label, value, onChange }: Props) {
  const { state } = useAppState()
  const palettes = state.document.palettes ?? []

  const [activePaletteId, setActivePaletteId] = useState<string>(() => palettes[0]?.id ?? '')

  const activePalette = palettes.find(p => p.id === activePaletteId) ?? palettes[0]

  return (
    <div className={styles.field} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
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
                  style={{ background: pc.color }}
                  title={pc.name}
                  onClick={() => onChange({ color: pc.color, paletteColorId: pc.id })}
                />
              ))}
            </div>
          )}
        </>
      )}
      <div className={styles.inputRow}>
        <input
          type="color"
          className={styles.colorSwatch}
          value={value.color === 'transparent' ? '#ffffff' : value.color}
          onChange={e => onChange({ color: e.target.value, paletteColorId: undefined })}
        />
        <input
          type="text"
          className={styles.textInput}
          value={value.color}
          onChange={e => onChange({ color: e.target.value, paletteColorId: undefined })}
          spellCheck={false}
        />
      </div>
    </div>
  )
}
